// public/js/api.js
export async function fetchPage(tag = 'basic') {
  const res = await fetch(`/api/page?tag=${encodeURIComponent(tag)}`);
  if (!res.ok) throw new Error('Failed to fetch page');
  return res.json(); // { pageId, html, keys }
}

export async function checkKey(pageId, key) {
  const res = await fetch('/api/checkKey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageId, key })
  });
  return res.json(); // { valid, matchedIn }
}

export async function postScore(userId, score) {
  const res = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, score })
  });
  return res.json();
}

export async function fetchLeaderboard() {
  const res = await fetch('/api/leaderboard');
  return res.json();
}
