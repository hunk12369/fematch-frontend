import { http } from '../client'
import type {
  ApiResponse,
  MatchCandidate,
  FeedResponse,
  SwipeType,
  SwipePayload,
  SwipeResponse,
  ChatMessage,
} from '../types'

export const matchService = {
  /**
   * Obtiene el feed de candidatos desde el backend real
   * GET /api/feed?page=1&limit=20
   */
  getFeed: async (page = 1, limit = 20): Promise<MatchCandidate[]> => {
    try {
      const response = await http.get<ApiResponse<FeedResponse> & FeedResponse>('/api/feed', {
        page,
        limit,
      })

      // Extraer lista de perfiles del backend
      if (response?.data && Array.isArray(response.data.profiles)) {
        return response.data.profiles
      }
      if (Array.isArray(response?.profiles)) {
        return response.profiles
      }
      if (Array.isArray(response?.data)) {
        return response.data as unknown as MatchCandidate[]
      }
      if (Array.isArray(response)) {
        return response as unknown as MatchCandidate[]
      }

      return []
    } catch (error) {
      console.warn('⚠️ [matchService.getFeed] Sin perfiles o error en /api/feed:', error)
      return []
    }
  },

  /**
   * Alias de compatibilidad para getFeed
   */
  getDiscoveryFeed: async (page = 1, limit = 20): Promise<MatchCandidate[]> => {
    return matchService.getFeed(page, limit)
  },

  /**
   * Registra swipe (LIKE, DISLIKE, SUPERLIKE) y crea Match si es mutuo
   * POST /api/swipe
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
      chatId: result.matchId || (result.match ? `chat_${candidateId}` : undefined),
      matchedUser: result.matchedUser,
    }
  },

  /**
   * Obtiene la lista de matches activos del backend
   * GET /api/matches
   */
  getMatches: async (): Promise<MatchCandidate[]> => {
    try {
      const response = await http.get<ApiResponse<MatchCandidate[]> & MatchCandidate[]>('/api/matches')
      if (Array.isArray(response?.data)) {
        return response.data
      }
      if (Array.isArray(response)) {
        return response
      }
      return []
    } catch (error) {
      console.warn('⚠️ [matchService.getMatches] Error al obtener matches:', error)
      return []
    }
  },

  /**
   * Obtiene los mensajes de un chat del backend
   * GET /api/chats/:chatId/messages
   */
  getMessages: async (chatId: string): Promise<ChatMessage[]> => {
    try {
      const response = await http.get<ApiResponse<ChatMessage[]> & ChatMessage[]>(`/api/chats/${chatId}/messages`)
      if (Array.isArray(response?.data)) {
        return response.data
      }
      if (Array.isArray(response)) {
        return response
      }
      return []
    } catch (error) {
      console.warn(`⚠️ [matchService.getMessages] Error al obtener mensajes de ${chatId}:`, error)
      return []
    }
  },
}
