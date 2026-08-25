import { http } from '../client'
import type { ApiResponse, StarsItemType, StarsInvoiceResponse } from '../types'

export type ProductType = 'vip_subscription' | 'boost' | 'superlikes'

export interface PremiumProduct {
  id: string
  backendItemType: StarsItemType
  type: ProductType
  title: string
  subtitle: string
  stars: number
  originalStars?: number
  discountBadge?: string
  popular?: boolean
  durationDays?: number
  amount?: number
  features?: string[]
}

export const VIP_PRODUCTS: PremiumProduct[] = [
  {
    id: 'vip_monthly',
    backendItemType: 'VIP_MONTHLY',
    type: 'vip_subscription',
    title: 'VIP Mensual',
    subtitle: 'Acceso total por 1 mes',
    stars: 250,
    durationDays: 30,
    features: [
      'Swipes & Likes ilimitados',
      'Ver a quién le gustas antes de hacer swipe',
      '5 Superlikes diarios gratis',
      '1 Boost gratis cada semana',
      'Modo Invisible y Pasaporte de ubicación',
    ],
  },
  {
    id: 'vip_annual',
    backendItemType: 'VIP_MONTHLY',
    type: 'vip_subscription',
    title: 'VIP Anual',
    subtitle: 'Facturado anualmente (150 ⭐/mes)',
    stars: 1800,
    originalStars: 3000,
    discountBadge: 'AHORRA 40%',
    popular: true,
    durationDays: 365,
    features: [
      'Todo lo incluido en VIP Mensual',
      'Insignia dorada VIP en tu perfil',
      'Prioridad máxima en el algoritmo de citas',
      'Soporte prioritario 24/7',
    ],
  },
]

export const BOOST_PRODUCTS: PremiumProduct[] = [
  {
    id: 'boost_single',
    backendItemType: 'BOOST',
    type: 'boost',
    title: '1 Boost de 24 Horas',
    subtitle: 'x10 de visibilidad en tu ciudad',
    stars: 100,
    amount: 1,
    features: [
      'Tu perfil será el #1 en la pila de swipes durante 24 horas',
      'Hasta 10 veces más matches potenciales',
    ],
  },
  {
    id: 'boost_pack_3',
    backendItemType: 'BOOST',
    type: 'boost',
    title: 'Pack 3 Boosts (72 Horas)',
    subtitle: 'Actívalos cuando prefieras',
    stars: 240,
    originalStars: 300,
    discountBadge: '20% OFF',
    popular: true,
    amount: 3,
    features: [
      '3 Boosts de 24 horas cada uno',
      'Aumenta tus conexiones en fines de semana',
    ],
  },
]

export const SUPERLIKE_PRODUCTS: PremiumProduct[] = [
  {
    id: 'superlikes_5',
    backendItemType: 'SUPERLIKE',
    type: 'superlikes',
    title: '5 Superlikes',
    subtitle: 'Destaca en sus notificaciones',
    stars: 50,
    amount: 5,
  },
  {
    id: 'superlikes_15',
    backendItemType: 'SUPERLIKE',
    type: 'superlikes',
    title: '15 Superlikes',
    subtitle: 'El pack más elegido',
    stars: 120,
    originalStars: 150,
    discountBadge: 'POPULAR',
    popular: true,
    amount: 15,
  },
  {
    id: 'superlikes_30',
    backendItemType: 'SUPERLIKE',
    type: 'superlikes',
    title: '30 Superlikes',
    subtitle: 'Máximo poder de conexión',
    stars: 200,
    originalStars: 300,
    discountBadge: 'MEJOR PRECIO',
    amount: 30,
  },
]

export const paymentService = {
  /**
   * Genera enlace de pago en Telegram Stars (XTR)
   * POST /api/stars/create-invoice-link
   * Body: { itemType: "VIP_MONTHLY" | "BOOST" | "SUPERLIKE" }
   * Lee invoiceLink y product.starsAmount o product.stars
   */
  createStarsInvoice: async (product: PremiumProduct): Promise<StarsInvoiceResponse> => {
    try {
      const response = await http.post<ApiResponse<StarsInvoiceResponse> & StarsInvoiceResponse>(
        '/api/stars/create-invoice-link',
        {
          itemType: product.backendItemType || 'VIP_MONTHLY',
        }
      )

      const resData = response.data || response
      if (resData?.invoiceLink) {
        return {
          invoiceLink: resData.invoiceLink,
          product: {
            itemType: resData.product?.itemType || product.backendItemType,
            title: resData.product?.title || product.title,
            stars: resData.product?.starsAmount || resData.product?.stars || product.stars,
            starsAmount: resData.product?.starsAmount || resData.product?.stars || product.stars,
          },
        }
      }
      throw new Error('Sin invoiceLink en respuesta')
    } catch {
      // Mock invoice link fallback para entorno de desarrollo local
      return {
        invoiceLink: `https://t.me/$mock_stars_invoice_${product.backendItemType}_${Date.now()}`,
        product: {
          itemType: product.backendItemType,
          title: product.title,
          stars: product.stars,
          starsAmount: product.stars,
        },
      }
    }
  },
}
