import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from './RequireAuth'

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const ExpensesPage = lazy(() => import('@/features/expenses/ExpensesPage'))
const BudgetPage = lazy(() => import('@/features/budget/BudgetPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'gastos', element: <ExpensesPage /> },
      { path: 'presupuesto', element: <BudgetPage /> },
      { path: 'ajustes', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
