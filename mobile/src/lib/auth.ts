import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from './api'
import type { User } from '../types'

const SESSION_TOKEN_KEY = 'session_token'
const USER_DATA_KEY = 'user_data'

/**
 * Login with NextAuth credentials provider.
 * Steps:
 *   1. GET /api/auth/csrf  → obtains csrfToken
 *   2. POST /api/auth/callback/credentials  → authenticates and sets session cookie
 *   3. GET /api/auth/session  → retrieves user data
 *   4. Store session token from Set-Cookie header in SecureStore
 */
export async function login(email: string, password: string): Promise<User> {
  // Step 1: get CSRF token
  const csrfRes = await axios.get(`${API_URL}/api/auth/csrf`)
  const csrfToken: string = csrfRes.data.csrfToken

  // Step 2: authenticate
  const params = new URLSearchParams()
  params.append('email', email)
  params.append('password', password)
  params.append('csrfToken', csrfToken)
  params.append('json', 'true')
  params.append('redirect', 'false')

  const authRes = await axios.post(
    `${API_URL}/api/auth/callback/credentials`,
    params.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 0,
      validateStatus: (s) => s < 500,
    }
  )

  // Extract session token from Set-Cookie header
  const setCookieHeader = authRes.headers['set-cookie']
  let sessionToken: string | null = null

  if (setCookieHeader) {
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : [setCookieHeader]

    for (const cookie of cookies) {
      const match = cookie.match(/next-auth\.session-token=([^;]+)/)
      if (match) {
        sessionToken = match[1]
        break
      }
    }
  }

  if (!sessionToken) {
    throw new Error('Credenziali non valide. Controlla email e password.')
  }

  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, sessionToken)

  // Step 3: fetch session user data
  const sessionRes = await axios.get(`${API_URL}/api/auth/session`, {
    headers: { Cookie: `next-auth.session-token=${sessionToken}` },
  })

  const sessionData = sessionRes.data
  if (!sessionData?.user) {
    throw new Error('Sessione non valida. Riprova.')
  }

  const user: User = {
    id: sessionData.user.id,
    name: sessionData.user.name,
    email: sessionData.user.email,
    role: sessionData.user.role,
  }

  await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user))
  return user
}

/**
 * Attempt to restore an existing session from SecureStore.
 * Returns the user if the stored token is still valid, otherwise null.
 */
export async function restoreSession(): Promise<User | null> {
  try {
    const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY)
    if (!token) return null

    const sessionRes = await axios.get(`${API_URL}/api/auth/session`, {
      headers: { Cookie: `next-auth.session-token=${token}` },
    })

    const sessionData = sessionRes.data
    if (!sessionData?.user) {
      await clearSession()
      return null
    }

    const user: User = {
      id: sessionData.user.id,
      name: sessionData.user.name,
      email: sessionData.user.email,
      role: sessionData.user.role,
    }

    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user))
    return user
  } catch {
    await clearSession()
    return null
  }
}

/**
 * Logout: invalidate server session and clear stored credentials.
 */
export async function logout(): Promise<void> {
  try {
    const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY)
    if (token) {
      // Get CSRF token for signout
      const csrfRes = await axios.get(`${API_URL}/api/auth/csrf`, {
        headers: { Cookie: `next-auth.session-token=${token}` },
      })
      const csrfToken: string = csrfRes.data.csrfToken

      await axios.post(
        `${API_URL}/api/auth/signout`,
        new URLSearchParams({ csrfToken }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: `next-auth.session-token=${token}`,
          },
          maxRedirects: 0,
          validateStatus: () => true,
        }
      )
    }
  } catch {
    // ignore logout errors
  } finally {
    await clearSession()
  }
}

async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY)
  await SecureStore.deleteItemAsync(USER_DATA_KEY)
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_DATA_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}
