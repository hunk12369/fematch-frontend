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
   * Obtiene la información del usuario actual sincronizando con /api/auth/telegram y /api/user/me
   */
  async function fetchMe(): Promise<User | null> {
    isLoading.value = true
    try {
      const data = await userService.getMe()
      if (data && data.user && data.user.id && !data.isNewUser && !data.isProfileIncomplete) {
        profile.value = data.user
        isNewUser.value = false
        isProfileIncomplete.value = false
      } else {
        profile.value = data?.user || null
        isNewUser.value = true
        isProfileIncomplete.value = Boolean(data?.isProfileIncomplete)
      }
      isLoaded.value = true
      return profile.value
    } catch (error) {
      console.warn('⚠️ [useUserStore.fetchMe] Usuario no encontrado o no autenticado en backend:', error)
      profile.value = null
      isNewUser.value = true
      isProfileIncomplete.value = true
      isLoaded.value = true
      return null
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
      if (!updated || !updated.id) {
        throw new Error('No se pudo verificar el ID del usuario en la base de datos.')
      }
      profile.value = updated
      isNewUser.value = false
      isProfileIncomplete.value = false
      isLoaded.value = true
      return updated
    } catch (error) {
      profile.value = null
      isNewUser.value = true
      isProfileIncomplete.value = true
      throw error
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
    profile.value = null
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
