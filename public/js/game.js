// public/js/game.js
import { fetchRandomPage } from './generatePage.js';
import { auth, db } from './auth.js';
import { doc, updateDoc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

let mode = 'single';
let huntType = 'basic';
let score = 0;
let timeLeft = 120; // default; can change by difficulty
let timerId = null;
let currentPageHtml = '';
let pageSeed = null; // optional page id

// UI elements
const modeSelectEl = () => document.getElementById('modeSelect');
const huntSelectEl = () => document.getElementById('huntSelect');
const iframeEl = () => document.getElementById('simulatedPage');
const overlayEl = () => document.getElementById('overlay');
const timerEl = () => document.getElementById('timer');
const scoreEl = () => document.getElementById('scoreDisplay');
const statusEl = () => document.getElementById('status');

function show(el) { el.hidden = false; }
function hide(el) { el.hidden = true; }

function startTimer() {
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    timerEl().textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerId);
      endGame();
    }
  }, 1000);
}

function endGame() {
  statusEl().textContent = `Game over. Final score: ${score}`;
  // persist score to Firestore (top-level 'scores' collection)
  const user = auth.currentUser;
  if (user) {
    const scoresRef = collection(db, 'scores');
    addDoc(scoresRef, {
      uid: user.uid,
      name: user.email || user.displayName || null,
      score,
      timestamp: Date.now()
    }).catch(err => console.error('Failed to store score', err));
  }
  overlayEl().querySelector('form').remove(); // disable input
}

// Validate submitted key.
// We check: elements with data-key, and HTML comments containing KEY: TOKEN
async function validateKey(inputKey) {
  try {
    const iframe = iframeEl();
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return false;

    // 1) data-key attributes
    const elements = Array.from(doc.querySelectorAll('[data-key]'));
    for (const el of elements) {
      if ((el.dataset && el.dataset.key) === inputKey) {
        // remove attribute to prevent double-score
        el.removeAttribute('data-key');
        return true;
      }
    }

    // 2) comments: search HTML source
    const htmlText = doc.documentElement.innerHTML;
    const re = /<!--\s*KEY:\s*([A-Za-z0-9_-]+)\s*-->/gi;
    let m;
    while ((m = re.exec(htmlText)) !== null) {
      if (m[1] === inputKey) return true;
    }

    // 3) hidden text nodes (elements with hidden attribute)
    const hiddenEls = Array.from(doc.querySelectorAll('[hidden]'));
    for (const he of hiddenEls) {
      if (he.textContent && he.textContent.includes(inputKey)) return true;
    }

    return false;
  } catch (err) {
    console.error('validateKey error', err);
    return false;
  }
}

async function submitKey(key) {
  const ok = await validateKey(key);
  if (ok) {
    score += 10;
    scoreEl().textContent = `Score: ${score}`;
    statusEl().textContent = `Correct! +10 points`;
  } else {
    statusEl().textContent = `Incorrect. Keep searching.`;
  }
}

async function loadAndShowPage(tag = 'basic') {
  // fetch random HTML from Firestore
  try {
    currentPageHtml = await fetchRandomPage(tag);
  } catch (err) {
    console.error('Failed to fetch page', err);
    statusEl().textContent = 'Failed to load page';
    return;
  }

  // create blob to load into iframe same-origin
  const blob = new Blob([currentPageHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  iframeEl().src = url;
  show(iframeEl());
  show(overlayEl());

  // set timeLeft by hunt type
  timeLeft = (huntType === 'advanced') ? 180 : 120;
  timerEl().textContent = `Time: ${timeLeft}s`;
  score = 0;
  scoreEl().textContent = `Score: ${score}`;
  startTimer();
}

// Expose top scores used by leaderboard
export async function getTopScores() {
  const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// wire UI events when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // mode buttons
  document.querySelectorAll('.modeBtn').forEach(btn => {
    btn.addEventListener('click', ev => {
      mode = btn.dataset.mode;
      hide(modeSelectEl());
      show(huntSelectEl());
    });
  });

  // hunt selection
  document.querySelectorAll('.huntBtn').forEach(btn => {
    btn.addEventListener('click', async ev => {
      huntType = btn.dataset.hunt;
      hide(huntSelectEl());
      // start game
      await loadAndShowPage(huntType === 'basic' ? 'basic' : 'advanced');
    });
  });

  // answer form
  const form = document.getElementById('answerForm');
  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const key = document.getElementById('keyInput').value.trim();
      if (!key) return;
      document.getElementById('keyInput').value = '';
      await submitKey(key);
    });
  }

  // skip button: load another page
  const skipBtn = document.getElementById('skipBtn');
  if (skipBtn) {
    skipBtn.addEventListener('click', async () => {
      await loadAndShowPage(huntType === 'basic' ? 'basic' : 'advanced');
    });
  }
});
