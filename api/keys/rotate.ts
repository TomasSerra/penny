import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '../_lib/firebaseAdmin.js'
import { applyCors, bearerToken, generateApiKey, hashApiKey, sendError } from '../_lib/http.js'

/** Creates the user's API key, replacing the previous one if it exists. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return sendError(res, 405, 'Método no permitido')

  const token = bearerToken(req)
  if (!token) return sendError(res, 401, 'No autenticado')

  let uid: string
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid
  } catch {
    return sendError(res, 401, 'Sesión inválida')
  }

  const db = adminDb()
  const privateRef = db.doc(`users/${uid}/private/apiKey`)
  const previous = await privateRef.get()
  const key = generateApiKey()

  const batch = db.batch()
  const previousKey = previous.get('key') as string | undefined
  if (previousKey) batch.delete(db.doc(`apiKeys/${hashApiKey(previousKey)}`))
  batch.set(db.doc(`apiKeys/${hashApiKey(key)}`), { uid, createdAt: FieldValue.serverTimestamp() })
  batch.set(privateRef, { key, createdAt: FieldValue.serverTimestamp() })
  await batch.commit()

  res.status(200).json({ ok: true, key })
}
