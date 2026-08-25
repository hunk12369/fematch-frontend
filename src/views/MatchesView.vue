<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches.store'
import { useHaptics } from '@/composables/useHaptics'
import { GENDER_IDENTITY_LABELS } from '@/api/types'
import { Search, Sparkles, Heart, MessageCircle, Send } from 'lucide-vue-next'

const router = useRouter()
const matchesStore = useMatchesStore()
const haptics = useHaptics()

onMounted(() => {
  matchesStore.loadMatches()
})

function openChat(chatId: string) {
  haptics.selection()
  router.push(`/chat/${chatId}`)
}
</script>

<template>
  <div class="flex-1 flex flex-col px-4 py-3 overflow-y-auto no-scrollbar gap-4 select-none">
    <!-- Search Bar -->
    <div class="relative">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-tg-hint" />
      <input
        type="text"
        placeholder="Buscar matches o conexiones..."
        class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text placeholder-tg-hint focus:outline-none focus:ring-2 focus:ring-fematch-pink-400"
      />
    </div>

    <!-- New Matches Section (Horizontal Avatars) -->
    <section>
      <div class="flex items-center justify-between mb-2.5">
        <h2 class="text-xs font-bold uppercase tracking-wider text-fematch-pink-600 dark:text-fematch-pink-400 flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Nuevas Conexiones ({{ matchesStore.matches.length }})</span>
        </h2>
      </div>

      <!-- Empty Matches State -->
      <div
        v-if="matchesStore.matches.length === 0"
        class="p-6 rounded-3xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-center flex flex-col items-center gap-2"
      >
        <div class="w-12 h-12 rounded-full bg-fematch-pink-500/10 text-fematch-pink-500 flex items-center justify-center">
          <Heart class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-bold text-tg-text">Aún no tienes conexiones</h3>
        <p class="text-xs text-tg-hint">Continúa explorando en el radar de citas para encontrar tu próximo match.</p>
      </div>

      <div v-else class="flex gap-3 overflow-x-auto no-scrollbar py-1">
        <div
          v-for="match in matchesStore.matches"
          :key="match.id"
          @click="openChat(match.id)"
          class="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform flex-shrink-0"
        >
          <div class="relative p-0.5 rounded-full bg-gradient-to-tr from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 shadow-pastel-pink">
            <img
              :src="match.photos[0]?.url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80'"
              :alt="match.firstName"
              class="w-14 h-14 rounded-full object-cover border-2 border-tg-bg"
            />
            <span
              v-if="match.online"
              class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-fematch-cyan-400 border-2 border-tg-bg rounded-full shadow-xs"
            />
          </div>
          <span class="text-[11px] font-bold text-tg-text max-w-[65px] truncate text-center">
            {{ match.firstName }}
          </span>
        </div>
      </div>
    </section>

    <!-- Active Conversations Section -->
    <section v-if="matchesStore.matches.length > 0" class="flex-1 flex flex-col">
      <h2 class="text-xs font-bold uppercase tracking-wider text-tg-hint mb-2 flex items-center gap-1.5">
        <MessageCircle class="w-3.5 h-3.5 text-fematch-violet-400" />
        <span>Conversaciones en Telegram</span>
      </h2>

      <div class="space-y-2">
        <div
          v-for="match in matchesStore.matches"
          :key="`chat-${match.id}`"
          @click="openChat(match.id)"
          class="flex items-center gap-3 p-3 rounded-2xl bg-tg-secondary-bg/80 border border-fematch-pink-100/70 dark:border-fematch-violet-900/30 hover:border-fematch-pink-300 transition-all cursor-pointer active:scale-[0.99]"
        >
          <!-- Match Avatar -->
          <div class="relative flex-shrink-0">
            <img
              :src="match.photos[0]?.url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80'"
              :alt="match.firstName"
              class="w-12 h-12 rounded-full object-cover"
            />
            <span
              v-if="match.online"
              class="absolute bottom-0 right-0 w-3 h-3 bg-fematch-cyan-400 border-2 border-tg-bg rounded-full"
            />
          </div>

          <!-- Chat Preview Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-0.5">
              <h3 class="text-sm font-bold text-tg-text truncate">{{ match.firstName }}</h3>
              <span class="text-[10px] text-fematch-pink-500 font-semibold">
                {{ GENDER_IDENTITY_LABELS[match.genderIdentity as keyof typeof GENDER_IDENTITY_LABELS] || match.genderIdentity }}
              </span>
            </div>
            <p class="text-xs text-tg-hint truncate flex items-center gap-1">
              <Send class="w-3 h-3 text-fematch-cyan-500" />
              <span>@{{ match.username || match.firstName }}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
