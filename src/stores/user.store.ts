import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userService } from '@/api/services/user.service'
import type { User, OnboardingPayload } from '@/api/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<User | null>(null)
  const isNewUser = ref<boolean>(false)
  const isProfileIncomplete = ref<boolean>(false)
  const isLoaded = ref<boolean>(false)
  const isLoading = ref<boolean>(false)

  /**
   * Obtiene la información del usuario actual sincronizando con /api/auth/telegram
   */
  async function fetchMe(): Promise<User> {
    isLoading.value = true
    try {
      const data = await userService.getMe()
      profile.value = data.user
      isNewUser.value = data.isNewUser || data.isProfileIncomplete
      isProfileIncomplete.value = data.isProfileIncomplete
      isLoaded.value = true
      return data.user
    } catch (error) {
      console.error('Error al obtener usuario actual:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Guarda los datos del onboarding en /api/user/onboarding y actualiza el estado a usuario existente
   */
  async function completeOnboarding(payload: OnboardingPayload): Promise<User> {
    isLoading.value = true
    try {
      const updated = await userService.saveOnboarding(payload)
      profile.value = updated
      isNewUser.value = false
      isProfileIncomplete.value = false
      isLoaded.value = true
      return updated
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reinicia el estado a nuevo usuario (útil para pruebas y desarrollo)
   */
  function resetOnboardingForTesting() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fematch_onboarding_completed')
    }
    isNewUser.value = true
    isProfileIncomplete.value = true
  }

  return {
    profile,
    isNewUser,
    isProfileIncomplete,
    isLoaded,
    isLoading,
    fetchMe,
    completeOnboarding,
    resetOnboardingForTesting,
  }
})
