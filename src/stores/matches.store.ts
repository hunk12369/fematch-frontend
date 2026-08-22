import { defineStore } from 'pinia'
import { ref } from 'vue'
import { matchService } from '@/api/services/match.service'
import type { MatchCandidate, MatchResult } from '@/api/types'
import { useHaptics } from '@/composables/useHaptics'

export const useMatchesStore = defineStore('matches', () => {
  const haptics = useHaptics()
  const candidates = ref<MatchCandidate[]>([])
  const matches = ref<any[]>([])
  const currentIndex = ref(0)
  const isLoading = ref(false)
  const lastMatch = ref<MatchCandidate | null>(null)
  const isMatchModalOpen = ref(false)

  async function loadDiscoveryFeed() {
    isLoading.value = true
    try {
      candidates.value = await matchService.getDiscoveryFeed()
      currentIndex.value = 0
    } catch (error) {
      console.error('Error loading discovery feed:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadMatches() {
    try {
      matches.value = await matchService.getMatches()
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  async function handleSwipe(action: 'like' | 'pass' | 'superlike'): Promise<MatchResult | null> {
    const currentCandidate = candidates.value[currentIndex.value]
    if (!currentCandidate) return null

    // Haptics según acción
    if (action === 'superlike') {
      haptics.notification('success')
    } else if (action === 'like') {
      haptics.impact('medium')
    } else {
      haptics.impact('light')
    }

    try {
      const result = await matchService.interact(currentCandidate.id, action)

      if (result.isMatch) {
        lastMatch.value = currentCandidate
        isMatchModalOpen.value = true
        haptics.notification('success')
      }

      // Avanzar al siguiente perfil
      currentIndex.value++
      return result
    } catch (error) {
      console.error('Swipe error:', error)
      return null
    }
  }

  function closeMatchModal() {
    isMatchModalOpen.value = false
    lastMatch.value = null
  }

  return {
    candidates,
    matches,
    currentIndex,
    isLoading,
    lastMatch,
    isMatchModalOpen,
    loadDiscoveryFeed,
    loadMatches,
    handleSwipe,
    closeMatchModal,
  }
})
