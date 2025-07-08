import axios from 'axios'
import { useAuthStore } from '@/stores/auth.js'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Request queue for retry after token refresh
let isRefreshing = false
let requestQueue = []

/**
 * Process queued requests after token refresh
 */
function processQueue(error, token = null) {
  requestQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    }
    else {
      promise.resolve(token)
    }
  })
  requestQueue = []
}

request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  error => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => {
    const { code, message } = response.data
    if (code === 200) {
      return response.data
    }

    // Handle specific error codes
    const error = new Error(message || '请求失败')
    error.code = code
    error.response = response

    return Promise.reject(error)
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 (Token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Add request to queue
        return new Promise((resolve, reject) => {
          requestQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return request(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const authStore = useAuthStore()
      const refreshToken = localStorage.getItem('refreshToken')

      // Try to refresh token
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          })

          const { token } = response.data.data
          authStore.setToken(token)
          originalRequest.headers.Authorization = `Bearer ${token}`

          processQueue(null, token)
          return request(originalRequest)
        }
        catch (refreshError) {
          processQueue(refreshError, null)
          authStore.clearToken()
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
        finally {
          isRefreshing = false
        }
      }
      else {
        // No refresh token, redirect to login
        authStore.clearToken()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

export default request
