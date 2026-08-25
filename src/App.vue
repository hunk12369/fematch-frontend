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
import { Send, Sparkles, ShieldCheck, HeartHandshake, ExternalLink } from 'lucide-vue-next'

const route = useRoute()
const tgStore = useTelegramStore()
const userStore = useUserStore()
const isValidTelegramSession = ref(true)

const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'FematchBot'
const telegramBotUrl = `https://t.me/${botUsername.replace('@', '')}`

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

const showHeader = computed(() => isValidTelegramSession.value && route.name !== 'chat' && route.name !== 'onboarding')
const showBottomNav = computed(() => isValidTelegramSession.value && route.meta.showBottomNav !== false && route.name !== 'onboarding')

function openTelegramBot() {
  window.open(telegramBotUrl, '_blank')
}
</script>

<template>
  <div
    class="flex flex-col h-full w-full max-w-md mx-auto bg-tg-bg text-tg-text relative overflow-hidden shadow-2xl transition-colors duration-200 select-none"
  >
    <!-- Dev Banner (indicador de entorno Mock / Real TMA en desarrollo) -->
    <DevBanner />

    <!-- ======================================================== -->
    <!-- VISTA BLOQUEANTE: ACCESO FUERA DE TELEGRAM               -->
    <!-- ======================================================== -->
    <div
      v-if="!isValidTelegramSession"
      class="flex-1 flex flex-col items-center justify-center p-6 text-center bg-tg-bg text-tg-text relative overflow-hidden z-50 animate-fade-in"
    >
      <!-- Background Ambient Glows -->
      <div class="absolute -top-16 -right-16 w-56 h-56 bg-fematch-pink-500/20 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-16 -left-16 w-56 h-56 bg-fematch-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      <!-- Fematch Logo Badge -->
      <div class="relative mb-4">
        <div class="w-20 h-20 rounded-3xl bg-gradient-to-tr from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 p-0.5 shadow-pastel-pink flex items-center justify-center">
          <div class="w-full h-full bg-tg-bg rounded-[22px] flex items-center justify-center">
            <Sparkles class="w-10 h-10 text-fematch-pink-500" />
          </div>
        </div>
        <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-fematch-cyan-400 text-white flex items-center justify-center shadow-md">
          <ShieldCheck class="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>

      <!-- Main Heading -->
      <div class="space-y-2 mb-6 max-w-xs">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fematch-pink-50 dark:bg-fematch-pink-950/60 border border-fematch-pink-200 dark:border-fematch-violet-900 text-fematch-pink-600 dark:text-fematch-pink-300 text-xs font-bold">
          <HeartHandshake class="w-3.5 h-3.5" />
          <span>Telegram Mini App</span>
        </div>

        <h1 class="text-2xl font-black tracking-tight text-tg-text">
          Por favor, abre Fematch desde la app oficial de Telegram
        </h1>

        <p class="text-xs text-tg-hint leading-relaxed">
          Fematch es una experiencia segura y exclusiva. Para sincronizar tus mensajes, proteger tu privacidad y acceder a tu perfil, abre la aplicación desde nuestro bot oficial.
        </p>
      </div>

      <!-- Action Button to Open Telegram Bot -->
      <div class="w-full max-w-xs space-y-3">
        <button
          type="button"
          @click="openTelegramBot"
          class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-extrabold text-sm shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Send class="w-4 h-4" />
          <span>Abrir @{{ botUsername.replace('@', '') }}</span>
          <ExternalLink class="w-4 h-4" />
        </button>

        <span class="text-[11px] text-tg-hint block">
          Compatible con Telegram para iOS, Android, macOS y Windows
        </span>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- FLUJO NORMAL DE LA APLICACIÓN (DENTRO DE TELEGRAM)      -->
    <!-- ======================================================== -->
    <template v-else>
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
    </template>
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
