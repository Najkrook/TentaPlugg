import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  runTransaction,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { mergeProgress } from './engine.js';
import { PROJECT_ID, AUTH_DOMAIN } from './config.js';
const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const emulated = env?.MODE === 'test' && env?.VITE_FIREBASE_EMULATORS === 'true';
const app = initializeApp({
  projectId: emulated ? 'demo-tentaplugg' : PROJECT_ID,
  appId: '1:475360574850:web:8ada8aea9c6a8b8555239b',
  apiKey: emulated ? 'fake-api-key' : 'AIzaSyCB22oJUwzWpZi-c8oVXyONqeK1E5Nspao',
  authDomain: AUTH_DOMAIN,
});
export const auth = getAuth(app);
export const db = getFirestore(app);
if (emulated) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
export function preferRedirect(platform = navigator) {
  return (
    /iPhone|iPad|iPod/.test(platform.userAgent) ||
    (/Macintosh/.test(platform.userAgent) && platform.maxTouchPoints > 1) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}
export async function login(beforeRedirect) {
  const redirect = async () => {
    beforeRedirect();
    await signInWithRedirect(auth, new GoogleAuthProvider());
  };
  if (preferRedirect()) return redirect();
  try {
    return await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (error) {
    if (
      ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(
        error.code,
      )
    )
      return redirect();
    throw error;
  }
}
export const finishRedirect = () => getRedirectResult(auth);
export const logout = () => signOut(auth);
export const watchUser = (cb) => onAuthStateChanged(auth, cb);
export async function pull(uid) {
  const s = await getDoc(doc(db, 'users', uid, 'progress', 'state'));
  return s.exists() ? JSON.parse(s.data().payload) : null;
}
export const push = (uid, state) =>
  runTransaction(db, async (transaction) => {
    const ref = doc(db, 'users', uid, 'progress', 'state');
    const previous = await transaction.get(ref);
    const merged = previous.exists()
      ? mergeProgress(JSON.parse(previous.data().payload), state)
      : state;
    transaction.set(ref, { payload: JSON.stringify(merged), updatedAt: Date.now() });
    return merged;
  });
