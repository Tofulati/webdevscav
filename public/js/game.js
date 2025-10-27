async function loadGamePage() {
  const res = await fetch("/api/getPage");
  const data = await res.json();

  // Insert the HTML into an iframe or container
  const iframe = document.createElement("iframe");
  iframe.srcdoc = data.html;
  iframe.style.width = "100%";
  iframe.style.height = "80vh";
  document.body.appendChild(iframe);

  // Overlay for submitting keys
  const overlay = document.createElement("section");
  overlay.innerHTML = `
    <h2>Enter keys you find:</h2>
    <input type="text" id="keysInput" placeholder="comma-separated keys">
    <button id="submitKeys">Submit</button>
    <p id="scoreOutput"></p>
  `;
  document.body.appendChild(overlay);

  document.getElementById("submitKeys").onclick = async () => {
    const keys = document.getElementById("keysInput").value.split(",").map(k => k.trim());
    const userId = localStorage.getItem("userId"); // from auth
    const pageId = data._id;

    const resp = await fetch("/api/verifyAnswer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pageId, submittedKeys: keys })
    });

    const result = await resp.json();
    document.getElementById("scoreOutput").innerText = `You got ${result.score} correct keys!`;
  };
}

window.onload = () => {
  if (!window.indexedDB) alert("Please use a modern web browser to play this game.");
  loadGamePage();
};
