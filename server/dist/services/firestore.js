import admin from 'firebase-admin';
let db = null;
try {
    // Try to initialize Firebase if credentials are provided
    if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(), // or via service account if preferred
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
        db = admin.firestore();
        console.log('[Firestore] Firebase Admin initialized successfully.');
    }
    else {
        console.log('[Firestore] No Firebase credentials found. Using in-memory fallback.');
    }
}
catch (error) {
    console.warn('[Firestore] Failed to initialize Firebase, falling back to in-memory store:', error);
}
// ====== IN-MEMORY FALLBACK ======
const sessions = new Map();
const leaderboard = [];
const foundKeysMap = new Map(); // sessionId -> set of found key values
// ====== EXPORTED METHODS ======
export async function saveSession(session) {
    if (db) {
        await db.collection('sessions').doc(session.id).set(session);
        await db.collection('sessions').doc(session.id).collection('state').doc('keys').set({ found: [] });
    }
    else {
        sessions.set(session.id, session);
        foundKeysMap.set(session.id, new Set());
    }
}
export async function getSession(sessionId) {
    if (db) {
        const doc = await db.collection('sessions').doc(sessionId).get();
        return doc.exists ? doc.data() : undefined;
    }
    return sessions.get(sessionId);
}
export async function markKeyFound(sessionId, keyValue) {
    if (db) {
        const keysRef = db.collection('sessions').doc(sessionId).collection('state').doc('keys');
        try {
            const doc = await keysRef.get();
            const found = doc.exists ? (doc.data()?.found || []) : [];
            if (found.includes(keyValue))
                return false;
            found.push(keyValue);
            await keysRef.set({ found });
            return true;
        }
        catch (e) {
            return false;
        }
    }
    else {
        const found = foundKeysMap.get(sessionId);
        if (!found)
            return false;
        if (found.has(keyValue))
            return false;
        found.add(keyValue);
        return true;
    }
}
export async function getFoundKeys(sessionId) {
    if (db) {
        const doc = await db.collection('sessions').doc(sessionId).collection('state').doc('keys').get();
        const found = doc.exists ? (doc.data()?.found || []) : [];
        return new Set(found);
    }
    return foundKeysMap.get(sessionId) || new Set();
}
export async function addLeaderboardEntry(entry) {
    entry.id = `lb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    if (db) {
        await db.collection('leaderboard').doc(entry.id).set({
            ...entry,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    else {
        leaderboard.push(entry);
        // Sort in-memory fallback
        leaderboard.sort((a, b) => {
            if (a.mode === 'fastest' && b.mode === 'fastest')
                return a.score - b.score; // Lower time is better
            return b.score - a.score; // Higher points is better
        });
    }
}
export async function getLeaderboard(limit = 50, period, mode) {
    if (db) {
        let query = db.collection('leaderboard');
        if (mode) {
            query = query.where('mode', '==', mode);
        }
        if (period === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(today));
        }
        else if (period === 'week') {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(weekAgo));
        }
        // Default sort by score. If mode is fastest, we should ideally sort ASC, but Firestore requires a composite index for where + order by.
        // To keep it simple, we'll sort DESC by default and let the client handle it if mixed modes are returned.
        query = query.orderBy('score', mode === 'fastest' ? 'asc' : 'desc').limit(limit);
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt
            };
        });
    }
    else {
        let filtered = [...leaderboard];
        if (mode)
            filtered = filtered.filter(e => e.mode === mode);
        if (period === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filtered = filtered.filter(e => e.createdAt >= today.getTime());
        }
        else if (period === 'week') {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            filtered = filtered.filter(e => e.createdAt >= weekAgo);
        }
        // Sort filtered results
        filtered.sort((a, b) => {
            if (a.mode === 'fastest' && b.mode === 'fastest')
                return a.score - b.score;
            return b.score - a.score;
        });
        return filtered.slice(0, limit);
    }
}
export async function deleteSession(sessionId) {
    if (db) {
        await db.collection('sessions').doc(sessionId).delete();
    }
    else {
        sessions.delete(sessionId);
        foundKeysMap.delete(sessionId);
    }
}
