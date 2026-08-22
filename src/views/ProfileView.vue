<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTelegramStore } from '@/stores/telegram.store'
import { userService } from '@/api/services/user.service'
import type { UserProfile } from '@/api/types'
import { useHaptics } from '@/composables/useHaptics'
import {
  ShieldCheck,
  Crown,
  Heart,
  Sparkles,
  Send,
  Zap,
} from 'lucide-vue-next'

const tgStore = useTelegramStore()
const haptics = useHaptics()

const profile = ref<UserProfile | null>(null)
const isLoading = ref(true)
const apiTestStatus = ref<string | null>(null)
const lastApiPayload = ref<any>(null)

onMounted(async () => {
  try {
    profile.value = await userService.getMe()
  } finally {
    isLoading.value = false
  }
})

async function testApiCall() {
  haptics.impact('medium')
  apiTestStatus.value = 'Enviando petición a la API con Axios...'
  try {
    const data = await userService.getMe()
    lastApiPayload.value = data
    apiTestStatus.value = '✅ Petición exitosa con encabezado Authorization: tma ...'
    haptics.notification('success')
  } catch (err: any) {
    apiTestStatus.value = `❌ Error: ${err.message}`
    haptics.notification('error')
  }
}

function testHaptic(style: 'light' | 'medium' | 'heavy') {
  haptics.impact(style)
}
</script>

<template>
  <div class="flex-1 flex flex-col px-4 py-4 overflow-y-auto no-scrollbar gap-4 pb-12">
    <!-- User Hero Card -->
    <div
      class="relative p-5 rounded-3xl bg-tg-secondary-bg border border-fematch-pink-200 dark:border-fematch-violet-900/60 shadow-sm overflow-hidden flex flex-col items-center text-center"
    >
      <!-- Background Ambient Glow -->
      <div class="absolute -top-10 -right-10 w-36 h-36 bg-fematch-pink-400/20 rounded-full blur-2xl pointer-events-none" />
      <div class="absolute -bottom-10 -left-10 w-36 h-36 bg-fematch-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

      <!-- Avatar with Gradient Ring -->
      <div class="relative mb-3">
        <div class="p-1 rounded-full bg-gradient-to-tr from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 shadow-pastel-pink">
          <img
            :src="tgStore.user?.photo_url || profile?.photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'"
            :alt="tgStore.userFullName"
            class="w-20 h-20 rounded-full object-cover border-2 border-tg-bg"
          />
        </div>
        <div
          v-if="tgStore.user?.is_premium"
          class="absolute bottom-0 right-0 p-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full text-white shadow-sm"
          title="Telegram Premium"
        >
          <Crown class="w-3.5 h-3.5 fill-white" />
        </div>
      </div>

      <!-- Names & Telegram Alias -->
      <h2 class="text-xl font-extrabold text-tg-text flex items-center gap-1.5">
        <span>{{ tgStore.userFullName }}</span>
        <ShieldCheck class="w-5 h-5 text-fematch-cyan-500" />
      </h2>
      <p class="text-xs text-fematch-pink-600 dark:text-fematch-pink-400 font-semibold mb-3">
        @{{ tgStore.user?.username || 'fematch_user' }} • Telegram ID: {{ tgStore.user?.id || '987654321' }}
      </p>

      <!-- Stats Bar -->
      <div class="grid grid-cols-3 gap-2 w-full pt-3 border-t border-fematch-pink-100 dark:border-fematch-violet-900/40">
        <div class="p-2 rounded-2xl bg-tg-bg">
          <span class="block text-sm font-black text-fematch-pink-500">
            {{ profile?.matchesCount || 28 }}
          </span>
          <span class="text-[10px] text-tg-hint font-medium">Matches</span>
        </div>
        <div class="p-2 rounded-2xl bg-tg-bg">
          <span class="block text-sm font-black text-fematch-violet-500">
            {{ profile?.likesCount || 142 }}
          </span>
          <span class="text-[10px] text-tg-hint font-medium">Likes</span>
        </div>
        <div class="p-2 rounded-2xl bg-tg-bg">
          <span class="block text-sm font-black text-fematch-cyan-500">98%</span>
          <span class="text-[10px] text-tg-hint font-medium">Rating</span>
        </div>
      </div>
    </div>

    <!-- Bio & Interests Card -->
    <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-tg-hint flex items-center gap-1.5">
        <Heart class="w-3.5 h-3.5 text-fematch-pink-500" />
        <span>Sobre Mí</span>
      </h3>
      <p class="text-xs text-tg-text leading-relaxed">
        {{ profile?.bio || 'Creativa, amante del café de especialidad y la buena música. Buscando conectar con personas afines.' }}
      </p>

      <div class="flex flex-wrap gap-1.5 pt-1">
        <span
          v-for="(interest, i) in profile?.interests || ['Diseño', 'Arte', 'Café', 'Fotografía', 'Música']"
          :key="interest"
          class="px-2.5 py-1 rounded-full text-[11px] font-semibold"
          :class="[
            i % 3 === 0
              ? 'bg-fematch-pink-100 dark:bg-fematch-pink-950/60 text-fematch-pink-700 dark:text-fematch-pink-300'
              : i % 3 === 1
              ? 'bg-fematch-violet-100 dark:bg-fematch-violet-950/60 text-fematch-violet-700 dark:text-fematch-violet-300'
              : 'bg-fematch-cyan-100 dark:bg-fematch-cyan-950/60 text-fematch-cyan-700 dark:text-fematch-cyan-300'
          ]"
        >
          {{ interest }}
        </span>
      </div>
    </div>

    <!-- Centralized Axios & TMA Authorization Demo Card -->
    <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-violet-200 dark:border-fematch-violet-900/60 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-fematch-violet-600 dark:text-fematch-violet-400 flex items-center gap-1.5">
          <Zap class="w-3.5 h-3.5" />
          <span>API & Auth Header TMA</span>
        </h3>
        <span class="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          Axios Ready
        </span>
      </div>

      <p class="text-xs text-tg-hint leading-relaxed">
        Todas las peticiones a la API adjuntan automáticamente la cabecera:
      </p>

      <div class="p-2.5 rounded-xl bg-black/80 font-mono text-[11px] text-emerald-400 break-all select-all">
        Authorization: tma {{ tgStore.initData || 'query_id=...&user=...' }}
      </div>

      <button
        @click="testApiCall"
        class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-bold text-xs shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        <Send class="w-3.5 h-3.5" />
        <span>Probar Petición con Axios Interceptor</span>
      </button>

      <div v-if="apiTestStatus" class="text-xs font-semibold text-fematch-pink-600 dark:text-fematch-pink-300">
        {{ apiTestStatus }}
      </div>
    </div>

    <!-- Haptics Test Playground -->
    <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-cyan-100 dark:border-fematch-cyan-900/40 space-y-2.5">
      <h3 class="text-xs font-bold uppercase tracking-wider text-fematch-cyan-600 dark:text-fematch-cyan-400 flex items-center gap-1.5">
        <Sparkles class="w-3.5 h-3.5" />
        <span>Telegram Haptic Feedback</span>
      </h3>

      <div class="grid grid-cols-3 gap-2">
        <button
          @click="testHaptic('light')"
          class="py-2 px-2 rounded-xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-semibold text-tg-text active:scale-95"
        >
          Light
        </button>
        <button
          @click="testHaptic('medium')"
          class="py-2 px-2 rounded-xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-semibold text-tg-text active:scale-95"
        >
          Medium
        </button>
        <button
          @click="testHaptic('heavy')"
          class="py-2 px-2 rounded-xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-semibold text-tg-text active:scale-95"
        >
          Heavy
        </button>
      </div>
    </div>
  </div>
</template>
