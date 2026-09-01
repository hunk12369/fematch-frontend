import { http, apiClient } from '../client'
import { authService } from './auth.service'
import type { ApiResponse, User, UserPhoto, OnboardingPayload } from '../types'

// Estado en memoria del usuario autenticado
let localCachedUser: User | null = null

export const userService = {
  /**
   * Obtiene el perfil del usuario autenticado
   * Primero consulta GET /api/user/me y si es necesario sincroniza con POST /api/auth/telegram
   */
  getMe: async (): Promise<{ user: User | null; isNewUser: boolean; isProfileIncomplete: boolean }> => {
    try {
      // 1. Intentar obtener perfil desde GET /api/user/me
      const response = await http.get<any>('/api/user/me')
      
      const userData = response.data?.user || response.user || (response.data?.id ? response.data : null)
      const isNew = Boolean(response.isNewUser ?? response.data?.isNewUser ?? !userData?.id)
      const isIncomplete = Boolean(response.isProfileIncomplete ?? response.data?.isProfileIncomplete ?? (!userData?.birthDate || !userData?.genderIdentity))

      if (userData && userData.id && !isNew && !isIncomplete) {
        localCachedUser = userData
        return {
          user: localCachedUser,
          isNewUser: false,
          isProfileIncomplete: false,
        }
      }

      // 2. Si no hay user en /api/user/me, sincronizar vía POST /api/auth/telegram
      const authData = await authService.syncTelegram()
      if (authData.data?.user && authData.data.user.id && !authData.isNewUser && !authData.isProfileIncomplete) {
        localCachedUser = authData.data.user
        return {
          user: localCachedUser,
          isNewUser: false,
          isProfileIncomplete: false,
        }
      }

      localCachedUser = null
      return {
        user: null,
        isNewUser: true,
        isProfileIncomplete: true,
      }
    } catch {
      // Fallback a sincronización de Telegram
      try {
        const authData = await authService.syncTelegram()
        if (authData.data?.user && authData.data.user.id && !authData.isNewUser && !authData.isProfileIncomplete) {
          localCachedUser = authData.data.user
          return {
            user: localCachedUser,
            isNewUser: false,
            isProfileIncomplete: false,
          }
        }
      } catch {}

      localCachedUser = null
      return {
        user: null,
        isNewUser: true,
        isProfileIncomplete: true,
      }
    }
  },

  /**
   * Completa el onboarding y guarda los datos de perfil en el backend
   * POST /api/user/onboarding
   * Payload: { gender_identity, birth_date, bio, city, latitude, longitude, target_genders, min_age, max_age, max_distance_km }
   */
  saveOnboarding: async (payload: OnboardingPayload): Promise<User> => {
    const response = await http.post<any>('/api/user/onboarding', payload)

    // Validar respuesta del servidor
    if (!response || response.success === false) {
      throw new Error(response?.message || response?.error || 'Error al guardar perfil en el backend')
    }

    const userData = response.data?.user || response.data || response.user
    if (!userData || !userData.id) {
      throw new Error('El backend no devolvió el registro del usuario creado con ID válido.')
    }

    localCachedUser = userData
    return userData
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
   * Solo se ejecuta si el usuario ya existe en base de datos (con user.id)
   */
  uploadPhoto: async (file: File, orderIndex?: number, userId?: string): Promise<string> => {
    const currentUserId = userId || localCachedUser?.id
    if (!currentUserId) {
      console.warn('⚠️ [uploadPhoto] Intento de subida sin usuario creado en BD. Cancelando petición.')
      throw new Error('Debes completar tu perfil antes de subir fotos al servidor.')
    }

    const formData = new FormData()
    formData.append('photo', file)
    if (typeof orderIndex === 'number') {
      formData.append('orderIndex', String(orderIndex))
    }

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
      console.warn(`⚠️ [deletePhoto] Error al eliminar foto ${photoId}:`, error)
      if (localCachedUser) {
        localCachedUser.photos = localCachedUser.photos.filter((p) => p.id !== photoId)
      }
      return false
    }
  },
}
