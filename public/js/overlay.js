// overlay.js – updated with game over + quit confirm + key tracking

const GAME_DURATION = 60; // seconds
let currentPageId = null;
let score = 0;
let timeLeft = GAME_DURATION;
let timerInterval = null;
let foundKeys = new Set();
let totalKeys = 0;

let iframeEl, timerEl, exitBtn, statusEl, keyInput, submitBtn, skipBtn, scoreValueEl;

function $(id) {
  return document.getElementById(id);
}

async function fetchAndLoadPage(tag = "basic") {
  try {
    const resp = await fetch(`/api/page?tag=${encodeURIComponent(tag)}`);
    if (!resp.ok) throw new Error("failed to fetch page");
    const data = await resp.json();

    currentPageId = data.pageId;
    totalKeys = data.keys.length;
    foundKeys.clear();

    const blob = new Blob([data.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframeEl.src = url;

    setStatus(`New page loaded — ${totalKeys} hidden keys`, "neutral");
    keyInput.value = "";
    keyInput.focus();
  } catch (err) {
    console.error(err);
    setStatus("Failed to load page", "error");
  }
}

function setStatus(msg, type = "neutral") {
  statusEl.textContent = msg;
  statusEl.style.color =
    type === "error" ? "#ff8080" : type === "success" ? "#a8ffb0" : "#fff";
}

async function checkKeyAndScore(key) {
  if (!currentPageId) {
    setStatus("No page loaded", "error");
    return;
  }
  try {
    const res = await fetch("/api/checkKey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: currentPageId, key }),
    });
    const data = await res.json();

    if (data.valid) {
      if (!foundKeys.has(key)) {
        foundKeys.add(key);
        score += 10;
        scoreValueEl.textContent = String(score);
        setStatus(`✅ Found (${foundKeys.size}/${totalKeys})`, "success");
      } else {
        setStatus("⚠️ Already found this key", "neutral");
      }
    } else {
      setStatus("❌ Not found", "error");
    }

    // Auto-end if all keys found
    if (foundKeys.size === totalKeys) {
      clearInterval(timerInterval);
      showGameOver();
    }
  } catch (err) {
    console.error(err);
    setStatus("Validation failed", "error");
  }
}

function startTimer(duration) {
  clearInterval(timerInterval);
  timeLeft = duration;
  timerEl.textContent = `Time: ${timeLeft}s`;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showGameOver();
    }
  }, 1000);
}

function showGameOver() {
  const overlay = document.createElement("div");
  overlay.className = "modal-backdrop";
  overlay.innerHTML = `
    <div class="modal">
      <h2>⏱️ Game Over</h2>
      <p>Final Score: <strong>${score}</strong></p>
      <p>Keys Found: ${foundKeys.size} / ${totalKeys}</p>
      <div class="modal-buttons">
        <button id="play-again">Play Again</button>
        <button id="exit-game">Exit</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("play-again").onclick = () => {
    overlay.remove();
    score = 0;
    scoreValueEl.textContent = "0";
    startTimer(GAME_DURATION);
    fetchAndLoadPage();
  };

  document.getElementById("exit-game").onclick = () => {
    window.location.href = "/";
  };
}

function showQuitConfirm() {
  const overlay = document.createElement("div");
  overlay.className = "modal-backdrop";
  overlay.innerHTML = `
    <div class="modal">
      <h2>Quit Game?</h2>
      <p>Your progress will be lost.</p>
      <div class="modal-buttons">
        <button id="cancel-quit">Cancel</button>
        <button id="confirm-quit">Exit</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("cancel-quit").onclick = () => overlay.remove();
  document.getElementById("confirm-quit").onclick = () => {
    overlay.remove();
    window.location.href = "/";
  };
}

function setupUi() {
  iframeEl = $("simulated-page");
  timerEl = $("timer");
  exitBtn = $("exit-btn");
  statusEl = $("status");
  keyInput = $("key-input");
  submitBtn = $("submit-key");
  skipBtn = $("skip-btn");
  scoreValueEl = $("score-value");

  exitBtn.addEventListener("click", showQuitConfirm);

  const onSubmit = async (e) => {
    if (e) e.preventDefault();
    const val = keyInput.value.trim();
    if (!val) return;
    await checkKeyAndScore(val);
    keyInput.value = "";
  };

  submitBtn.addEventListener("click", onSubmit);
  keyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSubmit(e);
  });

  skipBtn.addEventListener("click", () => fetchAndLoadPage());
}

window.addEventListener("DOMContentLoaded", async () => {
  setupUi();
  startTimer(GAME_DURATION);
  await fetchAndLoadPage("basic");
});
