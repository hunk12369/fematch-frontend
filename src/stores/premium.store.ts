import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  paymentService,
  type PremiumProduct,
  type ProductType,
  VIP_PRODUCTS,
  BOOST_PRODUCTS,
  SUPERLIKE_PRODUCTS,
} from '@/api/services/payment.service'
import { useHaptics } from '@/composables/useHaptics'

export const usePremiumStore = defineStore('premium', () => {
  const haptics = useHaptics()

  const isModalOpen = ref(false)
  const activeTab = ref<ProductType>('vip_subscription')
  const selectedProductId = ref<string>('vip_annual')
  const isPurchasing = ref(false)
  const purchaseSuccess = ref(false)
  const lastPurchasedProduct = ref<PremiumProduct | null>(null)
  const errorMessage = ref<string | null>(null)

  // Estado de beneficios activos del usuario
  const isVip = ref(false)
  const boostActiveUntil = ref<Date | null>(null)
  const superlikesCount = ref(3)

  function openModal(tab: ProductType = 'vip_subscription', defaultProductId?: string) {
    haptics.selection()
    activeTab.value = tab
    if (defaultProductId) {
      selectedProductId.value = defaultProductId
    } else {
      if (tab === 'vip_subscription') selectedProductId.value = 'vip_annual'
      if (tab === 'boost') selectedProductId.value = 'boost_pack_3'
      if (tab === 'superlikes') selectedProductId.value = 'superlikes_15'
    }
    purchaseSuccess.value = false
    errorMessage.value = null
    isModalOpen.value = true
  }

  function closeModal() {
    haptics.selection()
    isModalOpen.value = false
    purchaseSuccess.value = false
    errorMessage.value = null
  }

  /**
   * Ejecuta el flujo de compra con Telegram Stars e Invoice Gateway nativo
   */
  async function purchaseProduct(product: PremiumProduct): Promise<void> {
    isPurchasing.value = true
    errorMessage.value = null
    purchaseSuccess.value = false
    haptics.impact('medium')

    try {
      // 1. Obtener el enlace de factura generado por el backend
      const invoiceData = await paymentService.createStarsInvoice(product)
      const webApp = window.Telegram?.WebApp

      if (!webApp) {
        throw new Error('Telegram WebApp no está disponible en este entorno')
      }

      // 2. Abrir la pasarela nativa de Telegram Stars (openInvoice)
      webApp.openInvoice(invoiceData.invoiceLink, (status) => {
        console.log(`⭐ [Fematch TMA] Telegram Stars Invoice Status: ${status}`)

        if (status === 'paid') {
          // Actualizar beneficios en el cliente
          if (product.type === 'vip_subscription') {
            isVip.value = true
            superlikesCount.value += 15
          } else if (product.type === 'boost') {
            const now = new Date()
            const hours = (product.amount || 1) * 24
            boostActiveUntil.value = new Date(now.getTime() + hours * 60 * 60 * 1000)
          } else if (product.type === 'superlikes') {
            superlikesCount.value += product.amount || 5
          }

          lastPurchasedProduct.value = product
          purchaseSuccess.value = true
          isPurchasing.value = false
          haptics.notification('success')
        } else if (status === 'cancelled') {
          isPurchasing.value = false
          haptics.impact('light')
          console.log('Pago de Telegram Stars cancelado por el usuario')
        } else if (status === 'failed') {
          isPurchasing.value = false
          errorMessage.value = 'El pago no se pudo completar. Por favor intenta nuevamente.'
          haptics.notification('error')
        } else if (status === 'pending') {
          isPurchasing.value = false
          errorMessage.value = 'Pago pendiente de confirmación por la red de Telegram.'
        }
      })
    } catch (err: any) {
      console.error('Error al generar factura de Telegram Stars:', err)
      errorMessage.value = err.message || 'Error al conectar con la pasarela de pagos'
      isPurchasing.value = false
      haptics.notification('error')
    }
  }

  return {
    isModalOpen,
    activeTab,
    selectedProductId,
    isPurchasing,
    purchaseSuccess,
    lastPurchasedProduct,
    errorMessage,
    isVip,
    boostActiveUntil,
    superlikesCount,
    VIP_PRODUCTS,
    BOOST_PRODUCTS,
    SUPERLIKE_PRODUCTS,
    openModal,
    closeModal,
    purchaseProduct,
  }
})
