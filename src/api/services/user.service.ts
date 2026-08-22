import { http } from '../client'
import type { ApiResponse, UserProfile } from '../types'

export const userService = {
  /**
   * Obtiene el perfil del usuario autenticado vía Telegram
   */
  getMe: async (): Promise<UserProfile> => {
    try {
      const response = await http.get<ApiResponse<UserProfile>>('/users/me')
      return response.data
    } catch {
      // Retorno simulado si no hay backend activo en local
      return {
        id: 'usr_local_01',
        telegramId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 123456,
        name: window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Elena',
        age: 26,
        bio: 'Creativa, amante del café de especialidad ☕ y la música indie 🎶. Buscando buenas conexiones.',
        gender: 'female',
        photos: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        ],
        interests: ['Fotografía', 'Indie Rock', 'Diseño UI', 'Café', 'Viajes'],
        distanceKm: 3,
        verified: true,
        online: true,
        premium: true,
        likesCount: 142,
        matchesCount: 28,
      }
    }
  },

  /**
   * Actualiza los datos de perfil
   */
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await http.put<ApiResponse<UserProfile>>('/users/me', data)
    return response.data
  },
}
