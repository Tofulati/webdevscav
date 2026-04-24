const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export async function startGame(difficulty: string = 'medium', mode: string = 'fastest', theme?: string) {
  const res = await fetch(`${API_BASE}/game/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty, mode, theme }),
  });
  if (!res.ok) throw new Error('Failed to start game');
  return res.json();
}

export async function validateKey(sessionId: string, value: string) {
  const res = await fetch(`${API_BASE}/game/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, value }),
  });
  if (!res.ok) throw new Error('Validation failed');
  return res.json();
}

export async function getHint(sessionId: string, taskId: string) {
  const res = await fetch(`${API_BASE}/game/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, taskId }),
  });
  if (!res.ok) throw new Error('Failed to get hint');
  return res.json();
}

export async function getLeaderboard(period?: string, limit: number = 50, mode?: 'fastest' | 'endless') {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  if (mode) params.set('mode', mode);
  params.set('limit', limit.toString());
  const res = await fetch(`${API_BASE}/leaderboard?${params}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function submitScore(entry: {
  playerName: string;
  playerId: string;
  score: number;
  keysFound: number;
  totalKeys: number;
  timeUsed: number;
  difficulty: string;
  mode: string;
  theme: string;
}) {
  const res = await fetch(`${API_BASE}/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Failed to submit score');
  return res.json();
}
