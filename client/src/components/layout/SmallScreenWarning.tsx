import { useCallback, useEffect, useState } from 'react';

/** Viewport width at or below which we assume a phone/tablet or cramped desktop window. */
const NARROW_MEDIA = '(max-width: 900px)';

const SESSION_DISMISSED_KEY = 'webdevscav-small-viewport-warning-dismissed';

export function SmallScreenWarning() {
  const [isNarrow, setIsNarrow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(NARROW_MEDIA);
    const sync = () => {
      const narrow = mq.matches;
      setIsNarrow(narrow);
      if (!narrow) {
        sessionStorage.removeItem(SESSION_DISMISSED_KEY);
        setDismissed(false);
      } else {
        setDismissed(sessionStorage.getItem(SESSION_DISMISSED_KEY) === '1');
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const onDismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, '1');
    setDismissed(true);
  }, []);

  if (!isNarrow || dismissed) {
    return null;
  }

  return (
    <aside className="small-screen-warning" role="alert">
      <p className="small-screen-warning-text">
        This hunt is built for a keyboard and a wide screen. On a phone or narrow
        window, puzzles and devtools-style tools can be awkward or unusable. Use a
        computer if you can.
      </p>
      <button type="button" className="small-screen-warning-dismiss" onClick={onDismiss}>
        Dismiss
      </button>
    </aside>
  );
}
