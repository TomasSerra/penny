import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ensureProfile } from '@/data/profile'
import { auth, googleProvider } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextValue>({ user: auth.currentUser, loading: true })

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setState({ user, loading: false })
        if (user) ensureProfile(user).catch((error) => console.warn('[auth] ensureProfile', error))
      }),
    [],
  )

  const value = useMemo(() => state, [state])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

/** For components rendered behind the auth guard. */
export function useUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('useUser requires an authenticated user')
  return user
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  if (name) await updateProfile(credential.user, { displayName: name })
  await ensureProfile(credential.user)
  return credential
}

export function signOut() {
  return firebaseSignOut(auth)
}

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/invalid-email': 'El email no es válido',
  'auth/user-not-found': 'No hay una cuenta con ese email',
  'auth/wrong-password': 'Email o contraseña incorrectos',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email',
  'auth/weak-password': 'La contraseña tiene que tener al menos 6 caracteres',
  'auth/too-many-requests': 'Demasiados intentos, probá de nuevo en unos minutos',
  'auth/network-request-failed': 'Sin conexión, revisá tu internet',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google',
}

export function authErrorMessage(error: unknown): string | null {
  const code = (error as { code?: string })?.code
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null
  return (code && AUTH_ERRORS[code]) || 'Algo salió mal, probá de nuevo'
}
