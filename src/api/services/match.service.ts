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
      const response = await http.post<any>('/api/swipe', payload)

      const isMatch = Boolean(response?.match || response?.data?.match)
      const matchId = response?.matchId || response?.data?.matchId
      const rawUser = response?.matchedUser || response?.data?.matchedUser

      let matchedUser: User | undefined = undefined
      if (rawUser) {
        matchedUser = {
          id: rawUser.id || targetUserId,
          telegramId: String(rawUser.telegramId || ''),
          firstName: rawUser.firstName || rawUser.name || 'Match',
          username: rawUser.username || '',
          birthDate: rawUser.birthDate || '',
          age: Number(rawUser.age) || 24,
          genderIdentity: rawUser.genderIdentity || rawUser.gender_identity || 'OTHER',
          bio: rawUser.bio || '',
          city: rawUser.city || '',
          isVip: Boolean(rawUser.isVip),
          photos: Array.isArray(rawUser.photos) && rawUser.photos.length > 0
            ? rawUser.photos
            : rawUser.photoUrl
            ? [{ id: 'photo_0', url: rawUser.photoUrl, orderIndex: 0 }]
            : [],
        }
      }

      return {
        success: true,
        match: isMatch,
        matchId,
        matchedUser,
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
      isMatch: Boolean(result.match),
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
      const response = await http.get<any>('/api/matches')
      let rawMatchesList: any[] = []

      if (response?.data?.matches && Array.isArray(response.data.matches)) {
        rawMatchesList = response.data.matches
      } else if (response?.matches && Array.isArray(response.matches)) {
        rawMatchesList = response.matches
      } else if (Array.isArray(response?.data)) {
        rawMatchesList = response.data
      } else if (Array.isArray(response)) {
        rawMatchesList = response
      }

      return rawMatchesList.map((item: any) => {
        const u = item.user || item
        const matchId = item.matchId || u.id

        const photosList = Array.isArray(u.photos) && u.photos.length > 0
          ? u.photos.map((ph: any, idx: number) =>
              typeof ph === 'string'
                ? { id: `photo_${idx}`, url: ph, orderIndex: idx }
                : { id: ph.id || `photo_${idx}`, url: ph.url || '', orderIndex: ph.orderIndex ?? idx }
            )
          : u.photoUrl
          ? [{ id: 'photo_0', url: u.photoUrl, orderIndex: 0 }]
          : []

        return {
          id: u.id || matchId,
          matchId,
          telegramId: String(u.telegramId || ''),
          firstName: u.firstName || u.name || 'Match',
          username: u.username || '',
          birthDate: u.birthDate || '',
          age: Number(u.age) || 24,
          genderIdentity: u.genderIdentity || u.gender_identity || 'OTHER',
          bio: u.bio || '',
          city: u.city || '',
          isVip: Boolean(u.isVip),
          photos: photosList,
          online: true,
        }
      })
    } catch (error) {
      console.warn('⚠️ [matchService.getMatches] Error al obtener matches:', error)
      return []
    }
  },
}
