<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches.store'
import { Flame, MessageCircleHeart, User } from 'lucide-vue-next'
import { useHaptics } from '@/composables/useHaptics'

const route = useRoute()
const router = useRouter()
const matchesStore = useMatchesStore()
const haptics = useHaptics()

const navItems = computed(() => [
  {
    name: 'discover',
    label: 'Descubrir',
    path: '/discover',
    icon: Flame,
  },
  {
    name: 'matches',
    label: 'Matches',
    path: '/matches',
    icon: MessageCircleHeart,
    badge: matchesStore.matches.length > 0 ? matchesStore.matches.length : undefined,
  },
  {
    name: 'profile',
    label: 'Perfil',
    path: '/profile',
    icon: User,
  },
])

const currentRouteName = computed(() => route.name)

function navigateTo(path: string) {
  haptics.selection()
  router.push(path)
}
</script>

<template>
  <nav
    class="w-full bg-tg-bg/95 backdrop-blur-lg border-t border-fematch-pink-100 dark:border-fematch-violet-900/40 px-6 pt-2 pb-safe sticky bottom-0 z-30 transition-colors"
  >
    <div class="flex items-center justify-around max-w-md mx-auto py-1">
      <button
        v-for="item in navItems"
        :key="item.name"
        @click="navigateTo(item.path)"
        class="flex flex-col items-center gap-1 relative px-4 py-1 rounded-2xl transition-all duration-200"
        :class="[
          currentRouteName === item.name
            ? 'text-fematch-pink-600 dark:text-fematch-pink-400 font-bold scale-105'
            : 'text-gray-400 dark:text-gray-500 hover:text-fematch-violet-400 font-medium'
        ]"
      >
        <div class="relative">
          <component
            :is="item.icon"
            class="w-6 h-6 transition-transform"
            :class="{ 'stroke-[2.5px]': currentRouteName === item.name }"
          />

          <!-- Dynamic Unread Badge -->
          <span
            v-if="item.badge"
            class="absolute -top-1 -right-2 px-1.5 py-0.2 text-[10px] font-extrabold bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white rounded-full shadow-sm"
          >
            {{ item.badge }}
          </span>
        </div>

        <span class="text-[11px] tracking-wide">{{ item.label }}</span>

        <!-- Active dot indicator -->
        <div
          v-if="currentRouteName === item.name"
          class="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-fematch-pink-500 to-fematch-cyan-400 shadow-pastel-pink"
        />
        <div v-else class="w-1.5 h-1.5" />
      </button>
    </div>
  </nav>
</template>
