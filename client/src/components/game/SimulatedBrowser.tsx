import { type RefObject, useEffect } from 'react';

interface Props {
  html: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  theme: string;
}

const THEME_URLS: Record<string, string> = {
  ecommerce: 'https://techvault.dev/shop',
  blog: 'https://bytelog.io/articles',
  portfolio: 'https://alexrivera.dev',
  dashboard: 'https://cloudmetrics.io/dashboard',
  social: 'https://chirper.app/feed',
  news: 'https://dailywire.news',
  restaurant: 'https://lamaison.menu',
  startup: 'https://neuralflow.ai',
  travel: 'https://wanderlust.io',
  crypto: 'https://blockexchange.net',
  gaming: 'https://playnexus.gg',
  education: 'https://learnspace.edu',
  realestate: 'https://zillowclone.com',
  fitness: 'https://fitcore.app',
  medical: 'https://healthportal.org',
  streaming: 'https://streamhub.tv'
};

export default function SimulatedBrowser({ html, iframeRef, theme }: Props) {
  const url = THEME_URLS[theme] || 'https://example.dev';

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [html, iframeRef]);

  return (
    <div className="sim-browser" style={{ background: theme === 'dark' ? '#1a1a1a' : '#fff' }}>
      <div className="sim-browser-bar">
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gray-700)' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gray-700)' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gray-700)' }} />
        </div>
        <div className="sim-browser-url">
          {`https://${url.replace(/^https?:\/\//, '')}`}
        </div>
      </div>
      <iframe
        ref={iframeRef}
        className="sim-browser-iframe"
        title="Simulated Webpage"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
