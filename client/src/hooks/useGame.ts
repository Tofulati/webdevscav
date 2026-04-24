import { useState, useCallback, useRef, useEffect } from 'react';
import { startGame, validateKey, getHint } from '../lib/api';
import type { GameState, ValidateResponse } from '../types';

const INITIAL_STATE: GameState = {
  status: 'idle', gameId: null, html: null,
  totalKeys: 0, keysFound: 0, score: 0,
  timeLimit: 180, timeRemaining: 180, timeElapsed: 0,
  theme: '', difficulty: 'medium', mode: 'fastest',
  tasks: [], hintsUsed: 0,
};

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const start = useCallback(async (difficulty: string, mode: 'fastest' | 'endless' = 'fastest') => {
    setState(prev => ({ ...prev, status: 'loading', difficulty, mode }));
    try {
      const data = await startGame(difficulty, mode);
      setState({
        status: 'playing', gameId: data.gameId, html: data.html,
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

  const submitKey = useCallback(async (value: string): Promise<ValidateResponse | null> => {
    if (!state.gameId || !value.trim()) return null;
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
  }, [state.gameId, state.mode, state.timeElapsed, showToast]);

  const requestHint = useCallback(async (taskId: string) => {
    if (!state.gameId) return null;
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
  }, [state.gameId, showToast]);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
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

  return { state, setState, toast, start, submitKey, requestHint, reset, endGame, showToast };
}
