/**
 * server.js
 * Express backend that:
 * - generates unique simulated pages (HTML/CSS/JS with hidden keys)
 * - stores pages and scores in MongoDB if MONGO_URI is set, otherwise keeps them in memory
 *
 * Endpoints:
 *  GET  /api/page?tag=basic|advanced
 *  POST /api/checkKey  { pageId, key }
 *  POST /api/score     { userId, score }
 *  GET  /api/leaderboard
 *
 * Start: `node server.js` or `npm run dev`
 */

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "";

/**
 * Data store abstraction: either MongoDB (if MONGO_URI provided) or in-memory.
 * pages store: { id, html, keys, tag }
 * scores store: { userId, score, timestamp }
 */
let dbClient = null;
let pagesColl = null;
let scoresColl = null;
let isMongo = false;

// In-memory fallback stores
const memory = {
  pages: new Map(), // id -> { id, html, keys, tag }
  scores: [] // { userId, score, timestamp }
};

async function initDb() {
  if (MONGO_URI) {
    try {
      dbClient = new MongoClient(MONGO_URI, { serverApi: "1" });
      await dbClient.connect();
      const db = dbClient.db(); // database inferred from URI
      pagesColl = db.collection("pages");
      scoresColl = db.collection("scores");
      isMongo = true;
      console.log("Connected to MongoDB.");
    } catch (err) {
      console.error(
        "Failed to connect to MongoDB, falling back to memory store.",
        err.message
      );
      isMongo = false;
    }
  } else {
    console.log("No MONGO_URI provided — using in-memory store.");
  }
}

/* ---------------------- Helpers ---------------------- */

function generateSimulatedPage(tag = "basic") {
  const pageId = nanoid(10);
  const numKeys =
    tag === "advanced"
      ? 2 + Math.floor(Math.random() * 3)
      : 1 + Math.floor(Math.random() * 1);
  const keys = [];
  for (let i = 0; i < numKeys; i++) {
    keys.push(
      (
        Math.random().toString(36).substring(2, 8) +
        "-" +
        Math.floor(Math.random() * 900 + 100)
      )
        .toUpperCase()
    );
  }

  const titles = [
    "Local Goods",
    "The Vintage Shop",
    "Old Library",
    "Neighborhood Blog",
    "Coffee & Code"
  ];
  const title = titles[Math.floor(Math.random() * titles.length)];

  let htmlParts = [];
  htmlParts.push(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>`
  );

  htmlParts.push(`<style>
  body{font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial; padding:24px; line-height:1.4; color:#111}
  header, main, footer, section, article, nav { margin-bottom: 16px; }
  .muted{color:#666; font-size:0.9rem;}
  .hidden-key::after { content: "${keys[0]}"; display:none; }
  </style></head><body>`);

  htmlParts.push(
    `<header><h1>${title}</h1><p class="muted">Welcome! Explore this page and find the hidden keys.</p></header>`
  );
  htmlParts.push(`<main>`);
  htmlParts.push(
    `<section><p>New arrivals and features.</p><!-- KEY: ${keys[0]} --></section>`
  );

  if (numKeys > 1) {
    htmlParts.push(
      `<article data-key="${keys[1]}" hidden><p>This article is archived.</p></article>`
    );
  }

  if (numKeys > 2) {
    htmlParts.push(
      `<section><ul><li data-key="${keys[2]}" hidden>Item A</li><li>Item B</li></ul></section>`
    );
  }

  const consoleHints = keys
    .map((k, i) => `console.log("HINT ${i + 1}: ${k}")`)
    .join("; ");
  htmlParts.push(
    `<section><p>Browse around — some clues are in the console or comments.</p></section>`
  );
  htmlParts.push(`<footer><p class="muted">Contact: info@example.com</p></footer>`);
  htmlParts.push(`<script>${consoleHints};</script>`);
  htmlParts.push(`</main></body></html>`);

  const html = htmlParts.join("\n");
  return { id: pageId, html, keys, tag };
}

async function storePage(pageObj) {
  if (isMongo) {
    await pagesColl.insertOne({
      _id: pageObj.id,
      html: pageObj.html,
      keys: pageObj.keys,
      tag: pageObj.tag,
      createdAt: new Date()
    });
  } else {
    memory.pages.set(pageObj.id, pageObj);
  }
}

async function getStoredPage(id) {
  if (isMongo) {
    const doc = await pagesColl.findOne({ _id: id });
    if (!doc) return null;
    return { id: doc._id, html: doc.html, keys: doc.keys, tag: doc.tag };
  } else {
    return memory.pages.get(id) || null;
  }
}

async function saveScore({ userId, score }) {
  const rec = { userId, score, timestamp: Date.now() };
  if (isMongo) {
    await scoresColl.insertOne(rec);
  } else {
    memory.scores.push(rec);
  }
}

async function getLeaderboard(limit = 20) {
  if (isMongo) {
    const pipeline = [
      { $group: { _id: "$userId", total: { $sum: "$score" } } },
      { $sort: { total: -1 } },
      { $limit: limit }
    ];
    const agg = await scoresColl.aggregate(pipeline).toArray();
    return agg.map((r) => ({ userId: r._id, score: r.total }));
  } else {
    const map = new Map();
    for (const s of memory.scores) {
      map.set(s.userId, (map.get(s.userId) || 0) + s.score);
    }
    const arr = Array.from(map.entries()).map(([userId, score]) => ({
      userId,
      score
    }));
    arr.sort((a, b) => b.score - a.score);
    return arr.slice(0, limit);
  }
}

/* ---------------------- Routes ---------------------- */

app.get("/api/page", async (req, res) => {
  const tag = req.query.tag === "advanced" ? "advanced" : "basic";
  try {
    const pageObj = generateSimulatedPage(tag);
    await storePage(pageObj);
    return res.json({ pageId: pageObj.id, html: pageObj.html, keys: pageObj.keys.length });
  } catch (err) {
    console.error("GET /api/page error", err);
    return res.status(500).json({ error: "internal" });
  }
});

app.post("/api/checkKey", async (req, res) => {
  try {
    const { pageId, key } = req.body;
    if (!pageId || !key)
      return res.status(400).json({ error: "missing pageId or key" });

    const page = await getStoredPage(pageId);
    if (!page) return res.status(404).json({ valid: false, matchedIn: null });

    const html = page.html;
    const dataKeyRegex = new RegExp(
      `data-key\\s*=\\s*["']${escapeRegExp(key)}["']`,
      "i"
    );
    if (dataKeyRegex.test(html))
      return res.json({ valid: true, matchedIn: "data-key" });

    const commentRegex = new RegExp(
      `<!--\\s*KEY:\\s*${escapeRegExp(key)}\\s*-->`,
      "i"
    );
    if (commentRegex.test(html))
      return res.json({ valid: true, matchedIn: "comment" });

    const consoleRegex = new RegExp(
      `console\\.log\\([^\\)]*${escapeRegExp(key)}[^\\)]*\\)`,
      "i"
    );
    if (consoleRegex.test(html))
      return res.json({ valid: true, matchedIn: "console" });

    if (html.indexOf(key) !== -1)
      return res.json({ valid: true, matchedIn: "text" });

    return res.json({ valid: false, matchedIn: null });
  } catch (err) {
    console.error("POST /api/checkKey error", err);
    return res.status(500).json({ error: "internal" });
  }
});

app.post("/api/score", async (req, res) => {
  try {
    const { userId, score } = req.body;
    if (!userId || typeof score !== "number")
      return res.status(400).json({ error: "missing userId or score" });
    await saveScore({ userId, score });
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/score error", err);
    return res.status(500).json({ error: "internal" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const lb = await getLeaderboard(20);
    return res.json(lb);
  } catch (err) {
    console.error("GET /api/leaderboard error", err);
    return res.status(500).json({ error: "internal" });
  }
});

app.get("/health", (req, res) => res.send("ok"));

app.use((req, res) => res.status(404).json({ error: "not found" }));

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log(
        "Endpoints: GET /api/page, POST /api/checkKey, POST /api/score, GET /api/leaderboard"
      );
    });
  })
  .catch((err) => {
    console.error("Server init failed", err);
    process.exit(1);
  });
