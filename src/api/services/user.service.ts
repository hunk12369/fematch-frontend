import { http, apiClient } from '../client'
import { authService } from './auth.service'
import type { ApiResponse, User, UserPhoto, OnboardingPayload } from '../types'

// Estado en memoria simulado para desarrollo
let localCachedUser: User | null = null

export const userService = {
  /**
   * Obtiene el perfil del usuario autenticado
   * Primero consulta GET /api/user/me y si es necesario sincroniza con POST /api/auth/telegram
   */
  getMe: async (): Promise<{ user: User | null; isNewUser: boolean; isProfileIncomplete: boolean }> => {
    try {
      // 1. Intentar obtener perfil desde GET /api/user/me
      const response = await http.get<ApiResponse<{ user: User; isNewUser?: boolean; isProfileIncomplete?: boolean }> & { user?: User; isNewUser?: boolean; isProfileIncomplete?: boolean }>('/api/user/me')
      
      const userData = response.data?.user || response.user || (response.data as unknown as User)
      if (userData && userData.id) {
        localCachedUser = userData
        const isNew = Boolean(response.data?.isNewUser ?? response.isNewUser ?? false)
        const isIncomplete = Boolean(response.data?.isProfileIncomplete ?? response.isProfileIncomplete ?? (!userData.birthDate || !userData.genderIdentity))
        return {
          user: localCachedUser,
          isNewUser: isNew || isIncomplete,
          isProfileIncomplete: isIncomplete,
        }
      }

      // 2. Si no hay user en /api/user/me, sincronizar vía POST /api/auth/telegram
      const authData = await authService.syncTelegram()
      if (authData.data?.user) {
        localCachedUser = authData.data.user
        return {
          user: localCachedUser,
          isNewUser: Boolean(authData.isNewUser || authData.isProfileIncomplete),
          isProfileIncomplete: Boolean(authData.isProfileIncomplete),
        }
      }

      return {
        user: localCachedUser,
        isNewUser: true,
        isProfileIncomplete: true,
      }
    } catch {
      // Fallback a sincronización de Telegram
      try {
        const authData = await authService.syncTelegram()
        if (authData.data?.user) {
          localCachedUser = authData.data.user
          return {
            user: localCachedUser,
            isNewUser: Boolean(authData.isNewUser || authData.isProfileIncomplete),
            isProfileIncomplete: Boolean(authData.isProfileIncomplete),
          }
        }
      } catch {}

      return {
        user: localCachedUser,
        isNewUser: true,
        isProfileIncomplete: true,
      }
    }
  },

  /**
   * Completa el onboarding y guarda los datos de perfil en el backend
   * POST /api/user/onboarding
   * Payload: { gender_identity, birth_date, bio, city, target_genders, min_age, max_age, max_distance_km }
   */
  saveOnboarding: async (payload: OnboardingPayload): Promise<User> => {
    try {
      const response = await http.post<ApiResponse<User> & { user?: User }>('/api/user/onboarding', payload)
      const user = response.data || response.user || (localCachedUser as User)
      localCachedUser = user
      if (typeof window !== 'undefined') {
        localStorage.setItem('fematch_onboarding_completed', 'true')
      }
      return user
    } catch (error) {
      console.warn('⚠️ [saveOnboarding] Error al guardar onboarding:', error)
      let calculatedAge = 22
      if (payload.birth_date) {
        const birth = new Date(payload.birth_date)
        const today = new Date()
        calculatedAge = today.getFullYear() - birth.getFullYear()
      }

      const fallbackUser: User = {
        id: localCachedUser?.id || `usr_${Date.now()}`,
        telegramId: localCachedUser?.telegramId || '987654321',
        firstName: localCachedUser?.firstName || 'Usuario',
        username: localCachedUser?.username || '',
        birthDate: payload.birth_date,
        age: calculatedAge,
        genderIdentity: payload.gender_identity,
        bio: payload.bio || '',
        city: payload.city || '',
        isVip: localCachedUser?.isVip || false,
        photos: localCachedUser?.photos || [],
        preference: {
          targetGenders: payload.target_genders,
          minAge: payload.min_age,
          maxAge: payload.max_age,
          maxDistanceKm: payload.max_distance_km,
        },
      }
      localCachedUser = fallbackUser
      if (typeof window !== 'undefined') {
        localStorage.setItem('fematch_onboarding_completed', 'true')
      }
      return fallbackUser
    }
  },

  /**
   * Actualiza el perfil del usuario utilizando el endpoint de configuración
   */
  updateProfile: async (payload: OnboardingPayload): Promise<User> => {
    return userService.saveOnboarding(payload)
  },

  /**
   * Obtiene el listado de fotos de perfil del usuario ordenadas por orderIndex
   * GET /api/user/photos
   */
  getUserPhotos: async (): Promise<UserPhoto[]> => {
    try {
      const response = await http.get<ApiResponse<{ photos: UserPhoto[] }> & { photos?: UserPhoto[] }>('/api/user/photos')
      const photos = response.data?.photos || response.photos || []
      if (photos.length > 0 && localCachedUser) {
        localCachedUser.photos = photos
      }
      return photos
    } catch (error) {
      console.warn('⚠️ [getUserPhotos] Error al obtener fotos:', error)
      return localCachedUser?.photos || []
    }
  },

  /**
   * Sube una foto a Cloudflare R2 y la asocia en la base de datos
   * POST /api/user/photos (Multipart, máx 5MB)
   */
  uploadPhoto: async (file: File, orderIndex?: number): Promise<string> => {
    const formData = new FormData()
    formData.append('photo', file)
    if (typeof orderIndex === 'number') {
      formData.append('orderIndex', String(orderIndex))
    }

    try {
      const response = await apiClient.post<ApiResponse<{ photo: UserPhoto }>>(
        '/api/user/photos',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      const photo = response.data?.data?.photo
      const photoUrl = photo?.url

      if (photoUrl) {
        if (localCachedUser && !localCachedUser.photos.some((p) => p.url === photoUrl)) {
          localCachedUser.photos.push(photo)
        }
        return photoUrl
      }

      throw new Error('Respuesta inválida del servidor al subir la foto')
    } catch (error) {
      console.warn('⚠️ [uploadPhoto] Fallback para imagen local:', error)
      const localUrl = URL.createObjectURL(file)
      if (localCachedUser) {
        const newPhoto: UserPhoto = {
          id: `photo_${Date.now()}`,
          url: localUrl,
          orderIndex: localCachedUser.photos.length,
        }
        localCachedUser.photos.push(newPhoto)
      }
      return localUrl
    }
  },

  /**
   * Elimina la foto de Cloudflare R2 y del registro en la base de datos
   * DELETE /api/user/photos/:photoId
   */
  deletePhoto: async (photoId: string): Promise<boolean> => {
    try {
      await http.delete(`/api/user/photos/${photoId}`)
      if (localCachedUser) {
        localCachedUser.photos = localCachedUser.photos.filter((p) => p.id !== photoId)
      }
      return true
    } catch (error) {
      console.warn(`⚠️ [deletePhoto] Fallback al eliminar foto ${photoId}:`, error)
      if (localCachedUser) {
        localCachedUser.photos = localCachedUser.photos.filter((p) => p.id !== photoId)
      }
      return true
    }
  },
}
