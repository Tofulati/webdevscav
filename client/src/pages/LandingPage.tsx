import { Link } from 'react-router-dom';

export default function LandingPage() {

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-tag">STABLE_BUILD :: V2.1.0</div>
          <h1>INSPECT. EXPOSE. DOMINATE.</h1>
          <p>
            The world's first competitive scavenger hunt for developers. 
            Use your browser's internal engine to uncover hidden payloads 
            and security leaks in real-time simulations.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
            <Link to="/play" className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '18px' }}>
              LAUNCH_CONSOLE
            </Link>
            <Link to="/instructions" className="btn btn-secondary" style={{ padding: '16px 32px' }}>
              VIEW_SPECS
            </Link>
          </div>
        </div>
        
        {/* Visual Element - Static info or decorative */}
        <div className="landing-visual" style={{ opacity: 0.5 }}>
           <div className="devtools-sim" style={{ transform: 'rotate(-2deg)', scale: '1.1' }}>
            <div className="dt-line"><span className="dt-tag">&lt;body&gt;</span></div>
            <div className="dt-line indent-1"><span className="dt-comm">&lt;!-- ◈◈◈ SYSTEM_INITIALIZED ◈◈◈ --&gt;</span></div>
            <div className="dt-line indent-1"><span className="dt-tag">&lt;div</span> <span className="dt-attr">id</span>=<span className="dt-str">"leaks"</span><span className="dt-tag">&gt;</span></div>
            <div className="dt-line indent-2"><span className="dt-text">KEY_EXPOSED_01</span></div>
            <div className="dt-line indent-1"><span className="dt-tag">&lt;/div&gt;</span></div>
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="specs">
        <div className="specs-grid">
          <div className="spec-item">
            <h4>01 / Security Auditing</h4>
            <p>Identify leaked JWTs, exposed API keys, and insecure hidden metadata within production-grade web simulations. Learn how real-world breaches often start with "hidden" front-end configuration leaks.</p>
          </div>
          <div className="spec-item">
            <h4>02 / Internal Routing</h4>
            <p>Intercept and analyze simulated network traffic, XHR requests, and WebSocket streams. Understand how sensitive payloads can be sniffed if not properly encrypted or handled.</p>
          </div>
          <div className="spec-item">
            <h4>03 / DOM Forensics</h4>
            <p>Traverse deep DOM trees and inspect Shadow DOM boundaries to find injected elements. Discover how comments and data attributes can inadvertently leak system architecture details.</p>
          </div>
        </div>
      </section>
      {/* Intelligence Report */}
      <section className="intelligence-report" style={{ padding: '120px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="hero-tag">FIELD_INTELLIGENCE // GLOBAL_THREAT_ASSESSMENT</div>
          <h2 style={{ fontSize: '56px', fontWeight: 900, marginBottom: '32px', letterSpacing: '-2px', lineHeight: '1' }}>EVERY_WEB_APP_HAS_A_DARK_SIDE</h2>
          <p style={{ fontSize: '20px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '60px', maxWidth: '800px' }}>
            Modern web architecture is a facade. Underneath the glossy UI lies a labyrinth of "hidden actions"—private API endpoints, developer comments, and temporary storage buckets that were never meant for public eyes. 
            <strong> WebDevScav</strong> trains you to see through the interface and audit the engine.
          </p>

          {/* Expanded Stats Grid */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', marginBottom: '60px' }}>
            {[
              { val: '1.2B+', lbl: 'KEYS_LEAKED_ANNUALLY', sub: 'Exposed via public source maps' },
              { val: '85%', lbl: 'APPS_WITH_HIDDEN_LOGS', sub: 'Production-level debug leakage' },
              { val: '4:1', lbl: 'LEAK_TO_PATCH_RATIO', sub: 'Critical vulnerability delay' },
              { val: '$4.4M', lbl: 'AVG_BREACH_COST', sub: 'Financial impact per incident' },
              { val: '204D', lbl: 'IDENTIFICATION_TIME', sub: 'Avg time to detect exposure' },
              { val: '50%', lbl: 'CREDENTIAL_COMPROMISE', sub: 'Breaches via leaked auth' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-body)', padding: '40px' }}>
                <div style={{ color: 'var(--accent)', fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>{s.val}</div>
                <div style={{ fontSize: '10px', color: 'var(--text)', fontWeight: 800, letterSpacing: '1px', marginBottom: '8px' }}>{s.lbl}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Wide Case Study */}
          <div className="case-study-wide" style={{ background: 'var(--bg-surface)', padding: '60px', border: '1px solid var(--border)', borderRadius: '4px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '24px', right: '32px', display: 'flex', gap: '20px' }}>
              <div style={{ fontSize: '10px', color: 'var(--accent)', opacity: 0.5 }}>STATUS: ANALYZED</div>
              <div style={{ fontSize: '10px', color: 'var(--accent)', opacity: 0.5 }}>REF: #V4.412</div>
            </div>
            
            <h4 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '20px', letterSpacing: '2px' }}>
              CASE_STUDY_#4412_BREACH_TIMELINE
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', lineHeight: '2.5' }}>
                <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '20px' }}>
                  <span style={{ color: 'var(--text)' }}>[09:14]</span> <span style={{ color: 'var(--accent)' }}>&gt;</span> Attacker identifies <code>/api/debug/v1</code> via source map leakage.<br />
                  <span style={{ color: 'var(--text)' }}>[09:16]</span> <span style={{ color: 'var(--accent)' }}>&gt;</span> JWT found in <code>sessionStorage</code> with 'admin' scope.<br />
                  <span style={{ color: 'var(--text)' }}>[09:17]</span> <span style={{ color: 'var(--accent)' }}>&gt;</span> Internal database structure mapped via HTML comments.
                </div>
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', lineHeight: '2.5' }}>
                <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '20px' }}>
                  <span style={{ color: 'var(--text)' }}>[09:18]</span> <span style={{ color: 'var(--accent)' }}>&gt;</span> Secondary payload extraction from <code>data-*</code> attributes.<br />
                  <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255, 71, 87, 0.1)', borderLeft: '2px solid var(--error)', color: 'var(--error)', fontWeight: 'bold' }}>
                    [09:20] DATA_BREACH_INITIALIZED // EXTRACTION_COMPLETE.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '40px', textAlign: 'center', opacity: 0.8, letterSpacing: '1.5px', fontFamily: 'var(--font-mono)' }}>
            SOURCE :: GLOBAL_CYBERSECURITY_INDEX (GCI) & IBM SECURITY // 2024 THREAT_INTEL_REPORT
          </p>
        </div>
      </section>

      {/* Security Education Section */}
      <section className="education-section" style={{ marginTop: '80px', marginBottom: '80px', padding: '80px 0', borderTop: '1px solid var(--border)' }}>
        <div className="hero-tag">KNOWLEDGE_BASE // SECURITY_VULNERABILITIES</div>
        <h2 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '32px', letterSpacing: '-2px' }}>THE_DANGER_OF_SOURCE_LEAKS</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '18px', lineHeight: '1.6' }}>
              Many developers believe that what isn't rendered on the screen is safe from prying eyes. 
              <strong> This is a dangerous misconception.</strong> 
              Every byte sent to the browser—whether it's an HTML comment, a CSS variable, or a background network response—is accessible to anyone who knows how to open DevTools.
            </p>
          </div>
          <div className="leak-examples">
            <div className="leak-example" style={{ marginBottom: '24px', padding: '24px', background: 'var(--bg-surface)', borderLeft: '2px solid var(--error)' }}>
              <h5 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>PERSISTENT_THREATS</h5>
              <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Leaving JWTs or Session IDs in LocalStorage allows for Session Hijacking if XSS occurs.</p>
            </div>
            <div className="leak-example" style={{ padding: '24px', background: 'var(--bg-surface)', borderLeft: '2px solid var(--warning)' }}>
              <h5 style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>DEBUG_LEAKAGE</h5>
              <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Production logs containing "Config" objects can reveal internal API endpoints and private infrastructure.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
