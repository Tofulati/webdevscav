export interface HiddenKey {
    taskId: string;
    task: string;
    value: string;
    location: string;
    hint: string;
    difficulty: 'easy' | 'medium' | 'hard';
}
export interface GameSession {
    id: string;
    html: string;
    keys: HiddenKey[];
    theme: string;
    difficulty: string;
    mode: 'fastest' | 'endless';
    totalKeys: number;
    timeLimit: number;
    createdAt: number;
}
export interface GameStartResponse {
    gameId: string;
    html: string;
    totalKeys: number;
    timeLimit: number;
    theme: string;
    mode: 'fastest' | 'endless';
    tasks: {
        id: string;
        description: string;
    }[];
}
/** Full client rebuild after reload (same shape as start + sync fields). */
export interface GameRestoreResponse extends GameStartResponse {
    difficulty: string;
    tasks: {
        id: string;
        description: string;
        completed: boolean;
    }[];
    keysFound: number;
}
export interface ValidateRequest {
    gameId: string;
    value: string;
}
export interface ValidateResponse {
    correct: boolean;
    location?: string;
    taskId?: string;
    keysFound: number;
    totalKeys: number;
    score: number;
    alreadyFound?: boolean;
}
export interface LeaderboardEntry {
    id?: string;
    playerName: string;
    playerId: string;
    score: number;
    keysFound: number;
    totalKeys: number;
    timeUsed: number;
    difficulty: string;
    mode: 'fastest' | 'endless';
    theme: string;
    createdAt: number;
}
export interface RoomData {
    hostId: string;
    status: 'waiting' | 'playing' | 'completed';
    gameId: string | null;
    roomCode: string;
    settings: {
        timeLimit: number;
        difficulty: string;
    };
    createdAt: number;
}
export interface PlayerData {
    name: string;
    score: number;
    foundKeys: string[];
    totalKeys: number;
    completedAt: number | null;
}
export type WebpageTheme = 'ecommerce' | 'blog' | 'portfolio' | 'dashboard' | 'social' | 'news' | 'restaurant' | 'startup' | 'travel' | 'crypto' | 'gaming' | 'education' | 'realestate' | 'fitness' | 'streaming';
