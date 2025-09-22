import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue3-toastify'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
})

// export const updateAuthToken = () => {
//   const token = Cookies.get(import.meta.env.VITE_COOKIE_NAME)
//   api.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : ''
// }
let isRefreshing = false
let failedQueue: { resolve: (value?: any) => void; reject: (error: any) => void }[] = []
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}
export const updateAuthToken = (token?: string) => {
  const authToken = token || Cookies.get(import.meta.env.VITE_COOKIE_NAME)
  if (authToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(import.meta.env.VITE_COOKIE_NAME)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const authStore = useAuthStore()

    // If error is not 401 or it's a refresh token request, reject
    const errorData = error.response?.data as any
    if (errorData?.message === 'IP invalid!' || errorData?.error === 'Unauthorized') {
      authStore.logout()
      authStore.navigateToLogin()
      toast.error(
        errorData?.message === 'IP invalid!' ? 'IP Address ไม่ถูกต้อง' : errorData?.message,
      )
      return Promise.reject(error)
    }

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest.url?.includes('/auth/token/refresh')
    ) {
      if (error.response?.status === 401) {
        authStore.logout()
        authStore.navigateToLogin()
      }
      return Promise.reject(error)
    }

    // If we're already refreshing the token, add the request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return api(originalRequest)
        })
        .catch((err) => {
          return Promise.reject(err)
        })
    }

    // Set isRefreshing to true and try to refresh the token
    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = Cookies.get(import.meta.env.VITE_REFRESH_NAME)
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      // Call refresh token endpoint with the specified format
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/auth/token/refresh`, {
        refreshToken,
      })

      const { accessToken, refreshToken: newRefreshToken } = response.data.data

      // Update tokens
      if (newRefreshToken) {
        Cookies.set(import.meta.env.VITE_REFRESH_NAME, newRefreshToken)
      }
      if (accessToken) {
        Cookies.set(import.meta.env.VITE_COOKIE_NAME, accessToken)
        updateAuthToken(accessToken)
      } else {
        throw new Error('No access token in response')
      }
      // Process the queue
      processQueue(null, accessToken)

      // Retry the original request
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
      }
      return api(originalRequest)
    } catch (refreshError) {
      console.error('Refresh token error:', refreshError)
      // If refresh fails, clear tokens and redirect to login
      processQueue(refreshError, null)
      authStore.logout()
      authStore.navigateToLogin()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

updateAuthToken()

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     const authStore = useAuthStore()
//     if (err.response?.status === 401) {
//       authStore.logout()
//       authStore.navigateToLogin()
//       return Promise.reject(new Error('Unauthorized'))
//     }
//     return Promise.reject(err)
//   },
// )

export default api
