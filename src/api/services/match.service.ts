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
   * Obtiene el feed de candidatos filtrado por preferencias (género, edad), paginado (20 perfiles)
   * GET /api/feed?page=1&limit=20
   */
  getDiscoveryFeed: async (page = 1, limit = 20): Promise<MatchCandidate[]> => {
    try {
      const response = await http.get<ApiResponse<FeedResponse>>('/api/feed', {
        page,
        limit,
      })
      const profiles = response.data?.profiles || []
      if (profiles.length > 0) return profiles
      throw new Error('Feed vacío')
    } catch {
      // Mock data de respaldo para demo de Fematch
      return [
        {
          id: 'cand_01',
          telegramId: 101,
          name: 'Camila',
          age: 24,
          bio: 'Arquitecta & aficionada a las plantas 🌿. Me encanta recorrer galerías de arte y probar repostería.',
          gender: 'female',
          gender_identity: 'Lesbiana',
          photos: [
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
          ],
          interests: ['Arquitectura', 'Arte Moderno', 'Plantas', 'Yoga'],
          distanceKm: 2,
          compatibilityScore: 94,
          verified: true,
          online: true,
          premium: false,
        },
        {
          id: 'cand_02',
          telegramId: 102,
          name: 'Valeria',
          age: 27,
          bio: 'Product Designer & Melómana. Fan de los atardeceres en la playa 🌅 y los vinilos.',
          gender: 'female',
          gender_identity: 'Bisexual',
          photos: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
          ],
          interests: ['Diseño UI', 'Música', 'Playa', 'Tatuajes', 'Mascotas'],
          distanceKm: 4,
          compatibilityScore: 89,
          verified: true,
          online: false,
          premium: true,
        },
        {
          id: 'cand_03',
          telegramId: 103,
          name: 'Sofía',
          age: 25,
          bio: 'Escritora & ciclista urbana. Buscando a alguien con quien compartir charlas nocturnas y libros 📖✨.',
          gender: 'female',
          gender_identity: 'Queer',
          photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
          ],
          interests: ['Literatura', 'Ciclismo', 'Cine', 'Café'],
          distanceKm: 5,
          compatibilityScore: 98,
          verified: true,
          online: true,
          premium: false,
        },
      ]
    }
  },

  /**
   * Registra swipe (LIKE, DISLIKE, SUPERLIKE) y crea Match si es mutuo
   * POST /api/swipe
   */
  swipe: async (targetUserId: string, type: SwipeType): Promise<SwipeResponse> => {
    try {
      const payload: SwipePayload = { targetUserId, type }
      const response = await http.post<ApiResponse<SwipeResponse> & SwipeResponse>('/api/swipe', payload)

      // Manejar tanto formato { success, match, matchId, ... } directo como envuelto en { data: { ... } }
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
    } catch {
      // Simular respuesta si no hay backend activo
      const isMatch = type !== 'DISLIKE' && Math.random() > 0.35
      return {
        success: true,
        match: isMatch,
        matchId: isMatch ? `match_${targetUserId}_${Date.now()}` : undefined,
      }
    }
  },

  /**
   * Wrapper compatible para interactuar desde SwipeDeck ('like' | 'pass' | 'superlike')
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
   * Obtiene la lista de matches activos
   */
  getMatches: async () => {
    try {
      const response = await http.get<ApiResponse<MatchCandidate[]>>('/api/matches')
      return response.data
    } catch {
      return [
        {
          id: 'cand_01',
          telegramId: 101,
          name: 'Camila',
          age: 24,
          bio: 'Arquitecta & aficionada a las plantas 🌿',
          gender: 'female',
          gender_identity: 'Lesbiana',
          photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'],
          interests: ['Arquitectura', 'Arte Moderno'],
          compatibilityScore: 94,
          verified: true,
          online: true,
          premium: false,
          lastMessage: '¡Hola Elena! Me encantó tu foto en el museo 🎨',
          lastMessageTime: '12:30',
          unreadCount: 1,
        },
        {
          id: 'cand_03',
          telegramId: 103,
          name: 'Sofía',
          age: 25,
          bio: 'Escritora & ciclista urbana',
          gender: 'female',
          gender_identity: 'Queer',
          photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'],
          interests: ['Literatura', 'Ciclismo'],
          compatibilityScore: 98,
          verified: true,
          online: false,
          premium: false,
          lastMessage: '¡Hicieron Match! Inicia la conversación ✨',
          lastMessageTime: 'Ayer',
          unreadCount: 0,
        },
      ]
    }
  },

  /**
   * Obtiene los mensajes de un chat
   */
  getMessages: async (chatId: string): Promise<ChatMessage[]> => {
    try {
      const response = await http.get<ApiResponse<ChatMessage[]>>(`/api/chats/${chatId}/messages`)
      return response.data
    } catch {
      return [
        {
          id: 'm1',
          senderId: 'cand_01',
          receiverId: 'usr_local_01',
          content: '¡Hola Elena! Me encantó tu foto en el museo 🎨',
          timestamp: '12:30',
          isRead: true,
        },
        {
          id: 'm2',
          senderId: 'usr_local_01',
          receiverId: 'cand_01',
          content: '¡Hola Camila! Muchas gracias, es de una expo del mes pasado 😊 ¿A ti también te gusta el arte contemporáneo?',
          timestamp: '12:34',
          isRead: true,
        },
      ]
    }
  },
}
