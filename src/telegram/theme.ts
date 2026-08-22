import type { TelegramThemeParams } from './types'

/**
 * Convierte nombres de claves camelCase o snake_case a kebab-case para CSS vars
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase().replace(/_/g, '-')
}

/**
 * Calcula si un color hexadecimal es oscuro
 */
function isHexDark(hexColor?: string): boolean {
  if (!hexColor || !hexColor.startsWith('#')) return false
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0
  // Fórmula de luminancia percibida estándar HSP
  const luminance = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))
  return luminance < 128
}

/**
 * Sincroniza los themeParams de Telegram con las variables CSS del DOM y clases de Tailwind
 */
export function applyTelegramTheme(themeParams?: TelegramThemeParams, colorScheme?: 'light' | 'dark'): void {
  const root = document.documentElement
  const webApp = window.Telegram?.WebApp

  const params: TelegramThemeParams = themeParams || webApp?.themeParams || {}
  const scheme = colorScheme || webApp?.colorScheme

  // Mapear cada propiedad de themeParams a CSS variables (--tg-theme-*)
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      const cssVarName = `--tg-theme-${toKebabCase(key)}`
      root.style.setProperty(cssVarName, value)
    }
  })

  // Determinar si activar modo oscuro
  const isDark = scheme === 'dark' || (params.bg_color ? isHexDark(params.bg_color) : false)

  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Actualizar meta theme-color para la barra del navegador
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    const activeBg = params.header_bg_color || params.bg_color || (isDark ? '#121218' : '#fdf2f8')
    metaThemeColor.setAttribute('content', activeBg)
  }
}

/**
 * Escucha los cambios de tema que el usuario realice en su cliente de Telegram
 */
export function setupTelegramThemeListener(): void {
  const webApp = window.Telegram?.WebApp
  if (!webApp) return

  // Aplicar tema inicial
  applyTelegramTheme(webApp.themeParams, webApp.colorScheme)

  // Escuchar evento nativo themeChanged
  webApp.onEvent('themeChanged', () => {
    console.log('🎨 [Fematch TMA] Telegram Theme Changed:', webApp.themeParams)
    applyTelegramTheme(webApp.themeParams, webApp.colorScheme)
  })
}
