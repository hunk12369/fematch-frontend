<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MatchCandidate } from '@/api/types'
import { useMatchesStore } from '@/stores/matches.store'
import { useHaptics } from '@/composables/useHaptics'
import MatchCard from './MatchCard.vue'
import MatchModal from './MatchModal.vue'
import { RefreshCw, HeartHandshake, Sparkles, Loader2, Sliders } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    candidates?: MatchCandidate[]
    maxVisibleCards?: number
  }>(),
  {
    maxVisibleCards: 3,
  }
)

const emit = defineEmits<{
  (e: 'swipe', action: 'like' | 'pass' | 'superlike', candidate: MatchCandidate): void
  (e: 'match', candidate: MatchCandidate): void
  (e: 'empty'): void
  (e: 'open-filters'): void
}>()

const matchesStore = useMatchesStore()
const haptics = useHaptics()

// Referencia al componente MatchCard superior para acciones programáticas
const topCardRef = ref<InstanceType<typeof MatchCard> | null>(null)

// Lista reactiva de candidatos (por prop o desde el store)
const activeCandidates = computed(() => {
  return props.candidates && props.candidates.length > 0
    ? props.candidates
    : matchesStore.candidates
})

const currentIndex = computed(() => matchesStore.currentIndex)
const isLoading = computed(() => matchesStore.isLoading)

// Obtener la sub-pila de tarjetas visibles (máximo 3)
const visibleCards = computed(() => {
  const list = activeCandidates.value
  const start = currentIndex.value
  return list.slice(start, start + props.maxVisibleCards).map((candidate, idx) => ({
    candidate,
    indexOffset: idx,
    isTop: idx === 0,
  }))
})

const hasCards = computed(() => visibleCards.value.length > 0)
const topCandidate = computed(() => visibleCards.value[0]?.candidate || null)

/**
 * Procesa la acción de swipe (arrastrado o botón)
 */
async function handleSwipe(action: 'like' | 'pass' | 'superlike') {
  const candidate = topCandidate.value
  if (!candidate) return

  // Disparar mutación en matchService a través del store
  const result = await matchesStore.handleSwipe(action)

  emit('swipe', action, candidate)

  if (result?.isMatch) {
    emit('match', candidate)
  }

  if (currentIndex.value >= activeCandidates.value.length) {
    emit('empty')
  }
}

/**
 * Dispara swipe programático en la tarjeta superior con animación fluida
 */
function swipeTopCard(action: 'like' | 'pass' | 'superlike') {
  if (topCardRef.value?.swipeProgrammatically) {
    topCardRef.value.swipeProgrammatically(action)
  } else {
    handleSwipe(action)
  }
}

function reloadDeck() {
  haptics.impact('light')
  matchesStore.loadDiscoveryFeed(true)
}

defineExpose({
  swipe: swipeTopCard,
  reload: reloadDeck,
})
</script>

<template>
  <div class="relative w-full h-full flex flex-col justify-center items-center">
    <!-- Estado de Carga (Spinner animado mientras consulta /api/feed) -->
    <div
      v-if="isLoading && !hasCards"
      class="w-full max-w-sm h-[68vh] max-h-[600px] rounded-3xl bg-tg-secondary-bg border border-fematch-pink-200/60 dark:border-fematch-violet-900/60 flex flex-col items-center justify-center gap-3 p-6 text-center shadow-pastel-pink animate-pulse"
    >
      <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-fematch-pink-500 to-fematch-violet-500 flex items-center justify-center text-white shadow-pastel-pink">
        <Loader2 class="w-8 h-8 animate-spin" />
      </div>
      <span class="text-sm font-bold text-tg-text">Buscando perfiles afines...</span>
      <span class="text-xs text-tg-hint">Sintonizando tu radar de Fematch</span>
    </div>

    <!-- Pila de Tarjetas Interactivas (Stack Deck) -->
    <div
      v-else-if="hasCards"
      class="relative w-full max-w-sm h-[68vh] max-h-[600px] perspective-1000"
    >
      <!-- Renderizar tarjetas en orden inverso para que la superior quede encima en el DOM -->
      <MatchCard
        v-for="item in [...visibleCards].reverse()"
        :key="item.candidate.id"
        :ref="(el) => { if (item.isTop) topCardRef = el as any }"
        :candidate="item.candidate"
        :is-top="item.isTop"
        :index-offset="item.indexOffset"
        @swipe="handleSwipe"
      />
    </div>

    <!-- Empty State cuando no hay perfiles devueltos por el backend -->
    <div
      v-else
      class="w-full max-w-sm p-8 rounded-3xl bg-tg-secondary-bg border border-fematch-pink-200 dark:border-fematch-violet-900/60 text-center flex flex-col items-center gap-4 shadow-sm animate-fade-in"
    >
      <div
        class="w-16 h-16 rounded-full bg-gradient-to-tr from-fematch-pink-100 to-fematch-violet-100 dark:from-fematch-pink-900/40 dark:to-fematch-violet-900/40 flex items-center justify-center text-fematch-pink-500 shadow-inner"
      >
        <HeartHandshake class="w-8 h-8" />
      </div>

      <div>
        <div class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-fematch-pink-50 dark:bg-fematch-pink-950/60 text-[11px] font-bold text-fematch-pink-600 dark:text-fematch-pink-300 mb-2">
          <Sparkles class="w-3 h-3" />
          <span>Fematch Radar</span>
        </div>
        <h3 class="text-lg font-extrabold text-tg-text mb-1">
          No hay perfiles cerca por ahora
        </h3>
        <p class="text-xs text-tg-hint leading-relaxed">
          Has explorado todos los perfiles disponibles en tu área con tus filtros actuales. Intenta ampliar el radio de distancia o tus preferencias.
        </p>
      </div>

      <div class="flex flex-col w-full gap-2 mt-2">
        <button
          type="button"
          @click="reloadDeck"
          class="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-bold text-xs shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>Actualizar Radar</span>
        </button>

        <button
          type="button"
          @click="emit('open-filters')"
          class="w-full py-2.5 px-4 rounded-2xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-semibold text-tg-text hover:bg-tg-secondary-bg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Sliders class="w-3.5 h-3.5 text-fematch-violet-500" />
          <span>Ajustar Filtros de Búsqueda</span>
        </button>
      </div>
    </div>

    <!-- Modal de Celebración de Match -->
    <MatchModal
      :is-open="matchesStore.isMatchModalOpen"
      :matched-candidate="matchesStore.lastMatch"
      @close="matchesStore.closeMatchModal"
    />
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}
</style>
