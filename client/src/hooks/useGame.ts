import { useState, useCallback, useRef, useEffect } from 'react';
import { startGame, restoreGame, validateKey, getHint } from '../lib/api';
import type { GameState, GameRestoreResponse, ValidateResponse } from '../types';

const INITIAL_STATE: GameState = {
  status: 'idle', gameId: null, html: null,
  totalKeys: 0, keysFound: 0, score: 0,
  timeLimit: 180, timeRemaining: 180, timeElapsed: 0,
  theme: '', difficulty: 'medium', mode: 'fastest',
  tasks: [], hintsUsed: 0,
};

const STORAGE_KEY = 'webdevscav_active_game_v1';
const STORAGE_VERSION = 1;

function readPersisted(): GameState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { v?: number; state?: GameState };
    if (data.v !== STORAGE_VERSION || !data.state?.gameId) return null;
    const st = data.state;
    if (st.status !== 'arming' && st.status !== 'playing' && st.status !== 'completed') return null;
    if (st.status === 'arming') {
      return { ...st, status: 'playing' };
    }
    return st;
  } catch {
    return null;
  }
}

function mergeGameRestore(prev: GameState, r: GameRestoreResponse): GameState {
  const hintMap = new Map(prev.tasks.map((t) => [t.id, t.hintRevealed] as const));
  const tasks = r.tasks.map((t) => {
    const hintRevealed = hintMap.get(t.id);
    return {
      id: t.id,
      description: t.description,
      completed: t.completed,
      ...(hintRevealed ? { hintRevealed } : {}),
    };
  });

  const keysFound = r.keysFound;
  let status: GameState['status'] = 'playing';
  if (prev.status === 'completed') {
    status = 'completed';
  } else if (prev.mode === 'fastest' && keysFound >= r.totalKeys && r.totalKeys > 0) {
    status = 'completed';
  }

  const score =
    prev.mode === 'fastest'
      ? prev.timeElapsed
      : Math.max(0, keysFound * 100 - prev.hintsUsed * 25);

  return {
    ...prev,
    gameId: r.gameId,
    html: r.html,
    theme: r.theme,
    mode: r.mode,
    difficulty: r.difficulty,
    timeLimit: r.timeLimit,
    totalKeys: r.totalKeys,
    tasks,
    keysFound,
    status,
    score,
  };
}

export function useGame() {
  const hydratedFromStorageRef = useRef(false);
  const [state, setState] = useState<GameState>(() => {
    const saved = readPersisted();
    if (saved) {
      hydratedFromStorageRef.current = true;
      return saved;
    }
    return INITIAL_STATE;
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }

    if (state.status === 'idle' || !state.gameId) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* noop */
      }
      return;
    }
    if (state.status === 'loading') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* noop */
      }
      return;
    }

    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, state }));
      } catch (e) {
        console.warn('[useGame] Failed to persist session', e);
      }
    }, 800);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [state]);

  // Timer
  useEffect(() => {
    if (state.status === 'playing') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.mode === 'endless') {
            const next = prev.timeRemaining - 1;
            if (next <= 0) {
              clearInterval(timerRef.current!);
              return { ...prev, timeRemaining: 0, status: 'completed' };
            }
            return { ...prev, timeRemaining: next, timeElapsed: prev.timeElapsed + 1 };
          } else {
            // fastest mode counts UP
            const nextElapsed = prev.timeElapsed + 1;
            // Cap at timeLimit just in case
            if (nextElapsed >= prev.timeLimit) {
              clearInterval(timerRef.current!);
              return { ...prev, timeElapsed: prev.timeLimit, status: 'completed' };
            }
            return { ...prev, timeElapsed: nextElapsed };
          }
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [state.status, state.mode]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    const gameId = state.gameId;
    if (!gameId || state.status === 'idle' || state.status === 'loading') return;
    if (!hydratedFromStorageRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const r = (await restoreGame(gameId)) as GameRestoreResponse;
        if (cancelled) return;
        hydratedFromStorageRef.current = false;
        setState((prev) => {
          if (prev.gameId !== gameId) return prev;
          return mergeGameRestore(prev, r);
        });
      } catch {
        if (cancelled) return;
        hydratedFromStorageRef.current = false;
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* noop */
        }
        setState(INITIAL_STATE);
        showToast('Session no longer available. Progress was reset.', 'info');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.gameId, showToast]);

  const start = useCallback(async (difficulty: string, mode: 'fastest' | 'endless' = 'fastest') => {
    hydratedFromStorageRef.current = false;
    setState(prev => ({ ...prev, status: 'loading', difficulty, mode }));
    try {
      const data = await startGame(difficulty, mode);
      setState({
        status: 'arming', gameId: data.gameId, html: data.html,
        totalKeys: data.totalKeys, keysFound: 0, score: 0,
        timeLimit: data.timeLimit, timeRemaining: data.timeLimit, timeElapsed: 0,
        theme: data.theme, difficulty, mode: data.mode,
        tasks: data.tasks.map((t: any) => ({ ...t, completed: false })),
        hintsUsed: 0,
      });
    } catch {
      showToast('Failed to start game', 'error');
      setState(INITIAL_STATE);
    }
  }, [showToast]);

  const beginPlay = useCallback(() => {
    setState(prev => (prev.status === 'arming' ? { ...prev, status: 'playing' } : prev));
  }, []);

  const submitKey = useCallback(async (value: string): Promise<ValidateResponse | null> => {
    if (state.status !== 'playing' || !state.gameId || !value.trim()) return null;
    try {
      const result: ValidateResponse = await validateKey(state.gameId, value);
      if (result.correct && !result.alreadyFound) {
        setState(prev => {
          const newKeysFound = result.keysFound;
          const isComplete = prev.mode === 'fastest' && newKeysFound === result.totalKeys;
          
          // If complete and in fastest mode, score is the timeElapsed
          const finalScore = (isComplete && prev.mode === 'fastest') ? prev.timeElapsed : result.score;

          return {
            ...prev,
            keysFound: newKeysFound,
            score: finalScore,
            tasks: prev.tasks.map(t => t.id === result.taskId ? { ...t, completed: true } : t),
            status: isComplete ? 'completed' : prev.status,
          };
        });
        showToast(`Task Complete!`, 'success');
      } else if (result.alreadyFound) {
        showToast('Already found this key!', 'info');
      } else {
        showToast('Incorrect value', 'error');
      }
      return result;
    } catch {
      showToast('Validation error', 'error');
      return null;
    }
  }, [state.status, state.gameId, state.mode, state.timeElapsed, showToast]);

  const requestHint = useCallback(async (taskId: string) => {
    if (state.status !== 'playing' || !state.gameId) return null;
    try {
      const hint = await getHint(state.gameId, taskId);
      setState(prev => ({
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
        score: prev.mode === 'endless' ? Math.max(0, prev.score - 25) : prev.score,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, hintRevealed: hint.hint } : t),
      }));
      return hint;
    } catch {
      showToast('Failed to get hint', 'error');
      return null;
    }
  }, [state.status, state.gameId, showToast]);

  const reset = useCallback(() => {
    hydratedFromStorageRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    setState(INITIAL_STATE);
  }, []);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState(prev => {
      const finalizedScore = prev.mode === 'fastest'
        ? prev.timeElapsed
        : Math.max(0, prev.keysFound * 100 - prev.hintsUsed * 25);
      return { ...prev, score: finalizedScore, status: 'completed' };
    });
  }, []);

  return { state, setState, toast, start, beginPlay, submitKey, requestHint, reset, endGame, showToast };
}
