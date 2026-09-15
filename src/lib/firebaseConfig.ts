const env = import.meta.env

export const useEmulators = env.VITE_USE_EMULATORS === 'true'

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || (useEmulators ? 'demo-api-key' : ''),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (useEmulators ? 'demo-penny.firebaseapp.com' : ''),
  projectId: env.VITE_FIREBASE_PROJECT_ID || (useEmulators ? 'demo-penny' : ''),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

/** Checked before importing Firebase so a missing config shows a setup screen instead of crashing. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
