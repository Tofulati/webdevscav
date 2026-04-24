import type { GameSession, LeaderboardEntry } from '../types/index.js';
export declare function saveSession(session: GameSession): Promise<void>;
export declare function getSession(sessionId: string): Promise<GameSession | undefined>;
export declare function markKeyFound(sessionId: string, keyValue: string): Promise<boolean>;
export declare function getFoundKeys(sessionId: string): Promise<Set<string>>;
export declare function addLeaderboardEntry(entry: LeaderboardEntry): Promise<void>;
export declare function getLeaderboard(limit?: number, period?: string, mode?: string): Promise<LeaderboardEntry[]>;
export declare function deleteSession(sessionId: string): Promise<void>;
export declare function isFirestoreEnabled(): boolean;
