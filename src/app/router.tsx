import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { ErrorScreen } from './ErrorScreen'
import { lazyPage } from './lazyPage'
import { RequireAuth } from './RequireAuth'

const DashboardPage = lazyPage(() => import('@/features/dashboard/DashboardPage'))
const ExpensesPage = lazyPage(() => import('@/features/expenses/ExpensesPage'))
const BudgetPage = lazyPage(() => import('@/features/budget/BudgetPage'))
const SettingsPage = lazyPage(() => import('@/features/settings/SettingsPage'))

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <ErrorScreen /> },
  {
    element: <RequireAuth />,
    errorElement: <ErrorScreen />,
    children: [
      { index: true, element: <DashboardPage />, errorElement: <ErrorScreen inShell /> },
      { path: 'gastos', element: <ExpensesPage />, errorElement: <ErrorScreen inShell /> },
      { path: 'presupuesto', element: <BudgetPage />, errorElement: <ErrorScreen inShell /> },
      { path: 'ajustes', element: <SettingsPage />, errorElement: <ErrorScreen inShell /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
