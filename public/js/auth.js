// public/js/auth.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// TODO: replace these with your Firebase Web App config
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupBtn = document.getElementById('signupBtn');
  const authStatus = document.getElementById('authStatus');

  if (loginForm) {
    loginForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      try {
        await signInWithEmailAndPassword(auth, email, password);
        authStatus.textContent = 'Signed in';
        window.location.href = 'game.html';
      } catch (err) {
        authStatus.textContent = 'Sign-in failed: ' + (err.message || err);
      }
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const authStatus = document.getElementById('authStatus');
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // create profile doc
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: email,
          createdAt: Date.now(),
          displayName: email.split('@')[0]
        });
        authStatus.textContent = 'Account created';
        window.location.href = 'game.html';
      } catch (err) {
        authStatus.textContent = 'Sign-up failed: ' + (err.message || err);
      }
    });
  }

  // optional: sign-out detection on other pages
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // if on protected pages, optionally redirect to index
      // keep user on index for now
    }
  });
});
