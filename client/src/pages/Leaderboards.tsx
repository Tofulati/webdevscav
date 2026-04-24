import { useState, useEffect } from 'react';
import { getLeaderboard } from '../lib/api';
import type { LeaderboardEntry } from '../types';

export default function Leaderboards() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState('all');
  const [mode, setMode] = useState<'fastest' | 'endless'>('fastest');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(
      period === 'all' ? undefined : period,
      50,
      mode,
      difficulty === 'all' ? undefined : difficulty
    )
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [period, mode, difficulty]);

  return (
    <div className="container leaderboard-shell">
      <div className="leaderboard-page">
        <h1>AUDIT_LEADERBOARD</h1>
        <p className="subtitle">High-performance audit runs tracked across the network.</p>

        <div className="lb-filter-panel">
          <div className="lb-filter-row">
            <span className="lb-filter-label">PERIOD</span>
            <div className="lb-filter-group">
              {['all', 'today', 'week'].map((p) => (
                <button key={p} className={`lb-filter ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="lb-filter-row">
            <span className="lb-filter-label">MODE</span>
            <div className="lb-filter-group">
              {(['fastest', 'endless'] as const).map((m) => (
                <button key={m} className={`lb-filter ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
                  {m === 'fastest' ? 'FASTEST_TIME' : 'MAX_EXTRACTION'}
                </button>
              ))}
            </div>
          </div>

          <div className="lb-filter-row">
            <span className="lb-filter-label">DIFFICULTY</span>
            <div className="lb-filter-group">
              {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                <button key={d} className={`lb-filter ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            SYNCHRONIZING_DATA...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '120px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>NO_RUNS_FOUND // BE_THE_FIRST</p>
          </div>
        ) : (
          <table className="lb-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>OPERATOR</th>
                <th>CREDITS</th>
                <th>LEAKS_EXPOSED</th>
                <th>DIFFICULTY</th>
                <th>DURATION</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id || i}>
                  <td className="lb-rank">#{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ fontWeight: 700 }}>{e.playerName.toUpperCase()}</td>
                  <td className="lb-score">{e.score}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{e.keysFound}/{e.totalKeys}</td>
                  <td style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{e.difficulty.toUpperCase()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>{formatTime(e.timeUsed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
