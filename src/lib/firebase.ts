import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

if (typeof window === "undefined") {
  let baseUrl = "http://localhost:5000";
  if (import.meta.env.PROD || process.env.NODE_ENV === "production") {
    baseUrl = "https://election-campaign-479605.web.app";
  }
  console.log("Setting fetch base URL to:", baseUrl);
  const _fetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url: URL;
    if (typeof input === "string") {
      url = new URL(input, baseUrl);
    } else if (input instanceof URL) {
      url = input;
    } else {
      url = new URL(input.url, baseUrl);
    }

    url = new URL(url, baseUrl);

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

if (!import.meta.env.PROD && process.env.NODE_ENV !== "production") {
  connectFirestoreEmulator(db, "localhost", 8080);
}
