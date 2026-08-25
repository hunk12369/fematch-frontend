<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTelegramStore } from '@/stores/telegram.store'
import { useUserStore } from '@/stores/user.store'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import DevBanner from '@/components/dev/DevBanner.vue'
import PremiumModal from '@/components/premium/PremiumModal.vue'

const route = useRoute()
const tgStore = useTelegramStore()
const userStore = useUserStore()

onMounted(async () => {
  // Inicializar SDK de Telegram y cargar datos de usuario
  await tgStore.initialize()
  if (!userStore.isLoaded) {
    try {
      await userStore.fetchMe()
    } catch (e) {
      console.warn('Init user fetch error in App.vue:', e)
    }
  }
})

const showHeader = computed(() => route.name !== 'chat' && route.name !== 'onboarding')
const showBottomNav = computed(() => route.meta.showBottomNav !== false && route.name !== 'onboarding')
</script>

<template>
  <div
    class="flex flex-col h-full w-full max-w-md mx-auto bg-tg-bg text-tg-text relative overflow-hidden shadow-2xl transition-colors duration-200"
  >
    <!-- Dev Banner (indicador de entorno Mock / Real TMA) -->
    <DevBanner />

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
