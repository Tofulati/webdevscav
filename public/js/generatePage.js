// public/js/generatePage.js
import { db } from './auth.js';
import { collection, getDocs, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

const PAGES_COLL = 'pages';

// helper: seed sample pages if none exist
async function seedPagesIfEmpty() {
  const pagesCol = collection(db, PAGES_COLL);
  const snap = await getDocs(pagesCol);
  if (!snap.empty) return;

  const sample1 = {
    id: 'page1',
    tags: ['basic'],
    html: `
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Fake Store</title></head>
        <body>
          <header><h1>Local Goods</h1></header>
          <main>
            <p>Welcome to the fake store.</p>
            <!-- KEY: START123 -->
            <section hidden data-key="SECTIONKEY456"><p>Hidden promo</p></section>
            <footer><p>Contact us</p><script>console.log('Hint: The starting key is START123');</script></footer>
          </main>
        </body>
      </html>
    `
  };

  const sample2 = {
    id: 'page2',
    tags: ['advanced'],
    html: `
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Hidden Library</title></head>
        <body>
          <header><h2>Old Library</h2></header>
          <main>
            <article hidden data-key="ARTICLEKEY789"><p>Archived note</p></article>
            <ul>
              <li data-key="LIKEY1" hidden>Item 1</li>
              <li>Item 2</li>
            </ul>
            <!-- KEY: LIBSTART -->
            <script>console.log('library hint: look in comments');</script>
          </main>
        </body>
      </html>
    `
  };

  await setDoc(doc(db, PAGES_COLL, sample1.id), sample1);
  await setDoc(doc(db, PAGES_COLL, sample2.id), sample2);
}

export async function fetchRandomPage(tag = null) {
  // ensure sample pages exist for dev
  await seedPagesIfEmpty();

  const pagesRef = collection(db, PAGES_COLL);
  const snap = await getDocs(pagesRef);
  const docs = snap.docs.map(d => d.data());

  let filtered = docs;
  if (tag) filtered = docs.filter(p => (p.tags || []).includes(tag));
  if (filtered.length === 0) filtered = docs;

  const selected = filtered[Math.floor(Math.random() * filtered.length)];
  return selected.html;
}

// expose default load on DOMContentLoaded for basic usage
window.addEventListener('DOMContentLoaded', async () => {
  // no-op here; game.js calls fetchRandomPage when starting
});
