import {
  init as initSDK,
  viewport,
  miniApp,
  themeParams,
  swipeBehavior,
  closingBehavior,
} from '@telegram-apps/sdk'
import { setupTelegramMock } from './mock'
import { setupTelegramThemeListener } from './theme'
import type { TelegramWebApp, TelegramUser } from './types'

let isInitialized = false

export interface TMAInitResult {
  isInsideTelegram: boolean
  user: TelegramUser | null
  initDataRaw: string
  colorScheme: 'light' | 'dark'
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
 * Extrae el initData de Telegram desde:
 * 1. window.Telegram.WebApp.initData
 * 2. Hash de URL (#tgWebAppData=... o #tgWebAppInitData=...)
 * 3. Search query (?tgWebAppData=... o ?tgWebAppInitData=...)
 * 
 * Si no estamos en localhost, desactiva cualquier dato mock estático.
 */
export function extractTelegramInitData(): string {
  if (typeof window === 'undefined') return ''

  // 1. Objeto nativo Telegram WebApp
  const webAppInitData = window.Telegram?.WebApp?.initData
  if (webAppInitData && typeof webAppInitData === 'string' && webAppInitData.trim().length > 0) {
    if (!webAppInitData.includes('mock_fematch') || isLocalhost()) {
      return webAppInitData.trim()
    }
  }

  // 2. Extraer de Hash de URL (#tgWebAppData=... o #tgWebAppInitData=...)
  const hash = window.location.hash || ''
  if (hash) {
    const hashClean = hash.startsWith('#') ? hash.slice(1) : hash
    const params = new URLSearchParams(hashClean)
    const tgWebAppData = params.get('tgWebAppData') || params.get('tgWebAppInitData')
    if (tgWebAppData && tgWebAppData.trim().length > 0) {
      return decodeURIComponent(tgWebAppData.trim())
    }
  }

  // 3. Extraer de Query Parameters (?tgWebAppData=... o ?tgWebAppInitData=...)
  const search = window.location.search || ''
  if (search) {
    const searchClean = search.startsWith('?') ? search.slice(1) : search
    const params = new URLSearchParams(searchClean)
    const tgWebAppData = params.get('tgWebAppData') || params.get('tgWebAppInitData')
    if (tgWebAppData && tgWebAppData.trim().length > 0) {
      return decodeURIComponent(tgWebAppData.trim())
    }
  }

  // 4. Solo usar mock estático si estamos explícitamente en localhost y con la variable activada
  if (isLocalhost() && import.meta.env.VITE_ENABLE_DEV_TMA_MOCK === 'true') {
    return window.Telegram?.WebApp?.initData || ''
  }

  return ''
}

/**
 * Comprueba si la aplicación se está ejecutando dentro de un entorno Telegram real
 */
export function isInsideTelegramApp(): boolean {
  if (typeof window === 'undefined') return false

  const rawInitData = extractTelegramInitData()
  if (rawInitData && !rawInitData.includes('mock_fematch')) {
    return true
  }

  const webApp = window.Telegram?.WebApp
  if (
    webApp &&
    typeof webApp.initData === 'string' &&
    webApp.initData.length > 0 &&
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
    const initDataRaw = extractTelegramInitData()
    return {
      isInsideTelegram: isInsideTelegramApp(),
      user: webApp?.initDataUnsafe?.user || null,
      initDataRaw,
      colorScheme: webApp?.colorScheme || 'light',
    }
  }

  const inTelegram = isInsideTelegramApp()
  const allowMock = isLocalhost() && import.meta.env.VITE_ENABLE_DEV_TMA_MOCK === 'true'

  // Solo inyectar mock si NO estamos dentro de Telegram y estamos en localhost
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
    // Expandir app a pantalla completa
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
  const initDataRaw = extractTelegramInitData()
  const colorScheme = webApp?.colorScheme || 'light'

  console.log('🚀 [Fematch TMA] Mini App Inicializada:', {
    user: user ? `${user.first_name} (@${user.username || 'sin_alias'})` : 'Anónimo',
    colorScheme,
    hasInitData: Boolean(initDataRaw),
    isInsideTelegram: inTelegram,
    isLocalhost: isLocalhost(),
  })

  return {
    isInsideTelegram: inTelegram,
    user,
    initDataRaw,
    colorScheme,
  }
}

/**
 * Obtiene el initData raw actual para las peticiones de autenticación
 */
export function getTelegramInitData(): string {
  return extractTelegramInitData()
}
