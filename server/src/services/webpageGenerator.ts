import { v4 as uuidv4 } from 'uuid';
import { generateContent, isGeminiConfigured } from './gemini.js';
import { injectBridgeScript } from './bridgeInjector.js';
import type { HiddenKey, GameSession, WebpageTheme } from '../types/index.js';

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
    case 'network-response': return `auth_${randHex()}`;
    default: return randHex();
  }
}

function generateKeys(count: number, difficultyLevel: string): HiddenKey[] {
  const allLocations: { location: string; easyTask: string; mediumTask: string; hardTask: string; easyHint: string; mediumHint: string; hardHint: string; difficulty: 'easy' | 'medium' | 'hard' }[] = [
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
    } else if (difficultyLevel === 'hard') {
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

  return `<div class="site-shell"><header class="top-nav"><div class="brand">${template.title}</div><div class="links">${navLinks}</div></header><section class="block"><h1>${template.title}</h1><p>${template.subtitle}</p></section><footer class="footer"><div class="footer-grid">${footerColumns}</div></footer></div>`;
}

// Fallback template when Gemini is not configured
function generateFallbackPage(theme: WebpageTheme, keys: HiddenKey[]): string {
  const template = FALLBACK_TEMPLATES[theme] || FALLBACK_TEMPLATES.startup;
  const { colors } = template;
  const variant = THEME_LAYOUT_VARIANTS[theme] || 'profile';

  let headContent = '';
  let bodyContent = '';
  let scriptContent = '';
  let cssInjections = '';

  keys.forEach((key) => {
    switch (key.location) {
      case 'meta-tag': headContent += `<meta name="x-debug-key" content="${key.value}">\n`; break;
      case 'html-comment': bodyContent += `<!-- DEBUG_KEY: ${key.value} -->\n`; break;
      case 'hidden-element': bodyContent += `<div style="display:none">${key.value}</div>\n`; break;
      case 'css-variable': cssInjections += `:root { --f-token: "${key.value}"; }\n`; break;
      case 'css-content': cssInjections += `.footer::after { content: "${key.value}"; font-size: 0; opacity: 0; }\n`; break;
      case 'console-log': scriptContent += `console.debug("Internal Config Hash:", "${key.value}");\n`; break;
      case 'localstorage': scriptContent += `localStorage.setItem("v3_session", "${key.value}");\n`; break;
      case 'script-variable': scriptContent += `window.__INTERNAL_STATE__ = { hash: "${key.value}" };\n`; break;
      case 'cookie': scriptContent += `document.cookie = "_auth_v2=${key.value}; path=/";\n`; break;
      case 'session-storage': scriptContent += `sessionStorage.setItem("temp_id", "${key.value}");\n`; break;
      case 'network-response': scriptContent += `fetch("/api/v1/auth?token=${key.value}").catch(() => {});\n`; break;
      case 'network-header': scriptContent += `fetch("/api/ping", { headers: { "X-Audit-Key": "${key.value}" } }).catch(() => {});\n`; break;
      case 'data-attribute': bodyContent += `<div data-internal-id="${key.value}" style="display:none"></div>\n`; break;
      case 'aria-label': bodyContent += `<button aria-label="System: ${key.value}" style="display:none"></button>\n`; break;
    }
  });
  const layoutStyles = buildLayoutStyles(variant);
  const layoutBody = buildLayoutBody(template, variant);

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
    @media (max-width: 980px) { .footer-grid { grid-template-columns: 1fr; } }
    ${layoutStyles}
  </style>
</head>
<body>
  <!-- ◈◈◈ WEBDEVSCAV SIMULATION START ◈◈◈ -->
  <div id="webdevscav-simulated-root">
  ${bodyContent}
  ${layoutBody}

  <script>
    (function() {
      ${scriptContent}
      console.info("[System] Fallback template loaded for theme: ${theme} | layout: ${variant}");
      console.info("[System] Security Audit in progress...");
    })();
  </script>
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

      // Validate that all keys are present in the generated HTML
      const missingKeys = keys.filter((k) => !html.includes(k.value));
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
