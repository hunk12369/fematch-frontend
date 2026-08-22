import { http } from '../client'
import type { ApiResponse, MatchCandidate, MatchResult, ChatMessage } from '../types'

export const matchService = {
  /**
   * Obtiene la lista de perfiles recomendados para descubrir
   */
  getDiscoveryFeed: async (): Promise<MatchCandidate[]> => {
    try {
      const response = await http.get<ApiResponse<MatchCandidate[]>>('/matches/feed')
      return response.data
    } catch {
      // Mock data para demo inicial de Fematch
      return [
        {
          id: 'cand_01',
          telegramId: 101,
          name: 'Camila',
          age: 24,
          bio: 'Arquitecta & aficionada a las plantas 🌿. Me encanta recorrer galerías de arte y probar repostería.',
          gender: 'female',
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
          photos: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
          ],
          interests: ['Diseño', 'Música', 'Playa', 'Tatuajes', 'Perros'],
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
          photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
          ],
          interests: ['Literatura', 'Ciclismo', 'Cinema', 'Café'],
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
   * Envía una interacción de swipe (like, pass, superlike)
   */
  interact: async (candidateId: string, action: 'like' | 'pass' | 'superlike'): Promise<MatchResult> => {
    try {
      const response = await http.post<ApiResponse<MatchResult>>('/matches/interact', {
        candidateId,
        action,
      })
      return response.data
    } catch {
      // Simular match con probabilidad si es like o superlike
      const isMatch = action !== 'pass' && Math.random() > 0.3
      return {
        isMatch,
        chatId: isMatch ? `chat_${candidateId}` : undefined,
      }
    }
  },

  /**
   * Obtiene la lista de chats y matches activos
   */
  getMatches: async () => {
    try {
      const response = await http.get<ApiResponse<MatchCandidate[]>>('/matches')
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
      const response = await http.get<ApiResponse<ChatMessage[]>>(`/chats/${chatId}/messages`)
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
