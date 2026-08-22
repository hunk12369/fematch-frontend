import { hapticFeedback } from '@telegram-apps/sdk'

export function useHaptics() {
  /**
   * Genera una vibración táctil de impacto
   */
  const impact = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    try {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred(style)
        return
      }
    } catch {
      // fallback
    }

    // Fallback nativo directo de window.Telegram.WebApp
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style)
    }
  }

  /**
   * Genera una vibración táctil para notificaciones de estado
   */
  const notification = (type: 'error' | 'success' | 'warning') => {
    try {
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred(type)
        return
      }
    } catch {
      // fallback
    }

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred(type)
    }
  }

  /**
   * Genera una respuesta táctil muy sutil al cambiar una selección en la UI
   */
  const selection = () => {
    try {
      if (hapticFeedback.selectionChanged.isAvailable()) {
        hapticFeedback.selectionChanged()
        return
      }
    } catch {
      // fallback
    }

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged()
    }
  }

  return {
    impact,
    notification,
    selection,
  }
}
