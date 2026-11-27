import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import defaultConfig from '../firebase-applet-config.json';

// Explicit opt-in allows isolated staging without accidentally targeting the
// bundled production Firebase project when some staging variables are missing.
const staging = import.meta.env.VITE_USE_STAGING_FIREBASE === 'true';
const stagingConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
if (staging && (Object.values(stagingConfig).some(value => !value?.trim()) || stagingConfig.projectId === defaultConfig.projectId)) {
  throw new Error('Staging requires a complete, separate Firebase project configuration.');
}
const config = staging ? stagingConfig : defaultConfig;
const databaseId = staging ? import.meta.env.VITE_FIREBASE_DATABASE_ID : (defaultConfig as Record<string, string>).firestoreDatabaseId;

const app = initializeApp(config);

// A missing/empty Firestore database id must not be passed to getFirestore().
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
