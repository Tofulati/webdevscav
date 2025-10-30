// public/js/game.js
import { fetchPage, checkKey, postScore } from './api.js';

let pageId = null;
let score = 0;
let timeLeft = 120;
let timerInterval = null;

function $(id){ return document.getElementById(id); }

function show(el){ el.hidden = false; }
function hide(el){ el.hidden = true; }

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    $('timer').textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function endGame() {
  $('status').textContent = `Game over. Final score: ${score}`;
  const userId = window.InspectAuth.getUserId();
  postScore(userId, score).catch(err => console.warn('score post failed', err));
  // disable form
  const f = $('answerForm');
  if (f) f.querySelectorAll('input,button').forEach(e => e.disabled = true);
}

async function loadAndShow(tag = 'basic') {
  try {
    const data = await fetchPage(tag);
    pageId = data.pageId;
    score = 0;
    $('scoreDisplay').textContent = `Score: ${score}`;
    timeLeft = tag === 'advanced' ? 180 : 120;
    $('timer').textContent = `Time: ${timeLeft}s`;

    // create blob URL and load into iframe
    const blob = new Blob([data.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const iframe = $('simulatedFrame');
    iframe.src = url;
    show(iframe);
    show($('overlay'));
    startTimer();
  } catch (err) {
    console.error('loadAndShow failed', err);
    $('status').textContent = 'Failed to load page';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Mode selection
  document.querySelectorAll('.modeBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      hide($('modeSelect'));
      show($('huntSelect'));
    });
  });

  // Hunt selection
  document.querySelectorAll('.huntBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hunt = btn.dataset.hunt || 'basic';
      hide($('huntSelect'));
      loadAndShow(hunt);
    });
  });

  // form submit
  const form = $('answerForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('answerInput').value.trim();
      if (!input) return;
      $('answerInput').value = '';
      $('status').textContent = 'Checking...';
      try {
        const result = await checkKey(pageId, input);
        if (result.valid) {
          score += 10;
          $('scoreDisplay').textContent = `Score: ${score}`;
          $('status').textContent = `Correct! (+10) — matched in ${result.matchedIn}`;
        } else {
          $('status').textContent = 'Incorrect. Keep searching.';
        }
      } catch (err) {
        console.error(err);
        $('status').textContent = 'Validation failed';
      }
    });
  }

  // skip button
  const skip = $('skipBtn');
  if (skip) skip.addEventListener('click', () => {
    // just reload a new basic page
    loadAndShow('basic');
  });

  // ensure guest id exists
  window.InspectAuth.getUserId();
});
