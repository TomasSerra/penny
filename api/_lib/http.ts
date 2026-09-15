import { createHash, randomBytes } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

export function sendError(res: VercelResponse, status: number, error: string) {
  res.status(status).json({ ok: false, error })
}

export function readJsonBody(req: VercelRequest): unknown {
  const body: unknown = req.body
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString())
    } catch {
      return undefined
    }
  }
  return body
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function bearerToken(req: VercelRequest): string | undefined {
  const header = firstValue(req.headers.authorization)
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined
}

/** The Shortcut sends the key in the URL; headers are accepted too. */
export function extractApiKey(req: VercelRequest): string | undefined {
  return (
    firstValue(req.query.key) ??
    firstValue(req.query.apiKey) ??
    firstValue(req.headers['x-api-key']) ??
    bearerToken(req)
  )?.trim()
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): string {
  return `pny_${randomBytes(24).toString('base64url')}`
}
