import { Link } from 'react-router-dom';

export default function Instructions() {
  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '20px' }}>
      <div className="instructions-page">
        <div className="hero-tag">OPERATIONAL_MANUAL // V2.1.0</div>
        <h1>THE_HUNTER_GUIDE</h1>
        <p className="subtitle">Master the art of DOM forensics and network interception.</p>

        {/* 01 // GOAL */}
        <section className="guide-section">
          <h2>01 // MISSION_OBJECTIVE</h2>
          <p>
            Extract every <code>KEY_*</code> token hidden in a simulated production surface. Keys may appear in markup,
            comments, attributes, fetch payloads, headers, storage, or console output—never assume the visible UI is the
            whole story.
          </p>
        </section>

        {/* 02 // PLAY FLOW */}
        <section className="guide-section">
          <h2>02 // SESSION_PROTOCOL</h2>
          <ol className="workflow-steps">
            <li>
              <strong>Initialize.</strong> Choose difficulty and mode on the play screen. After the countdown, the
              fiction loads inside <code>#sim-frame</code> (see §04)—native DevTools must target that inner document.
            </li>
            <li>
              <strong>Orient.</strong> Open <strong>AUDIT_TASKS</strong> in the bottom toolbar for objectives and
              optional hints. Mine those lines for literal strings you can search in Elements and Network.
            </li>
            <li>
              <strong>Extract and submit.</strong> Paste the full token (including the <code>KEY_</code> prefix) into the
              toolbar field and <strong>SUBMIT</strong>. Only server-valid keys advance; re-copy from the source if a
              guess fails—harder tiers reuse similar prefixes.
            </li>
            <li>
              <strong>Finish.</strong> <strong>FASTEST_TIME</strong> ends when every key is cleared; the clock is the
              run. <strong>MAX_EXTRACTION</strong> runs until you <strong>TERMINATE</strong> or time expires—revealed
              hints cost score there, so request them when you are blocked, not at the first unknown.
            </li>
          </ol>
        </section>

        {/* 03 // DEVTOOLS CHROME */}
        <section className="guide-section">
          <h2>03 // DEVTOOLS_LAYOUT</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'center' }}>
            <div className="setup-box" style={{ margin: 0 }}>
              <p><strong>Open</strong></p>
              <ul>
                <li><strong>macOS:</strong> Cmd + Opt + I</li>
                <li><strong>Windows/Linux:</strong> F12 or Ctrl + Shift + I</li>
              </ul>
              <p><strong>Dock</strong></p>
              <ul>
                <li>Menu (⋮) → <strong>Dock to bottom</strong> so the scavenger toolbar stays usable.</li>
              </ul>
              <p className="tip">
                On timed modes, settle layout and panel widths before the mission clock starts—rearranging mid-run burns
                the same attention as a bad search path.
              </p>
            </div>
            <div className="docking-guide" style={{ margin: 0 }}>
              <div className="dock-window">
                <div className="dock-top"></div>
                <div className="dock-bottom active">NATIVE_DEVTOOLS</div>
              </div>
              <p className="tip">
                Bottom dock keeps the simulation and extraction controls in view.
              </p>
            </div>
          </div>
        </section>

        {/* 04 // IFRAME + HOW TO MOVE IN TREE */}
        <section className="guide-section">
          <h2>04 // TARGET_DOCUMENT</h2>
          <p>
            DevTools attached to the scavenger page show the parent DOM first. Expand{' '}
            <code>#sim-frame</code> → <code>#document</code> → <code>&lt;html&gt;</code> → <code>&lt;body&gt;</code>; the
            simulated app lives under <code>webdevscav-simulated-root</code>. You can also right-click inside the
            simulated viewport → <strong>Inspect</strong>, then confirm the selection sits under that iframe document
            before you walk the tree.
          </p>
          <div className="devtools-sim">
            <div className="dt-line"><span className="dt-tag">&lt;iframe</span> <span className="dt-attr">id</span>=<span className="dt-str">"sim-frame"</span> <span className="dt-tag">&gt;</span></div>
            <div className="dt-line indent-1"><span className="dt-tag">&lt;#document&gt;</span></div>
            <div className="dt-line indent-2"><span className="dt-tag">&lt;html&gt;</span></div>
            <div className="dt-line indent-3"><span className="dt-tag">&lt;body&gt;</span></div>
            <div className="dt-line indent-4"><span className="dt-comm">&lt;!-- ◈◈◈ WEBDEVSCAV SIMULATION START ◈◈◈ --&gt;</span></div>
            <div className="dt-line indent-4"><span className="dt-tag">&lt;div</span> <span className="dt-attr">id</span>=<span className="dt-str">"webdevscav-simulated-root"</span><span className="dt-tag">&gt;</span></div>
            <div className="dt-line indent-5"><span className="dt-text">... Simulated Content ...</span></div>
            <div className="dt-line indent-4"><span className="dt-tag">&lt;/div&gt;</span></div>
          </div>
          <ul className="inspect-steps">
            <li>
              With <strong>Elements</strong> focused, <strong>Cmd+F</strong> / <strong>Ctrl+F</strong> opens DOM search.
              Start with <code>KEY_</code>, then terms lifted directly from the audit log.
            </li>
            <li>
              Inspect attributes, inline <code>style</code>, HTML comments, and collapsed text nodes—higher difficulties
              favor non-visible pockets over obvious copy.
            </li>
          </ul>
        </section>

        {/* 05 // TABS */}
        <section className="guide-section">
          <h2>05 // PANEL_REFERENCE</h2>
          <div className="audit-tab-guide">
            <div className="tab-card">
              <h3>ELEMENTS</h3>
              <p>
                Beyond visible nodes, check <code>display: none</code>, <code>visibility: hidden</code>, and
                data-bearing attributes—debug scaffolding often stays in the tree but off-screen.
              </p>
            </div>
            <div className="tab-card">
              <h3>CONSOLE</h3>
              <p>Watch for leaked objects and structured logs; <code>Config</code>-shaped dumps and session metadata appear here more often than in the DOM.</p>
            </div>
            <div className="tab-card">
              <h3>NETWORK</h3>
              <p>
                Filter <strong>Fetch/XHR</strong>; read JSON bodies and response headers. Turn on <strong>Preserve log</strong>{' '}
                when the sim fires navigations or chained calls so responses do not vanish from the list.
              </p>
            </div>
            <div className="tab-card">
              <h3>APPLICATION</h3>
              <p>Review <strong>Local Storage</strong> and <strong>Cookies</strong> for session artifacts, feature flags, and tokens the renderer never prints.</p>
            </div>
          </div>
        </section>

        {/* 06 // ADVANCED */}
        <section className="guide-section">
          <h2>06 // HARD_MODE_HEURISTICS</h2>
          <dl className="pro-tips-dl">
            <dt>Cross-surface correlation</dt>
            <dd>
              When the UI references a value you cannot find in markup, assume it arrived via fetch, storage, or a
              script-held object. Walk <strong>Network</strong> → <strong>Application</strong> → <strong>Console</strong>{' '}
              instead of re-reading the same DOM branch.
            </dd>
            <dt>Timed vs endless judgment</dt>
            <dd>
              In <strong>FASTEST_TIME</strong>, a hint that collapses minutes of blind search is usually net-positive even
              though reading it takes seconds. In <strong>MAX_EXTRACTION</strong>, ration hints against the point penalty
              unless you are truly stuck.
            </dd>
          </dl>
        </section>

        {/* 07 // PLAYTHROUGH */}
        <section className="guide-section">
          <h2>07 // OPERATIONAL_PLAYTHROUGH</h2>
          <p>
            Watch the synchronized audit flow. The left panel shows the gameplay; the right panel simulates the corresponding
            DevTools state during a successful extraction.
          </p>
          <div className="playthrough-split" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2px', background: 'var(--border)', border: '1px solid var(--border)', marginTop: '32px', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="playthrough-video" style={{ background: 'black', position: 'relative' }}>
              <img src="/playthrough.webp" alt="Playthrough" style={{ width: '100%', display: 'block' }} />
              <div className="recording-legend" style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.8)', padding: '12px', borderLeft: '2px solid var(--accent)' }}>
                <h5 style={{ fontSize: '9px', color: 'var(--accent)', marginBottom: '4px' }}>INPUT_SEQUENCE //</h5>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>[F12] &rarr; [CTRL+F] &rarr; KEY_FOUND</div>
              </div>
            </div>
            <div className="simulated-devtools" style={{ background: '#1c1c1c', display: 'flex', flexDirection: 'column' }}>
              <div className="sd-header" style={{ height: '32px', background: '#2d2d2d', display: 'flex', gap: '16px', padding: '0 16px', alignItems: 'center', fontSize: '10px', color: '#999', fontFamily: 'var(--font-mono)' }}>
                <div style={{ color: '#fff', borderBottom: '2px solid #367cff', height: '100%', display: 'flex', alignItems: 'center' }}>ELEMENTS</div>
                <div>CONSOLE</div>
                <div>NETWORK</div>
              </div>
              <div className="sd-content" style={{ flex: 1, padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '11px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ color: '#808080' }}>&lt;!-- MISSION_INITIALIZED --&gt;</div>
                <div style={{ color: '#5db0d7' }}>&lt;div <span style={{ color: '#9cdcfe' }}>id</span>=<span style={{ color: '#ce9178' }}>"sim-root"</span>&gt;</div>
                <div style={{ paddingLeft: '32px', color: '#5db0d7', background: 'rgba(54, 124, 255, 0.1)', borderLeft: '2px solid #367cff' }}>
                   &lt;div <span style={{ color: '#9cdcfe' }}>class</span>=<span style={{ color: '#ce9178' }}>"payload"</span> <span style={{ color: '#9cdcfe' }}>data-key</span>=<span style={{ color: '#ce9178' }}>"KEY_FOUND_V2"</span>&gt;
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: '#1c1c1c', borderTop: '1px solid #333', padding: '10px' }}>
                  <div style={{ color: '#00ff00', fontSize: '10px' }}>&gt; Initializing Scavenger_Protocol...</div>
                  <div style={{ color: '#fff', fontSize: '10px' }}>&gt; Key matched: KEY_FOUND_V2</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div style={{ marginTop: '80px', textAlign: 'center' }}>
          <div className="hero-tag" style={{ marginBottom: '16px' }}>READY_FOR_DEPLOYMENT?</div>
          <Link to="/play" className="btn btn-primary" style={{ padding: '16px 16px' }}>
            Initialize First Session
          </Link>
        </div>
      </div>
    </div>
  );
}
