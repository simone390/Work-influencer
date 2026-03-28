import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { login as authLogin, logout as authLogout, restoreSession } from '../lib/auth'
import { registerForPushNotificationsAsync } from '../lib/notifications'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Attempt session restore on mount
  useEffect(() => {
    let cancelled = false
    restoreSession()
      .then((restored) => {
        if (!cancelled) setUser(restored)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const loggedUser = await authLogin(email, password)
    setUser(loggedUser)
    // Register push token after login (non-blocking)
    registerForPushNotificationsAsync().catch(() => {})
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setUser(null)
  }, [])

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      },
    },
    children
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
