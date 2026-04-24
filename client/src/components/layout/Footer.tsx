export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 0',
        marginTop: '80px',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        letterSpacing: '1px',
        color: 'var(--text-dim)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 16px',
        }}
      >
        {/* Left Side */}
        <div>
          © {year} <a
            href="https://albertho.vercel.app"
            target="_blank"
            style={{
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.opacity = 0.7)}
            onMouseLeave={(e) => (e.target.style.opacity = 1)}
          >
            ALBERT_HO
          </a>
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ opacity: 0.5 }}>|</span>
          <a
            href="https://github.com/Tofulati/webdevscav"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.opacity = 0.7)}
            onMouseLeave={(e) => (e.target.style.opacity = 1)}
          >
            GITHUB_REPO
          </a>
        </div>
      </div>
    </footer>
  );
}