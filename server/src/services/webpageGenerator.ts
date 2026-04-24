import { v4 as uuidv4 } from 'uuid';
import { generateContent, isGeminiConfigured } from './gemini.js';
import { injectBridgeScript } from './bridgeInjector.js';
import type { HiddenKey, GameSession, WebpageTheme } from '../types/index.js';

const SIMULATION_START_MARKER = '<!-- ◈◈◈ WEBDEVSCAV SIMULATION START ◈◈◈ -->';

/** Gemini sometimes drops this marker while keys still validate; players use it to find the simulated root in Elements. */
function ensureSimulationStartMarker(html: string): string {
  if (!/<body[^>]*>/i.test(html)) {
    return html;
  }
  if (html.includes('WEBDEVSCAV SIMULATION START')) {
    return html;
  }
  return html.replace(/<body([^>]*)>/i, `<body$1>\n  ${SIMULATION_START_MARKER}\n`);
}

function b64Utf8(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64');
}

/** Raw key or base64(key) in source (for atob()-based JS). */
function keyPresentInGeneratedHtml(html: string, value: string): boolean {
  if (html.includes(value)) return true;
  const b64 = b64Utf8(value);
  return b64.length > 0 && html.includes(b64);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function insertAfterRandomMatch(html: string, re: RegExp, injection: string): string {
  const matches = [...html.matchAll(re)];
  if (matches.length === 0) return html + injection;
  const m = matches[Math.floor(Math.random() * matches.length)];
  const pos = m.index! + m[0].length;
  return html.slice(0, pos) + injection + html.slice(pos);
}

function scatterPlaintextIntoLayout(layoutHtml: string, chunks: string[]): string {
  let out = layoutHtml;
  for (const chunk of shuffleArray(chunks)) {
    const injection = `\n${chunk}\n`;
    if (/<\/p>/i.test(out)) {
      out = insertAfterRandomMatch(out, /<\/p>/g, injection);
    } else if (/<\/section>/i.test(out)) {
      out = insertAfterRandomMatch(out, /<\/section>/g, injection);
    } else {
      out += injection;
    }
  }
  return out;
}

function scatterOtherLeaksIntoLayout(layoutHtml: string, chunks: string[]): string {
  let out = layoutHtml;
  for (const chunk of shuffleArray(chunks)) {
    const injection = `\n${chunk}\n`;
    if (/<\/section>/i.test(out)) {
      out = insertAfterRandomMatch(out, /<\/section>/g, injection);
    } else if (/<\/p>/i.test(out)) {
      out = insertAfterRandomMatch(out, /<\/p>/g, injection);
    } else {
      out += injection;
    }
  }
  return out;
}

/** Runtime decode in emitted JS (ASCII-safe keys only; our generators use alphanumeric-ish tokens). */
function jsFromB64(value: string): string {
  return `atob(${JSON.stringify(b64Utf8(value))})`;
}

const SCRIPT_DECOYS = [
  'try{window.performance&&performance.mark&&performance.mark("app:hydrate");}catch(e){}',
  'try{if(window.requestIdleCallback)requestIdleCallback(function(){});}catch(e){}',
  'void function(n){return n;}({});',
  'try{Object.freeze&&Object.freeze({});}catch(e){}',
  'try{typeof document!=="undefined"&&document.documentElement&&document.documentElement.getAttribute("lang");}catch(e){}',
];

const THEMES: WebpageTheme[] = [
  'ecommerce', 'blog', 'portfolio', 'dashboard',
  'social', 'news', 'restaurant', 'startup',
  'travel', 'crypto', 'gaming', 'education',
  'realestate', 'fitness', 'streaming'
];

const THEME_DESCRIPTIONS: Record<string, string> = {
  ecommerce: 'an online e-commerce store selling tech gadgets, with product listings, a shopping cart icon, navigation bar, and footer',
  blog: 'a personal tech blog with articles, a sidebar with categories, author bio, and comments section',
  portfolio: 'a web developer portfolio site with projects showcase, skills section, about me, and contact form',
  dashboard: 'an analytics dashboard with charts placeholder areas, stats cards, sidebar navigation, and data tables',
  social: 'a social media feed page with user posts, like/comment buttons, profile sidebar, and trending section',
  news: 'a news website homepage with featured article, article grid, categories bar, and breaking news ticker',
  restaurant: 'a restaurant website with menu sections, reservation form, photo gallery, and reviews',
  startup: 'a SaaS startup landing page with hero section, pricing cards, testimonials, and call-to-action buttons',
  travel: 'a travel agency site with destination cards, booking search bar, testimonials, and newsletter signup',
  crypto: 'a cryptocurrency exchange landing page with live price tickers, trade interface mockup, and wallet connect button',
  gaming: 'a video game distribution platform with featured games carousel, player stats, and community forums',
  education: 'an online learning platform with course catalog, instructor profiles, progress trackers, and video player mockup',
  realestate: 'a real estate listing site with property grid, map placeholder, advanced search filters, and agent contacts',
  fitness: 'a fitness tracker app landing page with workout plans, progress charts, membership pricing, and diet tips',
  streaming: 'a movie streaming service with large hero banner, genre rows, continue watching section, and user profile icon',
};

function generateRealisticValue(location: string): string {
  const randHex = () => Math.random().toString(16).substring(2, 10);
  switch (location) {
    case 'html-comment': return `dev_override_${randHex()}`;
    case 'hidden-element': return `usr_${randHex()}`;
    case 'data-attribute': return `test_env_${randHex()}`;
    case 'meta-tag': return `v2-${randHex()}-${randHex()}`;
    case 'css-variable': return `theme-token-${randHex()}`;
    case 'css-content': return `v-${randHex()}`;
    case 'console-log': return `tk_live_${randHex()}`;
    case 'script-variable': return `sk_test_${randHex()}`;
    case 'localstorage': return `eyJhbGciOiJIUzI1Ni_${randHex()}`;
    case 'cookie': return `sess_${randHex()}`;
    case 'session-storage': return `csrf_${randHex()}`;
    case 'network-response':
    case 'network-header':
      return `auth_${randHex()}`;
    case 'click-network':
      return `clk_${randHex()}`;
    case 'click-reveal':
      return `ui_${randHex()}`;
    case 'console-invoke':
      return `cmd_${randHex()}`;
    case 'script-bundle':
      return `bnd_${randHex()}`;
    case 'plaintext':
      return `REF-${randHex().toUpperCase()}`;
    default:
      return randHex();
  }
}

function generateKeys(count: number, difficultyLevel: string): HiddenKey[] {
  const allLocations: {
    location: string;
    easyTask: string;
    mediumTask: string;
    hardTask: string;
    easyHint: string;
    mediumHint: string;
    hardHint: string;
    difficulty: 'easy' | 'medium' | 'hard';
    /** Omit from easy mode */
    requiresMedium?: boolean;
    /** Omit from easy and medium */
    requiresHard?: boolean;
  }[] = [
    { 
      location: 'html-comment', 
      easyTask: 'Find the secret in the HTML comments.',
      mediumTask: 'Locate a developer backdoor in the source comments.',
      hardTask: 'A rogue developer left an obfuscated breadcrumb in a comment; find it.',
      easyHint: 'Look for green text in the Elements tab like <!-- ... -->.', 
      mediumHint: 'Inspect the document for "DEBUG_KEY" or "dev_override" comments.',
      hardHint: 'Search the entire source tree for hidden annotations.',
      difficulty: 'easy' 
    },
    { 
      location: 'hidden-element', 
      easyTask: 'Find an invisible element in the page.',
      mediumTask: 'Identify an obscured tracking node in the DOM.',
      hardTask: 'Extract a key from a node hidden via advanced CSS techniques.',
      easyHint: 'Search for elements with "display: none".', 
      mediumHint: 'Check for nodes with opacity: 0 or absolute positioning off-screen.',
      hardHint: 'Look for elements hidden with clip-path or visibility: hidden.',
      difficulty: 'easy' 
    },
    { 
      location: 'data-attribute', 
      easyTask: 'Check the data attributes of page elements.',
      mediumTask: 'Find a leak in the custom data attributes of a UI component.',
      hardTask: 'A system token is buried in a non-standard data attribute; extract it.',
      easyHint: 'Look for "data-" attributes in the Elements tab.', 
      mediumHint: 'Inspect the main container or header for data-token attributes.',
      hardHint: 'Find a data attribute that looks like a session ID.',
      difficulty: 'medium' 
    },
    { 
      location: 'meta-tag', 
      easyTask: 'Check the head of the document for meta tags.',
      mediumTask: 'Locate internal metadata exposed in the head section.',
      hardTask: 'Find a migration-v2 secret hidden in the meta headers.',
      easyHint: 'Check the <head> section for <meta> tags.', 
      mediumHint: 'Look for custom meta names like "env-key" or "app-version".',
      hardHint: 'Check for meta tags that aren\'t part of standard SEO.',
      difficulty: 'easy' 
    },
    { 
      location: 'css-variable', 
      easyTask: 'Look for custom properties in the CSS styles.',
      mediumTask: 'Extract an API token from the CSS design system variables.',
      hardTask: 'A secret hash is stored in a CSS variable; find it in the computed styles.',
      easyHint: 'Check the :root styles for variables starting with "--".', 
      mediumHint: 'Look for variables like --theme-token or --config-hash.',
      hardHint: 'Check computed styles on specific components like the footer or brand.',
      difficulty: 'medium' 
    },
    { 
      location: 'css-content', 
      easyTask: 'Check for text added via CSS pseudo-elements.',
      mediumTask: 'Locate a versioning hash in a pseudo-element\'s content.',
      hardTask: 'Find an obscured key hidden in a ::before or ::after decoration.',
      easyHint: 'Inspect elements for ::after or ::before styles.', 
      mediumHint: 'Check the content property of pseudo-elements in the Styles tab.',
      hardHint: 'Look for pseudo-elements with font-size: 0 but readable content.',
      difficulty: 'hard' 
    },
    { 
      location: 'console-log', 
      easyTask: 'Open the console and look for a logged message.',
      mediumTask: 'Find a verbose debugging log leaking sensitive data.',
      hardTask: 'Intercept a developer log that outputs an internal auth token.',
      easyHint: 'Open the Console tab and read the messages.', 
      mediumHint: 'Look for objects or strings containing "tk_live" or "hash".',
      hardHint: 'Check for filtered or debug-level logs.',
      difficulty: 'easy' 
    },
    { 
      location: 'script-variable', 
      easyTask: 'Find a secret variable in the global window object.',
      mediumTask: 'Extract a configuration secret from an inline script.',
      hardTask: 'A hardcoded state object is hidden in a script; find the hash.',
      easyHint: 'Type "window" in the console or check <script> tags.', 
      mediumHint: 'Search for variables like __CONFIG or __INTERNAL_STATE.',
      hardHint: 'Check for constants defined inside an IIFE.',
      difficulty: 'medium' 
    },
    { 
      location: 'localstorage', 
      easyTask: 'Check the Local Storage for saved data.',
      mediumTask: 'Locate a persistent JWT cache in Local Storage.',
      hardTask: 'Extract a session token from the browser\'s persistent store.',
      easyHint: 'Go to Application tab -> Local Storage.', 
      mediumHint: 'Look for keys like auth_session or user_token.',
      hardHint: 'Find a value that looks like a base64 encoded JWT.',
      difficulty: 'medium' 
    },
    { 
      location: 'cookie', 
      easyTask: 'Check the cookies for this page.',
      mediumTask: 'Find an unencrypted session cookie exposing state.',
      hardTask: 'A secure-flag-missing cookie is leaking a server secret.',
      easyHint: 'Go to Application tab -> Cookies.', 
      mediumHint: 'Look for names like _auth_v2 or session_id.',
      hardHint: 'Find a cookie value with a long hex or base64 string.',
      difficulty: 'hard' 
    },
    { 
      location: 'session-storage', 
      easyTask: 'Check the Session Storage for temporary data.',
      mediumTask: 'Locate a CSRF token stored in Session Storage.',
      hardTask: 'Extract a temporary system ID from the session cache.',
      easyHint: 'Go to Application tab -> Session Storage.', 
      mediumHint: 'Look for keys like temp_id or csrf_token.',
      hardHint: 'Check for values updated during page load.',
      difficulty: 'hard' 
    },
    {
      location: 'network-response',
      easyTask: 'Find a network response from something the simulated app would load (dashboard widget, availability check, live pricing strip).',
      mediumTask: 'A believable on-page feature triggers a fetch; the key appears only in that response body.',
      hardTask: 'Trace which UI affordance fires the request, then read the JSON or text payload for the token.',
      easyHint: 'Reload or interact with a data-heavy part of the page (cart, live map, status ticker), then sort Network by Fetch/XHR.', 
      mediumHint: 'Pick the request whose name matches what the visible UI just updated (inventory, quote, feed refresh).',
      hardHint: 'Expand nested JSON in the Response tab; the value may sit beside fields the UI already shows.',
      difficulty: 'hard'
    },
    {
      location: 'network-header',
      easyTask: 'Inspect request headers on a call that matches visible app behavior (checkout, export, sync).',
      mediumTask: 'A normal-looking action sends a custom header; find it on that request\'s Headers tab.',
      hardTask: 'Figure out which control fires the tagged request, then read the outgoing request headers.',
      easyHint: 'Perform a plausible action (save, export, connect), then open the newest fetch in Network → Headers.', 
      mediumHint: 'Request Headers often include vendor or integration names that match buttons you clicked.',
      hardHint: 'Compare headers across a few rows; the unusual header usually pairs with one specific user action.',
      difficulty: 'hard'
    },
    { 
      location: 'aria-label', 
      easyTask: 'Check the accessibility labels on buttons.',
      mediumTask: 'Locate an internal hash leaked in an ARIA attribute.',
      hardTask: 'Find an obscured system ID hidden in a screen-reader label.',
      easyHint: 'Check for "aria-label" or "title" attributes.', 
      mediumHint: 'Inspect icons and buttons for non-descriptive aria labels.',
      hardHint: 'Search for accessibility tags that contain hex strings.',
      difficulty: 'medium' 
    },
    {
      location: 'plaintext',
      easyTask: 'Find a reference code embedded in normal page text (not a labeled “secret” box).',
      mediumTask: 'A token is woven into realistic copy—bylines, footers, SKUs, or metadata lines.',
      hardTask: 'The key appears as plausible editorial or ops text, or is visually hidden but still plain text in the DOM.',
      easyHint: 'Skim article body, captions, and footer fine print; look for REF- style codes.',
      mediumHint: 'Check table cells, shipping lines, version strings, and copyright tails.',
      hardHint: 'View page source or search the DOM: some tokens sit in visually collapsed or off-screen text nodes.',
      difficulty: 'medium'
    },
    {
      location: 'click-network',
      easyTask: 'Use a real-looking control in the fake app (save, publish, sync cart, preview invoice), then inspect Network for the request it fired.',
      mediumTask: 'A button or link that belongs in the layout triggers fetch; the token travels in that request only after you click.',
      hardTask: 'Nothing leaks on load—identify which visible product control performs the sync, then read that fetch\'s URL or body.',
      easyHint: 'Clear Network, click a primary workflow control (post, checkout step, refresh list), then inspect the new row.',
      mediumHint: 'The request name or query should match the UI you used (draft save, catalog sync, entitlement refresh).',
      hardHint: 'Turn off Preserve log, click once, and compare the single new entry\'s payload to the rest.',
      difficulty: 'hard',
      requiresMedium: true
    },
    {
      location: 'click-reveal',
      easyTask: 'Use an in-app disclosure (expand row, show details, reveal code) that fits the page theme.',
      mediumTask: 'A control that looks like part of the product writes the token into the DOM only after interaction.',
      hardTask: 'Find the affordance that expands or toggles copy without leaving the simulated experience.',
      easyHint: 'Look for chevrons, “Show more”, pricing tiers, or order-detail toggles in the main content.',
      mediumHint: 'Watch the Elements panel while expanding panels—the token may appear in a sibling span.',
      hardHint: 'Reveals usually sit next to the control you clicked; avoid hunting random footer micro-links.',
      difficulty: 'medium',
      requiresMedium: true
    },
    {
      location: 'console-invoke',
      easyTask: 'Run a small function from the browser console to print the token.',
      mediumTask: 'A diagnostic hook is registered on window; invoke it from the Console tab.',
      hardTask: 'Recover the function name from a subtle source hint, then call it and read the output.',
      easyHint: 'Search the page source for comments mentioning console or window.',
      mediumHint: 'Look for window.__… or globalThis assignments in inline scripts.',
      hardHint: 'The hint may be an HTML comment; the function returns or logs the exact key string.',
      difficulty: 'hard',
      requiresHard: true
    },
    {
      location: 'script-bundle',
      easyTask: 'Inspect an inline script block that resembles vendor or telemetry code.',
      mediumTask: 'A minified-looking stub hides an encoded token—recover it from Sources / page source.',
      hardTask: 'Parse obfuscated inline “bundle” code; the key is only present as encoded payload.',
      easyHint: 'Open Sources (or search in View Source) for chunks, telemetry, or vendor stubs.',
      mediumHint: 'Look for atob(…) or long string literals in secondary script tags.',
      hardHint: 'Follow IIFEs with misleading filenames in comments; decode base64 payloads mentally or in console.',
      difficulty: 'hard',
      requiresHard: true
    }
  ];

  let poolCandidates = allLocations;
  if (difficultyLevel === 'easy') {
    poolCandidates = allLocations.filter((l) => !l.requiresMedium && !l.requiresHard);
  } else if (difficultyLevel === 'medium') {
    poolCandidates = allLocations.filter((l) => !l.requiresHard);
  }

  const keys: HiddenKey[] = [];
  let previousLocation = '';
  const usage = new Map<string, number>();
  const pool = shuffleArray(poolCandidates);

  for (let i = 0; i < count; i++) {
    const sorted = [...pool].sort(
      (a, b) => (usage.get(a.location) ?? 0) - (usage.get(b.location) ?? 0)
    );
    const minCount = usage.get(sorted[0].location) ?? 0;
    const bucket = sorted.filter((x) => (usage.get(x.location) ?? 0) === minCount);
    let loc = bucket[Math.floor(Math.random() * bucket.length)];
    let tries = 0;
    while (loc.location === previousLocation && tries < pool.length * 2) {
      loc = pool[Math.floor(Math.random() * pool.length)];
      tries++;
    }
    usage.set(loc.location, (usage.get(loc.location) ?? 0) + 1);
    previousLocation = loc.location;

    let task = loc.easyTask;
    let hint = loc.easyHint;

    if (difficultyLevel === 'medium') {
      task = loc.mediumTask;
      hint = loc.mediumHint;
    } else if (difficultyLevel === 'hard') {
      task = loc.hardTask;
      hint = loc.hardHint;
    }

    keys.push({
      taskId: uuidv4(),
      task: task,
      value: generateRealisticValue(loc.location),
      location: loc.location,
      hint: hint,
      difficulty: loc.difficulty,
    });
  }

  return keys;
}

function buildPrompt(theme: WebpageTheme, keys: HiddenKey[]): string {
  const themeDesc = THEME_DESCRIPTIONS[theme];

  const keyInstructions = keys.map((key, i) => {
    switch (key.location) {
      case 'html-comment': return `${i + 1}. Hide an HTML comment: <!-- DEBUG_KEY: ${key.value} -->`;
      case 'hidden-element': return `${i + 1}. Add an invisible element: <span style="display:none">${key.value}</span>`;
      case 'data-attribute': return `${i + 1}. Add data-internal-id="${key.value}" to a prominent UI element`;
      case 'css-variable': return `${i + 1}. Set a CSS variable: --f-token: "${key.value}";`;
      case 'console-log': return `${i + 1}. Log to console: console.debug("Internal Config Hash:", "${key.value}");`;
      case 'localstorage': return `${i + 1}. Set LocalStorage: localStorage.setItem("v3_session", "${key.value}");`;
      case 'meta-tag': return `${i + 1}. Add meta tag: <meta name="env-key" content="${key.value}">`;
      case 'css-content': return `${i + 1}. Use CSS content: .nav-brand::before { content: "${key.value}"; font-size: 0; }`;
      case 'script-variable': return `${i + 1}. Define JS variable: window.__INTERNAL_STATE__ = { hash: "${key.value}" };`;
      case 'cookie': return `${i + 1}. Set Cookie: document.cookie = "_auth_v2=${key.value}; max-age=3600";`;
      case 'network-response': return `${i + 1}. Fire fetch() from code that clearly belongs to a visible, on-theme widget (hero stats ticker, inventory strip, “live quote” card)—not a detached script. Include the key in the response-shaped payload or query the UI implies. Use fetch(url, { cache: 'no-store' }) and for GET append '&_t=' + Date.now() so reloads still show a fresh Network entry. Example: fetch('/api/game/dummy?token=${key.value}&_t=' + Date.now(), { cache: 'no-store' }).catch(() => {});`;
      case 'network-header': return `${i + 1}. Same rule: tie the outgoing fetch to believable UI context (export, connect partner, checkout). Request header: fetch('/api/game/dummy', { headers: { 'X-Audit-Key': '${key.value}' }, cache: 'no-store' }).catch(() => {}); Always set cache: 'no-store'. Prefer a header name that plausibly matches that action, not generic “internal diff” jargon.`;
      case 'session-storage': return `${i + 1}. Set SessionStorage: sessionStorage.setItem("temp_id", "${key.value}");`;
      case 'aria-label': return `${i + 1}. Add ARIA label: <button aria-label="Action: ${key.value}">Submit</button>`;
      case 'plaintext': return `${i + 1}. Weave "${key.value}" into normal mid-page copy (article body, SKU line, shipping estimate, testimonial attribution, or version line)—never isolated at the top or in a labeled “secret” block. It must read as plausible customer-facing or product copy. Avoid fictitious internal-only lines (CI diff IDs, shadow row audits, made-up pipeline jargon) unless the entire page is clearly a devtools/internal portal theme.`;
      case 'click-network': return `${i + 1}. Add a control that already makes sense in the simulated product (e.g. “Save draft”, “Publish post”, “Sync catalog”, “Refresh quote”, “Create posting”) in the correct section of the layout. That control's handler fires fetch('/api/game/dummy?...') ONLY on click—never on load. Use encodeURIComponent(atob("BASE64")) for the token, { cache: "no-store" } (double quotes inside JS), and &_cb=Date.now(). Do not bolt on a stray paragraph of ops/CI microcopy solely to host a link—the button or link must belong with the surrounding fake feature.`;
      case 'click-reveal': return `${i + 1}. Use a disclosure pattern that matches the UI (expand pricing tier, “Show tracking #” in order detail, API key mock in a developer-settings panel). The visible label and placement must match that region. On click, write the decoded key into an adjacent span (atob in JS only). Optional class hooks (w-inline-note / inline-action) only if they match your stylesheet—no orphan footnote sentences disconnected from the app chrome.`;
      case 'console-invoke': return `${i + 1}. Register globalThis.FN = function(){ console.info or return the key from atob("${b64Utf8(key.value)}"); } with FN a short random identifier; leave ONE subtle HTML comment naming window.FN so players can discover it. Do not print the raw key in HTML.`;
      case 'script-bundle': return `${i + 1}. Add a second inline <script> styled like vendor/telemetry (leading comment e.g. /* chunk:vendor.ops.v2 */) with an IIFE that takes base64("${b64Utf8(key.value)}") as argument—do not print the decoded key; discovery is via reading Sources.`;
      default: return `${i + 1}. Hide the value "${key.value}" somewhere in the source.`;
    }
  }).join('\n');

  return `You are a World-Class Frontend Architect. Generate a complete, high-fidelity, single-file HTML webpage for ${themeDesc}.

DESIGN STANDARDS (IMPECCABLE):
- USE RICH AESTHETICS: The design should look like a premium 2024 tech landing page.
- CONTENT DENSITY: The page MUST be large and fleshed out. Include at least 5 distinct sections:
    1. Hero Section with call-to-action.
    2. Features/Benefits Grid.
    3. Content Feed (e.g., Fake Articles, Product Catalog, or News Grid).
    4. Interactive Component (e.g., Shopping Cart Sidebar, User Settings Panel, or Search Filter).
    5. Footer with multiple columns of links.
- REALISM: Use realistic copywriting and data. NO "Lorem Ipsum". Use fake user names, prices, dates, and technical descriptions.
- VIBRANT PALETTE: Use a curated color system (e.g., deep purples, vibrant cyans, or sleek monochromatic dark modes).
- GLASSMORPHISM: Implement subtle blur effects, gradients, and soft shadows where appropriate.
- MODERN TYPOGRAPHY: Use 'Inter' or 'system-ui' fonts with strong hierarchy.
- DEVTOOLS_VISIBILITY: You MUST wrap the entire body content in a div with id="webdevscav-simulated-root".
- DEVTOOLS_VISIBILITY: You MUST add a large, obvious HTML comment at the very top of the body: <!-- ◈◈◈ WEBDEVSCAV SIMULATION START ◈◈◈ -->.
- NO PLACEHOLDERS: Use realistic images from https://picsum.photos.
- ANIMATIONS: Add smooth hover transitions and subtle micro-interactions.

SCAVENGER HUNT REQUIREMENTS:
You MUST embed these exact hidden keys. They should be integrated naturally into your code:
${keyInstructions}

RULES:
- Return ONLY the raw HTML code (no markdown fences, no chat).
- The page must be 100% self-contained (all CSS in <style>, all JS in <script>).
- Ensure non-plaintext hidden keys are NOT visible on the rendered UI, but easily findable via Developer Tools. Plaintext keys must appear as exact character sequences in the HTML (inside realistic copy or in visually hidden/off-screen text), never as an obvious labeled “key” callout.
- SCRIPT_DISCIPLINE: Do NOT put every secret in one giant <script> at the bottom. Split into several small <script> blocks placed in different sections of the body (between content blocks). In JavaScript, do not paste raw key strings—use only atob("BASE64_UTF8") for any key material (compute base64 of the exact UTF-8 bytes of the key).
- SIMULATED_UI_FIRST: The HTML is a believable single-page app or marketing surface for the theme. Any button, link, redirect, or fetch that exposes a key must be part of that surface's normal chrome (nav, editor toolbar, cart, settings, feed cards)—not an injected sentence about CI, diffing, shadow rows, internal refs, or other fake infra copy that would not appear on a public page. Generate the fake UI first; attach the minimal script or inline handler so the interaction a player would naturally try is what triggers the leak.
- NO_SYNTHETIC_INTERNALS: Do not add standalone microcopy whose only purpose is to smuggle a control or token (e.g. “CI attaches an internal ref beside the changelog”, “shadow row drifts from pricing”). If copy sounds like employee-only pipeline jargon unrelated to the visible product story, replace it with customer- or product-facing wording while preserving DevTools discoverability.
- INTERACTION_KEYS: For click-to-fetch or click-to-reveal patterns, wire handlers to controls that already exist in the layout for narrative reasons (primary/secondary CTAs, list row actions, modal footers). Keys must not appear until interaction. For HTML onclick handlers wrapped in single quotes, use { cache: "no-store" } with double quotes inside JavaScript—never backslash-escaped quotes inside the attribute. Prefer fetch to /api/game/dummy?... on click so the request always records. For console-invoke, expose one global function that returns or logs the key; you may leave a single subtle HTML comment naming the function. For faux vendor bundles, add a secondary inline script with a vendor-style comment header; the key may appear only as a base64 literal passed into an IIFE—do not write the decoded key into the DOM for that pattern.
- NETWORK_AUDIT_FETCHES: Any fetch() meant to expose a key in DevTools MUST use { cache: 'no-store' }. For GET requests, append a cache-busting query such as '&_t=' + Date.now() so a full page reload still performs a new request. Prefer /api/game/dummy for harmless dummy traffic. On-load fetches should still originate from widgets the user can see (status banner, live counter), not invisible bootstrap-only noise unless the theme is explicitly a loading/telemetry demo.
- The page must be responsive and professional.`;
}

interface FallbackThemeTemplate {
  title: string;
  subtitle: string;
  nav: string[];
  ctaPrimary: string;
  ctaSecondary: string;
  features: Array<{ title: string; detail: string }>;
  feedLabel: string;
  feedItems: Array<{ title: string; detail: string; meta: string }>;
  panelTitle: string;
  panelRows: Array<{ label: string; value: string }>;
  footerColumns: Array<{ title: string; links: string[] }>;
  colors: { primary: string; accent: string; bg: string; glow: string };
}

const FALLBACK_TEMPLATES: Record<WebpageTheme, FallbackThemeTemplate> = {
  ecommerce: {
    title: 'TechVault — Premium Device Marketplace',
    subtitle: 'Trusted by 18,000+ teams to source enterprise laptops, peripherals, and edge hardware with same-day procurement tracking.',
    nav: ['Catalog', 'B2B Pricing', 'Bundles', 'Orders', 'Support'],
    ctaPrimary: 'Shop This Week',
    ctaSecondary: 'Compare Bundles',
    features: [
      { title: 'Procurement Automation', detail: 'Auto-syncs purchase approvals with finance and exports invoice-ready line items.' },
      { title: 'Global Warehousing', detail: '92 fulfillment nodes across NA, EMEA, and APAC with SLA-backed delivery windows.' },
      { title: 'Device Lifecycle Plans', detail: 'Track warranty, depreciation, and secure disposal for every purchased asset.' },
    ],
    feedLabel: 'Popular This Week',
    feedItems: [
      { title: 'ZenBook Pro 15 (2026)', detail: '$1,899 • 32GB RAM • 2TB SSD • RTX 5060', meta: '4.8 rating • 742 reviews' },
      { title: 'Nimbus Dock X12', detail: '$349 • 4x USB-C • 2x HDMI • 2.5GbE', meta: 'IT-approved in 120+ orgs' },
      { title: 'PulseNoise ANC Headset', detail: '$189 • 42h battery • Teams certified mic array', meta: 'Top seller in remote work kits' },
    ],
    panelTitle: 'Cart Health & Checkout Insights',
    panelRows: [
      { label: 'Open carts', value: '184 active sessions' },
      { label: 'Abandon rate', value: '17.2% (down 2.3%)' },
      { label: 'Avg order value', value: '$1,264.37' },
      { label: 'Fastest checkout', value: '01:08 by ops@novaforge.io' },
    ],
    footerColumns: [
      { title: 'Company', links: ['About', 'Careers', 'Press', 'Enterprise'] },
      { title: 'Resources', links: ['Shipping Policy', 'Warranty', 'Tax Exempt', 'Status'] },
      { title: 'Developers', links: ['Procurement API', 'Webhooks', 'SDKs', 'Changelog'] },
    ],
    colors: { primary: '#6c5ce7', accent: '#a29bfe', bg: '#0b0b14', glow: 'rgba(108,92,231,0.35)' },
  },
  blog: {
    title: 'ByteLog — Engineering Stories That Ship',
    subtitle: 'A publication for practical software architecture, postmortems, and experiments from teams building at scale.',
    nav: ['Latest', 'Architecture', 'DX', 'AI Tooling', 'Newsletter'],
    ctaPrimary: 'Read Today\'s Digest',
    ctaSecondary: 'Subscribe',
    features: [
      { title: 'Editor Curated Series', detail: 'Multi-part deep dives with code snippets, benchmarks, and rollout checklists.' },
      { title: 'Audience Signals', detail: 'Track saves, read-time, and completion rates for each article cohort.' },
      { title: 'Author Studio', detail: 'Draft workflow with approvals, SEO previews, and publication calendars.' },
    ],
    feedLabel: 'Featured Articles',
    feedItems: [
      { title: 'How We Cut API p95 by 41%', detail: 'Case study on queue shaping and cache key discipline.', meta: 'By Maya Chen • Apr 19, 2026' },
      { title: 'Designing for Failure in Event Pipelines', detail: 'A playbook for retries, idempotency, and dead-letter visibility.', meta: 'By Andre Silva • Apr 17, 2026' },
      { title: 'CSS Architecture for Multi-Team Frontends', detail: 'Namespacing and token layering without framework lock-in.', meta: 'By Kira Olsen • Apr 12, 2026' },
    ],
    panelTitle: 'Engagement Panel',
    panelRows: [
      { label: 'Daily readers', value: '38,412' },
      { label: 'Avg read time', value: '6m 42s' },
      { label: 'Newsletter CTR', value: '12.8%' },
      { label: 'Returning audience', value: '63%' },
    ],
    footerColumns: [
      { title: 'Editorial', links: ['Submission Guide', 'Style Guide', 'Fact Checking', 'Contributors'] },
      { title: 'Community', links: ['Discord', 'Open Drafts', 'Events', 'Podcast'] },
      { title: 'Legal', links: ['Terms', 'Privacy', 'Cookie Policy', 'License'] },
    ],
    colors: { primary: '#00b894', accent: '#55efc4', bg: '#0d1117', glow: 'rgba(0,184,148,0.3)' },
  },
  portfolio: {
    title: 'Alex Rivera — Product Engineer Portfolio',
    subtitle: 'Building resilient web products from idea to launch with a focus on design systems, reliability, and measurable growth.',
    nav: ['Projects', 'Case Studies', 'Stack', 'Testimonials', 'Contact'],
    ctaPrimary: 'View Case Studies',
    ctaSecondary: 'Book Intro Call',
    features: [
      { title: 'End-to-End Product Delivery', detail: 'From discovery workshops to production deployment and observability setup.' },
      { title: 'Performance-First Builds', detail: 'Core Web Vitals optimization with measurable before/after reporting.' },
      { title: 'Team Enablement', detail: 'Mentoring, documentation, and handoff systems that scale across squads.' },
    ],
    feedLabel: 'Recent Work',
    feedItems: [
      { title: 'Atlas Finance Rebuild', detail: 'Led migration from monolith UI to modular React platform.', meta: 'Result: +28% conversion' },
      { title: 'HelioOps Design System', detail: 'Created token architecture adopted by 7 product teams.', meta: 'Result: -35% UI regressions' },
      { title: 'Medline Portal Accessibility Pass', detail: 'Shipped WCAG 2.2 AA improvements in 6-week sprint.', meta: 'Result: 0 critical audit findings' },
    ],
    panelTitle: 'Availability & Engagement',
    panelRows: [
      { label: 'Current status', value: 'Accepting 1 new project' },
      { label: 'Avg project length', value: '9-12 weeks' },
      { label: 'Client response SLA', value: '< 12 business hours' },
      { label: 'Timezone overlap', value: 'US/EU friendly' },
    ],
    footerColumns: [
      { title: 'Work', links: ['Product Builds', 'Design Systems', 'Frontend Architecture', 'Performance Audits'] },
      { title: 'Proof', links: ['Client Notes', 'Project Metrics', 'References', 'Resume'] },
      { title: 'Connect', links: ['Email', 'LinkedIn', 'GitHub', 'Calendar'] },
    ],
    colors: { primary: '#e17055', accent: '#fab1a0', bg: '#0d0d0d', glow: 'rgba(225,112,85,0.35)' },
  },
  dashboard: {
    title: 'CloudMetrics — Infrastructure Operations Suite',
    subtitle: 'Unified observability across services, queues, and incidents with incident workflows your on-call team can actually use.',
    nav: ['Overview', 'Services', 'Alerts', 'Incidents', 'Billing'],
    ctaPrimary: 'Open Live Dashboard',
    ctaSecondary: 'Export Report',
    features: [
      { title: 'Service Health Topology', detail: 'Dependency maps with upstream impact tracing and error budget context.' },
      { title: 'Anomaly Detection', detail: 'Learns baseline latency and throughput to surface suspicious spikes fast.' },
      { title: 'Runbook Triggers', detail: 'Attach remediation playbooks directly to monitor states and alert thresholds.' },
    ],
    feedLabel: 'Operational Events',
    feedItems: [
      { title: 'payments-api latency spike', detail: 'p95 rose to 910ms for 4m in us-west-2.', meta: 'Mitigated • 09:14 UTC' },
      { title: 'worker queue backlog', detail: 'InvoiceQueue reached 12,480 pending jobs.', meta: 'Autoscaled • 08:47 UTC' },
      { title: 'cache hit-rate recovery', detail: 'Redis cluster returned to 96.1% hit-rate.', meta: 'Stable • 08:31 UTC' },
    ],
    panelTitle: 'SRE Quick Controls',
    panelRows: [
      { label: 'Active incidents', value: '2 high • 4 medium' },
      { label: 'SLO compliance', value: '99.93% this month' },
      { label: 'Deploys today', value: '27 successful • 1 rolled back' },
      { label: 'Error budget left', value: '73.4%' },
    ],
    footerColumns: [
      { title: 'Operations', links: ['Runbooks', 'Escalation Matrix', 'Maintenance Windows', 'Status Page'] },
      { title: 'Integrations', links: ['PagerDuty', 'Slack', 'Datadog', 'Grafana'] },
      { title: 'Platform', links: ['API Tokens', 'RBAC', 'Audit Logs', 'Changelog'] },
    ],
    colors: { primary: '#0984e3', accent: '#74b9ff', bg: '#0a0a0f', glow: 'rgba(9,132,227,0.35)' },
  },
  social: {
    title: 'LoopLine — Community Pulse Feed',
    subtitle: 'A social platform for builders sharing launch updates, product clips, and collaboration requests in real time.',
    nav: ['Feed', 'Creators', 'Messages', 'Trending', 'Spaces'],
    ctaPrimary: 'Join Live Feed',
    ctaSecondary: 'Create Post',
    features: [
      { title: 'Creator Reputation Graph', detail: 'Signals quality via response depth, peer endorsements, and consistency.' },
      { title: 'Smart Moderation', detail: 'AI-assisted filtering with transparent appeal workflows for community trust.' },
      { title: 'Live Collaboration Rooms', detail: 'Small group spaces for design critiques and sprint planning sessions.' },
    ],
    feedLabel: 'Trending Posts',
    feedItems: [
      { title: '@sami.launch', detail: 'Posted a demo of zero-config analytics for indie apps.', meta: '2.4k likes • 184 comments' },
      { title: '@devmara', detail: 'Shared a visual bug triage workflow with Figma templates.', meta: '1.1k saves • 96 reposts' },
      { title: '@kaylinops', detail: 'Started a thread on reducing outage MTTR in startups.', meta: 'Live discussion • 342 participants' },
    ],
    panelTitle: 'Creator Console',
    panelRows: [
      { label: 'Profile growth', value: '+1,284 followers this week' },
      { label: 'Best posting window', value: 'Tue-Thu • 10:00-12:30' },
      { label: 'Audience split', value: '48% devs • 27% PMs • 25% founders' },
      { label: 'Reply velocity', value: 'Avg 6m response time' },
    ],
    footerColumns: [
      { title: 'Product', links: ['Safety', 'Creator Monetization', 'Mobile Apps', 'Enterprise Communities'] },
      { title: 'Discover', links: ['Hashtags', 'Leaderboards', 'Spotlight', 'Guides'] },
      { title: 'Support', links: ['Help Center', 'Policies', 'Contact Trust Team', 'Accessibility'] },
    ],
    colors: { primary: '#fd79a8', accent: '#ffeaa7', bg: '#0f0b16', glow: 'rgba(253,121,168,0.35)' },
  },
  news: {
    title: 'SignalWire News — Briefings for Tech Leaders',
    subtitle: 'Daily reporting across infrastructure, policy, and startup markets with editorial context for executive teams.',
    nav: ['Headlines', 'Markets', 'Policy', 'Startups', 'Investigations'],
    ctaPrimary: 'Read Morning Brief',
    ctaSecondary: 'Set Topic Alerts',
    features: [
      { title: 'Rapid Coverage Desk', detail: 'Breaking updates with source-linked timelines and correction transparency.' },
      { title: 'Sector Analysis', detail: 'Context-rich reports on SaaS, cloud infra, and AI tooling economics.' },
      { title: 'Regional Bureaus', detail: 'On-ground correspondents in SF, London, Singapore, and Sao Paulo.' },
    ],
    feedLabel: 'Top Stories',
    feedItems: [
      { title: 'Cloud spend growth cools to 18% YoY', detail: 'Enterprises shift spend toward optimization and reserved pricing.', meta: 'Updated 37m ago' },
      { title: 'Open model licensing debate heats up', detail: 'Consortium proposes baseline governance language for contributors.', meta: 'By Staff • Policy Desk' },
      { title: 'Series B activity rebounds in fintech', detail: 'Median round size climbs to $31M in Q1.', meta: 'Data Team • Markets' },
    ],
    panelTitle: 'Newsroom Publishing Tracker',
    panelRows: [
      { label: 'Articles today', value: '46 published' },
      { label: 'Corrections issued', value: '1 minor clarification' },
      { label: 'Subscriber growth', value: '+2.1% week over week' },
      { label: 'Avg time-to-publish', value: '18 minutes' },
    ],
    footerColumns: [
      { title: 'Newsroom', links: ['Ethics Policy', 'Corrections', 'Editorial Team', 'Syndication'] },
      { title: 'Products', links: ['Pro Terminal', 'Mobile Alerts', 'Podcast', 'Research PDF'] },
      { title: 'Account', links: ['Manage Subscription', 'Billing', 'Gift Access', 'Preferences'] },
    ],
    colors: { primary: '#ffe66d', accent: '#f1fa8c', bg: '#0d1020', glow: 'rgba(255,230,109,0.35)' },
  },
  restaurant: {
    title: 'Saffron Dock — Coastal Kitchen & Bar',
    subtitle: 'Seasonal tasting menus, local seafood sourcing, and reservation slots that update in real time for downtown diners.',
    nav: ['Menu', 'Reservations', 'Private Dining', 'Chef Table', 'Gallery'],
    ctaPrimary: 'Book Table',
    ctaSecondary: 'View Tasting Menu',
    features: [
      { title: 'Seasonal Menu Engine', detail: 'Rotates dishes weekly based on market arrivals from partner fisheries.' },
      { title: 'Guest Preference Profiles', detail: 'Tracks allergies and seating notes for a smoother return experience.' },
      { title: 'Event Catering Workflow', detail: 'Proposal builder for corporate dinners and milestone celebrations.' },
    ],
    feedLabel: 'Chef Highlights',
    feedItems: [
      { title: 'Charred Octopus Tartine', detail: '$24 • fermented chili aioli • lemon ash', meta: 'Pairing: dry Riesling' },
      { title: 'Saffron Lobster Risotto', detail: '$39 • citrus butter • fennel pollen', meta: 'Most ordered this month' },
      { title: 'Roasted Stone Fruit Pavlova', detail: '$14 • vanilla bean cream • almond praline', meta: 'New spring dessert' },
    ],
    panelTitle: 'Service Operations',
    panelRows: [
      { label: 'Tonight reservations', value: '88 / 96 seats booked' },
      { label: 'Walk-in wait time', value: '22-30 minutes' },
      { label: 'Average table turn', value: '1h 18m' },
      { label: 'Guest satisfaction', value: '4.9 / 5 from 1,203 reviews' },
    ],
    footerColumns: [
      { title: 'Visit', links: ['Hours', 'Location', 'Parking', 'Accessibility'] },
      { title: 'Dining', links: ['Main Menu', 'Wine List', 'Chef Counter', 'Gift Cards'] },
      { title: 'Contact', links: ['Reservations Team', 'Events', 'Press', 'Careers'] },
    ],
    colors: { primary: '#ff7675', accent: '#fdcb6e', bg: '#140c0a', glow: 'rgba(255,118,117,0.35)' },
  },
  startup: {
    title: 'NeuralFlow — Workflow Intelligence Platform',
    subtitle: 'Automate repetitive ops work with explainable AI assistants, policy controls, and enterprise-grade audit trails.',
    nav: ['Platform', 'Solutions', 'Pricing', 'Customers', 'Docs'],
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Watch Product Tour',
    features: [
      { title: 'No-Code Automation Studio', detail: 'Map triggers, approvals, and action chains in a visual orchestration canvas.' },
      { title: 'Policy Guardrails', detail: 'Enforce redaction, retention, and compliance controls before execution.' },
      { title: 'ROI Instrumentation', detail: 'Quantify time saved, risk reduction, and workflow completion by department.' },
    ],
    feedLabel: 'Customer Launches',
    feedItems: [
      { title: 'BrightArc Finance', detail: 'Automated monthly close checklist across accounting and FP&A.', meta: 'Saved 240 hours/quarter' },
      { title: 'FleetSnap Logistics', detail: 'Built SLA breach escalation bot for customer ops.', meta: 'Reduced response lag by 36%' },
      { title: 'HorizonCare Clinics', detail: 'Created HIPAA-safe intake triage assistant in 9 days.', meta: '92% staff adoption' },
    ],
    panelTitle: 'Growth Metrics',
    panelRows: [
      { label: 'Pipeline value', value: '$4.8M qualified' },
      { label: 'Trial-to-paid', value: '31.7%' },
      { label: 'Net revenue retention', value: '124%' },
      { label: 'Avg implementation', value: '13 days' },
    ],
    footerColumns: [
      { title: 'Why NeuralFlow', links: ['Security', 'Trust Center', 'Architecture', 'Roadmap'] },
      { title: 'Developers', links: ['API Docs', 'SDK Starter', 'CLI', 'Templates'] },
      { title: 'Compare', links: ['vs Zapier', 'vs Workato', 'vs In-house Build', 'Migration Guide'] },
    ],
    colors: { primary: '#00cec9', accent: '#81ecec', bg: '#050505', glow: 'rgba(0,206,201,0.35)' },
  },
  travel: {
    title: 'Wayfare Atlas — Premium Trip Planning',
    subtitle: 'Plan multi-city itineraries with local guides, flexible bookings, and verified reviews from frequent travelers.',
    nav: ['Destinations', 'Flights', 'Stays', 'Experiences', 'Travel Club'],
    ctaPrimary: 'Plan My Trip',
    ctaSecondary: 'Explore Deals',
    features: [
      { title: 'Dynamic Itinerary Builder', detail: 'Combines flights, transit, and event timing into one conflict-free plan.' },
      { title: 'Smart Fare Tracking', detail: 'Alerts on meaningful drops and predicts booking windows by route history.' },
      { title: 'Local Partner Network', detail: 'Book vetted tours and transport with live support in 42 countries.' },
    ],
    feedLabel: 'Trending Destinations',
    feedItems: [
      { title: 'Kyoto in Autumn', detail: '7-day itinerary • boutique ryokan + heritage district walks', meta: 'From $2,340 / traveler' },
      { title: 'Lisbon + Porto', detail: '5 days • culinary route + riverfront hotels', meta: 'From $1,480 / traveler' },
      { title: 'Patagonia Expedition', detail: '10 days • guided hikes + glacier transfer', meta: 'Limited seats • departs May 18' },
    ],
    panelTitle: 'Trip Operations Board',
    panelRows: [
      { label: 'Bookings this week', value: '1,294 confirmed' },
      { label: 'On-time departure rate', value: '96.7%' },
      { label: 'Support SLA', value: 'Median response 3m 12s' },
      { label: 'Repeat travelers', value: '54%' },
    ],
    footerColumns: [
      { title: 'Explore', links: ['Destination Guides', 'Visa Tips', 'Packing Lists', 'Travel Stories'] },
      { title: 'Book', links: ['Flights', 'Hotels', 'Tours', 'Insurance'] },
      { title: 'Member', links: ['Rewards', 'Referral Program', 'Account', '24/7 Support'] },
    ],
    colors: { primary: '#00d2d3', accent: '#54a0ff', bg: '#06131a', glow: 'rgba(0,210,211,0.35)' },
  },
  crypto: {
    title: 'OrbitX Exchange — Digital Asset Terminal',
    subtitle: 'Institutional-grade trading, custody, and market intelligence for serious crypto participants.',
    nav: ['Markets', 'Trade', 'Earn', 'Institutional', 'Security'],
    ctaPrimary: 'Open Trading Terminal',
    ctaSecondary: 'View Proof of Reserves',
    features: [
      { title: 'Low-Latency Matching', detail: 'Sub-25ms order execution across spot and perpetual order books.' },
      { title: 'Custody Controls', detail: 'MPC wallet policies, whitelisted withdrawals, and role-based approvals.' },
      { title: 'Risk Dashboard', detail: 'Portfolio VaR, liquidation heatmaps, and exposure alerts in one view.' },
    ],
    feedLabel: 'Market Movers',
    feedItems: [
      { title: 'BTC / USD', detail: '$83,420.11 • +2.8% 24h', meta: 'Volume $3.1B' },
      { title: 'ETH / USD', detail: '$4,120.64 • +1.9% 24h', meta: 'Open interest up 12%' },
      { title: 'SOL / USD', detail: '$187.08 • -0.7% 24h', meta: 'Funding neutral' },
    ],
    panelTitle: 'Risk & Compliance',
    panelRows: [
      { label: 'Margin utilization', value: '43.2%' },
      { label: 'Liquidation buffer', value: 'Healthy across top 20 accounts' },
      { label: 'Suspicious activity flags', value: '3 pending review' },
      { label: 'Reserve ratio', value: '1.09x assets / liabilities' },
    ],
    footerColumns: [
      { title: 'Platform', links: ['Fees', 'API Docs', 'Trading Rules', 'Status'] },
      { title: 'Security', links: ['Bug Bounty', 'Audit Reports', 'Account Protection', 'Incident History'] },
      { title: 'Legal', links: ['Terms', 'Risk Disclosure', 'Regional Restrictions', 'Privacy'] },
    ],
    colors: { primary: '#feca57', accent: '#ff9ff3', bg: '#0b0b16', glow: 'rgba(254,202,87,0.32)' },
  },
  gaming: {
    title: 'ArcForge — Game Discovery Platform',
    subtitle: 'Discover fresh releases, track competitive stats, and jump into community events across PC and console titles.',
    nav: ['Store', 'Library', 'Esports', 'Community', 'Creators'],
    ctaPrimary: 'Browse New Releases',
    ctaSecondary: 'Open Friends List',
    features: [
      { title: 'Personalized Recommendations', detail: 'Suggests games from play history, genre preference, and session length.' },
      { title: 'Live Tournament Hub', detail: 'Watch brackets, player streams, and event stats in a synced panel.' },
      { title: 'Cross-Platform Parties', detail: 'Invite friends from PC, console, and cloud sessions in one room.' },
    ],
    feedLabel: 'Featured Games',
    feedItems: [
      { title: 'Helix Protocol', detail: 'Tactical co-op shooter • 4.7 score', meta: 'Peak players: 82,144' },
      { title: 'Echoes of Veyra', detail: 'Narrative RPG • 60+ hour campaign', meta: 'New DLC released today' },
      { title: 'Turbo Kart Uprising', detail: 'Arcade racer • ranked season 5 live', meta: 'Crossplay enabled' },
    ],
    panelTitle: 'Player Activity',
    panelRows: [
      { label: 'Friends online', value: '23 currently active' },
      { label: 'Party invites', value: '4 pending' },
      { label: 'Daily challenge streak', value: '17 days' },
      { label: 'Matchmaking latency', value: '34ms average' },
    ],
    footerColumns: [
      { title: 'Play', links: ['Download Client', 'Controller Support', 'Cloud Saves', 'Wishlist'] },
      { title: 'Community', links: ['Forums', 'Clans', 'Guides', 'Events Calendar'] },
      { title: 'Creator Tools', links: ['Creator Program', 'Overlay Kit', 'Asset Packs', 'Monetization'] },
    ],
    colors: { primary: '#6c5ce7', accent: '#00cec9', bg: '#090a15', glow: 'rgba(108,92,231,0.36)' },
  },
  education: {
    title: 'SkillBridge Academy — Career Learning Paths',
    subtitle: 'Structured online courses with mentor feedback, practical labs, and measurable progress for modern tech careers.',
    nav: ['Courses', 'Tracks', 'Mentors', 'Certificates', 'Community'],
    ctaPrimary: 'Start Learning',
    ctaSecondary: 'Preview Curriculum',
    features: [
      { title: 'Role-Based Tracks', detail: 'Frontend, data, cloud, and product tracks aligned to hiring requirements.' },
      { title: 'Hands-On Labs', detail: 'Browser-based exercises with guided hints and automated validation.' },
      { title: 'Mentor Office Hours', detail: 'Weekly sessions for architecture reviews and portfolio feedback.' },
    ],
    feedLabel: 'Top Courses',
    feedItems: [
      { title: 'Modern React Systems', detail: '42 lessons • 18 hours • intermediate', meta: '94% completion satisfaction' },
      { title: 'Cloud Fundamentals to Deployment', detail: '31 lessons • 14 labs • beginner-friendly', meta: 'Used by 47 bootcamps' },
      { title: 'Data Storytelling for PMs', detail: '22 lessons • dashboard capstone', meta: 'Certificate included' },
    ],
    panelTitle: 'Learner Progress Snapshot',
    panelRows: [
      { label: 'Active learners', value: '26,402 this month' },
      { label: 'Avg weekly study time', value: '4h 28m' },
      { label: 'Certificate completion', value: '68.4%' },
      { label: 'Mentor response SLA', value: '< 24h' },
    ],
    footerColumns: [
      { title: 'Learning', links: ['Catalog', 'Learning Paths', 'Assessments', 'Scholarships'] },
      { title: 'For Teams', links: ['Team Plans', 'Skill Reports', 'Admin Console', 'SSO'] },
      { title: 'Support', links: ['Help Center', 'Accessibility', 'Student Success', 'Contact'] },
    ],
    colors: { primary: '#2ed573', accent: '#7bed9f', bg: '#08110d', glow: 'rgba(46,213,115,0.33)' },
  },
  realestate: {
    title: 'NorthKey Estates — Residential Property Hub',
    subtitle: 'Browse verified listings, compare neighborhood data, and schedule tours with local agents in minutes.',
    nav: ['Buy', 'Rent', 'Neighborhoods', 'Agents', 'Mortgage'],
    ctaPrimary: 'Search Listings',
    ctaSecondary: 'Get Pre-Qualified',
    features: [
      { title: 'Verified Listing Pipeline', detail: 'Agent-reviewed inventory with pricing history and disclosure tracking.' },
      { title: 'Neighborhood Intelligence', detail: 'School ratings, commute estimates, and community trend indicators.' },
      { title: 'Tour Scheduling Assistant', detail: 'Coordinate in-person and virtual tours with one-click confirmations.' },
    ],
    feedLabel: 'Fresh Listings',
    feedItems: [
      { title: '2BR Loft — Mission District', detail: '$1,180,000 • 1,240 sqft • 2 bath', meta: 'Open house Sat 11:00 AM' },
      { title: '4BR Home — Austin East', detail: '$742,000 • 2,860 sqft • renovated kitchen', meta: 'Listed 2 days ago' },
      { title: 'Downtown Condo — Seattle', detail: '$689,500 • 980 sqft • skyline view', meta: 'HOA: $420 / month' },
    ],
    panelTitle: 'Market Activity Panel',
    panelRows: [
      { label: 'Avg days on market', value: '21 days' },
      { label: 'Median sold-over-ask', value: '+3.6%' },
      { label: 'Tour requests today', value: '312 scheduled' },
      { label: 'Mortgage rates', value: '6.18% fixed (30y)' },
    ],
    footerColumns: [
      { title: 'Services', links: ['Buyer Services', 'Seller Toolkit', 'Rentals', 'Relocation'] },
      { title: 'Data', links: ['Market Reports', 'Price Trends', 'School Maps', 'Zoning'] },
      { title: 'Agents', links: ['Find an Agent', 'Top Producers', 'Join Brokerage', 'Licensing'] },
    ],
    colors: { primary: '#1e90ff', accent: '#70a1ff', bg: '#081018', glow: 'rgba(30,144,255,0.32)' },
  },
  fitness: {
    title: 'ForgeFit — Performance Coaching Platform',
    subtitle: 'Personalized training plans, nutrition tracking, and recovery insights designed for long-term consistency.',
    nav: ['Programs', 'Coaches', 'Nutrition', 'Progress', 'Community'],
    ctaPrimary: 'Start Plan',
    ctaSecondary: 'Take Fitness Quiz',
    features: [
      { title: 'Adaptive Training Blocks', detail: 'Program intensity adjusts based on performance and fatigue signals.' },
      { title: 'Nutrition Protocols', detail: 'Macro guidance with grocery lists and prep timelines by goal type.' },
      { title: 'Recovery Intelligence', detail: 'Sleep and readiness trends to prevent overtraining and injury risk.' },
    ],
    feedLabel: 'Member Programs',
    feedItems: [
      { title: 'Strength Rebuild 8-Week', detail: '4 sessions/week • barbell + bodyweight progression', meta: 'Used by 12,400 members' },
      { title: 'Hybrid Runner Conditioning', detail: 'Mobility + tempo intervals + VO2 max sessions', meta: 'Coach-rated 4.9 / 5' },
      { title: 'Lean Performance Nutrition', detail: 'Meal templates for cut/recomp goals', meta: 'Includes weekly check-ins' },
    ],
    panelTitle: 'Personal Dashboard Snapshot',
    panelRows: [
      { label: 'Current streak', value: '29 workout days logged' },
      { label: 'Weekly adherence', value: '91%' },
      { label: 'Resting HR trend', value: '-4 bpm over 30 days' },
      { label: 'Coach feedback pending', value: '2 updates' },
    ],
    footerColumns: [
      { title: 'Training', links: ['Program Library', 'Exercise Index', 'Progressive Plans', 'Benchmarks'] },
      { title: 'Health', links: ['Recovery', 'Meal Plans', 'Supplements', 'Habit Tracker'] },
      { title: 'Community', links: ['Challenges', 'Leaderboard', 'Success Stories', 'Support'] },
    ],
    colors: { primary: '#ff6b6b', accent: '#feca57', bg: '#120c0c', glow: 'rgba(255,107,107,0.34)' },
  },
  streaming: {
    title: 'ScreenWave — Premium Streaming Network',
    subtitle: 'Watch curated films, exclusive series, and live events with adaptive quality and cross-device continuation.',
    nav: ['Home', 'Series', 'Movies', 'Live', 'My List'],
    ctaPrimary: 'Continue Watching',
    ctaSecondary: 'Browse New Arrivals',
    features: [
      { title: 'Smart Content Curation', detail: 'Combines watch history, mood tags, and completion behavior to recommend titles.' },
      { title: 'Adaptive Playback Engine', detail: 'Optimized bitrate switching for stable quality on variable networks.' },
      { title: 'Family Profile Controls', detail: 'Age filters, watch limits, and profile PIN controls across devices.' },
    ],
    feedLabel: 'Top Picks Tonight',
    feedItems: [
      { title: 'Silent Orbit', detail: 'Sci-fi thriller • 2 seasons • 4K HDR', meta: '98% match for your profile' },
      { title: 'The Last Harbor', detail: 'Crime drama • New episode released', meta: 'Trending in your region' },
      { title: 'Field Notes: Arctic Front', detail: 'Documentary • 84 minutes', meta: 'Editor\'s spotlight pick' },
    ],
    panelTitle: 'Playback & Account Status',
    panelRows: [
      { label: 'Concurrent streams', value: '3 / 4 active' },
      { label: 'Average quality', value: '2160p on Fiber' },
      { label: 'Downloads available', value: '17 titles offline ready' },
      { label: 'Next billing date', value: 'May 03, 2026' },
    ],
    footerColumns: [
      { title: 'Browse', links: ['Genres', 'New & Popular', 'Top 10', 'Coming Soon'] },
      { title: 'Account', links: ['Plans', 'Devices', 'Profiles', 'Payment Methods'] },
      { title: 'Help', links: ['Support Center', 'Playback Help', 'Parental Controls', 'Accessibility'] },
    ],
    colors: { primary: '#ff4757', accent: '#ff6b81', bg: '#0b0b12', glow: 'rgba(255,71,87,0.34)' },
  },
};

type FallbackLayoutVariant =
  | 'storefront'
  | 'article'
  | 'newsroom'
  | 'video-platform'
  | 'streaming-app'
  | 'stock-terminal'
  | 'listing-market'
  | 'profile'
  | 'saas'
  | 'fitness';

const THEME_LAYOUT_VARIANTS: Record<WebpageTheme, FallbackLayoutVariant> = {
  ecommerce: 'storefront',
  restaurant: 'storefront',
  travel: 'storefront',
  realestate: 'listing-market',
  blog: 'article',
  news: 'newsroom',
  education: 'article',
  portfolio: 'profile',
  social: 'video-platform',
  startup: 'saas',
  fitness: 'fitness',
  dashboard: 'stock-terminal',
  crypto: 'stock-terminal',
  gaming: 'video-platform',
  streaming: 'streaming-app',
};

function buildLayoutStyles(variant: FallbackLayoutVariant): string {
  const base = `
  .site-shell { width: min(1240px, 94vw); margin: 0 auto; }
  .top-nav { display:flex; justify-content:space-between; align-items:center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .top-nav .brand { font-weight: 800; color: var(--text); }
  .top-nav .links { display:flex; gap: 14px; flex-wrap: wrap; color: var(--text-muted); font-size: 13px; }
  .block { border: 1px solid var(--border); background: rgba(255,255,255,.02); border-radius: 12px; padding: 14px; }
  `;

  if (variant === 'storefront') {
    return `${base}
    .layout-storefront .hero { display:grid; grid-template-columns: 1.2fr .8fr; gap: 14px; margin: 16px 0; }
    .layout-storefront .products { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; }
    .layout-storefront .products img { width:100%; height:150px; object-fit:cover; border-radius: 8px; margin-bottom: 8px; }
    .layout-storefront .cart li { display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
    @media (max-width: 900px){ .layout-storefront .hero,.layout-storefront .products{grid-template-columns:1fr;} }`;
  }
  if (variant === 'article') {
    return `${base}
    .layout-article .headline { padding: 20px 0 14px; border-bottom: 1px solid var(--border); }
    .layout-article .headline h1 { font-size: clamp(34px,6vw,56px); max-width: 18ch; }
    .layout-article .main { display:grid; grid-template-columns: .7fr 1.3fr; gap: 18px; margin: 16px 0; }
    .layout-article .story p { margin-bottom: 12px; line-height: 1.7; max-width: 68ch; }
    .layout-article .story img { width:100%; height: 260px; object-fit: cover; border-radius: 10px; margin: 12px 0; }
    @media (max-width: 900px){ .layout-article .main{grid-template-columns:1fr;} }`;
  }
  if (variant === 'newsroom') {
    return `${base}
    .layout-newsroom .ticker { padding: 8px 12px; background: rgba(255,255,255,.05); border-radius: 999px; margin: 12px 0; font-size: 12px; }
    .layout-newsroom .grid { display:grid; grid-template-columns: 1.3fr .7fr; gap: 14px; margin: 10px 0 16px; }
    .layout-newsroom .lead img { width:100%; height: 220px; object-fit:cover; border-radius: 8px; margin: 8px 0; }
    .layout-newsroom .column article { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
    @media (max-width: 900px){ .layout-newsroom .grid{grid-template-columns:1fr;} }`;
  }
  if (variant === 'streaming-app') {
    return `${base}
    .layout-streaming-app .hero { position:relative; margin: 12px 0 18px; border-radius: 14px; overflow: hidden; min-height: 320px; }
    .layout-streaming-app .hero img { width:100%; height:320px; object-fit:cover; }
    .layout-streaming-app .hero .overlay { position:absolute; inset:0; background: linear-gradient(90deg, rgba(0,0,0,.75), rgba(0,0,0,.2)); padding: 26px; display:flex; flex-direction:column; justify-content:flex-end; }
    .layout-streaming-app .row { margin-bottom: 14px; }
    .layout-streaming-app .rail { display:grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
    .layout-streaming-app .rail article img { width:100%; height:120px; object-fit:cover; border-radius: 8px; margin-bottom: 6px; }
    @media (max-width: 1000px){ .layout-streaming-app .rail{grid-template-columns:1fr 1fr;} }`;
  }
  if (variant === 'video-platform') {
    return `${base}
    .layout-video-platform .main { display:grid; grid-template-columns: 1.2fr .8fr; gap: 14px; margin: 14px 0; }
    .layout-video-platform .player { border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
    .layout-video-platform .player img { width:100%; height: 340px; object-fit: cover; display:block; }
    .layout-video-platform .up-next article { display:grid; grid-template-columns: 120px 1fr; gap: 10px; padding: 8px 0; border-bottom:1px solid rgba(255,255,255,.06); }
    .layout-video-platform .up-next img { width:120px; height:72px; object-fit: cover; border-radius: 8px; }
    @media (max-width: 980px){ .layout-video-platform .main{grid-template-columns:1fr;} }`;
  }
  if (variant === 'stock-terminal') {
    return `${base}
    .layout-stock-terminal .strip { display:grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; margin: 12px 0; }
    .layout-stock-terminal .strip article { border:1px solid var(--border); border-radius:10px; padding: 10px; background: rgba(255,255,255,.03); }
    .layout-stock-terminal .terminal { display:grid; grid-template-columns: 1.2fr .8fr; gap: 12px; }
    .layout-stock-terminal table { width:100%; border-collapse: collapse; font-size: 13px; }
    .layout-stock-terminal th,.layout-stock-terminal td { border-bottom:1px solid rgba(255,255,255,.06); padding: 8px; text-align:left; }
    .layout-stock-terminal .orders li { display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
    @media (max-width: 980px){ .layout-stock-terminal .terminal,.layout-stock-terminal .strip{grid-template-columns:1fr;} }`;
  }
  if (variant === 'listing-market') {
    return `${base}
    .layout-listing-market .map-row { display:grid; grid-template-columns: .8fr 1.2fr; gap: 12px; margin: 12px 0; }
    .layout-listing-market .map { background: url('https://picsum.photos/seed/mapgrid/640/500') center/cover; min-height: 320px; border-radius: 12px; border:1px solid var(--border); }
    .layout-listing-market .cards article { border:1px solid var(--border); border-radius: 10px; padding: 10px; margin-bottom: 10px; background: rgba(255,255,255,.02); }
    .layout-listing-market .cards img { width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:8px; }
    @media (max-width: 900px){ .layout-listing-market .map-row{grid-template-columns:1fr;} }`;
  }
  if (variant === 'saas') {
    return `${base}
    .layout-saas .hero { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
    .layout-saas .pricing { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; }
    .layout-saas .pricing article { border:1px solid var(--border); border-radius: 10px; padding: 12px; background: rgba(255,255,255,.02); }
    @media (max-width: 960px){ .layout-saas .hero,.layout-saas .pricing{grid-template-columns:1fr;} }`;
  }
  if (variant === 'fitness') {
    return `${base}
    .layout-fitness .dashboard { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; margin: 12px 0; }
    .layout-fitness .dashboard article { border:1px solid var(--border); border-radius: 10px; padding: 10px; background: rgba(255,255,255,.02); }
    .layout-fitness .plans { display:grid; grid-template-columns: 1.2fr .8fr; gap: 12px; }
    .layout-fitness .plans article { border:1px solid var(--border); border-radius: 12px; padding: 12px; }
    @media (max-width: 980px){ .layout-fitness .dashboard,.layout-fitness .plans{grid-template-columns:1fr;} }`;
  }
  if (variant === 'profile') {
    return `${base}
    .layout-profile .hero { display:grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; margin: 20px 0; }
    .layout-profile .hero-visual img { width:100%; max-height: 440px; object-fit: cover; border-radius: 14px; border:1px solid var(--border); }
    .layout-profile .projects { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; }
    .layout-profile .projects article { border:1px solid var(--border); border-radius: 12px; overflow: hidden; background: rgba(255,255,255,.02); }
    .layout-profile .projects article img { width:100%; height: 190px; object-fit: cover; display:block; }
    .layout-profile .projects article h4 { padding: 10px 12px 0; }
    .layout-profile .projects article p, .layout-profile .projects article span { padding: 0 12px 12px; display:block; }
    .layout-profile .metrics { display:grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; margin: 8px 0 18px; }
    .layout-profile .metrics article { border:1px solid var(--border); border-radius: 10px; padding: 14px 12px; background: rgba(255,255,255,.02); }
    .layout-profile .stack { display:flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 4px; }
    .layout-profile .stack span { font-size: 12px; padding: 7px 14px; border-radius: 999px; border:1px solid var(--border); color: var(--text-muted); }
    @media (max-width: 960px){ .layout-profile .hero,.layout-profile .projects,.layout-profile .metrics{grid-template-columns:1fr;} }`;
  }

  return `${base}`;
}

function buildLayoutBody(template: FallbackThemeTemplate, variant: FallbackLayoutVariant): string {
  const navLinks = template.nav.map((item) => `<a href="#">${item}</a>`).join('');
  const footerColumns = template.footerColumns
    .map((column) => `<div><h5>${column.title}</h5>${column.links.map((link) => `<a href="#">${link}</a>`).join('')}</div>`)
    .join('\n');
  const panelRows = template.panelRows.map((row) => `<li><strong>${row.label}</strong><span>${row.value}</span></li>`).join('');
  const feedCards = template.feedItems
    .map((item, index) => `<article><h4>${item.title}</h4><p>${item.detail}</p><span>${item.meta}</span>${index < template.feedItems.length - 1 ? '' : ''}</article>`)
    .join('');
  const featureCards = template.features.map((feature) => `<article><h4>${feature.title}</h4><p>${feature.detail}</p></article>`).join('');
  const longFeed = Array.from({ length: 9 }, (_, i) => {
    const item = template.feedItems[i % template.feedItems.length];
    return `<article class="block"><h4>${item.title} #${i + 1}</h4><p>${item.detail}</p><span>${item.meta}</span></article>`;
  }).join('');
  const longTableRows = Array.from({ length: 14 }, (_, i) => {
    const item = template.feedItems[i % template.feedItems.length];
    return `<tr><td>${item.title.split(' ')[0]}-${100 + i}</td><td>${i % 2 ? 'BUY' : 'SELL'}</td><td>${item.detail}</td><td>${item.meta}</td></tr>`;
  }).join('');
  const longListRows = Array.from({ length: 12 }, (_, i) => {
    const row = template.panelRows[i % template.panelRows.length];
    return `<li><strong>${row.label}</strong><span>${row.value}</span></li>`;
  }).join('');

  if (variant === 'storefront') {
    const cards = template.feedItems.map((item) => `<article class="block"><img src="https://picsum.photos/seed/${encodeURIComponent(item.title)}/420/280" alt="${item.title}"><h4>${item.title}</h4><p>${item.detail}</p><span>${item.meta}</span></article>`).join('');
    return `<div class="layout-storefront site-shell">
      <header class="top-nav"><div class="brand">${template.title.split('—')[0]}</div><div class="links">${navLinks}</div></header>
      <section class="hero"><article class="block"><p class="section-title">Storefront</p><h1>${template.title}</h1><p>${template.subtitle}</p><a class="btn-main" href="#">${template.ctaPrimary}</a></article><aside class="block"><p class="section-title">${template.panelTitle}</p><ul class="cart">${panelRows}</ul></aside></section>
      <section class="products">${cards}</section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Trending Collections</p><div class="products">${cards}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Recently Viewed</p><div class="products">${cards}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Customer Q&A</p><div style="display:grid; gap:10px;">${longFeed}</div></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${template.title.split('—')[0]}</p></footer>
    </div>`;
  }
  if (variant === 'article') {
    return `<div class="layout-article site-shell">
      <header class="top-nav"><div class="brand">${template.title.split('—')[0]}</div><div class="links">${navLinks}</div></header>
      <section class="headline"><p class="section-title">Longform Article</p><h1>${template.feedItems[0].title}</h1><p>${template.feedItems[0].meta}</p></section>
      <section class="main"><aside class="block"><p class="section-title">Key Takeaways</p>${featureCards}</aside><article class="story block"><img src="https://picsum.photos/seed/${encodeURIComponent(template.title)}/960/540" alt="${template.title}"><p>${template.subtitle}</p><p>${template.feedItems[0].detail}</p><p>${template.feedItems[1].detail}</p><p>${template.feedItems[2].detail}</p><a href="#" class="btn-main">${template.ctaPrimary}</a></article></section>
      <section class="block"><p class="section-title">Related Stories</p><div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px;">${longFeed}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Editorial Timeline</p><div style="display:grid; gap:8px;">${longFeed}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Reader Comments</p><div style="display:grid; gap:8px;">${longFeed}</div></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${template.title.split('—')[0]}</p></footer>
    </div>`;
  }
  if (variant === 'newsroom') {
    const side = template.feedItems.map((item) => `<article><h4>${item.title}</h4><p>${item.detail}</p><span>${item.meta}</span></article>`).join('');
    return `<div class="layout-newsroom site-shell">
      <header class="top-nav"><div class="brand">${template.title.split('—')[0]}</div><div class="links">${navLinks}</div></header>
      <div class="ticker">BREAKING: Infrastructure policy vote passes committee • Markets close mixed • New funding round announced</div>
      <section class="grid"><article class="lead block"><p class="section-title">Lead Story</p><img src="https://picsum.photos/seed/${encodeURIComponent(template.feedItems[0].title)}/960/540" alt="lead"><h3>${template.feedItems[0].title}</h3><p>${template.feedItems[0].detail}</p></article><aside class="column block"><p class="section-title">Top Stories</p>${side}</aside></section>
      <section class="block"><p class="section-title">World / Politics / Business</p><div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">${longFeed}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Most Read in Last 24h</p><div style="display:grid; gap:8px;">${longFeed}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Live Blog Updates</p><div style="display:grid; gap:8px;">${longFeed}</div></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${template.title.split('—')[0]}</p></footer>
    </div>`;
  }
  if (variant === 'streaming-app') {
    const rail = template.feedItems.map((item) => `<article><img src="https://picsum.photos/seed/${encodeURIComponent(item.title + 'stream')}/420/240" alt="${item.title}"><h4>${item.title}</h4><span>${item.meta}</span></article>`).join('');
    return `<div class="layout-streaming-app site-shell">
      <header class="top-nav"><div class="brand">${template.title.split('—')[0]}</div><div class="links">${navLinks}</div></header>
      <section class="hero"><img src="https://picsum.photos/seed/${encodeURIComponent(template.title + 'hero')}/1200/500" alt="${template.title}"><div class="overlay"><p class="section-title">Featured Tonight</p><h1>${template.feedItems[0].title}</h1><p>${template.feedItems[0].detail}</p><a class="btn-main" href="#">${template.ctaPrimary}</a></div></section>
      <section class="row"><p class="section-title">Continue Watching</p><div class="rail">${rail}</div></section>
      <section class="row"><p class="section-title">Trending Now</p><div class="rail">${rail}${rail}</div></section>
      <section class="row"><p class="section-title">Because You Watched</p><div class="rail">${rail}${rail}</div></section>
      <section class="block"><p class="section-title">Your Watchlist Activity</p><ul>${longListRows}</ul></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${template.title.split('—')[0]}</p></footer>
    </div>`;
  }
  if (variant === 'video-platform') {
    const upNext = template.feedItems.map((item) => `<article><img src="https://picsum.photos/seed/${encodeURIComponent(item.title + 'video')}/280/180" alt="${item.title}"><div><h4>${item.title}</h4><p>${item.detail}</p><span>${item.meta}</span></div></article>`).join('');
    return `<div class="layout-video-platform site-shell">
      <header class="top-nav"><div class="brand">${template.title.split('—')[0]}</div><div class="links">${navLinks}</div></header>
      <section class="main"><article><div class="player"><img src="https://picsum.photos/seed/${encodeURIComponent(template.title + 'player')}/1200/680" alt="player"></div><div class="block" style="margin-top:10px;"><h3>${template.feedItems[0].title}</h3><p>${template.feedItems[0].detail}</p><span>${template.feedItems[0].meta}</span></div></article><aside class="up-next block"><p class="section-title">Up Next</p>${upNext}</aside></section>
      <section class="block"><p class="section-title">Recommended for You</p><div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px;">${upNext}${upNext}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Top Live Channels</p><div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px;">${upNext}${upNext}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Community Posts</p><div style="display:grid; gap:8px;">${longFeed}</div></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${template.title.split('—')[0]}</p></footer>
    </div>`;
  }
  if (variant === 'stock-terminal') {
    const strip = template.feedItems.map((item) => `<article><strong>${item.title.split(' ')[0]}</strong><p>${item.meta}</p><span>${item.detail}</span></article>`).join('');
    const orderRows = template.panelRows.map((item) => `<li><strong>${item.label}</strong><span>${item.value}</span></li>`).join('');
    const tableRows = template.feedItems.map((item, idx) => `<tr><td>${item.title}</td><td>${idx % 2 ? 'BUY' : 'SELL'}</td><td>${item.detail}</td></tr>`).join('');
    return `<div class="layout-stock-terminal site-shell">
      <header class="top-nav"><div class="brand">${template.title.split('—')[0]} Terminal</div><div class="links">${navLinks}</div></header>
      <section class="strip">${strip}</section>
      <section class="terminal"><article class="block"><p class="section-title">Market Tape</p><table><thead><tr><th>Symbol</th><th>Side</th><th>Price/Info</th></tr></thead><tbody>${tableRows}</tbody></table></article><aside class="block"><p class="section-title">Order Panel</p><ul class="orders">${orderRows}</ul><a href="#" class="btn-main">${template.ctaPrimary}</a></aside></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Level II Quotes</p><table><thead><tr><th>Symbol</th><th>Side</th><th>Price</th><th>Notes</th></tr></thead><tbody>${longTableRows}</tbody></table></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">News & Analyst Notes</p><div style="display:grid; gap:8px;">${longFeed}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Watchlists</p><ul class="orders">${longListRows}</ul></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${template.title.split('—')[0]}</p></footer>
    </div>`;
  }
  if (variant === 'listing-market') {
    const cards = template.feedItems.map((item) => `<article><img src="https://picsum.photos/seed/${encodeURIComponent(item.title + 'home')}/500/320" alt="${item.title}"><h4>${item.title}</h4><p>${item.detail}</p><span>${item.meta}</span></article>`).join('');
    return `<div class="layout-listing-market site-shell">
      <header class="top-nav"><div class="brand">${template.title.split('—')[0]}</div><div class="links">${navLinks}</div></header>
      <section class="map-row"><aside class="map"></aside><div class="cards">${cards}</div></section>
      <section class="block"><p class="section-title">${template.panelTitle}</p><ul>${panelRows}</ul></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Nearby Listings</p><div class="cards">${cards}${cards}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Neighborhood Guides</p><div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px;">${longFeed}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Recent Price Changes</p><ul>${longListRows}</ul></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${template.title.split('—')[0]}</p></footer>
    </div>`;
  }
  if (variant === 'saas') {
    const pricing = ['Starter', 'Growth', 'Enterprise'].map((tier, idx) => `<article><h4>${tier}</h4><p>${idx === 0 ? '$49' : idx === 1 ? '$149' : 'Custom'}/mo</p><span>${template.features[idx % template.features.length].detail}</span></article>`).join('');
    return `<div class="layout-saas site-shell">
      <header class="top-nav"><div class="brand">${template.title.split('—')[0]}</div><div class="links">${navLinks}</div></header>
      <section class="hero"><article class="block"><p class="section-title">Platform</p><h1>${template.title}</h1><p>${template.subtitle}</p><a class="btn-main" href="#">${template.ctaPrimary}</a></article><article class="block"><p class="section-title">Why Teams Buy</p>${featureCards}</article></section>
      <section class="pricing">${pricing}</section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Customer Stories</p><div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px;">${longFeed}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Product Updates</p><table><thead><tr><th>Version</th><th>Release</th><th>Summary</th><th>Status</th></tr></thead><tbody>${longTableRows}</tbody></table></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Security & Compliance</p><ul>${longListRows}</ul></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${template.title.split('—')[0]}</p></footer>
    </div>`;
  }
  if (variant === 'fitness') {
    const stats = template.panelRows.map((row) => `<article><strong>${row.value}</strong><p>${row.label}</p></article>`).join('');
    return `<div class="layout-fitness site-shell">
      <header class="top-nav"><div class="brand">${template.title.split('—')[0]}</div><div class="links">${navLinks}</div></header>
      <section class="dashboard">${stats}</section>
      <section class="plans"><article><p class="section-title">Today's Plan</p>${featureCards}</article><aside><p class="section-title">${template.feedLabel}</p>${feedCards}</aside></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Class Schedule</p><table><thead><tr><th>Time</th><th>Class</th><th>Coach</th><th>Spots Left</th></tr></thead><tbody>${longTableRows}</tbody></table></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Member Activity Feed</p><div style="display:grid; gap:8px;">${longFeed}</div></section>
      <section class="block" style="margin-top:12px;"><p class="section-title">Nutrition & Recovery Notes</p><ul>${longListRows}</ul></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${template.title.split('—')[0]}</p></footer>
    </div>`;
  }
  if (variant === 'profile') {
    const brand = template.title.split('—')[0].trim();
    const projectCards = template.feedItems
      .map(
        (item) =>
          `<article><img src="https://picsum.photos/seed/${encodeURIComponent(item.title + 'pf')}/560/300" alt=""><h4>${item.title}</h4><p>${item.detail}</p><span>${item.meta}</span></article>`
      )
      .join('');
    const metricCards = template.panelRows
      .map(
        (row) =>
          `<article><strong style="font-size:19px;color:var(--text);display:block;">${row.value}</strong><p style="margin-top:8px;font-size:12px;color:var(--text-muted);">${row.label}</p></article>`
      )
      .join('');
    const stackTags = [
      'TypeScript',
      'React',
      'Node',
      'Design systems',
      'Accessibility',
      'CI/CD',
      'Vite',
      'Storybook',
      'PostgreSQL',
      'Figma',
    ];
    const stackHtml = stackTags.map((t) => `<span>${t}</span>`).join('');
    return `<div class="layout-profile site-shell">
      <header class="top-nav"><div class="brand">${brand}</div><div class="links">${navLinks}</div></header>
      <section class="hero">
        <article>
          <p class="section-title">Intro</p>
          <h1>${template.title}</h1>
          <p>${template.subtitle}</p>
          <p style="margin-top:14px;font-size:14px;line-height:1.65;color:var(--text-muted);max-width:52ch;">I work with product, design, and platform teams to ship UIs that stay fast under load, pass accessibility audits, and remain approachable for the next engineer. Engagements usually blend architecture, implementation, and a pragmatic observability story so launches don’t surprise you in week three.</p>
          <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">
            <a class="btn-main" href="#">${template.ctaPrimary}</a>
            <a class="btn-main" href="#" style="background:transparent;border:1px solid var(--border);color:var(--text);">${template.ctaSecondary}</a>
          </div>
        </article>
        <div class="hero-visual"><img src="https://picsum.photos/seed/${encodeURIComponent(template.title + 'hero')}/720/520" alt="Studio workspace"></div>
      </section>
      <section class="metrics">${metricCards}</section>
      <section class="block"><p class="section-title">${template.panelTitle}</p><ul class="cart">${panelRows}</ul></section>
      <section class="block" style="margin-top:14px;"><p class="section-title">${template.feedLabel}</p><div class="projects">${projectCards}</div></section>
      <section class="block" style="margin-top:14px;"><p class="section-title">How I work</p><div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px;">${featureCards}</div></section>
      <section class="block" style="margin-top:14px;"><p class="section-title">Stack &amp; tools</p><div class="stack">${stackHtml}</div><p style="font-size:13px;margin-top:14px;color:var(--text-muted);max-width:62ch;">Baseline above; each contract adapts to your existing platform, design tokens, and release process.</p></section>
      <section class="block" style="margin-top:14px;"><p class="section-title">Write-ups &amp; artifacts</p><div style="display:grid; gap:10px;">${longFeed}</div></section>
      <section class="block" style="margin-top:14px;"><p class="section-title">Timeline &amp; notes</p><ul>${longListRows}</ul></section>
      <section class="block" style="margin-top:14px;"><p class="section-title">Delivery checklist</p><table><thead><tr><th>Phase</th><th>Milestone</th><th>Detail</th><th>Status</th></tr></thead><tbody>${longTableRows}</tbody></table></section>
      <footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026 ${brand}</p></footer>
    </div>`;
  }

  return `<div class="site-shell"><header class="top-nav"><div class="brand">${template.title}</div><div class="links">${navLinks}</div></header><section class="hero block" style="margin:16px 0;"><p class="section-title">Overview</p><h1>${template.title}</h1><p>${template.subtitle}</p></section><section class="block"><p class="section-title">Highlights</p><div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px;">${featureCards}</div></section><section class="block" style="margin-top:14px;"><p class="section-title">Activity</p><div style="display:grid; gap:10px;">${longFeed}</div></section><footer class="footer"><div class="footer-grid">${footerColumns}</div><p class="copyright">&copy; 2026</p></footer></div>`;
}

// Fallback template when Gemini is not configured
function generateFallbackPage(theme: WebpageTheme, keys: HiddenKey[]): string {
  const template = FALLBACK_TEMPLATES[theme] || FALLBACK_TEMPLATES.startup;
  const { colors } = template;
  const variant = THEME_LAYOUT_VARIANTS[theme] || 'profile';
  const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

  let headContent = '';
  let cssInjections = '';
  const domLeaksPlain: string[] = [];
  const domLeaksOther: string[] = [];
  const scriptFrags: string[] = [];

  keys.forEach((key) => {
    const rndLs = () => pick(['v3_session', 'auth_shadow', 'client_prefetch', 'boot_cache', 'trace_hint', 'preflight_kv']);
    const rndSs = () => pick(['temp_id', 'csrf_token', 'trace_session', 'hydration_nonce', 'svc_handshake']);
    const rndWin = () => `_0x${Math.floor(Math.random() * 1e9)}`;

    switch (key.location) {
      case 'meta-tag':
        headContent += pick([
          `<meta name="generator" content="Static site · build ${key.value}">\n`,
          `<meta name="twitter:data1" content="${key.value}">\n`,
          `<meta name="product:retailer_item_id" content="${key.value}">\n`,
        ]);
        break;
      case 'html-comment':
        domLeaksOther.push(pick([
          `<!-- build: ${key.value} -->\n`,
          `<!-- trace:${key.value} -->\n`,
          `<!-- sync-marker ${key.value} -->\n`,
        ]));
        break;
      case 'hidden-element':
        domLeaksOther.push(pick([
          `<div style="display:none">${key.value}</div>\n`,
          `<span style="visibility:hidden">${key.value}</span>\n`,
          `<p style="position:absolute;left:-9999px;top:-9999px">${key.value}</p>\n`,
        ]));
        break;
      case 'css-variable':
        cssInjections += pick([
          `:root { --f-token-${Math.floor(Math.random() * 1000)}: "${key.value}"; }\n`,
          `.site-shell { --session-mark: "${key.value}"; }\n`,
          `.top-nav { --ops-salt: "${key.value}"; }\n`,
        ]);
        break;
      case 'css-content':
        cssInjections += pick([
          `.footer::after { content: "${key.value}"; font-size: 0; opacity: 0; }\n`,
          `.brand::before { content: "${key.value}"; display: block; height: 0; overflow: hidden; }\n`,
          `.section-title::after { content: "${key.value}"; font-size: 0; }\n`,
        ]);
        break;
      case 'console-log':
        scriptFrags.push(
          pick([
            `try{console.debug("\\u200c",${jsFromB64(key.value)});}catch(e){}`,
            `try{console.info("\\u2060",${jsFromB64(key.value)});}catch(e){}`,
            `try{console.log("\\u200d",${jsFromB64(key.value)});}catch(e){}`,
          ])
        );
        break;
      case 'localstorage':
        scriptFrags.push(
          `try{localStorage.setItem(${JSON.stringify(rndLs())},${jsFromB64(key.value)});}catch(e){}`
        );
        break;
      case 'script-variable':
        scriptFrags.push(
          `try{window[${JSON.stringify(rndWin())}]={v:${jsFromB64(key.value)}};}catch(e){}`
        );
        break;
      case 'cookie':
        scriptFrags.push(
          pick([
            `try{document.cookie="_a="+encodeURIComponent(${jsFromB64(key.value)})+";path=/";}catch(e){}`,
            `try{document.cookie="s="+encodeURIComponent(${jsFromB64(key.value)})+";path=/;max-age=3600";}catch(e){}`,
            `try{document.cookie="m="+encodeURIComponent(${jsFromB64(key.value)})+";path=/";}catch(e){}`,
          ])
        );
        break;
      case 'session-storage':
        scriptFrags.push(
          `try{sessionStorage.setItem(${JSON.stringify(rndSs())},${jsFromB64(key.value)});}catch(e){}`
        );
        break;
      case 'network-response':
        scriptFrags.push(
          pick([
            `try{fetch("/api/v1/auth?token="+encodeURIComponent(${jsFromB64(key.value)})+"&_cb="+Date.now(),{cache:"no-store"}).catch(function(){});}catch(e){}`,
            `try{fetch("/api/game/dummy?token="+encodeURIComponent(${jsFromB64(key.value)})+"&_cb="+Date.now(),{cache:"no-store"}).catch(function(){});}catch(e){}`,
            `try{fetch("/api/verify?auth="+encodeURIComponent(${jsFromB64(key.value)})+"&_cb="+Date.now(),{cache:"no-store"}).catch(function(){});}catch(e){}`,
          ])
        );
        break;
      case 'network-header':
        scriptFrags.push(
          pick([
            `try{fetch("/api/ping",{headers:{"X-Audit-Key":${jsFromB64(key.value)}},cache:"no-store"}).catch(function(){});}catch(e){}`,
            `try{fetch("/api/game/dummy",{headers:{"X-Trace-Key":${jsFromB64(key.value)}},cache:"no-store"}).catch(function(){});}catch(e){}`,
            `try{fetch("/api/health",{headers:{"Authorization":"Bearer "+${jsFromB64(key.value)}},cache:"no-store"}).catch(function(){});}catch(e){}`,
          ])
        );
        break;
      case 'click-network':
        domLeaksOther.push(
          pick([
            `<p class="w-inline-note" style="margin-top:10px;">Totals can lag after you change quantities — <button type="button" class="inline-action" onclick='try{fetch("/api/game/dummy?cart_sync="+encodeURIComponent(${jsFromB64(key.value)})+"&_cb="+Date.now(),{cache:"no-store"}).catch(function(){});}catch(e){}'>refresh cart from server</button> to pull tax and shipping.</p>\n`,
            `<p class="w-inline-note" style="margin-top:10px;">List prices update when suppliers change feeds — <button type="button" class="inline-action" onclick='try{fetch("/api/game/dummy?catalog="+encodeURIComponent(${jsFromB64(key.value)})+"&_cb="+Date.now(),{cache:"no-store"}).catch(function(){});}catch(e){}'>sync live prices</button> for this category.</p>\n`,
            `<p class="w-inline-note" style="margin-top:10px;">Your draft is only on this device until you ship it — <button type="button" class="inline-action" onclick='try{fetch("/api/game/dummy?publish="+encodeURIComponent(${jsFromB64(key.value)})+"&_cb="+Date.now(),{cache:"no-store"}).catch(function(){});}catch(e){}'>publish now</button> to push the public version.</p>\n`,
            `<p class="w-inline-note" style="margin-top:10px;">Availability shown here may be stale — <button type="button" class="inline-action" onclick='try{fetch("/api/game/dummy?inventory="+encodeURIComponent(${jsFromB64(key.value)})+"&_cb="+Date.now(),{cache:"no-store"}).catch(function(){});}catch(e){}'>check warehouse stock</button> before checkout.</p>\n`,
          ])
        );
        break;
      case 'click-reveal': {
        const rid = `wds_${Math.random().toString(36).slice(2, 10)}`;
        domLeaksOther.push(
          pick([
            `<p class="w-inline-note" style="margin-top:10px;">Need the reference from your email receipt? <button type="button" class="inline-action" aria-label="Show order reference" onclick='try{var e=document.getElementById("${rid}");if(e)e.textContent=${jsFromB64(key.value)};}catch(e){}'>Show order reference</button> <span id="${rid}" class="mono" style="display:inline-block;min-width:6ch;vertical-align:baseline;margin-left:4px"></span> — have it ready for support.</p>\n`,
            `<p class="w-inline-note" style="margin-top:10px;">A bundle discount was applied at checkout — <button type="button" class="inline-action" aria-label="Show promo code" onclick='try{var e=document.getElementById("${rid}");if(e)e.textContent=${jsFromB64(key.value)};}catch(e){}'>show applied code</button> <span id="${rid}" class="mono" style="display:inline-block;min-width:6ch;vertical-align:baseline;margin-left:4px"></span> appears next to your subtotal.</p>\n`,
            `<p class="w-inline-note" style="margin-top:10px;">Tracking link not visible yet? <button type="button" class="inline-action" aria-label="Reveal shipment ID" onclick='try{var e=document.getElementById("${rid}");if(e)e.textContent=${jsFromB64(key.value)};}catch(e){}'>reveal shipment ID</button> <span id="${rid}" class="mono" style="display:inline-block;min-width:6ch;vertical-align:baseline;margin-left:4px"></span> once the carrier scans the label.</p>\n`,
          ])
        );
        break;
      }
      case 'console-invoke': {
        const fn = `__wds_${Math.random().toString(36).slice(2, 10)}`;
        domLeaksOther.push(
          `<!-- checkout helper: window.${fn}() in console returns the promo / order reference string -->\n`
        );
        scriptFrags.push(
          `try{globalThis[${JSON.stringify(fn)}]=function(){var k=${jsFromB64(key.value)};console.info(k);return k;};}catch(e){}`
        );
        break;
      }
      case 'script-bundle':
        scriptFrags.push(
          `try{/* chunk:vendor.ops.v2 */void function(H){var u=typeof H==='string'?atob(H):'';void(u);}(${JSON.stringify(b64Utf8(key.value))});}catch(e){}`
        );
        break;
      case 'data-attribute':
        domLeaksOther.push(pick([
          `<div data-inventory-sku="${key.value}" style="display:none"></div>\n`,
          `<section data-product-ref="${key.value}" hidden></section>\n`,
          `<article data-listing-id="${key.value}" style="position:absolute;left:-9999px;"></article>\n`,
        ]));
        break;
      case 'aria-label':
        domLeaksOther.push(pick([
          `<button type="button" aria-label="Dismiss: ${key.value}" tabindex="-1" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></button>\n`,
          `<span role="presentation" aria-label="${key.value}" style="position:absolute;clip:rect(0,0,0,0)"></span>\n`,
          `<a href="#" aria-label="Continue ${key.value}" style="position:absolute;left:-10000px">skip</a>\n`,
        ]));
        break;
      case 'plaintext':
        domLeaksPlain.push(pick([
          `<p style="font-size:13px;color:var(--text-muted)">Order confirmation: save reference <span class="mono">${key.value}</span> for returns and warranty.</p>\n`,
          `<p style="font-size:13px;color:var(--text-muted)">This listing ships with manufacturer ref <span class="mono">${key.value}</span> printed on the carton label.</p>\n`,
          `<p style="font-size:13px;color:var(--text-muted)">Support may ask for ticket <span class="mono">${key.value}</span> — include it in your reply.</p>\n`,
          `<p style="font-size:13px;color:var(--text-muted)">Enterprise quote revision <span class="mono">${key.value}</span> replaces the February catalog for this SKU.</p>\n`,
          `<p style="font-size:13px;color:var(--text-muted)">Member ID <span class="mono">${key.value}</span> — renews on your billing date unless you cancel.</p>\n`,
          `<p style="font-size:13px;color:var(--text-muted)">Shipment manifest line <span class="mono">${key.value}</span>; carrier scanned at sort facility, no holds.</p>\n`,
          `<li style="font-size:13px;color:var(--text-muted)">Line item SKU trace <span class="mono">${key.value}</span> — matches the packing slip in the box.</li>\n`,
          `<p class="testimonial-cite" style="font-size:13px;color:var(--text-muted)">“We went live last quarter — rollout ref <span class="mono">${key.value}</span> if your team wants the same playbook.”</p>\n`,
          `<p style="font-size:13px;color:var(--text-muted)">Release notes: patch <span class="mono">${key.value}</span> is live for all regions as of this morning.</p>\n`,
          `<span class="sr-only">${key.value}</span>\n`,
        ]));
        break;
    }
  });

  const layoutStyles = buildLayoutStyles(variant);
  let layoutHtml = buildLayoutBody(template, variant);
  layoutHtml = scatterPlaintextIntoLayout(layoutHtml, domLeaksPlain);
  layoutHtml = scatterOtherLeaksIntoLayout(layoutHtml, domLeaksOther);

  const mergedFrags = shuffleArray([...scriptFrags]);
  const withDecoys: string[] = [];
  for (const frag of mergedFrags) {
    if (Math.random() < 0.4) {
      withDecoys.push(SCRIPT_DECOYS[Math.floor(Math.random() * SCRIPT_DECOYS.length)]);
    }
    withDecoys.push(frag);
  }
  for (let d = 0; d < 3; d++) {
    withDecoys.push(SCRIPT_DECOYS[Math.floor(Math.random() * SCRIPT_DECOYS.length)]);
  }
  const scriptTagsHtml = shuffleArray(withDecoys)
    .map((code) => `  <script>${code}</script>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${headContent}
  <title>${template.title}</title>
  <style>
    :root {
      --primary: ${colors.primary};
      --accent: ${colors.accent};
      --bg: ${colors.bg};
      --surface: rgba(255,255,255,0.04);
      --border: rgba(255,255,255,0.08);
      --text: #ffffff;
      --text-muted: #b6bdd6;
      --glow: ${colors.glow};
      ${cssInjections}
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.55;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    .container { width: min(1200px, 92vw); margin: 0 auto; }
    h1, h2, h3, h4 { letter-spacing: -0.3px; }
    h1 { font-size: clamp(30px, 5vw, 50px); margin-bottom: 10px; line-height: 1.1; }
    p { color: var(--text-muted); }
    .section-title { font-size: 12px; color: var(--accent); letter-spacing: 1.1px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
    .btn-main {
      display: inline-block; padding: 14px 24px; background: var(--primary);
      color: white; border-radius: 10px; font-weight: 700;
      transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1);
    }
    .btn-main:hover { transform: translateY(-2px); box-shadow: 0 12px 30px -12px var(--primary); }
    h4 { margin-bottom: 6px; font-size: 16px; }
    span { color: var(--text-muted); font-size: 12px; }
    ul { list-style: none; }
    footer {
      padding: 52px 0; border-top: 1px solid var(--border);
      color: var(--text-muted); font-size: 13px;
    }
    .footer-grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 18px; margin-bottom: 22px; }
    .footer-grid h5 { color: var(--text); margin-bottom: 8px; font-size: 14px; }
    .footer-grid a { display:block; margin-bottom: 7px; color: var(--text-muted); font-size: 13px; }
    .footer-grid a:hover { color: var(--text); }
    .copyright { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; font-size: 12px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; letter-spacing: 0.03em; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .w-inline-note { font-size: 12px; color: var(--text-muted); line-height: 1.55; display: inline; }
    .w-inline-note .inline-action { font: inherit; color: color-mix(in oklab, var(--accent) 72%, var(--text-muted) 28%); background: transparent; border: 0; padding: 0; margin: 0; cursor: pointer; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
    .w-inline-note .inline-action:hover { color: var(--accent); }
    @media (max-width: 980px) { .footer-grid { grid-template-columns: 1fr; } }
    ${layoutStyles}
  </style>
</head>
<body>
  <!-- ◈◈◈ WEBDEVSCAV SIMULATION START ◈◈◈ -->
  <div id="webdevscav-simulated-root">
  ${layoutHtml}

${scriptTagsHtml}
  </div>
</body>
</html>`;
}

let lastThemeIndex = -1;

export async function generateWebpage(
  difficulty: string = 'medium',
  mode: 'fastest' | 'endless' = 'fastest',
  requestedTheme?: WebpageTheme
): Promise<GameSession> {
  // Theme rotation logic
  let themeIndex = Math.floor(Math.random() * THEMES.length);
  if (themeIndex === lastThemeIndex) {
    themeIndex = (themeIndex + 1) % THEMES.length;
  }
  lastThemeIndex = themeIndex;
  
  const theme = requestedTheme || THEMES[themeIndex];
  
  // Updated key counts: Easy=10, Medium=20, Hard=30
  const keyCount = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
  
  // Time limits for Endless mode (in Fastest mode, timer counts up, so limit is just a safety cap)
  const timeLimit = mode === 'endless' ? 120 : 900; 
  
  const keys = generateKeys(keyCount, difficulty);
  const sessionId = uuidv4();

  let html: string;

  const shouldUseGemini = process.env.ENABLE_GEMINI === 'true' && isGeminiConfigured();

  if (shouldUseGemini) {
    try {
      const prompt = buildPrompt(theme, keys);
      const rawHtml = await generateContent(prompt);
      // Clean up any markdown code fences the model might add
      html = rawHtml
        .replace(/^```html?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      // Validate that all keys are present (literal or base64 for atob()-style JS)
      const missingKeys = keys.filter((k) => !keyPresentInGeneratedHtml(html, k.value));
      if (missingKeys.length > 0) {
        console.warn(`[WebpageGenerator] ${missingKeys.length} keys missing from Gemini output, using fallback`);
        html = generateFallbackPage(theme, keys);
      }
    } catch (err: any) {
      if (err?.status === 429) {
        console.warn('⚠️  [WebpageGenerator] Gemini API Free Tier Rate Limit Exceeded. Using local fallback template.');
      } else if (err?.status === 400) {
        console.warn('⚠️  [WebpageGenerator] Gemini API Key is invalid or expired. Please check your .env file. Using local fallback template.');
      } else {
        console.error('⚠️  [WebpageGenerator] Gemini generation failed, using fallback:', err.message || err);
      }
      html = generateFallbackPage(theme, keys);
    }
  } else {
    console.log('[WebpageGenerator] Gemini disabled or not configured, using fallback template');
    html = generateFallbackPage(theme, keys);
  }

  html = ensureSimulationStartMarker(html);

  // Inject the bridge script for DevTools communication
  html = injectBridgeScript(html);

  return {
    id: sessionId,
    html,
    keys,
    theme,
    difficulty,
    mode,
    totalKeys: keyCount,
    timeLimit,
    createdAt: Date.now(),
  };
}
