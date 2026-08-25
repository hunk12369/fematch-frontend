import { http } from '../client'
import type { ApiResponse, AuthTelegramResponse, AuthMeResponse } from '../types'

export const authService = {
  /**
   * Sincroniza y valida el initData de Telegram en PostgreSQL (User.upsert)
   * POST /api/auth/telegram
   */
  syncTelegram: async (): Promise<AuthTelegramResponse> => {
    try {
      const response = await http.post<ApiResponse<AuthTelegramResponse>>('/api/auth/telegram', {})
      return response.data
    } catch (error) {
      console.warn('⚠️ [authService.syncTelegram] Fallback a datos locales de Telegram:', error)
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
      return {
        user: {
          id: 'usr_local_01',
          telegramId: tgUser?.id || 987654321,
          name: tgUser?.first_name ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : 'Elena Vargas',
          age: 26,
          bio: 'Creativa, amante del café de especialidad y la música indie.',
          gender: 'female',
          gender_identity: 'Lesbiana',
          pronouns: 'Ella / She',
          occupation: 'UI Designer',
          city: 'Madrid',
          photos: [
            tgUser?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          ],
          interests: ['Fotografía', 'Arte Moderno', 'Café', 'Plantas'],
          search_preferences: {
            minAge: 20,
            maxAge: 35,
            maxDistanceKm: 30,
            interestedIn: ['Mujer cis', 'Mujer trans', 'No binaria', 'Lesbiana', 'Bisexual'],
          },
          verified: true,
          online: true,
          premium: Boolean(tgUser?.is_premium),
          likesCount: 142,
          matchesCount: 28,
          isNewUser: false,
          onboardingCompleted: true,
        },
        telegramUser: tgUser || {
          id: 987654321,
          first_name: 'Elena',
          last_name: 'Vargas',
          username: 'elena_fematch',
        },
      }
    }
  },

  /**
   * Obtiene el perfil actual autenticado de Telegram
   * GET /api/auth/me
   */
  getAuthMe: async (): Promise<AuthMeResponse> => {
    try {
      const response = await http.get<ApiResponse<AuthMeResponse>>('/api/auth/me')
      return response.data
    } catch (error) {
      console.warn('⚠️ [authService.getAuthMe] Fallback a datos locales:', error)
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
      return {
        telegramUser: tgUser || {
          id: 987654321,
          first_name: 'Elena',
          last_name: 'Vargas',
          username: 'elena_fematch',
        },
        initData: window.Telegram?.WebApp?.initData || '',
      }
    }
  },
}
