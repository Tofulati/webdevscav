import type { GameSession, WebpageTheme } from '../types/index.js';
export declare function generateWebpage(difficulty?: string, mode?: 'fastest' | 'endless', requestedTheme?: WebpageTheme): Promise<GameSession>;
