import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TelegramUser, TelegramThemeParams } from '@/telegram/types'
import { initializeTelegramApp, getTelegramInitDataRaw } from '@/telegram/init'
import { applyTelegramTheme } from '@/telegram/theme'

export const useTelegramStore = defineStore('telegram', () => {
  const isLoaded = ref(false)
  const isInsideTelegram = ref(false)
  const user = ref<TelegramUser | null>(null)
  const initData = ref<string>('')
  const colorScheme = ref<'light' | 'dark'>('light')
  const themeParams = ref<TelegramThemeParams>({})

  const isDarkMode = computed(() => colorScheme.value === 'dark')
  const hasValidInitData = computed(() => Boolean(initData.value && initData.value.includes('hash=')))
  const userFullName = computed(() => {
    if (!user.value) return 'Usuario Fematch'
    return `${user.value.first_name} ${user.value.last_name || ''}`.trim()
  })

  /**
   * Inicializa el estado reactivo de Telegram
   */
  async function initialize() {
    if (isLoaded.value) return

    const result = await initializeTelegramApp()
    isInsideTelegram.value = result.isInsideTelegram
    user.value = result.user
    initData.value = result.initDataRaw || getTelegramInitDataRaw()
    colorScheme.value = result.colorScheme

    const webApp = window.Telegram?.WebApp
    if (webApp?.themeParams) {
      themeParams.value = webApp.themeParams
    }

    isLoaded.value = true
  }

  /**
   * Alterna manualmente el esquema de color (útil para pruebas y modo manual)
   */
  function toggleTheme() {
    const nextScheme = colorScheme.value === 'light' ? 'dark' : 'light'
    colorScheme.value = nextScheme
    applyTelegramTheme(themeParams.value, nextScheme)
  }

  return {
    isLoaded,
    isInsideTelegram,
    user,
    initData,
    colorScheme,
    themeParams,
    isDarkMode,
    hasValidInitData,
    userFullName,
    initialize,
    toggleTheme,
  }
})
