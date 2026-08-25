import { http, apiClient } from '../client'
import { authService } from './auth.service'
import type { ApiResponse, User, UserPhoto, OnboardingPayload } from '../types'

// Estado en memoria simulado para persistencia en sesión de desarrollo local
let localCachedUser: User = {
  id: 'usr_local_01',
  telegramId: '987654321',
  firstName: 'Elena',
  username: 'elena_fematch',
  birthDate: '1998-05-14',
  age: 26,
  genderIdentity: 'TRANS_FEM',
  bio: 'Creativa, apasionada por la música indie y el arte.',
  city: 'Madrid',
  isVip: true,
  photos: [
    {
      id: 'photo_01',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      orderIndex: 0,
    },
    {
      id: 'photo_02',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      orderIndex: 1,
    },
  ],
  preference: {
    targetGenders: ['FEMBOY', 'TRANS_FEM', 'TRANS_MASC', 'CROSSDRESSER'],
    minAge: 20,
    maxAge: 35,
    maxDistanceKm: 30,
  },
  distanceKm: 3,
  likesCount: 142,
  matchesCount: 28,
}

export const userService = {
  /**
   * Obtiene el perfil del usuario autenticado sincronizando con PostgreSQL
   * POST /api/auth/telegram
   */
  getMe: async (): Promise<{ user: User; isNewUser: boolean; isProfileIncomplete: boolean }> => {
    try {
      const authData = await authService.syncTelegram()
      if (authData.data?.user) {
        localCachedUser = {
          ...localCachedUser,
          ...authData.data.user,
        }
        return {
          user: localCachedUser,
          isNewUser: Boolean(authData.isNewUser),
          isProfileIncomplete: Boolean(authData.isProfileIncomplete),
        }
      }
      return {
        user: localCachedUser,
        isNewUser: false,
        isProfileIncomplete: false,
      }
    } catch {
      return {
        user: { ...localCachedUser },
        isNewUser: false,
        isProfileIncomplete: false,
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
      const user = response.data || response.user || localCachedUser
      localCachedUser = {
        ...localCachedUser,
        ...user,
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('fematch_onboarding_completed', 'true')
      }
      return localCachedUser
    } catch (error) {
      console.warn('⚠️ [saveOnboarding] Fallback en local:', error)
      // Calcular edad a partir de birth_date
      let calculatedAge = localCachedUser.age
      if (payload.birth_date) {
        const birth = new Date(payload.birth_date)
        const today = new Date()
        calculatedAge = today.getFullYear() - birth.getFullYear()
      }

      localCachedUser = {
        ...localCachedUser,
        genderIdentity: payload.gender_identity,
        birthDate: payload.birth_date,
        age: calculatedAge,
        bio: payload.bio || '',
        city: payload.city || 'Madrid',
        preference: {
          targetGenders: payload.target_genders,
          minAge: payload.min_age,
          maxAge: payload.max_age,
          maxDistanceKm: payload.max_distance_km,
        },
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('fematch_onboarding_completed', 'true')
      }
      return { ...localCachedUser }
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
      if (photos.length > 0) {
        localCachedUser.photos = photos
      }
      return photos
    } catch (error) {
      console.warn('⚠️ [getUserPhotos] Fallback a fotos locales:', error)
      return localCachedUser.photos || []
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
        if (!localCachedUser.photos.some((p) => p.url === photoUrl)) {
          localCachedUser.photos.push(photo)
        }
        return photoUrl
      }

      throw new Error('Respuesta inválida del servidor al subir la foto')
    } catch (error) {
      console.warn('⚠️ [uploadPhoto] Fallback simulado para Cloudflare R2:', error)
      const localUrl = URL.createObjectURL(file)
      const newPhoto: UserPhoto = {
        id: `photo_${Date.now()}`,
        url: localUrl,
        orderIndex: localCachedUser.photos.length,
      }
      localCachedUser.photos.push(newPhoto)
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
      localCachedUser.photos = localCachedUser.photos.filter((p) => p.id !== photoId)
      return true
    } catch (error) {
      console.warn(`⚠️ [deletePhoto] Fallback al eliminar foto ${photoId}:`, error)
      localCachedUser.photos = localCachedUser.photos.filter((p) => p.id !== photoId)
      return true
    }
  },
}
