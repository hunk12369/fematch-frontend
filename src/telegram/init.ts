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
 * Comprueba si la aplicación se está ejecutando dentro de un entorno Telegram real
 */
export function isInsideTelegramApp(): boolean {
  if (typeof window === 'undefined') return false

  const webApp = window.Telegram?.WebApp
  if (
    webApp &&
    typeof webApp.initData === 'string' &&
    webApp.initData.length > 0 &&
    !webApp.initData.includes('mock_fematch')
  ) {
    return true
  }

  // Comprobar si existen parámetros de lanzamiento nativos de Telegram en hash o search
  const hash = window.location.hash || ''
  const search = window.location.search || ''
  if (hash.includes('tgWebAppData') || search.includes('tgWebAppData')) {
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
    return {
      isInsideTelegram: isInsideTelegramApp(),
      user: webApp?.initDataUnsafe?.user || null,
      initDataRaw: webApp?.initData || '',
      colorScheme: webApp?.colorScheme || 'light',
    }
  }

  const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TMA_MOCK === 'true'
  const inTelegram = isInsideTelegramApp()

  // Si estamos en entorno local o fuera de Telegram y el mock está activo, inyectamos el mock
  if (!inTelegram && isDev) {
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
  const initDataRaw = webApp?.initData || ''
  const colorScheme = webApp?.colorScheme || 'light'

  console.log('🚀 [Fematch TMA] Mini App Inicializada con éxito:', {
    user: user ? `${user.first_name} (@${user.username || 'sin_alias'})` : 'Anónimo / Dev',
    colorScheme,
    hasInitData: Boolean(initDataRaw),
    platform: webApp?.platform || 'browser',
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
  if (typeof window === 'undefined') return ''
  return window.Telegram?.WebApp?.initData || ''
}
