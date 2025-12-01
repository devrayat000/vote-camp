import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

if (!import.meta.env.PROD && typeof window === "undefined") {
  const _fetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url: URL;
    if (typeof input === "string") {
      url = new URL(input, "http://localhost:5000");
    } else if (input instanceof URL) {
      url = input;
    } else {
      url = new URL(input.url, "http://localhost:5000");
    }

    url = new URL(url, "http://localhost:5000");

    return _fetch(url, init);
  };
}

async function fetchConfig() {
  const res = await globalThis.fetch("/__/firebase/init.json");
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase config: ${res.statusText}`);
  }
  return res.json();
}

async function initApp() {
  const config = await fetchConfig();
  // Initialize Firebase app if not already initialized
  return initializeApp(config);
}

// @ts-expect-error: add to window
globalThis.firebaseAppPromise = initApp();

export async function ensureInitialized() {
  // @ts-expect-error: add to window
  return globalThis.firebaseAppPromise;
}

const app = await initApp(); // Use existing app initialized by firebase/init.js
export const db = initializeFirestore(app, {});

if (!import.meta.env.PROD) {
  connectFirestoreEmulator(db, "localhost", 8080);
}
