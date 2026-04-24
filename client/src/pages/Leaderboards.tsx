import { useState, useEffect } from 'react';
import { getLeaderboard } from '../lib/api';
import type { LeaderboardEntry } from '../types';

export default function Leaderboards() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(period === 'all' ? undefined : period)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
      <div className="leaderboard-page">
        <div className="hero-tag">GLOBAL_METRICS :: V2.1.0</div>
        <h1>AUDIT_LEADERBOARD</h1>
        <p className="subtitle">High-performance audit sessions tracked across the network.</p>

        <div className="lb-filters">
          {['all', 'today', 'week'].map(p => (
            <button key={p} className={`lb-filter ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            SYNCHRONIZING_DATA...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '120px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>NO_SESSIONS_FOUND // BE_THE_FIRST</p>
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
