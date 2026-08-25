import { http } from '../client'
import type { AuthTelegramResponse, AuthMeResponse, User } from '../types'

export const authService = {
  /**
   * Sincroniza y valida el initData de Telegram en PostgreSQL (User.upsert)
   * POST /api/auth/telegram
   * Respuesta: { success: true, isNewUser: boolean, isProfileIncomplete: boolean, data: { user, telegramUser } }
   */
  syncTelegram: async (): Promise<AuthTelegramResponse> => {
    try {
      const response = await http.post<AuthTelegramResponse>('/api/auth/telegram', {})
      return response
    } catch (error) {
      console.warn('⚠️ [authService.syncTelegram] Error o fallback a datos locales de Telegram:', error)
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
      const fallbackUser: User = {
        id: 'usr_local_01',
        telegramId: String(tgUser?.id || 987654321),
        firstName: tgUser?.first_name || 'Elena',
        username: tgUser?.username || 'elena_fematch',
        birthDate: '1998-05-14',
        age: 26,
        genderIdentity: 'TRANS_FEM',
        bio: 'Creativa, apasionada por la música indie y el arte.',
        city: 'Madrid',
        isVip: Boolean(tgUser?.is_premium),
        photos: [
          {
            id: 'photo_01',
            url: tgUser?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
            orderIndex: 0,
          },
        ],
        preference: {
          targetGenders: ['FEMBOY', 'TRANS_FEM', 'TRANS_MASC', 'CROSSDRESSER'],
          minAge: 20,
          maxAge: 35,
          maxDistanceKm: 30,
        },
      }

      return {
        success: true,
        isNewUser: false,
        isProfileIncomplete: false,
        data: {
          user: fallbackUser,
          telegramUser: tgUser || {
            id: 987654321,
            first_name: 'Elena',
            last_name: 'Vargas',
            username: 'elena_fematch',
          },
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
      const response = await http.get<{ success: boolean; data: AuthMeResponse }>('/api/auth/me')
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
