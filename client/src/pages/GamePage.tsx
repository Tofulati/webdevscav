import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { submitScore } from '../lib/api';
import SimulatedBrowser from '../components/game/SimulatedBrowser';
import ScoreModule from '../components/game/ScoreModule';

export default function GamePage() {
  const game = useGame();
  const location = useLocation();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const state = location.state as { mode: 'fastest' | 'endless'; difficulty: string } | null;
    if (state && state.mode && state.difficulty && !hasStartedRef.current) {
      hasStartedRef.current = true;
      game.start(state.difficulty, state.mode);
    }
  }, [location.state, game.start]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleHint = async (taskId: string) => {
    await game.requestHint(taskId);
  };

  const handleSubmitScore = async () => {
    if (!playerName.trim() || submitted) return;
    await submitScore({
      playerName: playerName.trim(),
      playerId: 'anon_' + Math.random().toString(36).substring(2, 8),
      score: game.state.score,
      keysFound: game.state.keysFound,
      totalKeys: game.state.totalKeys,
      timeUsed: game.state.timeLimit - game.state.timeRemaining,
      difficulty: game.state.difficulty,
      mode: playerMode,
      theme: game.state.theme,
    });
    setSubmitted(true);
    game.showToast('SCORE_SUBMITTED // SUCCESS', 'success');
  };

  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [playerMode, setPlayerMode] = useState<'single' | 'multiplayer'>('single');

  const handleStartGame = () => {
    if (selectedDifficulty) {
      game.start(selectedDifficulty, game.state.mode);
    }
  };

  // Idle — mode & difficulty select
  if (game.state.status === 'idle') {
    return (
      <div className="difficulty-select-container">
        <div className="difficulty-select">
          <div className="hero-tag">SESSION_INITIALIZATION</div>
          <h2>SELECT_AUDIT_MODE</h2>
          
          <div className="mode-selection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', marginBottom: '40px' }}>
            <button 
              className={`mode-select-btn ${game.state.mode === 'fastest' ? 'active' : ''}`}
              onClick={() => game.setState(prev => ({ ...prev, mode: 'fastest' }))}
            >
              <div className="icon">◈</div>
              <h4>FASTEST_TIME</h4>
              <p>Race against the clock.</p>
            </button>
            <button 
              className={`mode-select-btn ${game.state.mode === 'endless' ? 'active' : ''}`}
              onClick={() => game.setState(prev => ({ ...prev, mode: 'endless' }))}
            >
              <div className="icon">▣</div>
              <h4>MAX_EXTRACTION</h4>
              <p>Find as many keys as possible.</p>
            </button>
          </div>

          <h2>SELECT_SESSION_TYPE</h2>
          <p>Multiplayer is coming soon. Use single player for now.</p>
          <div className="mode-selection" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', marginBottom: '40px' }}>
            <button
              className={`mode-select-btn ${playerMode === 'single' ? 'active' : ''}`}
              onClick={() => setPlayerMode('single')}
            >
              <div className="icon">◉</div>
              <h4>SINGLE_PLAYER</h4>
              <p>Run solo extraction.</p>
            </button>
            <button
              className="mode-select-btn"
              disabled
              style={{ opacity: 0.4, cursor: 'not-allowed' }}
            >
              <div className="icon">◎</div>
              <h4>MULTIPLAYER</h4>
              <p>DISABLED // COMING_SOON</p>
            </button>
          </div>

          <h2>SELECT_AUDIT_LEVEL</h2>
          <p>
            {game.state.mode === 'fastest'
              ? 'Higher difficulty levels increase key density and use more cryptic encryption.'
              : 'Higher difficulty levels increase challenge density and use more cryptic encryption.'}
          </p>
          <div className="diff-options">
            {[
              {
                level: 'easy',
                label: 'EASY',
                desc: game.state.mode === 'fastest' ? '10_KEYS // CLEAR_HINTS' : '∞_KEY_STREAM // CLEAR_HINTS',
                marker: 'L1'
              },
              {
                level: 'medium',
                label: 'MEDIUM',
                desc: game.state.mode === 'fastest' ? '20_KEYS // TECH_HINTS' : '∞_KEY_STREAM // TECH_HINTS',
                marker: 'L2'
              },
              {
                level: 'hard',
                label: 'HARD',
                desc: game.state.mode === 'fastest' ? '30_KEYS // CRYPTIC_HINTS' : '∞_KEY_STREAM // CRYPTIC_HINTS',
                marker: 'L3'
              },
            ].map(d => (
              <button 
                key={d.level} 
                className={`diff-option ${selectedDifficulty === d.level ? 'active' : ''}`} 
                onClick={() => setSelectedDifficulty(d.level)}
              >
                <div className="marker">{d.marker}</div>
                <h4>{d.label}</h4>
                <p>{d.desc}</p>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '40px' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleStartGame} 
              disabled={!selectedDifficulty}
              style={{ width: '100%', height: '64px', justifyContent: 'center', fontSize: '16px', opacity: selectedDifficulty ? 1 : 0.3 }}
            >
              INITIALIZE_AUDIT_SESSION
            </button>
          </div>

          <div className="devtools-warning">
            <div className="warning-title" style={{color: 'red'}}>REQUIRED_CONFIGURATION //</div>
            <p>
              Open your browser's Developer Tools (<strong>F12</strong> or <strong>Cmd+Opt+I</strong>). 
              For the optimal experience, <strong>dock DevTools to the bottom</strong> of the window. 
              This ensures the technical toolbar remains fully visible during the session.
              <br></br><br></br>
              <strong>This game is only available for PCs and Laptops only, as other systems are incompatible.</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (game.state.status === 'loading') {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>INITIALIZING_SIMULATION...</p>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '-12px' }}>BUILDING_DOM_TREE // INJECTING_PAYLOADS</p>
      </div>
    );
  }

  // Game complete overlay
  const showComplete = game.state.status === 'completed';

  return (
    <div className="game-container">
      {/* Score Module */}
      <ScoreModule state={game.state} onSubmitKey={game.submitKey} onHint={handleHint} onEnd={game.endGame} />

      {/* Simulated Browser */}
      <div className="game-top">
        <SimulatedBrowser html={game.state.html || ''} iframeRef={iframeRef} theme={game.state.theme} />
      </div>

      {/* Toast */}
      {game.toast && <div className={`toast ${game.toast.type}`}>{game.toast.message}</div>}

      {/* Game Complete Overlay */}
      {showComplete && (
        <div className="game-complete-overlay">
          <div className="game-complete-card">
            <div className="hero-tag">SESSION_TERMINATED</div>
            <h2>
              {game.state.mode === 'fastest' && game.state.keysFound === game.state.totalKeys
                ? "PERFECT_EXTRACTION"
                : "EXTRACTION_COMPLETE"}
            </h2>
            <div className="final-score">{game.state.score}</div>
            
            <div className="game-complete-stats">
              <div className="game-complete-stat">
                <div className="val">
                  {game.state.mode === 'fastest'
                    ? `${game.state.keysFound}/${game.state.totalKeys}`
                    : `${game.state.keysFound}/∞`}
                </div>
                <div className="lbl">LEAKS_EXPOSED</div>
              </div>
              <div className="game-complete-stat">
                <div className="val">{game.state.timeElapsed}s</div>
                <div className="lbl">DURATION</div>
              </div>
              <div className="game-complete-stat">
                <div className="val">{game.state.hintsUsed}</div>
                <div className="lbl">HINTS_USED</div>
              </div>
            </div>

            {!submitted && (
              <>
                <input 
                  className="name-input" 
                  type="text" 
                  placeholder="ENTER_OPERATOR_NAME..."
                  value={playerName} 
                  onChange={e => setPlayerName(e.target.value)} 
                />
                <div className="game-complete-actions">
                  <button className="btn btn-primary" onClick={handleSubmitScore} disabled={!playerName.trim()}>
                    UPLOAD_SCORE
                  </button>
                  <button className="btn btn-secondary" onClick={game.reset}>NEW_SESSION</button>
                </div>
              </>
            )}
            {submitted && (
              <div className="game-complete-actions">
                <button className="btn btn-primary" onClick={game.reset}>RESTART_SIMULATION</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
