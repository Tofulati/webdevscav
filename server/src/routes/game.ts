import { Router, Request, Response } from 'express';
import { generateWebpage } from '../services/webpageGenerator.js';
import {
  saveSession, getSession, markKeyFound, getFoundKeys
} from '../services/firestore.js';
import type { GameStartResponse, ValidateResponse } from '../types/index.js';

const router = Router();

/**
 * GET /api/game/dummy
 * Dummy endpoint used to simulate API requests so players can find keys in the Network tab
 */
router.get('/dummy', (req: Request, res: Response) => {
  res.json({
    verified: true,
    token: req.query.token || 'MISSING_TOKEN',
    message: 'System verification complete.'
  });
});

/**
 * POST /api/game/start
 * Generates a new webpage and creates a game instance.
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { difficulty = 'medium', mode = 'fastest', theme } = req.body;
    const session = await generateWebpage(difficulty, mode, theme);
    await saveSession(session);

    const response: GameStartResponse = {
      gameId: session.id,
      html: session.html,
      totalKeys: session.totalKeys,
      timeLimit: session.timeLimit,
      theme: session.theme,
      mode: session.mode,
      tasks: session.keys.map(k => ({ id: k.taskId, description: k.task })),
    };

    res.json(response);
  } catch (err) {
    console.error('[Game] Failed to start game:', err);
    res.status(500).json({ error: 'Failed to generate game' });
  }
});

/**
 * POST /api/game/validate
 * Validates a submitted key value against the current game.
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const gameId = req.body.gameId || req.body.sessionId;
    const { value } = req.body;
    if (!gameId || !value) {
      res.status(400).json({ error: 'Missing gameId or value' });
      return;
    }

    const session = await getSession(gameId);
    if (!session) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const trimmedValue = value.trim().toUpperCase();
    const matchedKey = session.keys.find(
      (k) => k.value.toUpperCase() === trimmedValue
    );

    const foundKeys = await getFoundKeys(gameId);

    if (!matchedKey) {
      const response: ValidateResponse = {
        correct: false,
        keysFound: foundKeys.size,
        totalKeys: session.totalKeys,
        score: calculateScore(foundKeys.size, session.totalKeys, 0, 0, session.mode),
      };
      res.json(response);
      return;
    }

    const isNew = await markKeyFound(gameId, matchedKey.value);
    const updatedFound = await getFoundKeys(gameId);

    const response: ValidateResponse = {
      correct: true,
      taskId: matchedKey.taskId,
      keysFound: updatedFound.size,
      totalKeys: session.totalKeys,
      score: calculateScore(updatedFound.size, session.totalKeys, 0, 0, session.mode),
      alreadyFound: !isNew,
    };

    res.json(response);
  } catch (err) {
    console.error('[Game] Validation error:', err);
    res.status(500).json({ error: 'Validation failed' });
  }
});

/**
 * POST /api/game/hint
 * Returns a hint for an unfound key.
 */
router.post('/hint', async (req: Request, res: Response) => {
  try {
    const gameId = req.body.gameId || req.body.sessionId;
    const { taskId } = req.body;
    if (!gameId || !taskId) {
      res.status(400).json({ error: 'Missing gameId or taskId' });
      return;
    }

    const session = await getSession(gameId);
    if (!session) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const foundKeys = await getFoundKeys(gameId);
    const targetKey = session.keys.find((k) => k.taskId === taskId);

    if (!targetKey) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (foundKeys.has(targetKey.value)) {
      res.json({ hint: 'This task is already completed!', remaining: session.totalKeys - foundKeys.size });
      return;
    }

    res.json({
      hint: targetKey.hint,
      remaining: session.totalKeys - foundKeys.size,
    });
  } catch (err) {
    console.error('[Game] Hint error:', err);
    res.status(500).json({ error: 'Failed to get hint' });
  }
});

/**
 * GET /api/game/state/:id
 * Returns game info (without answer keys).
 */
router.get('/state/:id', async (req: Request, res: Response) => {
  const session = await getSession(req.params.id as string);
  if (!session) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  const foundKeys = await getFoundKeys(session.id);
  res.json({
    gameId: session.id,
    theme: session.theme,
    difficulty: session.difficulty,
    mode: session.mode,
    totalKeys: session.totalKeys,
    keysFound: foundKeys.size,
    timeLimit: session.timeLimit,
    score: calculateScore(foundKeys.size, session.totalKeys, 0, 0, session.mode),
  });
});

function calculateScore(found: number, total: number, hintsUsed: number, timeUsed: number, mode: string): number {
  if (mode === 'fastest') {
    // In fastest mode, score is literally the time used (lower is better, but for leaderboard we might want a derivative)
    // Actually let's keep it as time used, and handle sorting in the DB service.
    return timeUsed;
  }
  
  const basePoints = found * 100;
  const hintPenalty = hintsUsed * 25;
  const completionBonus = found === total ? 500 : 0;
  return Math.max(0, basePoints - hintPenalty + completionBonus);
}

export default router;
