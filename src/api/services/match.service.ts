import { http } from '../client'
import type {
  ApiResponse,
  User,
  FeedResponse,
  SwipeType,
  SwipePayload,
  SwipeResponse,
} from '../types'

export const matchService = {
  /**
   * Obtiene el feed de candidatos desde el backend real
   * GET /api/feed?page=1&limit=20
   * Mapea cada perfil leyendo firstName, genderIdentity y photos [{ url, orderIndex }]
   */
  getFeed: async (page = 1, limit = 20): Promise<User[]> => {
    try {
      const response = await http.get<ApiResponse<FeedResponse> & FeedResponse & { profiles?: User[] }>('/api/feed', {
        page,
        limit,
      })

      let rawProfiles: any[] = []

      if (response?.data && Array.isArray(response.data.profiles)) {
        rawProfiles = response.data.profiles
      } else if (Array.isArray(response?.profiles)) {
        rawProfiles = response.profiles
      } else if (Array.isArray(response?.data)) {
        rawProfiles = response.data
      } else if (Array.isArray(response)) {
        rawProfiles = response
      }

      // Normalizar objetos de usuario asegurando firstName, genderIdentity y photos
      const normalizedProfiles: User[] = rawProfiles.map((p) => {
        const photosList = Array.isArray(p.photos)
          ? p.photos.map((ph: any, idx: number) => {
              if (typeof ph === 'string') {
                return { id: `photo_${idx}`, url: ph, orderIndex: idx }
              }
              return {
                id: ph.id || `photo_${idx}`,
                url: ph.url || '',
                orderIndex: ph.orderIndex ?? idx,
              }
            })
          : []

        return {
          id: p.id,
          telegramId: String(p.telegramId || ''),
          firstName: p.firstName || p.name || 'Usuario',
          username: p.username || '',
          birthDate: p.birthDate || '',
          age: Number(p.age) || 20,
          genderIdentity: p.genderIdentity || p.gender_identity || 'OTHER',
          bio: p.bio || '',
          city: p.city || '',
          isVip: Boolean(p.isVip),
          photos: photosList,
          preference: p.preference || undefined,
          distanceKm: p.distanceKm,
        }
      })

      return normalizedProfiles
    } catch (error) {
      console.warn('⚠️ [matchService.getFeed] Error al cargar feed del backend:', error)
      return []
    }
  },

  /**
   * Alias de compatibilidad para getFeed
   */
  getDiscoveryFeed: async (page = 1, limit = 20): Promise<User[]> => {
    return matchService.getFeed(page, limit)
  },

  /**
   * Registra swipe (LIKE, DISLIKE, SUPERLIKE) y crea Match si es mutuo
   * POST /api/swipe
   * Body: { targetUserId, type: "LIKE" | "DISLIKE" | "SUPERLIKE" }
   */
  swipe: async (targetUserId: string, type: SwipeType): Promise<SwipeResponse> => {
    try {
      const payload: SwipePayload = { targetUserId, type }
      const response = await http.post<ApiResponse<SwipeResponse> & SwipeResponse>('/api/swipe', payload)

      if (typeof response.match === 'boolean') {
        return response
      }
      if (response.data && typeof response.data.match === 'boolean') {
        return response.data
      }
      return {
        success: true,
        match: false,
      }
    } catch (error) {
      console.warn('⚠️ [matchService.swipe] Error al registrar swipe:', error)
      return {
        success: false,
        match: false,
      }
    }
  },

  /**
   * Wrapper interactivo desde la baraja de SwipeDeck ('like' | 'pass' | 'superlike')
   */
  interact: async (candidateId: string, action: 'like' | 'pass' | 'superlike') => {
    const typeMap: Record<'like' | 'pass' | 'superlike', SwipeType> = {
      like: 'LIKE',
      pass: 'DISLIKE',
      superlike: 'SUPERLIKE',
    }
    const result = await matchService.swipe(candidateId, typeMap[action])
    return {
      isMatch: result.match,
      matchId: result.matchId || (result.match ? `match_${candidateId}` : undefined),
      matchedUser: result.matchedUser,
    }
  },

  /**
   * Obtiene la lista de matches activos del backend
   * GET /api/matches
   */
  getMatches: async (): Promise<User[]> => {
    try {
      const response = await http.get<ApiResponse<User[]> & User[]>('/api/matches')
      const rawMatches = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : []

      return rawMatches.map((m: any) => ({
        id: m.id,
        telegramId: String(m.telegramId || ''),
        firstName: m.firstName || m.name || 'Match',
        username: m.username || '',
        birthDate: m.birthDate || '',
        age: Number(m.age) || 22,
        genderIdentity: m.genderIdentity || m.gender_identity || 'OTHER',
        bio: m.bio || '',
        city: m.city || '',
        isVip: Boolean(m.isVip),
        photos: Array.isArray(m.photos)
          ? m.photos.map((ph: any, idx: number) =>
              typeof ph === 'string' ? { id: `photo_${idx}`, url: ph, orderIndex: idx } : ph
            )
          : [],
      }))
    } catch (error) {
      console.warn('⚠️ [matchService.getMatches] Error al obtener matches:', error)
      return []
    }
  },
}
