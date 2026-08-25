<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTelegramStore } from '@/stores/telegram.store'
import type { User } from '@/api/types'
import { MessageCircle, Sparkles, Heart } from 'lucide-vue-next'
import { useHaptics } from '@/composables/useHaptics'

const props = defineProps<{
  isOpen: boolean
  matchedCandidate: User | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const tgStore = useTelegramStore()
const haptics = useHaptics()

function onChatNow() {
  haptics.impact('medium')
  emit('close')
  if (props.matchedCandidate) {
    router.push(`/chat/${props.matchedCandidate.id}`)
  }
}

function onKeepSwiping() {
  haptics.selection()
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen && matchedCandidate"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
  >
    <div
      class="relative w-full max-w-sm rounded-4xl bg-gradient-to-b from-fematch-violet-950 via-slate-900 to-black p-6 border border-fematch-pink-400/40 text-center shadow-2xl overflow-hidden"
    >
      <!-- Background Ambient Glow -->
      <div
        class="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-fematch-pink-500/30 rounded-full blur-3xl pointer-events-none"
      />
      <div
        class="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-fematch-cyan-500/25 rounded-full blur-3xl pointer-events-none"
      />

      <!-- Header badge -->
      <div class="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-fematch-pink-500/20 border border-fematch-pink-400/40 text-fematch-pink-300 text-xs font-bold mb-4 shadow-sm">
        <Sparkles class="w-3.5 h-3.5" />
        <span>Nueva Conexión Especial</span>
      </div>

      <h2
        class="text-3xl font-black bg-gradient-to-r from-fematch-pink-400 via-fematch-violet-300 to-fematch-cyan-300 bg-clip-text text-transparent mb-1"
      >
        ¡Es un Match!
      </h2>
      <p class="text-xs text-gray-300 mb-6">
        Tú y <span class="font-bold text-white">{{ matchedCandidate.firstName }}</span> se han gustado mutuamente.
      </p>

      <!-- Intersecting User Avatars with Heart Badge -->
      <div class="relative flex justify-center items-center h-28 mb-8">
        <!-- Current User Avatar -->
        <div
          class="w-22 h-22 rounded-full ring-4 ring-fematch-pink-400 overflow-hidden shadow-pastel-pink -mr-4 z-10"
        >
          <img
            :src="tgStore.user?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'"
            alt="Tu perfil"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Heart Intersection Badge -->
        <div
          class="absolute z-30 w-10 h-10 rounded-full bg-gradient-to-tr from-fematch-pink-500 to-fematch-violet-500 flex items-center justify-center shadow-lg animate-bounce"
        >
          <Heart class="w-5 h-5 fill-white text-white" />
        </div>

        <!-- Matched User Avatar -->
        <div
          class="w-22 h-22 rounded-full ring-4 ring-fematch-cyan-400 overflow-hidden shadow-pastel-cyan -ml-4 z-10"
        >
          <img
            :src="matchedCandidate.photos[0]?.url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80'"
            :alt="matchedCandidate.firstName"
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-3">
        <button
          type="button"
          @click="onChatNow"
          class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-bold text-sm shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <MessageCircle class="w-4 h-4" />
          <span>Ver Conexión</span>
        </button>

        <button
          type="button"
          @click="onKeepSwiping"
          class="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-gray-200 font-semibold text-xs transition-colors"
        >
          Seguir Explorando
        </button>
      </div>
    </div>
  </div>
</template>
