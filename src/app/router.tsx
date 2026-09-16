import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { ErrorScreen } from './ErrorScreen'
import { RequireAuth } from './RequireAuth'

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const ExpensesPage = lazy(() => import('@/features/expenses/ExpensesPage'))
const BudgetPage = lazy(() => import('@/features/budget/BudgetPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <ErrorScreen /> },
  {
    element: <RequireAuth />,
    errorElement: <ErrorScreen />,
    children: [
      { index: true, element: <DashboardPage />, errorElement: <ErrorScreen /> },
      { path: 'gastos', element: <ExpensesPage />, errorElement: <ErrorScreen /> },
      { path: 'presupuesto', element: <BudgetPage />, errorElement: <ErrorScreen /> },
      { path: 'ajustes', element: <SettingsPage />, errorElement: <ErrorScreen /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
