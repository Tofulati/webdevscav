import express from 'express';
import gameRoutes from './routes/game.js';
import leaderboardRoutes from './routes/leaderboard.js';
export function createApp() {
    const app = express();
    const allowedOrigin = process.env.CORS_ORIGIN;
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        const isLocalhost = origin?.startsWith('http://localhost:');
        if (allowedOrigin && origin === allowedOrigin) {
            res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        }
        else if (isLocalhost) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        else if (!origin) {
            // Allow server-to-server or same-origin requests with no Origin header.
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
        else {
            res.setHeader('Access-Control-Allow-Origin', allowedOrigin || 'http://localhost:5173');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }
        next();
    });
    app.use(express.json({ limit: '10mb' }));
    app.use('/api/game', gameRoutes);
    app.use('/api/leaderboard', leaderboardRoutes);
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });
    return app;
}
