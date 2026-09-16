import { CATEGORY_BY_ID, PAYMENT_METHOD_BY_ID } from '@shared/catalog'
import type { Expense } from '@shared/types'
import { formatDate } from './format'

const SOURCE_LABELS = { app: 'App', api: 'API', subscription: 'Suscripción' } as const

function cell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function expensesToCsv(expenses: Expense[]): string {
  const header = [
    'Fecha',
    'Mes',
    'Descripción',
    'Monto',
    'Moneda',
    'Monto ARS',
    'Monto USD',
    'Tipo de cambio',
    'Categoría',
    'Medio de pago',
    'Necesario',
    'Cuota',
    'Origen',
  ]
  const rows = expenses.map((expense) => [
    formatDate(expense.date, { day: '2-digit', month: '2-digit', year: 'numeric' }),
    expense.month,
    expense.description,
    expense.amount,
    expense.currency,
    expense.amountARS,
    expense.amountUSD,
    expense.rate.value,
    CATEGORY_BY_ID[expense.category]?.label ?? expense.category,
    PAYMENT_METHOD_BY_ID[expense.paymentMethod]?.label ?? expense.paymentMethod,
    expense.necessary ? 'Si' : 'No',
    expense.installment ? `${expense.installment.number}/${expense.installment.total}` : '',
    SOURCE_LABELS[expense.source],
  ])
  // BOM so Excel opens accents correctly
  return `﻿${[header, ...rows].map((row) => row.map(cell).join(',')).join('\n')}`
}

export async function saveFile(filename: string, content: string, type = 'text/csv') {
  const file = new File([content], filename, { type })
  // A standalone iOS PWA has no downloads: <a download> opens a Quick Look preview that fires
  // `pagehide`, and Firestore shuts itself down on it (see lib/firebase). The share sheet keeps
  // the page alive and still offers "Guardar en Archivos".
  if (window.matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(file)
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(link)
  link.click()
  link.remove()
  // Revoking right away can cancel the download before the browser reads the blob.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
