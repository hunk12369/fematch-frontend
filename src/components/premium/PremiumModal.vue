<script setup lang="ts">
import { computed } from 'vue'
import { usePremiumStore } from '@/stores/premium.store'
import {
  type PremiumProduct,
  type ProductType,
} from '@/api/services/payment.service'
import { useHaptics } from '@/composables/useHaptics'
import {
  X,
  Crown,
  Zap,
  Star,
  Check,
  Sparkles,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-vue-next'

const premiumStore = usePremiumStore()
const haptics = useHaptics()

const currentProducts = computed<PremiumProduct[]>(() => {
  if (premiumStore.activeTab === 'vip_subscription') return premiumStore.VIP_PRODUCTS
  if (premiumStore.activeTab === 'boost') return premiumStore.BOOST_PRODUCTS
  return premiumStore.SUPERLIKE_PRODUCTS
})

const selectedProduct = computed<PremiumProduct | undefined>(() => {
  return currentProducts.value.find((p) => p.id === premiumStore.selectedProductId) || currentProducts.value[0]
})

function selectProduct(product: PremiumProduct) {
  haptics.selection()
  premiumStore.selectedProductId = product.id
}

function setTab(tab: ProductType) {
  haptics.selection()
  premiumStore.activeTab = tab
  if (tab === 'vip_subscription') premiumStore.selectedProductId = 'vip_annual'
  if (tab === 'boost') premiumStore.selectedProductId = 'boost_pack_3'
  if (tab === 'superlikes') premiumStore.selectedProductId = 'superlikes_15'
}

function onBuy() {
  if (!selectedProduct.value || premiumStore.isPurchasing) return
  premiumStore.purchaseProduct(selectedProduct.value)
}

function onClose() {
  premiumStore.closeModal()
}
</script>

<template>
  <div
    v-if="premiumStore.isModalOpen"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
  >
    <div
      class="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-tg-bg border border-fematch-pink-200/50 dark:border-fematch-violet-900/60 shadow-2xl overflow-hidden"
    >
      <!-- Background Ambient Colors -->
      <div
        class="absolute -top-16 -right-16 w-56 h-56 bg-fematch-pink-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <div
        class="absolute top-40 -left-16 w-56 h-56 bg-fematch-violet-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <div
        class="absolute -bottom-16 right-10 w-48 h-48 bg-fematch-cyan-500/15 rounded-full blur-3xl pointer-events-none"
      />

      <!-- Modal Top Bar -->
      <div class="relative z-10 px-5 pt-4 pb-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-sm"
          >
            <Crown class="w-4 h-4 fill-white" />
          </div>
          <span class="text-base font-extrabold text-tg-text">
            Tienda Fematch
          </span>
        </div>

        <button
          type="button"
          @click="onClose"
          class="p-1.5 rounded-full bg-tg-secondary-bg hover:bg-gray-200 dark:hover:bg-gray-800 text-tg-hint hover:text-tg-text transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- ============================================== -->
      <!-- SUCCESS CELEBRATION VIEW                       -->
      <!-- ============================================== -->
      <div
        v-if="premiumStore.purchaseSuccess"
        class="relative z-10 flex-1 p-6 flex flex-col items-center justify-center text-center gap-4 my-auto"
      >
        <div
          class="w-20 h-20 rounded-full bg-gradient-to-tr from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 flex items-center justify-center text-white shadow-pastel-pink animate-bounce"
        >
          <CheckCircle2 class="w-10 h-10" />
        </div>

        <div>
          <h3 class="text-2xl font-black text-tg-text mb-1">
            ¡Pago Confirmado!
          </h3>
          <p class="text-xs text-tg-hint leading-relaxed max-w-xs mx-auto">
            Tus <span class="font-bold text-amber-500">Telegram Stars</span> han sido procesadas y los beneficios de
            <span class="font-bold text-fematch-pink-500">{{ premiumStore.lastPurchasedProduct?.title }}</span> ya están activos.
          </p>
        </div>

        <button
          type="button"
          @click="onClose"
          class="w-full max-w-xs mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-extrabold text-sm shadow-pastel-pink active:scale-95 transition-transform"
        >
          ¡Comenzar a Disfrutar!
        </button>
      </div>

      <!-- ============================================== -->
      <!-- REGULAR STORE VIEW                             -->
      <!-- ============================================== -->
      <div v-else class="relative z-10 flex-1 overflow-y-auto no-scrollbar px-5 py-2 space-y-4">
        <!-- Tab Navigation Switcher -->
        <div class="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40">
          <button
            type="button"
            @click="setTab('vip_subscription')"
            class="py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            :class="[
              premiumStore.activeTab === 'vip_subscription'
                ? 'bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white shadow-pastel-pink scale-[1.02]'
                : 'text-tg-hint hover:text-tg-text'
            ]"
          >
            <Crown class="w-3.5 h-3.5" />
            <span>VIP</span>
          </button>

          <button
            type="button"
            @click="setTab('boost')"
            class="py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            :class="[
              premiumStore.activeTab === 'boost'
                ? 'bg-gradient-to-r from-fematch-violet-500 to-fematch-cyan-500 text-white shadow-pastel-violet scale-[1.02]'
                : 'text-tg-hint hover:text-tg-text'
            ]"
          >
            <Zap class="w-3.5 h-3.5" />
            <span>Boost 24h</span>
          </button>

          <button
            type="button"
            @click="setTab('superlikes')"
            class="py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            :class="[
              premiumStore.activeTab === 'superlikes'
                ? 'bg-gradient-to-r from-fematch-cyan-500 to-fematch-pink-500 text-white shadow-pastel-cyan scale-[1.02]'
                : 'text-tg-hint hover:text-tg-text'
            ]"
          >
            <Star class="w-3.5 h-3.5" />
            <span>Superlikes</span>
          </button>
        </div>

        <!-- Tab 1: Suscripción VIP -->
        <div v-if="premiumStore.activeTab === 'vip_subscription'" class="space-y-3">
          <!-- Hero Banner -->
          <div
            class="p-4 rounded-2xl bg-gradient-to-br from-fematch-pink-500/10 via-fematch-violet-500/15 to-fematch-cyan-500/10 border border-fematch-pink-300 dark:border-fematch-violet-700 text-center"
          >
            <h4 class="text-base font-black text-tg-text mb-1">
              Desbloquea el Máximo Potencial
            </h4>
            <p class="text-xs text-tg-hint">
              Consigue hasta 5 veces más matches y descubre quién te dio Like primero.
            </p>
          </div>

          <!-- Product Cards Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="product in premiumStore.VIP_PRODUCTS"
              :key="product.id"
              @click="selectProduct(product)"
              class="relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between"
              :class="[
                premiumStore.selectedProductId === product.id
                  ? 'border-fematch-pink-500 bg-fematch-pink-50/70 dark:bg-fematch-violet-950/60 shadow-pastel-pink'
                  : 'border-fematch-pink-100 dark:border-fematch-violet-900/40 bg-tg-secondary-bg hover:border-fematch-pink-300'
              ]"
            >
              <!-- Discount Badge -->
              <span
                v-if="product.discountBadge"
                class="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-[9px] font-extrabold text-white shadow-xs"
              >
                {{ product.discountBadge }}
              </span>

              <div>
                <h5 class="text-xs font-bold text-tg-text mb-0.5">{{ product.title }}</h5>
                <span class="text-[10px] text-tg-hint block mb-2">{{ product.subtitle }}</span>
              </div>

              <div class="flex items-center gap-1 mt-1">
                <span class="text-base font-black text-amber-500">{{ product.stars }}</span>
                <span class="text-xs font-bold text-amber-500">⭐ Stars</span>
                <span
                  v-if="product.originalStars"
                  class="text-[10px] text-tg-hint line-through ml-1"
                >
                  {{ product.originalStars }}
                </span>
              </div>
            </div>
          </div>

          <!-- VIP Features Checklist -->
          <div class="p-3.5 rounded-2xl bg-tg-secondary-bg/80 border border-fematch-pink-100 dark:border-fematch-violet-900/30 space-y-2">
            <h5 class="text-xs font-bold uppercase tracking-wider text-fematch-pink-600 dark:text-fematch-pink-400 flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5" />
              <span>Beneficios Exclusivos VIP</span>
            </h5>

            <ul class="space-y-1.5 text-xs text-tg-text">
              <li
                v-for="feat in selectedProduct?.features || premiumStore.VIP_PRODUCTS[0].features"
                :key="feat"
                class="flex items-start gap-2"
              >
                <div class="p-0.5 rounded-full bg-fematch-pink-500 text-white flex-shrink-0 mt-0.5">
                  <Check class="w-3 h-3 stroke-[3]" />
                </div>
                <span class="text-[11px] leading-tight">{{ feat }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Tab 2: Boost 24h -->
        <div v-else-if="premiumStore.activeTab === 'boost'" class="space-y-3">
          <div
            class="p-4 rounded-2xl bg-gradient-to-br from-fematch-violet-500/15 via-fematch-cyan-500/10 to-fematch-pink-500/10 border border-fematch-violet-300 dark:border-fematch-violet-700 text-center"
          >
            <div class="w-10 h-10 rounded-full bg-fematch-violet-500 text-white mx-auto flex items-center justify-center mb-2 shadow-pastel-violet animate-pulse-gentle">
              <Zap class="w-5 h-5 fill-white" />
            </div>
            <h4 class="text-base font-black text-tg-text mb-1">
              Multiplica tu Visibilidad x10
            </h4>
            <p class="text-xs text-tg-hint">
              Conviértete en el perfil #1 que verán todas las personas cercanas en las próximas 24 horas.
            </p>
          </div>

          <!-- Boost Options Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="product in premiumStore.BOOST_PRODUCTS"
              :key="product.id"
              @click="selectProduct(product)"
              class="relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between"
              :class="[
                premiumStore.selectedProductId === product.id
                  ? 'border-fematch-violet-500 bg-fematch-violet-50/70 dark:bg-fematch-violet-950/60 shadow-pastel-violet'
                  : 'border-fematch-violet-100 dark:border-fematch-violet-900/40 bg-tg-secondary-bg hover:border-fematch-violet-300'
              ]"
            >
              <span
                v-if="product.discountBadge"
                class="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-fematch-violet-500 to-fematch-cyan-500 text-[9px] font-extrabold text-white shadow-xs"
              >
                {{ product.discountBadge }}
              </span>

              <div>
                <h5 class="text-xs font-bold text-tg-text mb-0.5">{{ product.title }}</h5>
                <span class="text-[10px] text-tg-hint block mb-2">{{ product.subtitle }}</span>
              </div>

              <div class="flex items-center gap-1 mt-1">
                <span class="text-base font-black text-amber-500">{{ product.stars }}</span>
                <span class="text-xs font-bold text-amber-500">⭐ Stars</span>
                <span
                  v-if="product.originalStars"
                  class="text-[10px] text-tg-hint line-through ml-1"
                >
                  {{ product.originalStars }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Packs de Superlikes -->
        <div v-else class="space-y-3">
          <div
            class="p-4 rounded-2xl bg-gradient-to-br from-fematch-cyan-500/15 via-fematch-pink-500/10 to-fematch-violet-500/10 border border-fematch-cyan-300 dark:border-fematch-cyan-800 text-center"
          >
            <div class="w-10 h-10 rounded-full bg-fematch-cyan-400 text-white mx-auto flex items-center justify-center mb-2 shadow-pastel-cyan">
              <Star class="w-5 h-5 fill-white" />
            </div>
            <h4 class="text-base font-black text-tg-text mb-1">
              Destaca al Instante
            </h4>
            <p class="text-xs text-tg-hint">
              Los Superlikes muestran tu perfil con un marco especial y una notificación prioritaria.
            </p>
          </div>

          <!-- Superlikes Packs Grid -->
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="product in premiumStore.SUPERLIKE_PRODUCTS"
              :key="product.id"
              @click="selectProduct(product)"
              class="relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-center"
              :class="[
                premiumStore.selectedProductId === product.id
                  ? 'border-fematch-cyan-400 bg-fematch-cyan-50/70 dark:bg-fematch-cyan-950/60 shadow-pastel-cyan'
                  : 'border-fematch-cyan-100 dark:border-fematch-cyan-900/40 bg-tg-secondary-bg hover:border-fematch-cyan-300'
              ]"
            >
              <span
                v-if="product.discountBadge"
                class="absolute -top-2.5 inset-x-2 px-1 py-0.5 rounded-full bg-gradient-to-r from-fematch-cyan-500 to-fematch-pink-500 text-[8px] font-extrabold text-white truncate"
              >
                {{ product.discountBadge }}
              </span>

              <div class="my-auto pt-1">
                <Star class="w-6 h-6 text-fematch-cyan-500 fill-fematch-cyan-400 mx-auto mb-1" />
                <h5 class="text-xs font-black text-tg-text">{{ product.amount }}</h5>
                <span class="text-[9px] text-tg-hint block">Superlikes</span>
              </div>

              <div class="mt-2 pt-1 border-t border-gray-200 dark:border-gray-800">
                <span class="text-xs font-black text-amber-500">{{ product.stars }} ⭐</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Feedback Message -->
        <div
          v-if="premiumStore.errorMessage"
          class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-500 font-medium"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ premiumStore.errorMessage }}</span>
        </div>
      </div>

      <!-- Modal Bottom Actions & Star Pay Button -->
      <div
        v-if="!premiumStore.purchaseSuccess"
        class="relative z-10 p-5 bg-tg-bg border-t border-fematch-pink-100 dark:border-fematch-violet-900/40 pb-safe flex flex-col gap-2"
      >
        <button
          type="button"
          :disabled="premiumStore.isPurchasing || !selectedProduct"
          @click="onBuy"
          class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-black text-sm shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Loader2 v-if="premiumStore.isPurchasing" class="w-5 h-5 animate-spin" />
          <template v-else>
            <span>Pagar {{ selectedProduct?.stars || 100 }}</span>
            <span class="flex items-center text-amber-300">⭐ Stars</span>
            <span class="text-xs text-white/80 font-normal ml-1">({{ selectedProduct?.title }})</span>
          </template>
        </button>

        <div class="flex items-center justify-center gap-1 text-[10px] text-tg-hint">
          <ShieldCheck class="w-3.5 h-3.5 text-fematch-cyan-500" />
          <span>Transacción segura y nativa procesada vía Telegram Stars</span>
        </div>
      </div>
    </div>
  </div>
</template>
