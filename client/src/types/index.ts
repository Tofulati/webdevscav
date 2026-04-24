export interface HiddenKey {
  value: string;
  location: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameStartResponse {
  gameId: string;
  html: string;
  totalKeys: number;
  timeLimit: number;
  theme: string;
  mode: 'fastest' | 'endless';
  tasks: { id: string; description: string }[];
}

export interface GameRestoreResponse extends GameStartResponse {
  difficulty: string;
  tasks: { id: string; description: string; completed: boolean }[];
  keysFound: number;
}

export interface ValidateResponse {
  correct: boolean;
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

// DevTools types

export interface DOMNode {
  type: 'element' | 'text' | 'comment';
  tag?: string;
  content?: string;
  attrs?: Record<string, string>;
  children?: DOMNode[];
  styles?: Record<string, string>;
  cssRules?: CSSRuleInfo[];
  rootCssRules?: CSSRuleInfo[];
  inlineStyle?: string;
  path?: string;
  id?: string;
  className?: string;
}

export interface CSSRuleInfo {
  selector: string;
  properties: string;
}

export interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info';
  args: string[];
  timestamp: number;
}

export interface NetworkEntry {
  url: string;
  method: string;
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface StorageData {
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: { name: string; value: string }[];
}

export interface GameState {
  status: 'idle' | 'loading' | 'arming' | 'playing' | 'completed';
  gameId: string | null;
  html: string | null;
  totalKeys: number;
  keysFound: number;
  score: number;
  timeLimit: number;
  timeRemaining: number;
  timeElapsed: number; // Added for upward timer
  theme: string;
  difficulty: string;
  mode: 'fastest' | 'endless';
  tasks: { id: string; description: string; completed: boolean; hintRevealed?: string }[];
  hintsUsed: number;
}

export type DevToolsTab = 'elements' | 'styles' | 'console' | 'network' | 'application';
