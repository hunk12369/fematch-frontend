<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useMatchesStore } from '@/stores/matches.store'
import MatchCard from '@/components/ui/MatchCard.vue'
import MatchModal from '@/components/ui/MatchModal.vue'
import { RefreshCw, HeartHandshake } from 'lucide-vue-next'

const matchesStore = useMatchesStore()

onMounted(() => {
  if (matchesStore.candidates.length === 0) {
    matchesStore.loadDiscoveryFeed()
  }
})

const currentCandidate = computed(() => {
  return matchesStore.candidates[matchesStore.currentIndex] || null
})

const hasMore = computed(() => {
  return matchesStore.currentIndex < matchesStore.candidates.length
})

function onSwipe(action: 'like' | 'pass' | 'superlike') {
  matchesStore.handleSwipe(action)
}

function onReloadFeed() {
  matchesStore.loadDiscoveryFeed()
}
</script>

<template>
  <div class="flex-1 flex flex-col justify-center items-center px-4 py-3 relative overflow-hidden">
    <!-- Active Match Card -->
    <div v-if="hasMore && currentCandidate" class="w-full max-w-sm">
      <MatchCard
        :key="currentCandidate.id"
        :candidate="currentCandidate"
        @swipe="onSwipe"
      />
    </div>

    <!-- Empty State when feed is finished -->
    <div
      v-else
      class="w-full max-w-sm p-8 rounded-3xl bg-tg-secondary-bg border border-fematch-pink-200 dark:border-fematch-violet-900/60 text-center flex flex-col items-center gap-4 shadow-sm"
    >
      <div
        class="w-16 h-16 rounded-full bg-gradient-to-tr from-fematch-pink-100 to-fematch-violet-100 dark:from-fematch-pink-900/40 dark:to-fematch-violet-900/40 flex items-center justify-center text-fematch-pink-500 shadow-inner"
      >
        <HeartHandshake class="w-8 h-8" />
      </div>

      <div>
        <h3 class="text-lg font-extrabold text-tg-text mb-1">
          ¡Estás al día!
        </h3>
        <p class="text-xs text-tg-hint leading-relaxed">
          Has explorado todos los perfiles cercanos por el momento. Vuelve pronto para nuevas conexiones en Fematch.
        </p>
      </div>

      <button
        @click="onReloadFeed"
        class="mt-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-bold text-xs shadow-pastel-pink active:scale-95 transition-transform flex items-center gap-2"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Recargar Perfiles</span>
      </button>
    </div>

    <!-- Match Celebration Modal -->
    <MatchModal
      :is-open="matchesStore.isMatchModalOpen"
      :matched-candidate="matchesStore.lastMatch"
      @close="matchesStore.closeMatchModal"
    />
  </div>
</template>
