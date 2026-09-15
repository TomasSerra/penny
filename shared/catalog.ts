import { normalizeText } from './text.js'
import type { CategoryId, PaymentMethodId } from './types.js'

export interface CatalogItem<Id extends string> {
  id: Id
  label: string
  emoji: string
  aliases: string[]
}

export const CATEGORIES: CatalogItem<CategoryId>[] = [
  { id: 'food', label: 'Comida', emoji: '🍔', aliases: ['comidas', 'restaurante', 'delivery', 'almuerzo', 'cena'] },
  { id: 'groceries', label: 'Supermercado', emoji: '🛒', aliases: ['super', 'mercado', 'almacen', 'verduleria'] },
  { id: 'car', label: 'Auto', emoji: '🚗', aliases: ['coche', 'nafta', 'combustible', 'estacionamiento', 'peaje'] },
  { id: 'transport', label: 'Transporte', emoji: '🚌', aliases: ['colectivo', 'subte', 'uber', 'taxi', 'sube', 'tren'] },
  { id: 'personal_care', label: 'Cuidado personal', emoji: '💅', aliases: ['cuidado', 'personal', 'peluqueria', 'belleza'] },
  { id: 'health', label: 'Salud', emoji: '💊', aliases: ['farmacia', 'medico', 'prepaga', 'remedios'] },
  { id: 'home', label: 'Hogar', emoji: '🏠', aliases: ['casa', 'alquiler', 'expensas', 'muebles'] },
  { id: 'utilities', label: 'Servicios', emoji: '💡', aliases: ['servicio', 'luz', 'gas', 'agua', 'internet', 'celular'] },
  { id: 'entertainment', label: 'Entretenimiento', emoji: '🎉', aliases: ['ocio', 'salidas', 'salida', 'cine', 'streaming'] },
  { id: 'clothing', label: 'Ropa', emoji: '👕', aliases: ['indumentaria', 'zapatillas', 'calzado'] },
  { id: 'education', label: 'Educación', emoji: '📚', aliases: ['facultad', 'curso', 'libros', 'estudio'] },
  { id: 'travel', label: 'Viajes', emoji: '✈️', aliases: ['viaje', 'vacaciones', 'hotel', 'vuelo'] },
  { id: 'gifts', label: 'Regalos', emoji: '🎁', aliases: ['regalo'] },
  { id: 'pets', label: 'Mascotas', emoji: '🐾', aliases: ['mascota', 'veterinaria', 'perro', 'gato'] },
  { id: 'other', label: 'Otros', emoji: '📦', aliases: ['otro', 'varios'] },
]

export const PAYMENT_METHODS: CatalogItem<PaymentMethodId>[] = [
  { id: 'credit', label: 'Tarjeta de crédito', emoji: '💳', aliases: ['credito', 'tarjeta', 'tc', 'visa', 'mastercard', 'amex'] },
  { id: 'debit', label: 'Tarjeta de débito', emoji: '🏦', aliases: ['debito', 'td'] },
  { id: 'wallet', label: 'Billetera virtual', emoji: '📱', aliases: ['billetera', 'mercado pago', 'mercadopago', 'mp', 'qr', 'transferencia'] },
  { id: 'cash', label: 'Efectivo', emoji: '💵', aliases: ['cash', 'plata'] },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  CatalogItem<CategoryId>
>

export const PAYMENT_METHOD_BY_ID = Object.fromEntries(PAYMENT_METHODS.map((p) => [p.id, p])) as Record<
  PaymentMethodId,
  CatalogItem<PaymentMethodId>
>

function findInCatalog<Id extends string>(items: CatalogItem<Id>[], input: unknown): Id | undefined {
  if (typeof input !== 'string' || !input.trim()) return undefined
  const raw = input.trim()
  const emojiMatch = items.find((item) => raw.startsWith(item.emoji) || raw === item.emoji.replace('️', ''))
  if (emojiMatch) return emojiMatch.id

  const text = normalizeText(raw)
  if (!text) return undefined
  const exact = items.find(
    (item) =>
      item.id === text.replace(/ /g, '_') ||
      normalizeText(item.label) === text ||
      item.aliases.some((alias) => normalizeText(alias) === text),
  )
  if (exact) return exact.id
  return items.find((item) => text.includes(normalizeText(item.label)))?.id
}

export function findCategory(input: unknown): CategoryId | undefined {
  return findInCatalog(CATEGORIES, input)
}

export function findPaymentMethod(input: unknown): PaymentMethodId | undefined {
  return findInCatalog(PAYMENT_METHODS, input)
}
