import { type RefObject, useEffect, useState, useCallback } from 'react';

/** Paste into DevTools Console (Chromium) with this tab top-level selected — jumps Elements to the simulated root. */
export const SIM_FRAME_ELEMENTS_JUMP =
  "inspect(document.querySelector('#sim-frame')?.contentDocument?.getElementById('webdevscav-simulated-root'))";

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
  const [jumpCopied, setJumpCopied] = useState(false);

  const copyElementsJump = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SIM_FRAME_ELEMENTS_JUMP);
      setJumpCopied(true);
      window.setTimeout(() => setJumpCopied(false), 2000);
    } catch {
      /* clipboard denied or unavailable */
    }
  }, []);

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
        <div className="sim-browser-dots" aria-hidden="true">
          <span className="sim-browser-dot" />
          <span className="sim-browser-dot" />
          <span className="sim-browser-dot" />
        </div>
        <div className="sim-browser-url">
          {`https://${url.replace(/^https?:\/\//, '')}`}
        </div>
        <button
          type="button"
          className="sim-browser-jump-btn"
          onClick={copyElementsJump}
          title="Open DevTools on this tab first, then paste into the Console (Chrome, Edge, Brave…). Jumps Elements to webdevscav-simulated-root inside the iframe."
        >
          {jumpCopied ? 'Copied' : 'Copy Console jump'}
        </button>
      </div>
      <iframe
        id="sim-frame"
        ref={iframeRef}
        className="sim-browser-iframe"
        title="Simulated Webpage (right-click inside the page area and choose Inspect to attach DevTools to this document)"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
