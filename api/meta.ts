import type { VercelRequest, VercelResponse } from '@vercel/node'
import { CATEGORIES, PAYMENT_METHODS } from '../shared/catalog.js'
import { applyCors } from './_lib/http.js'

/** Lists for "Choose from Menu" actions in the iOS Shortcut. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).json({
    categories: CATEGORIES.map((item) => `${item.emoji} ${item.label}`),
    paymentMethods: PAYMENT_METHODS.map((item) => `${item.emoji} ${item.label}`),
    necessary: ['Si', 'No'],
    currencies: ['ARS', 'USD'],
  })
}
