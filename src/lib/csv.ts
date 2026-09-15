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

export function downloadFile(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
