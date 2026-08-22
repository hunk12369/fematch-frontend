<script setup lang="ts">
import { computed } from 'vue'
import { useTelegramStore } from '@/stores/telegram.store'
import { useHaptics } from '@/composables/useHaptics'
import { Sparkles, Moon, Sun, ShieldCheck } from 'lucide-vue-next'

const tgStore = useTelegramStore()
const haptics = useHaptics()

const isDark = computed(() => tgStore.isDarkMode)

function onToggleTheme() {
  haptics.selection()
  tgStore.toggleTheme()
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

    <!-- Right Controls: TG User badge & Theme toggle -->
    <div class="flex items-center gap-2">
      <!-- Telegram User Badge -->
      <div
        v-if="tgStore.user"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fematch-pink-50 dark:bg-fematch-violet-950/60 border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-medium text-fematch-pink-700 dark:text-fematch-pink-300"
      >
        <ShieldCheck class="w-3.5 h-3.5 text-fematch-cyan-500" />
        <span class="max-w-[85px] truncate font-semibold">{{ tgStore.user.first_name }}</span>
      </div>

      <!-- Theme Switcher -->
      <button
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
