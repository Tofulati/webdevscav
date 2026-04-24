import { Link } from 'react-router-dom';

export default function Instructions() {
  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
      <div className="instructions-page">
        <div className="hero-tag">OPERATIONAL_MANUAL // V2.1.0</div>
        <h1>THE_HUNTER_GUIDE</h1>
        <p className="subtitle">Master the art of DOM forensics and network interception.</p>

        {/* 01 // OVERVIEW */}
        <section className="guide-section">
          <h2>01 // MISSION_OBJECTIVE</h2>
          <p>
            Your goal is to extract "Exposed Keys" hidden within simulated production environments. 
            These keys follow the <code>KEY_XXXXX</code> pattern and are buried deep within the 
            application's state, source code, and network headers.
          </p>
        </section>

        {/* 02 // SETUP & DOCKING */}
        <section className="guide-section">
          <h2>02 // ENVIRONMENT_CONFIGURATION</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'center' }}>
            <div className="setup-box" style={{ margin: 0 }}>
              <p><strong>Step 1: Open Developer Tools</strong></p>
              <ul style={{ fontSize: '14px', opacity: 0.8 }}>
                <li><strong>macOS:</strong> Cmd + Opt + I</li>
                <li><strong>Windows/Linux:</strong> F12 or Ctrl + Shift + I</li>
              </ul>
              <div style={{ marginTop: '24px' }}>
                <p><strong>Step 2: Dock Side</strong></p>
                <ol style={{ fontSize: '14px', opacity: 0.8 }}>
                  <li>Click three dots (⋮)</li>
                  <li>Select <strong>Dock to bottom</strong> (▢)</li>
                </ol>
              </div>
            </div>
            <div className="docking-guide" style={{ margin: 0 }}>
              <div className="dock-window">
                <div className="dock-top"></div>
                <div className="dock-bottom active">NATIVE_DEVTOOLS</div>
              </div>
              <p className="tip" style={{ marginTop: '12px', fontSize: '11px' }}>
                Docking to the bottom ensures the Scavenger Toolbar remains visible during inspection.
              </p>
            </div>
          </div>
        </section>

        {/* 03 // FINDING THE SIMULATION */}
        <section className="guide-section">
          <h2>03 // IDENTIFYING_THE_TARGET</h2>
          <p>
            The simulation is hosted within an isolated <code>&lt;iframe&gt;</code>. To begin your audit, 
            locate the following boundary in the <strong>Elements</strong> tab:
          </p>
          <div className="devtools-sim" style={{ marginTop: '24px' }}>
            <div className="dt-line"><span className="dt-tag">&lt;iframe</span> <span className="dt-attr">id</span>=<span className="dt-str">"sim-frame"</span> <span className="dt-tag">&gt;</span></div>
            <div className="dt-line indent-1"><span className="dt-tag">&lt;#document&gt;</span></div>
            <div className="dt-line indent-2"><span className="dt-tag">&lt;html&gt;</span></div>
            <div className="dt-line indent-3"><span className="dt-tag">&lt;body&gt;</span></div>
            <div className="dt-line indent-4"><span className="dt-comm">&lt;!-- ◈◈◈ WEBDEVSCAV SIMULATION START ◈◈◈ --&gt;</span></div>
            <div className="dt-line indent-4"><span className="dt-tag">&lt;div</span> <span className="dt-attr">id</span>=<span className="dt-str">"webdevscav-simulated-root"</span><span className="dt-tag">&gt;</span></div>
            <div className="dt-line indent-5"><span className="dt-text">... Simulated Content ...</span></div>
            <div className="dt-line indent-4"><span className="dt-tag">&lt;/div&gt;</span></div>
          </div>
        </section>

        {/* 04 // AUDIT TABS */}
        <section className="guide-section">
          <h2>04 // AUDIT_TECHNIQUES</h2>
          <div className="audit-tab-guide">
            <div className="tab-card">
              <h3>ELEMENTS</h3>
              <p>Search for <code>display: none</code> or <code>visibility: hidden</code>. Developers often "hide" debug flags or admin controls in the DOM.</p>
            </div>
            <div className="tab-card">
              <h3>CONSOLE</h3>
              <p>Monitor logs for leaked objects. Production logs often inadvertently print <code>Config</code> or <code>Session</code> metadata.</p>
            </div>
            <div className="tab-card">
              <h3>NETWORK</h3>
              <p>Filter by <strong>Fetch/XHR</strong>. Inspect JSON responses—they often contain more data than what the UI renders.</p>
            </div>
            <div className="tab-card">
              <h3>APPLICATION</h3>
              <p>Audit <strong>LocalStorage</strong> and <strong>Cookies</strong> for stored JWTs, session IDs, or debug mode flags.</p>
            </div>
          </div>
        </section>

        {/* 05 // PLAYTHROUGH */}
        <section className="guide-section">
          <h2>05 // OPERATIONAL_PLAYTHROUGH</h2>
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
          <Link to="/play" className="btn btn-primary" style={{ padding: '16px 48px' }}>
            Initialize First Session
          </Link>
        </div>
      </div>
    </div>
  );
}
