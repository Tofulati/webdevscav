import { Router } from 'express';
import { generateWebpage } from '../services/webpageGenerator.js';
import { saveSession, getSession, markKeyFound, getFoundKeys } from '../services/firestore.js';
const router = Router();
/**
 * GET /api/game/dummy
 * Dummy endpoint used to simulate API requests so players can find keys in the Network tab
 */
router.get('/dummy', (req, res) => {
    res.json({
        verified: true,
        token: req.query.token || 'MISSING_TOKEN',
        message: 'System verification complete.'
    });
});
/**
 * POST /api/game/start
 * Generates a new webpage and creates a game session.
 */
router.post('/start', async (req, res) => {
    try {
        const { difficulty = 'medium', mode = 'fastest', theme } = req.body;
        const session = await generateWebpage(difficulty, mode, theme);
        await saveSession(session);
        const response = {
            sessionId: session.id,
            html: session.html,
            totalKeys: session.totalKeys,
            timeLimit: session.timeLimit,
            theme: session.theme,
            mode: session.mode,
            tasks: session.keys.map(k => ({ id: k.taskId, description: k.task })),
        };
        res.json(response);
    }
    catch (err) {
        console.error('[Game] Failed to start game:', err);
        res.status(500).json({ error: 'Failed to generate game' });
    }
});
/**
 * POST /api/game/validate
 * Validates a submitted key value against the session.
 */
router.post('/validate', async (req, res) => {
    try {
        const { sessionId, value } = req.body;
        if (!sessionId || !value) {
            res.status(400).json({ error: 'Missing sessionId or value' });
            return;
        }
        const session = await getSession(sessionId);
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        const trimmedValue = value.trim().toUpperCase();
        const matchedKey = session.keys.find((k) => k.value.toUpperCase() === trimmedValue);
        const foundKeys = await getFoundKeys(sessionId);
        if (!matchedKey) {
            const response = {
                correct: false,
                keysFound: foundKeys.size,
                totalKeys: session.totalKeys,
                score: calculateScore(foundKeys.size, session.totalKeys, 0, 0, session.mode),
            };
            res.json(response);
            return;
        }
        const isNew = await markKeyFound(sessionId, matchedKey.value);
        const updatedFound = await getFoundKeys(sessionId);
        const response = {
            correct: true,
            taskId: matchedKey.taskId,
            keysFound: updatedFound.size,
            totalKeys: session.totalKeys,
            score: calculateScore(updatedFound.size, session.totalKeys, 0, 0, session.mode),
            alreadyFound: !isNew,
        };
        res.json(response);
    }
    catch (err) {
        console.error('[Game] Validation error:', err);
        res.status(500).json({ error: 'Validation failed' });
    }
});
/**
 * POST /api/game/hint
 * Returns a hint for an unfound key.
 */
router.post('/hint', async (req, res) => {
    try {
        const { sessionId, taskId } = req.body;
        const session = await getSession(sessionId);
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        const foundKeys = await getFoundKeys(sessionId);
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
    }
    catch (err) {
        console.error('[Game] Hint error:', err);
        res.status(500).json({ error: 'Failed to get hint' });
    }
});
/**
 * GET /api/game/session/:id
 * Returns session info (without answer keys).
 */
router.get('/session/:id', async (req, res) => {
    const session = await getSession(req.params.id);
    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    const foundKeys = await getFoundKeys(session.id);
    res.json({
        sessionId: session.id,
        theme: session.theme,
        difficulty: session.difficulty,
        mode: session.mode,
        totalKeys: session.totalKeys,
        keysFound: foundKeys.size,
        timeLimit: session.timeLimit,
        score: calculateScore(foundKeys.size, session.totalKeys, 0, 0, session.mode),
    });
});
function calculateScore(found, total, hintsUsed, timeUsed, mode) {
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
