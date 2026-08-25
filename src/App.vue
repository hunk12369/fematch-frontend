<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTelegramStore } from '@/stores/telegram.store'
import { useUserStore } from '@/stores/user.store'
import { hasValidTelegramInitData } from '@/telegram/init'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import DevBanner from '@/components/dev/DevBanner.vue'
import PremiumModal from '@/components/premium/PremiumModal.vue'
import { Send, AlertTriangle, ExternalLink } from 'lucide-vue-next'

const route = useRoute()
const tgStore = useTelegramStore()
const userStore = useUserStore()
const isValidTelegramSession = ref(true)

onMounted(async () => {
  // 1. Inicializar SDK de Telegram
  await tgStore.initialize()
  isValidTelegramSession.value = hasValidTelegramInitData()

  // 2. Solo realizar peticiones al backend si existe un hash de autenticación válido
  if (isValidTelegramSession.value && !userStore.isLoaded) {
    try {
      await userStore.fetchMe()
    } catch (e) {
      console.warn('Init user fetch warning in App.vue:', e)
    }
  }
})

const showHeader = computed(() => route.name !== 'chat' && route.name !== 'onboarding')
const showBottomNav = computed(() => route.meta.showBottomNav !== false && route.name !== 'onboarding')

function openTelegramBot() {
  const botUrl = 'https://t.me/fematch_bot'
  window.open(botUrl, '_blank')
}
</script>

<template>
  <div
    class="flex flex-col h-full w-full max-w-md mx-auto bg-tg-bg text-tg-text relative overflow-hidden shadow-2xl transition-colors duration-200"
  >
    <!-- Dev Banner (indicador de entorno Mock / Real TMA en desarrollo) -->
    <DevBanner />

    <!-- Banner de advertencia si se abre en navegador externo sin sesión válida de Telegram -->
    <div
      v-if="!isValidTelegramSession"
      class="bg-gradient-to-r from-amber-500/90 via-rose-500/90 to-fematch-pink-600 text-white p-3.5 text-xs text-center flex flex-col items-center justify-center gap-2 shadow-md z-50 animate-fade-in"
    >
      <div class="flex items-center gap-1.5 font-bold">
        <AlertTriangle class="w-4 h-4 text-white" />
        <span>Por favor, abre Fematch desde la app oficial de Telegram</span>
      </div>
      <p class="text-[11px] text-white/90 leading-tight max-w-xs">
        Para proteger tu privacidad y validar tus credenciales de forma segura, accede mediante el bot de Telegram.
      </p>
      <button
        type="button"
        @click="openTelegramBot"
        class="mt-1 px-4 py-1.5 rounded-full bg-white text-slate-900 font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
      >
        <Send class="w-3.5 h-3.5 text-fematch-pink-500" />
        <span>Abrir en Telegram</span>
        <ExternalLink class="w-3 h-3 text-slate-600" />
      </button>
    </div>

    <!-- App Top Header -->
    <AppHeader v-if="showHeader" />

    <!-- Main View Content with Vue Router transitions -->
    <main class="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- App Bottom Nav Bar -->
    <BottomNav v-if="showBottomNav" />

    <!-- Global Premium & Telegram Stars Modal -->
    <PremiumModal />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
