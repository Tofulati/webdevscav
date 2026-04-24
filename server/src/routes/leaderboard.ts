import { Router, Request, Response } from 'express';
import { getLeaderboard, addLeaderboardEntry } from '../services/firestore.js';

const router = Router();

/**
 * GET /api/leaderboard
 * Returns top scores, optionally filtered by period.
 */
router.get('/', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const period = req.query.period as string | undefined;
  const entries = await getLeaderboard(limit, period);
  res.json(entries);
});

/**
 * POST /api/leaderboard
 * Submits a new leaderboard entry.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { playerName, playerId, score, keysFound, totalKeys, timeUsed, difficulty, mode, theme } = req.body;

    if (!playerName || score === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    await addLeaderboardEntry({
      playerName,
      playerId: playerId || 'anon_' + Math.random().toString(36).substring(2, 8),
      score,
      keysFound,
      totalKeys,
      timeUsed,
      difficulty,
      mode: mode || 'solo',
      theme: theme || 'unknown',
      createdAt: Date.now(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Leaderboard] Failed to add entry:', err);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

export default router;
