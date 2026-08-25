<script setup lang="ts">
import { computed } from 'vue'
import { useTelegramStore } from '@/stores/telegram.store'
import { usePremiumStore } from '@/stores/premium.store'
import { useHaptics } from '@/composables/useHaptics'
import { Sparkles, Moon, Sun, Crown } from 'lucide-vue-next'

const tgStore = useTelegramStore()
const premiumStore = usePremiumStore()
const haptics = useHaptics()

const isDark = computed(() => tgStore.isDarkMode)

function onToggleTheme() {
  haptics.selection()
  tgStore.toggleTheme()
}

function openPremiumShop() {
  premiumStore.openModal('vip_subscription')
}
</script>

<template>
  <header
    class="w-full bg-tg-bg/90 backdrop-blur-md border-b border-fematch-pink-100 dark:border-fematch-violet-900/40 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 transition-colors"
  >
    <!-- Logo & Brand -->
    <div class="flex items-center gap-2">
      <div
        class="w-8 h-8 rounded-full bg-gradient-to-tr from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 flex items-center justify-center shadow-pastel-pink text-white font-bold text-base"
      >
        <Sparkles class="w-4 h-4 text-white" />
      </div>
      <div>
        <h1
          class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 bg-clip-text text-transparent"
        >
          Fematch
        </h1>
      </div>
    </div>

    <!-- Right Controls: VIP Store, TG User badge & Theme toggle -->
    <div class="flex items-center gap-2">
      <!-- VIP / Stars Tienda Button -->
      <button
        type="button"
        @click="openPremiumShop"
        class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/20 border border-amber-400/50 text-amber-500 font-extrabold text-xs active:scale-95 transition-transform shadow-xs"
        title="Tienda VIP y Telegram Stars"
      >
        <Crown class="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
        <span v-if="premiumStore.isVip" class="text-[11px] font-black">VIP</span>
        <span v-else class="text-[11px]">Tienda</span>
      </button>

      <!-- Theme Switcher -->
      <button
        type="button"
        @click="onToggleTheme"
        class="p-2 rounded-full bg-fematch-violet-50 dark:bg-fematch-violet-900/50 text-fematch-violet-600 dark:text-fematch-violet-300 active:scale-95 transition-transform"
        title="Alternar tema"
      >
        <Moon v-if="!isDark" class="w-4 h-4" />
        <Sun v-else class="w-4 h-4 text-fematch-cyan-400" />
      </button>
    </div>
  </header>
</template>
