import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userService } from '@/api/services/user.service'
import type { UserProfile } from '@/api/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const isNewUser = ref<boolean>(false)
  const isLoaded = ref<boolean>(false)
  const isLoading = ref<boolean>(false)

  /**
   * Obtiene la información del usuario actual desde /api/user/me
   */
  async function fetchMe(): Promise<UserProfile> {
    isLoading.value = true
    try {
      const data = await userService.getMe()
      profile.value = data
      isNewUser.value = Boolean(data.isNewUser)
      isLoaded.value = true
      return data
    } catch (error) {
      console.error('Error al obtener usuario actual:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Guarda los datos del onboarding y actualiza el estado a usuario existente
   */
  async function completeOnboarding(data: Partial<UserProfile>): Promise<UserProfile> {
    isLoading.value = true
    try {
      const updated = await userService.completeOnboarding(data)
      profile.value = updated
      isNewUser.value = false
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
    if (profile.value) {
      profile.value.isNewUser = true
      profile.value.onboardingCompleted = false
    }
  }

  return {
    profile,
    isNewUser,
    isLoaded,
    isLoading,
    fetchMe,
    completeOnboarding,
    resetOnboardingForTesting,
  }
})
