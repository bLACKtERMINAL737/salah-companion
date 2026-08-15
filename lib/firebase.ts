import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import type { UserSettings } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let app: FirebaseApp | null = null;

/** Lazily initializes Firebase — safe to call even when env vars are unset
 *  (the app runs fully offline/local-only until they're filled in). */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth() {
  const a = getFirebaseApp();
  return a ? getAuth(a) : null;
}

export function getFirebaseDb() {
  const a = getFirebaseApp();
  return a ? getFirestore(a) : null;
}

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase isn't configured — add NEXT_PUBLIC_FIREBASE_* env vars.");
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase isn't configured — add NEXT_PUBLIC_FIREBASE_* env vars.");
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase isn't configured — add NEXT_PUBLIC_FIREBASE_* env vars.");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) await firebaseSignOut(auth);
}

export function watchAuthState(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ── Settings sync (Firestore) ─────────────────────────────────────────────
// Doc shape: users/{uid} → UserSettings. The app works fully without an
// account (settings live in localStorage — see context/SettingsContext);
// signing in just layers cross-device sync on top.

export async function pushSettingsToCloud(uid: string, settings: UserSettings): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(doc(db, "users", uid), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
}

export async function pullSettingsFromCloud(uid: string): Promise<UserSettings | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserSettings) : null;
}

export function watchCloudSettings(uid: string, callback: (settings: UserSettings | null) => void): () => void {
  const db = getFirebaseDb();
  if (!db) return () => {};
  return onSnapshot(doc(db, "users", uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserSettings) : null);
  });
}
