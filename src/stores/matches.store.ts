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
  const currentPage = ref(1)
  const isLoading = ref(false)
  const lastMatch = ref<MatchCandidate | null>(null)
  const isMatchModalOpen = ref(false)

  async function loadDiscoveryFeed(reset = false) {
    if (reset) {
      currentPage.value = 1
      candidates.value = []
      currentIndex.value = 0
    }
    isLoading.value = true
    try {
      const newProfiles = await matchService.getDiscoveryFeed(currentPage.value, 20)
      if (reset || candidates.value.length === 0) {
        candidates.value = newProfiles
        currentIndex.value = 0
      } else {
        const existingIds = new Set(candidates.value.map((c) => c.id))
        const unique = newProfiles.filter((c) => !existingIds.has(c.id))
        candidates.value.push(...unique)
      }
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

      // Cargar más perfiles si se acerca al final de la pila
      if (currentIndex.value >= candidates.value.length - 3 && !isLoading.value) {
        currentPage.value++
        loadDiscoveryFeed(false)
      }

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
    currentPage,
    isLoading,
    lastMatch,
    isMatchModalOpen,
    loadDiscoveryFeed,
    loadMatches,
    handleSwipe,
    closeMatchModal,
  }
})
