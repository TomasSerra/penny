import { randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { CATEGORY_BY_ID } from '../shared/catalog.js'
import { buildExpenses } from '../shared/expenses.js'
import { parseExpenseInput } from '../shared/normalize.js'
import { fetchRate } from '../shared/rates.js'
import { serializeExpense } from '../shared/serialize.js'
import { DEFAULT_SETTINGS, type RateSnapshot, type UserSettings } from '../shared/types.js'
import { adminDb } from './_lib/firebaseAdmin.js'
import { applyCors, extractApiKey, hashApiKey, readJsonBody, sendError } from './_lib/http.js'

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: currency === 'ARS' ? 0 : 2 }).format(amount)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return sendError(res, 405, 'Usá POST para cargar un gasto')

  const apiKey = extractApiKey(req)
  if (!apiKey) return sendError(res, 401, 'Falta la API key (?key=...)')

  const db = adminDb()
  const keyRef = db.doc(`apiKeys/${hashApiKey(apiKey)}`)
  const keySnap = await keyRef.get()
  if (!keySnap.exists) return sendError(res, 401, 'API key inválida')
  const uid = keySnap.get('uid') as string

  const parsed = parseExpenseInput(readJsonBody(req))
  if (!parsed.ok) return sendError(res, 400, parsed.error)
  const input = parsed.value

  const userSnap = await db.doc(`users/${uid}`).get()
  const settings: UserSettings = { ...DEFAULT_SETTINGS, ...(userSnap.get('settings') ?? {}) }

  let rate: RateSnapshot | undefined
  try {
    rate = await fetchRate(settings.rate)
  } catch {
    rate = userSnap.get('lastRate')
  }
  if (!rate) return sendError(res, 503, 'No se pudo obtener la cotización del dólar, probá de nuevo')

  const drafts = buildExpenses(input, {
    rate,
    closingDay: settings.cardClosingDay,
    source: 'api',
    groupId: randomUUID(),
  })

  const batch = db.batch()
  const collection = db.collection(`users/${uid}/expenses`)
  const ids = drafts.map((draft) => {
    const ref = collection.doc()
    batch.set(ref, {
      ...serializeExpense(draft),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return ref.id
  })
  batch.update(keyRef, { lastUsedAt: FieldValue.serverTimestamp() })
  await batch.commit()

  const category = CATEGORY_BY_ID[input.category]
  const installments = input.installments > 1 ? ` en ${input.installments} cuotas` : ''
  res.status(201).json({
    ok: true,
    id: ids[0],
    ids,
    message: `Gasto cargado: ${money(input.amount, input.currency)} en ${category.emoji} ${category.label}${installments}`,
  })
}
