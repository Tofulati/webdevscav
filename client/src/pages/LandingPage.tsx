import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-tag">STABLE_BUILD :: V2.1.0</div>
          <h1>INSPECT. EXPOSE. DOMINATE.</h1>
          <p>
            The world&apos;s first competitive scavenger hunt for developers.
            Use your browser&apos;s internal engine to uncover hidden payloads
            and security leaks in real-time simulations.
          </p>

          <div className="hero-actions">
            <Link to="/play" className="btn btn-primary">
              LAUNCH_CONSOLE
            </Link>
            <Link to="/instructions" className="btn btn-secondary">
              VIEW_SPECS
            </Link>
          </div>
        </div>

        <div className="landing-visual">
          <div className="devtools-sim">
            <div className="dt-line"><span className="dt-tag">&lt;body&gt;</span></div>
            <div className="dt-line indent-1"><span className="dt-comm">&lt;!-- ◈◈◈ SYSTEM_INITIALIZED ◈◈◈ --&gt;</span></div>
            <div className="dt-line indent-1"><span className="dt-tag">&lt;div</span> <span className="dt-attr">id</span>=<span className="dt-str">"leaks"</span><span className="dt-tag">&gt;</span></div>
            <div className="dt-line indent-2"><span className="dt-text">KEY_EXPOSED_01</span></div>
            <div className="dt-line indent-1"><span className="dt-tag">&lt;/div&gt;</span></div>
          </div>
        </div>
      </section>

      <section className="specs">
        <div className="specs-grid">
          <div className="spec-item">
            <h4>01 / Security Auditing</h4>
            <p>Identify leaked JWTs, exposed API keys, and insecure hidden metadata within production-grade web simulations. Learn how real-world breaches often start with &quot;hidden&quot; front-end configuration leaks.</p>
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

      <section className="intelligence-report">
        <div className="intelligence-report-inner">
          <div className="hero-tag">FIELD_INTELLIGENCE // GLOBAL_THREAT_ASSESSMENT</div>
          <h2 className="landing-section-title">EVERY_WEB_APP_HAS_A_DARK_SIDE</h2>
          <p className="landing-lede">
            Modern web architecture is a facade. Underneath the glossy UI lies a labyrinth of &quot;hidden actions&quot;—private API endpoints, developer comments, and temporary storage buckets that were never meant for public eyes.
            <strong> WebDevScav</strong> trains you to see through the interface and audit the engine.
          </p>

          <div className="landing-stats-grid">
            {[
              { val: '1.2B+', lbl: 'KEYS_LEAKED_ANNUALLY', sub: 'Exposed via public source maps' },
              { val: '85%', lbl: 'APPS_WITH_HIDDEN_LOGS', sub: 'Production-level debug leakage' },
              { val: '4:1', lbl: 'LEAK_TO_PATCH_RATIO', sub: 'Critical vulnerability delay' },
              { val: '$4.4M', lbl: 'AVG_BREACH_COST', sub: 'Financial impact per incident' },
              { val: '204D', lbl: 'IDENTIFICATION_TIME', sub: 'Avg time to detect exposure' },
              { val: '50%', lbl: 'CREDENTIAL_COMPROMISE', sub: 'Breaches via leaked auth' },
            ].map((s, i) => (
              <div key={i} className="landing-stat-cell">
                <div className="landing-stat-val">{s.val}</div>
                <div className="landing-stat-lbl">{s.lbl}</div>
                <div className="landing-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="case-study-wide">
            <div className="case-study-header-row">
              <h4 className="case-study-heading">CASE_STUDY_#4412_BREACH_TIMELINE</h4>
              <div className="case-study-meta">
                <span>STATUS: ANALYZED</span>
                <span>REF: #V4.412</span>
              </div>
            </div>

            <div className="case-study-columns">
              <div className="case-study-feed">
                <div className="case-study-feed-inner">
                  <span className="case-study-time">[09:14]</span> <span className="case-study-prompt">&gt;</span> Attacker identifies <code>/api/debug/v1</code> via source map leakage.<br />
                  <span className="case-study-time">[09:16]</span> <span className="case-study-prompt">&gt;</span> JWT found in <code>sessionStorage</code> with &apos;admin&apos; scope.<br />
                  <span className="case-study-time">[09:17]</span> <span className="case-study-prompt">&gt;</span> Internal database structure mapped via HTML comments.
                </div>
              </div>
              <div className="case-study-feed">
                <div className="case-study-feed-inner">
                  <span className="case-study-time">[09:18]</span> <span className="case-study-prompt">&gt;</span> Secondary payload extraction from <code>data-*</code> attributes.<br />
                  <div className="case-study-alert">
                    [09:20] DATA_BREACH_INITIALIZED // EXTRACTION_COMPLETE.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="landing-source-note">
            SOURCE :: GLOBAL_CYBERSECURITY_INDEX (GCI) &amp; IBM SECURITY // 2024 THREAT_INTEL_REPORT
          </p>
        </div>
      </section>

      <section className="education-section">
        <div className="hero-tag">KNOWLEDGE_BASE // SECURITY_VULNERABILITIES</div>
        <h2 className="landing-section-title">THE_DANGER_OF_SOURCE_LEAKS</h2>
        <div className="landing-edu-grid">
          <div>
            <p className="landing-edu-lede">
              Many developers believe that what isn&apos;t rendered on the screen is safe from prying eyes.
              <strong> This is a dangerous misconception.</strong>
              {' '}Every byte sent to the browser—whether it&apos;s an HTML comment, a CSS variable, or a background network response—is accessible to anyone who knows how to open DevTools.
            </p>
          </div>
          <div className="leak-examples">
            <div className="leak-example">
              <h5>PERSISTENT_THREATS</h5>
              <p>Leaving JWTs or Session IDs in LocalStorage allows for Session Hijacking if XSS occurs.</p>
            </div>
            <div className="leak-example leak-example--warn">
              <h5>DEBUG_LEAKAGE</h5>
              <p>Production logs containing &quot;Config&quot; objects can reveal internal API endpoints and private infrastructure.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
