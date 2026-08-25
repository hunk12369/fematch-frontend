<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { matchService } from '@/api/services/match.service'
import type { User } from '@/api/types'
import { GENDER_IDENTITY_LABELS } from '@/api/types'
import { useHaptics } from '@/composables/useHaptics'
import { ArrowLeft, Send, MapPin, ExternalLink, ShieldCheck, Heart } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const haptics = useHaptics()

const matchId = (route.params.id as string) || ''
const match = ref<User | null>(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    const matches = await matchService.getMatches()
    match.value = matches.find((m) => m.id === matchId) || matches[0] || null
  } finally {
    isLoading.value = false
  }
})

function openTelegramChat() {
  haptics.impact('medium')
  const username = match.value?.username

  if (!username) {
    alert('Este usuario no tiene un alias público de Telegram configurado.')
    return
  }

  const telegramUrl = `https://t.me/${username.replace('@', '')}`

  // Si estamos en Telegram WebApp, usar el método nativo
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(telegramUrl)
  } else {
    window.open(telegramUrl, '_blank')
  }
}

function goBack() {
  haptics.selection()
  router.back()
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full bg-tg-bg text-tg-text relative overflow-hidden select-none">
    <!-- Chat Header -->
    <header class="px-4 py-3 bg-tg-bg/95 backdrop-blur-md border-b border-fematch-pink-100 dark:border-fematch-violet-900/40 flex items-center justify-between sticky top-0 z-20">
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="goBack"
          class="p-1.5 -ml-1 rounded-full text-tg-text hover:bg-tg-secondary-bg active:scale-95 transition-transform"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-2.5">
          <div class="relative w-9 h-9 rounded-full overflow-hidden border border-fematch-pink-300">
            <img
              :src="match?.photos[0]?.url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80'"
              :alt="match?.firstName"
              class="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 class="text-sm font-extrabold text-tg-text flex items-center gap-1">
              <span>{{ match?.firstName || 'Conexión' }}</span>
              <ShieldCheck class="w-3.5 h-3.5 text-fematch-cyan-500" />
            </h2>
            <span class="text-[10px] text-fematch-pink-500 font-semibold">
              {{ match?.genderIdentity ? (GENDER_IDENTITY_LABELS[match.genderIdentity as keyof typeof GENDER_IDENTITY_LABELS] || match.genderIdentity) : 'Fematch Match' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center text-center gap-6">
      <!-- Match Hero Visual Card -->
      <div class="relative w-44 h-56 rounded-3xl overflow-hidden border-3 border-fematch-pink-300 dark:border-fematch-violet-700 shadow-2xl bg-neutral-900">
        <img
          :src="match?.photos[0]?.url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'"
          :alt="match?.firstName"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-left">
          <h3 class="text-base font-black text-white">
            {{ match?.firstName || 'Match' }}, {{ match?.age || 24 }}
          </h3>
          <span v-if="match?.city" class="text-[10px] text-white/90 flex items-center gap-1">
            <MapPin class="w-3 h-3 text-fematch-cyan-400" />
            <span>{{ match.city }}</span>
          </span>
        </div>
      </div>

      <!-- Match Connection Details -->
      <div class="max-w-xs space-y-2">
        <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-fematch-pink-500/15 to-fematch-violet-500/15 text-fematch-pink-600 dark:text-fematch-pink-300 text-xs font-bold">
          <Heart class="w-3.5 h-3.5 fill-current" />
          <span>¡Conexión Mutua!</span>
        </div>

        <h3 class="text-xl font-black text-tg-text">
          Chatea directamente en Telegram
        </h3>

        <p class="text-xs text-tg-hint leading-relaxed">
          Para garantizar la máxima privacidad y sincronización de mensajes instantáneos, las conversaciones se realizan en Telegram nativo.
        </p>

        <div v-if="match?.bio" class="p-3 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text italic">
          "{{ match.bio }}"
        </div>
      </div>

      <!-- Action Button to Open Native Telegram Chat -->
      <div class="w-full max-w-xs space-y-2">
        <button
          type="button"
          @click="openTelegramChat"
          class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-extrabold text-sm shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Send class="w-4 h-4" />
          <span>Abrir Chat con @{{ match?.username || match?.firstName || 'usuario' }}</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </button>

        <span class="text-[10px] text-tg-hint block">
          Se abrirá tu conversación privada y cifrada en Telegram
        </span>
      </div>
    </main>
  </div>
</template>
