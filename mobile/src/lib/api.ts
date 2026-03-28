import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Interceptor: attach session cookie to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('session_token')
    if (token) {
      config.headers['Cookie'] = `next-auth.session-token=${token}`
    }
  } catch {
    // ignore
  }
  return config
})

// Interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('session_token')
      await SecureStore.deleteItemAsync('user_data')
    }
    return Promise.reject(error)
  }
)

export { API_URL }
export default api
