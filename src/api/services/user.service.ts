import { http, apiClient } from '../client'
import { authService } from './auth.service'
import type { ApiResponse, UserProfile, UserPhoto } from '../types'

// Verificar si el usuario ya completó el onboarding en almacenamiento local
const hasCompletedOnboarding = typeof window !== 'undefined'
  ? localStorage.getItem('fematch_onboarding_completed') === 'true'
  : false

// Estado en memoria simulado para persistencia en sesión de desarrollo local
let localCachedProfile: UserProfile = {
  id: 'usr_local_01',
  telegramId: 987654321,
  name: 'Elena Vargas',
  age: 26,
  bio: 'Creativa, amante del café de especialidad ☕ y la música indie 🎶. Buscando buenas conexiones en la comunidad.',
  gender: 'female',
  gender_identity: 'Lesbiana',
  pronouns: 'Ella / She',
  occupation: 'UI Designer & Fotógrafa',
  city: 'Madrid',
  relationship_intent: 'Citas y romance',
  isNewUser: !hasCompletedOnboarding,
  onboardingCompleted: hasCompletedOnboarding,
  photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  ],
  userPhotos: [
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
  interests: ['Fotografía', 'Indie Rock', 'Diseño UI', 'Café', 'Viajes', 'Arte Moderno', 'Plantas'],
  search_preferences: {
    minAge: 21,
    maxAge: 35,
    maxDistanceKm: 30,
    interestedIn: ['Mujer cis', 'Mujer trans', 'No binaria', 'Lesbiana', 'Bisexual'],
  },
  distanceKm: 3,
  verified: true,
  online: true,
  premium: true,
  likesCount: 142,
  matchesCount: 28,
}

export const userService = {
  /**
   * Obtiene el perfil del usuario autenticado sincronizando con PostgreSQL
   * POST /api/auth/telegram
   */
  getMe: async (): Promise<UserProfile> => {
    try {
      const authData = await authService.syncTelegram()
      if (authData.user) {
        localCachedProfile = {
          ...localCachedProfile,
          ...authData.user,
        }
        return localCachedProfile
      }
      return localCachedProfile
    } catch {
      return { ...localCachedProfile }
    }
  },

  /**
   * Obtiene el listado de fotos de perfil del usuario ordenadas por orderIndex
   * GET /api/user/photos
   */
  getUserPhotos: async (): Promise<UserPhoto[]> => {
    try {
      const response = await http.get<ApiResponse<{ photos: UserPhoto[] }>>('/api/user/photos')
      return response.data?.photos || []
    } catch (error) {
      console.warn('⚠️ [getUserPhotos] Fallback a fotos locales:', error)
      return localCachedProfile.userPhotos || []
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
        if (!localCachedProfile.photos.includes(photoUrl)) {
          localCachedProfile.photos.push(photoUrl)
        }
        if (!localCachedProfile.userPhotos) {
          localCachedProfile.userPhotos = []
        }
        localCachedProfile.userPhotos.push(photo)
        return photoUrl
      }

      throw new Error('Respuesta inválida del servidor al subir la foto')
    } catch (error) {
      console.warn('⚠️ [uploadPhoto] Fallback simulado para Cloudflare R2:', error)
      const localUrl = URL.createObjectURL(file)
      if (!localCachedProfile.photos.includes(localUrl)) {
        localCachedProfile.photos.push(localUrl)
      }
      if (!localCachedProfile.userPhotos) {
        localCachedProfile.userPhotos = []
      }
      localCachedProfile.userPhotos.push({
        id: `photo_${Date.now()}`,
        url: localUrl,
        orderIndex: localCachedProfile.photos.length - 1,
      })
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
      if (localCachedProfile.userPhotos) {
        localCachedProfile.userPhotos = localCachedProfile.userPhotos.filter((p) => p.id !== photoId)
      }
      return true
    } catch (error) {
      console.warn(`⚠️ [deletePhoto] Fallback al eliminar foto ${photoId}:`, error)
      if (localCachedProfile.userPhotos) {
        localCachedProfile.userPhotos = localCachedProfile.userPhotos.filter((p) => p.id !== photoId)
      }
      return true
    }
  },

  /**
   * Actualiza los datos de perfil y preferencias de búsqueda
   */
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      localCachedProfile = {
        ...localCachedProfile,
        ...data,
      }
      if (data.onboardingCompleted) {
        localCachedProfile.isNewUser = false
        if (typeof window !== 'undefined') {
          localStorage.setItem('fematch_onboarding_completed', 'true')
        }
      }
      return { ...localCachedProfile }
    } catch {
      return { ...localCachedProfile }
    }
  },

  /**
   * Completa el proceso de onboarding del usuario
   */
  completeOnboarding: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    return userService.updateProfile({
      ...data,
      isNewUser: false,
      onboardingCompleted: true,
    })
  },
}
