import {
  init as initSDK,
  viewport,
  miniApp,
  themeParams,
  swipeBehavior,
  closingBehavior,
} from '@telegram-apps/sdk'
import { setupTelegramMock, getMockInitData } from './mock'
import { setupTelegramThemeListener } from './theme'
import type { TelegramWebApp, TelegramUser } from './types'

let isInitialized = false

export interface TMAInitResult {
  isInsideTelegram: boolean
  user: TelegramUser | null
  initDataRaw: string
  colorScheme: 'light' | 'dark'
  isValid: boolean
}

/**
 * Comprueba si la aplicación se está ejecutando en entorno de desarrollo local (localhost / 127.0.0.1)
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.localhost') ||
    host === '[::1]'
  )
}

/**
 * Función robusta para obtener el initData de Telegram con validación de hash:
 * 
 * - Prioridad 1: window.Telegram?.WebApp?.initData (si no está vacío y contiene hash=).
 * - Prioridad 2: Extraer y decodificar el parámetro de la URL window.location.hash buscando 'tgWebAppData=' o '#tgWebAppData='.
 * - Prioridad 3: Extraer de los search params (?tgWebAppData=...).
 * - Prioridad 4: Fallback solo si import.meta.env.DEV es true (o VITE_ENABLE_DEV_TMA_MOCK === 'true').
 *   Si está en producción y no hay datos válidos con hash=, retorna string vacío "".
 */
export function getTelegramInitDataRaw(): string {
  if (typeof window === 'undefined') return ''

  // Prioridad 1: window.Telegram?.WebApp?.initData (si no está vacío)
  const webAppInitData = window.Telegram?.WebApp?.initData
  if (typeof webAppInitData === 'string' && webAppInitData.trim().length > 0) {
    const trimmed = webAppInitData.trim()
    if (trimmed.includes('hash=')) {
      return trimmed
    }
  }

  // Prioridad 2: Extraer y decodificar el parámetro de URL hash (#tgWebAppData=... o #tgWebAppInitData=...)
  const rawHash = window.location.hash || ''
  if (rawHash) {
    const hashClean = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash
    const params = new URLSearchParams(hashClean)
    const tgWebAppData = params.get('tgWebAppData') || params.get('tgWebAppInitData')

    if (tgWebAppData && tgWebAppData.trim().length > 0) {
      let decoded = tgWebAppData.trim()
      try {
        decoded = decodeURIComponent(decoded)
      } catch {
        // En caso de fallo en decodeURIComponent, usar valor crudo
      }
      if (decoded.includes('hash=')) {
        return decoded
      }
    }

    // Extracción regex directa en hash por si no estuviese estructurado como querystring
    if (hashClean.includes('tgWebAppData=')) {
      const match = hashClean.match(/tgWebAppData=([^&]+)/)
      if (match && match[1]) {
        let decoded = match[1]
        try {
          decoded = decodeURIComponent(decoded)
        } catch {}
        if (decoded.includes('hash=')) {
          return decoded
        }
      }
    }
  }

  // Prioridad 3: Extraer de los search params (?tgWebAppData=... o ?tgWebAppInitData=...)
  const rawSearch = window.location.search || ''
  if (rawSearch) {
    const searchClean = rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch
    const params = new URLSearchParams(searchClean)
    const tgWebAppData = params.get('tgWebAppData') || params.get('tgWebAppInitData')

    if (tgWebAppData && tgWebAppData.trim().length > 0) {
      let decoded = tgWebAppData.trim()
      try {
        decoded = decodeURIComponent(decoded)
      } catch {}
      if (decoded.includes('hash=')) {
        return decoded
      }
    }
  }

  // Prioridad 4: Fallback solo si import.meta.env.DEV es true o se habilitó explícitamente en localhost
  const isDevMode = Boolean(import.meta.env.DEV)
  const isMockEnabled = import.meta.env.VITE_ENABLE_DEV_TMA_MOCK === 'true'

  if (isDevMode || (isLocalhost() && isMockEnabled)) {
    if (webAppInitData && webAppInitData.includes('hash=')) {
      return webAppInitData
    }
    return getMockInitData()
  }

  // Si está en producción y no hay datos válidos, retornar string vacío
  return ''
}

/**
 * Comprueba si disponemos de un initData de Telegram con firma/hash válido
 */
export function hasValidTelegramInitData(): boolean {
  const raw = getTelegramInitDataRaw()
  return Boolean(raw && raw.includes('hash='))
}

/**
 * Comprueba si la aplicación se está ejecutando dentro de un entorno Telegram real
 */
export function isInsideTelegramApp(): boolean {
  if (typeof window === 'undefined') return false

  const rawInitData = getTelegramInitDataRaw()
  if (rawInitData && !rawInitData.includes('mock_fematch')) {
    return true
  }

  const webApp = window.Telegram?.WebApp
  if (
    webApp &&
    typeof webApp.initData === 'string' &&
    webApp.initData.includes('hash=') &&
    !webApp.initData.includes('mock_fematch')
  ) {
    return true
  }

  return false
}

/**
 * Inicializa el SDK de Telegram Mini Apps, Viewport, Tema y Expande la aplicación a pantalla completa
 */
export async function initializeTelegramApp(): Promise<TMAInitResult> {
  if (isInitialized) {
    const webApp = window.Telegram?.WebApp
    const initDataRaw = getTelegramInitDataRaw()
    const isValid = hasValidTelegramInitData()
    return {
      isInsideTelegram: isInsideTelegramApp(),
      user: webApp?.initDataUnsafe?.user || null,
      initDataRaw,
      colorScheme: webApp?.colorScheme || 'light',
      isValid,
    }
  }

  const inTelegram = isInsideTelegramApp()
  const allowMock = (Boolean(import.meta.env.DEV) || isLocalhost()) && import.meta.env.VITE_ENABLE_DEV_TMA_MOCK === 'true'

  // Solo inyectar mock si NO estamos dentro de Telegram real y estamos en dev/localhost
  if (!inTelegram && allowMock) {
    setupTelegramMock()
  }

  try {
    // 1. Inicializar SDK de @telegram-apps/sdk
    initSDK()

    // 2. Montar miniApp y vincular variables CSS
    if (miniApp.mount.isAvailable()) {
      miniApp.mount()
      if (miniApp.setHeaderColor.isAvailable()) {
        miniApp.setHeaderColor('bg_color')
      }
    }

    // 3. Montar y Expandir el Viewport
    if (viewport.mount.isAvailable()) {
      await viewport.mount()
      if (viewport.expand.isAvailable()) {
        viewport.expand()
      }
      if (viewport.bindCssVars.isAvailable()) {
        viewport.bindCssVars()
      }
    }

    // 4. Montar y sincronizar tema con SDK
    if (themeParams.mount.isAvailable()) {
      themeParams.mount()
      if (themeParams.bindCssVars.isAvailable()) {
        themeParams.bindCssVars()
      }
    }

    // 5. Configurar gestos (evitar cierre accidental al deslizar hacia abajo)
    if (swipeBehavior.mount.isAvailable()) {
      swipeBehavior.mount()
      if (swipeBehavior.disableVertical.isAvailable()) {
        swipeBehavior.disableVertical()
      }
    }

    // 6. Activar confirmación de cierre en caso de sesión activa
    if (closingBehavior.mount.isAvailable()) {
      closingBehavior.mount()
    }
  } catch (sdkError) {
    console.warn('⚠️ [Fematch TMA] SDK mount warning (usando fallback directo de Telegram.WebApp):', sdkError)
  }

  // Fallback directo a window.Telegram.WebApp (compatibilidad universal en clientes móviles iOS/Android)
  const webApp: TelegramWebApp | undefined = window.Telegram?.WebApp

  if (webApp) {
    try {
      webApp.expand()
      webApp.ready()
    } catch (e) {
      console.warn('Error expanding Telegram.WebApp:', e)
    }

    // Adaptar tema a los colores de Telegram
    setupTelegramThemeListener()
  }

  isInitialized = true

  const user = webApp?.initDataUnsafe?.user || null
  const initDataRaw = getTelegramInitDataRaw()
  const colorScheme = webApp?.colorScheme || 'light'
  const isValid = hasValidTelegramInitData()

  console.log('🚀 [Fematch TMA] Mini App Inicializada:', {
    user: user ? `${user.first_name} (@${user.username || 'sin_alias'})` : 'Anónimo',
    colorScheme,
    hasValidInitData: isValid,
    isInsideTelegram: inTelegram,
    isDev: import.meta.env.DEV,
  })

  return {
    isInsideTelegram: inTelegram,
    user,
    initDataRaw,
    colorScheme,
    isValid,
  }
}

/**
 * Obtiene el initData raw actual para las peticiones de autenticación
 */
export function getTelegramInitData(): string {
  return getTelegramInitDataRaw()
}
