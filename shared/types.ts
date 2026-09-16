export type Currency = 'ARS' | 'USD'

export type RateType =
  | 'oficial'
  | 'blue'
  | 'bolsa'
  | 'contadoconliqui'
  | 'cripto'
  | 'mayorista'
  | 'tarjeta'

export type RateSide = 'compra' | 'venta'

export interface RateConfig {
  type: RateType
  side: RateSide
}

export interface RateSnapshot extends RateConfig {
  value: number
  /** ISO timestamp of when the quote was taken */
  at: string
}

export type CategoryId =
  | 'food'
  | 'groceries'
  | 'car'
  | 'transport'
  | 'personal_care'
  | 'health'
  | 'home'
  | 'utilities'
  | 'entertainment'
  | 'clothing'
  | 'education'
  | 'travel'
  | 'gifts'
  | 'pets'
  | 'other'

export type PaymentMethodId = 'credit' | 'debit' | 'wallet' | 'cash'

export interface MoneyItem {
  id: string
  name: string
  amount: number
  currency: Currency
}

export interface Savings {
  shortTermPct: number
  longTermPct: number
}

/** Month key in the form `yyyy-MM` */
export type MonthKey = string

export interface Budget {
  month: MonthKey
  incomes: MoneyItem[]
  deductions: MoneyItem[]
  fixedExpenses: MoneyItem[]
  savings: Savings
  rateSnapshot?: RateSnapshot
}

export type ExpenseSource = 'app' | 'api' | 'subscription'

export interface InstallmentInfo {
  groupId: string
  number: number
  total: number
  totalAmount: number
  purchaseDate: Date
}

export interface Expense {
  id: string
  date: Date
  /** Month the expense impacts (for credit card purchases, the month the statement is paid) */
  month: MonthKey
  amount: number
  currency: Currency
  rate: RateSnapshot
  amountARS: number
  amountUSD: number
  description: string
  category: CategoryId
  paymentMethod: PaymentMethodId
  necessary: boolean
  source: ExpenseSource
  installment?: InstallmentInfo
  /** Credit card purchases are dated in the month they are paid; this keeps when they were actually bought */
  purchaseDate?: Date
  subscriptionId?: string
}

export type ExpenseDraft = Omit<Expense, 'id'> & { id?: string }

/** How many months between charges */
export type SubscriptionFrequency = 1 | 2 | 3 | 6 | 12

/** Months after the purchase in which a credit card purchase is paid */
export type CardMonthOffset = 1 | 2

export interface Subscription {
  id: string
  name: string
  amount: number
  currency: Currency
  category: CategoryId
  paymentMethod: PaymentMethodId
  necessary: boolean
  dayOfMonth: number
  /** Missing on subscriptions created before it existed, which are monthly */
  frequencyMonths?: SubscriptionFrequency
  /** First charge; later ones repeat every `frequencyMonths` from here */
  startMonth: MonthKey
  active: boolean
  /** Months whose generated expense was deleted by the user and must not be recreated */
  skippedMonths?: MonthKey[]
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface UserSettings {
  theme: ThemePreference
  rate: RateConfig
  /** ISO timestamp of when the user finished the onboarding */
  onboardedAt?: string
  /** ISO timestamp of the last time they postponed it; the dashboard keeps offering it */
  onboardingSkippedAt?: string
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  rate: { type: 'cripto', side: 'compra' },
}
