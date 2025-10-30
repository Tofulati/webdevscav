let currentPageId = null;
let score = 0;

const iframe = document.getElementById("simulatedPage");
const keyInput = document.getElementById("keyInput");
const feedback = document.getElementById("feedback");
const scoreDisplay = document.getElementById("scoreDisplay");
const newPageBtn = document.getElementById("newPage");
const submitBtn = document.getElementById("submitKey");

// Load a new page into the iframe using a data URL
async function loadNewPage(tag = "basic") {
  try {
    const res = await fetch(`/api/page?tag=${tag}`);
    const data = await res.json();
    currentPageId = data.pageId;

    // Use data URL to safely inject HTML
    iframe.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(data.html);

    feedback.textContent = `New page loaded! ${data.keys} key(s) hidden.`;
    feedback.style.color = "black";
  } catch (err) {
    feedback.textContent = "Error loading new page.";
    feedback.style.color = "red";
    console.error(err);
  }
}

// Check the entered key
async function checkKey() {
  const key = keyInput.value.trim();
  if (!key || !currentPageId) return;

  try {
    const res = await fetch("/api/checkKey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: currentPageId, key }),
    });
    const data = await res.json();

    if (data.valid) {
      feedback.textContent = `✅ Correct! Found in ${data.matchedIn}.`;
      feedback.style.color = "green";
      score += 10;
      scoreDisplay.textContent = `Score: ${score}`;
      keyInput.value = "";
    } else {
      feedback.textContent = "❌ Not found. Try again.";
      feedback.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    feedback.textContent = "Error checking key.";
    feedback.style.color = "red";
  }
}

// Event listeners
submitBtn.addEventListener("click", checkKey);
newPageBtn.addEventListener("click", () => loadNewPage("basic"));
keyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkKey();
});

// Load the first page automatically
loadNewPage();
