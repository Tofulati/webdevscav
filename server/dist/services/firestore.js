import admin from 'firebase-admin';
let db = null;
let firestoreReady = false;
function getFirebaseCredential() {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    if (serviceAccountJson) {
        return admin.credential.cert(JSON.parse(serviceAccountJson));
    }
    if (serviceAccountBase64) {
        const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        return admin.credential.cert(JSON.parse(decoded));
    }
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (projectId && clientEmail && privateKey) {
        return admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        });
    }
    return admin.credential.applicationDefault();
}
try {
    // Try to initialize Firebase if credentials are provided
    if (process.env.FIREBASE_PROJECT_ID) {
        const credential = getFirebaseCredential();
        if (!admin.apps.length) {
            admin.initializeApp({
                credential,
                projectId: process.env.FIREBASE_PROJECT_ID,
            });
        }
        db = admin.firestore();
        firestoreReady = true;
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
const sessionCache = new Map(); // read-through cache for Firestore-backed sessions
// ====== EXPORTED METHODS ======
export async function saveSession(session) {
    if (db) {
        await db.collection('sessions').doc(session.id).set(session);
        await db.collection('sessions').doc(session.id).collection('state').doc('keys').set({ found: [] });
        sessionCache.set(session.id, session);
    }
    else {
        sessions.set(session.id, session);
        foundKeysMap.set(session.id, new Set());
    }
}
export async function getSession(sessionId) {
    if (db) {
        const cached = sessionCache.get(sessionId);
        if (cached)
            return cached;
        const doc = await db.collection('sessions').doc(sessionId).get();
        if (!doc.exists)
            return undefined;
        const session = doc.data();
        sessionCache.set(sessionId, session);
        return session;
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
export async function getLeaderboard(limit = 50, period, mode, difficulty) {
    if (db) {
        // Avoid composite-index requirements by doing filtering/sorting in memory.
        const snapshot = await db.collection('leaderboard').limit(500).get();
        const rawEntries = snapshot.docs.map((doc) => {
            const data = doc.data();
            const createdAt = typeof data.createdAt === 'number'
                ? data.createdAt
                : data.createdAt?.toMillis
                    ? data.createdAt.toMillis()
                    : Date.now();
            return {
                id: doc.id,
                ...data,
                createdAt,
            };
        });
        let filtered = rawEntries;
        if (mode)
            filtered = filtered.filter((e) => e.mode === mode);
        if (difficulty)
            filtered = filtered.filter((e) => e.difficulty === difficulty);
        if (period === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filtered = filtered.filter((e) => e.createdAt >= today.getTime());
        }
        else if (period === 'week') {
            const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            filtered = filtered.filter((e) => e.createdAt >= weekAgo);
        }
        filtered.sort((a, b) => {
            if (a.mode === 'fastest' && b.mode === 'fastest')
                return a.score - b.score;
            return b.score - a.score;
        });
        return filtered.slice(0, limit);
    }
    else {
        let filtered = [...leaderboard];
        if (mode)
            filtered = filtered.filter(e => e.mode === mode);
        if (difficulty)
            filtered = filtered.filter(e => e.difficulty === difficulty);
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
        sessionCache.delete(sessionId);
    }
    else {
        sessions.delete(sessionId);
        foundKeysMap.delete(sessionId);
    }
}
export function isFirestoreEnabled() {
    return firestoreReady;
}
