import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios'
import { getTelegramInitDataRaw, hasValidTelegramInitData } from '@/telegram/init'

// Base URL configurada desde variables de entorno
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

/**
 * Instancia centralizada de Axios configurada para Telegram Mini Apps
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * Interceptor de Peticiones:
 * Solo adjunta la cabecera Authorization / x-telegram-init-data si initData contiene la firma 'hash='
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const initData = getTelegramInitDataRaw()

    if (initData && initData.includes('hash=')) {
      // Formato estándar Telegram Mini Apps
      config.headers.set('Authorization', `tma ${initData}`)
      config.headers.set('x-telegram-init-data', initData)
    } else {
      // Si no hay hash válido, no adjuntar cabecera inválida
      console.warn(
        '⚠️ [Fematch API] Petición sin hash en initData. Omitiendo Authorization tma para evitar 401.'
      )
    }

    // Cabeceras adicionales de tema Telegram
    if (window.Telegram?.WebApp?.colorScheme) {
      config.headers.set('X-Telegram-Theme', window.Telegram.WebApp.colorScheme)
    }

    return config
  },
  (error: AxiosError) => {
    console.error('❌ [Fematch API Request Error]:', error)
    return Promise.reject(error)
  }
)

/**
 * Interceptor de Respuestas:
 * Manejo unificado de respuestas exitosas, expiración de tokens / firmas inválidas y errores del servidor
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          console.error(
            '🔒 [Fematch API 401 Unauthorized] initData inválido o sesión expirada de Telegram:',
            data
          )
          window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error')
          break

        case 403:
          console.warn('⛔ [Fematch API 403 Forbidden] Acceso restringido:', data)
          break

        case 404:
          console.warn('🔍 [Fematch API 404 Not Found]:', error.config?.url)
          break

        case 500:
        case 502:
        case 503:
          console.error('💥 [Fematch API Server Error]:', data)
          break

        default:
          console.error(`⚠️ [Fematch API Error ${status}]:`, data)
      }
    } else if (error.request) {
      console.warn('📡 [Fematch API Network Warning] Sin respuesta del backend:', error.message)
    } else {
      console.error('⚠️ [Fematch API Config Error]:', error.message)
    }

    return Promise.reject(error)
  }
)

/**
 * Wrapper tipado para simplificar llamadas HTTP en servicios
 */
export const http = {
  get: <T = unknown>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((res) => res.data),

  post: <T = unknown>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((res) => res.data),

  put: <T = unknown>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((res) => res.data),

  patch: <T = unknown>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((res) => res.data),

  delete: <T = unknown>(url: string) =>
    apiClient.delete<T>(url).then((res) => res.data),
}

export { hasValidTelegramInitData }

export default apiClient
