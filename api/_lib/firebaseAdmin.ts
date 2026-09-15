import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function adminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  if (serviceAccount) {
    const json = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf8'))
    return initializeApp({ credential: cert(json) })
  }
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-penny' })
  }
  throw new Error('Falta FIREBASE_SERVICE_ACCOUNT en las variables de entorno')
}

export const adminDb = () => getFirestore(adminApp())
export const adminAuth = () => getAuth(adminApp())
