import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { firebaseConfig, useEmulators } from './firebaseConfig'

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
auth.languageCode = 'es'

// Persistent cache keeps the app usable offline; writes sync when back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

// Firestore shuts its cache down on `pagehide` for good (on Safari every later read just hangs).
// iOS also fires it without unloading, e.g. when a home-screen app previews a file or bfcache
// restores the page, which leaves a live page on a dead database: reload when it comes back.
let pageHidden = false
window.addEventListener('pagehide', () => {
  pageHidden = true
})
const reviveAfterPagehide = () => {
  if (pageHidden) window.location.reload()
}
window.addEventListener('pageshow', reviveAfterPagehide)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') reviveAfterPagehide()
})

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
