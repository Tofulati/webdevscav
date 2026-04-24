import { v4 as uuidv4 } from 'uuid';
import { generateContent, isGeminiConfigured } from './gemini.js';
import { injectBridgeScript } from './bridgeInjector.js';
const THEMES = [
    'ecommerce', 'blog', 'portfolio', 'dashboard',
    'social', 'news', 'restaurant', 'startup',
    'travel', 'crypto', 'gaming', 'education',
    'realestate', 'fitness', 'streaming'
];
const THEME_DESCRIPTIONS = {
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
function generateRealisticValue(location) {
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
        case 'network-response': return `auth_${randHex()}`;
        default: return randHex();
    }
}
function generateKeys(count, difficultyLevel) {
    const allLocations = [
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
            easyTask: 'Check the Network tab for an API response.',
            mediumTask: 'Intercept a background fetch leaking an auth hash.',
            hardTask: 'Analyze a JSON payload from a mock API call to find the key.',
            easyHint: 'Open the Network tab and look for XHR/Fetch requests.',
            mediumHint: 'Inspect the "Response" body of calls to /api/auth or similar.',
            hardHint: 'Look for keys buried deep in a nested JSON object.',
            difficulty: 'hard'
        },
        {
            location: 'network-header',
            easyTask: 'Check the headers of a network request.',
            mediumTask: 'Find a custom request header in an analytics ping.',
            hardTask: 'A secret audit key is sent in an outgoing header; intercept it.',
            easyHint: 'Check the Network tab, click a request, then "Headers".',
            mediumHint: 'Look for "X-Audit-Key" or "Authorization" in Request Headers.',
            hardHint: 'Inspect all outgoing requests for non-standard headers.',
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
        }
    ];
    const shuffled = allLocations.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map((loc) => {
        let task = loc.easyTask;
        let hint = loc.easyHint;
        if (difficultyLevel === 'medium') {
            task = loc.mediumTask;
            hint = loc.mediumHint;
        }
        else if (difficultyLevel === 'hard') {
            task = loc.hardTask;
            hint = loc.hardHint;
        }
        return {
            taskId: uuidv4(),
            task: task,
            value: generateRealisticValue(loc.location),
            location: loc.location,
            hint: hint,
            difficulty: loc.difficulty,
        };
    });
}
function buildPrompt(theme, keys) {
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
            case 'network-response': return `${i + 1}. Mock Fetch: In a script, fetch('/api/v1/auth').then(r => r.json()).catch(() => {}); (Make sure the key "${key.value}" is in the mock fetch logic or as a query param)`;
            case 'network-header': return `${i + 1}. Request Header: fetch('/api/ping', { headers: { 'X-Audit-Key': '${key.value}' } });`;
            case 'session-storage': return `${i + 1}. Set SessionStorage: sessionStorage.setItem("temp_id", "${key.value}");`;
            case 'aria-label': return `${i + 1}. Add ARIA label: <button aria-label="Action: ${key.value}">Submit</button>`;
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
- Ensure the hidden keys are NOT visible on the rendered UI, but easily findable via Developer Tools.
- The page must be responsive and professional.`;
}
// Fallback template when Gemini is not configured
function generateFallbackPage(theme, keys) {
    const themeColors = {
        ecommerce: { primary: '#6c5ce7', accent: '#a29bfe', bg: '#0b0b14' },
        blog: { primary: '#00b894', accent: '#55efc4', bg: '#0d1117' },
        portfolio: { primary: '#e17055', accent: '#fab1a0', bg: '#0d0d0d' },
        dashboard: { primary: '#0984e3', accent: '#74b9ff', bg: '#0a0a0f' },
        startup: { primary: '#00cec9', accent: '#81ecec', bg: '#050505' },
    };
    const colors = themeColors[theme] || themeColors.startup;
    let headContent = '';
    let bodyContent = '';
    let scriptContent = '';
    let cssInjections = '';
    keys.forEach((key) => {
        switch (key.location) {
            case 'meta-tag':
                headContent += `<meta name="x-debug-key" content="${key.value}">\n`;
                break;
            case 'html-comment':
                bodyContent += `<!-- DEBUG_KEY: ${key.value} -->\n`;
                break;
            case 'hidden-element':
                bodyContent += `<div style="display:none">${key.value}</div>\n`;
                break;
            case 'css-variable':
                cssInjections += `:root { --f-token: "${key.value}"; }\n`;
                break;
            case 'css-content':
                cssInjections += `.footer::after { content: "${key.value}"; font-size: 0; opacity: 0; }\n`;
                break;
            case 'console-log':
                scriptContent += `console.debug("Internal Config Hash:", "${key.value}");\n`;
                break;
            case 'localstorage':
                scriptContent += `localStorage.setItem("v3_session", "${key.value}");\n`;
                break;
            case 'script-variable':
                scriptContent += `window.__INTERNAL_STATE__ = { hash: "${key.value}" };\n`;
                break;
            case 'cookie':
                scriptContent += `document.cookie = "_auth_v2=${key.value}; path=/";\n`;
                break;
            case 'session-storage':
                scriptContent += `sessionStorage.setItem("temp_id", "${key.value}");\n`;
                break;
            case 'network-response':
                scriptContent += `fetch("/api/v1/auth?token=${key.value}").catch(() => {});\n`;
                break;
            case 'network-header':
                scriptContent += `fetch("/api/ping", { headers: { "X-Audit-Key": "${key.value}" } }).catch(() => {});\n`;
                break;
            case 'data-attribute':
                bodyContent += `<div data-internal-id="${key.value}" style="display:none"></div>\n`;
                break;
            case 'aria-label':
                bodyContent += `<button aria-label="System: ${key.value}" style="display:none"></button>\n`;
                break;
        }
    });
    const themeTitles = {
        ecommerce: 'TechVault — Premium Tech Store',
        blog: 'ByteLog — Developer Stories',
        portfolio: 'Alex Rivera — Full Stack Developer',
        dashboard: 'CloudMetrics — Analytics Dashboard',
        startup: 'NeuralFlow — AI Platform',
    };
    const title = themeTitles[theme] || 'WebDevScav Audit';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${headContent}
  <title>${title}</title>
  <style>
    :root {
      --primary: ${colors.primary};
      --accent: ${colors.accent};
      --bg: ${colors.bg};
      --surface: rgba(255,255,255,0.03);
      --border: rgba(255,255,255,0.08);
      --text: #ffffff;
      --text-muted: #a0a0a0;
      ${cssInjections}
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
    }
    nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 40px; background: rgba(0,0,0,0.4);
      backdrop-filter: blur(12px); border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 100;
    }
    .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: var(--primary); }
    .hero {
      padding: 120px 40px 80px; text-align: center;
      background: radial-gradient(circle at top right, rgba(108,92,231,0.1), transparent);
    }
    .hero h1 { font-size: 64px; font-weight: 900; letter-spacing: -2px; margin-bottom: 20px; line-height: 1.1; }
    .hero h1 span { color: var(--primary); }
    .hero p { font-size: 20px; color: var(--text-muted); max-width: 600px; margin: 0 auto 40px; }
    .btn-main {
      display: inline-block; padding: 16px 40px; background: var(--primary);
      color: white; border-radius: 4px; font-weight: 700; text-decoration: none;
      transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1);
    }
    .btn-main:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -10px var(--primary); }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; padding: 80px 40px; max-width: 1200px; margin: 0 auto; }
    .card {
      background: var(--surface); border: 1px solid var(--border);
      padding: 40px; transition: all 0.3s;
    }
    .card:hover { border-color: var(--primary); transform: translateY(-4px); background: rgba(255,255,255,0.05); }
    .card h3 { font-size: 20px; margin-bottom: 12px; font-weight: 700; }
    .card p { color: var(--text-muted); font-size: 15px; }
    footer {
      padding: 60px 40px; border-top: 1px solid var(--border);
      text-align: center; color: var(--text-muted); font-size: 13px;
    }
  </style>
</head>
<body>
  <!-- ◈◈◈ WEBDEVSCAV SIMULATION START ◈◈◈ -->
  <div id="webdevscav-simulated-root">
  ${bodyContent}
  <nav>
    <div class="logo">${title.split('—')[0]}</div>
    <div style="display:flex; gap:32px; font-size:14px; font-weight:600">
      <a href="#" style="color:var(--text); text-decoration:none">Network</a>
      <a href="#" style="color:var(--text-muted); text-decoration:none">Security</a>
      <a href="#" style="color:var(--text-muted); text-decoration:none">Assets</a>
    </div>
  </nav>

  <div class="hero">
    <h1>Next-Gen <span>Digital</span> Extraction.</h1>
    <p>Premium audit services for the modern decentralized web. Secure your assets with NeuralFlow.</p>
    <a href="#" class="btn-main">Explore Platform</a>
  </div>

  <div class="grid">
    <div class="card"><h3>01 // ANALYTICS</h3><p>Real-time data stream processing with zero-latency overhead.</p></div>
    <div class="card"><h3>02 // SECURITY</h3><p>Post-quantum encryption standards for all transit payloads.</p></div>
    <div class="card"><h3>03 // SCALE</h3><p>Distributed infrastructure spanning 42 global availability zones.</p></div>
  </div>

  <footer class="footer">
    <p>&copy; 2026 ${title.split('—')[0]}. INTERNAL_AUDIT_MODE // SESSION_ACTIVE</p>
  </footer>

  <script>
    (function() {
      ${scriptContent}
      console.info("[System] Impeccable Design Engine Initialized.");
      console.info("[System] Security Audit in progress...");
    })();
  </script>
  </div>
</body>
</html>`;
}
let lastThemeIndex = -1;
export async function generateWebpage(difficulty = 'medium', mode = 'fastest', requestedTheme) {
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
    let html;
    if (isGeminiConfigured()) {
        try {
            const prompt = buildPrompt(theme, keys);
            const rawHtml = await generateContent(prompt);
            // Clean up any markdown code fences the model might add
            html = rawHtml
                .replace(/^```html?\n?/i, '')
                .replace(/\n?```$/i, '')
                .trim();
            // Validate that all keys are present in the generated HTML
            const missingKeys = keys.filter((k) => !html.includes(k.value));
            if (missingKeys.length > 0) {
                console.warn(`[WebpageGenerator] ${missingKeys.length} keys missing from Gemini output, using fallback`);
                html = generateFallbackPage(theme, keys);
            }
        }
        catch (err) {
            if (err?.status === 429) {
                console.warn('⚠️  [WebpageGenerator] Gemini API Free Tier Rate Limit Exceeded. Using local fallback template.');
            }
            else if (err?.status === 400) {
                console.warn('⚠️  [WebpageGenerator] Gemini API Key is invalid or expired. Please check your .env file. Using local fallback template.');
            }
            else {
                console.error('⚠️  [WebpageGenerator] Gemini generation failed, using fallback:', err.message || err);
            }
            html = generateFallbackPage(theme, keys);
        }
    }
    else {
        console.log('[WebpageGenerator] Gemini not configured, using fallback template');
        html = generateFallbackPage(theme, keys);
    }
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
