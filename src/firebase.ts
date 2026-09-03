import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import defaultConfig from '../firebase-applet-config.json';

// Firebase's generated web configuration is the canonical configuration for
// this application. Do not allow unrelated Railway/NEXT_PUBLIC variables to
// silently override the Web API key and cause auth/invalid-api-key at startup.
const config = {
  apiKey: defaultConfig.apiKey,
  authDomain: defaultConfig.authDomain,
  projectId: defaultConfig.projectId,
  storageBucket: defaultConfig.storageBucket,
  messagingSenderId: defaultConfig.messagingSenderId,
  appId: defaultConfig.appId,
};

const databaseId = (defaultConfig as Record<string, string>).firestoreDatabaseId;

const app = initializeApp(config);

// A missing/empty Firestore database id must not be passed to getFirestore().
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
