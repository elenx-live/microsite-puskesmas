import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Konfigurasi Firebase opsional. Di build Microsite mandiri (standalone)
 * berkas ini tidak ada; kredensial diambil dari env VITE_FIREBASE_*.
 * `import.meta.glob` tidak melempar error bila berkas tidak ditemukan.
 */
const configModules = (import.meta as any).glob('../../firebase-applet-config.json', {
  eager: true,
  import: 'default',
}) as Record<string, any>;
const firebaseAppletConfig: any =
  Object.values(configModules)[0] ?? {};

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseAppletConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseAppletConfig.projectId || env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseAppletConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseAppletConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseAppletConfig.appId || env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App centrally
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
const customDatabaseId = (firebaseAppletConfig as any).firestoreDatabaseId;
export const db = (customDatabaseId && customDatabaseId !== '(default)') 
  ? getFirestore(app, customDatabaseId) 
  : getFirestore(app);
export const storage = getStorage(app);

// Check if Firebase is using real credentials
export const isLiveFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('DummyKey')
);

