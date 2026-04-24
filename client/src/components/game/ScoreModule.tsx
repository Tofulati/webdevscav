import { useState } from 'react';
import type { GameState } from '../../types';

interface ScoreModuleProps {
  state: GameState;
  onSubmitKey: (key: string) => Promise<any>;
  onHint: (taskId: string) => void;
  onEnd: () => void;
}

export default function ScoreModule({ state, onSubmitKey, onHint, onEnd }: ScoreModuleProps) {
  const [inputValue, setInputValue] = useState('');
  const [showTasks, setShowTasks] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    const result = await onSubmitKey(inputValue.trim());
    const isCorrect = result && typeof result === 'object' && result.correct;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setInputValue('');
    setTimeout(() => setFeedback(null), 600);
  };

  return (
    <div className="score-module">
      <div className="score-stat found">
        <span className="label">EXPOSED</span>
        <span className="value">{state.keysFound}{state.mode === 'fastest' ? ` / ${state.totalKeys}` : ''}</span>
      </div>

      <div className="score-stat">
        <span className="label">{state.mode === 'fastest' ? 'SESSION_TIME' : 'POINTS'}</span>
        <span className="value">{state.score}</span>
      </div>

      <div className="score-stat timer">
        <span className="label">TIMER</span>
        <span className="value">{formatTime(state.mode === 'fastest' ? state.timeElapsed : state.timeRemaining)}</span>
      </div>

      <div className="score-input-group">
        <button 
          className="btn btn-secondary btn-small" 
          onClick={() => setShowTasks(!showTasks)}
          style={{ borderRight: 'none', borderRadius: 'var(--radius-xs) 0 0 var(--radius-xs)' }}
        >
          {showTasks ? 'CLOSE_LOG' : 'AUDIT_TASKS'} ({state.keysFound}{state.mode === 'fastest' ? `/${state.totalKeys}` : ''})
        </button>
        <input
          type="text"
          className={`score-input ${feedback === 'correct' ? 'correct' : feedback === 'incorrect' ? 'incorrect' : ''}`}
          placeholder="ENTER_KEY_VALUE..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button className="score-submit-btn" onClick={handleSubmit}>
          SUBMIT
        </button>
      </div>

      <button className="btn btn-secondary btn-small" onClick={onEnd} style={{ marginLeft: '12px' }}>
        TERMINATE
      </button>

      {/* Tasks Dropdown */}
      {showTasks && (
        <div className="tasks-dropdown">
          <div className="tasks-header">
            <h3>ACTIVE_AUDIT_LOG</h3>
            <button onClick={() => setShowTasks(false)}>×</button>
          </div>
          <div className="tasks-list">
            {state.tasks.map((task) => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <div className="task-status">
                  {task.completed ? '▣' : '▢'}
                </div>
                <div className="task-content">
                  <p>{task.description}</p>
                  {task.hintRevealed && (
                    <div className="task-hint-text">
                      <strong>HINT_REVEALED //</strong> {task.hintRevealed}
                    </div>
                  )}
                  {!task.completed && !task.hintRevealed && (
                    <button 
                      className="btn btn-secondary btn-small" 
                      onClick={() => onHint(task.id)}
                      style={{ marginTop: '12px', fontSize: '10px' }}
                    >
                      REQUEST_HINT [-25]
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
