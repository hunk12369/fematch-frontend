<script setup lang="ts">
import { onMounted } from 'vue'
import { useMatchesStore } from '@/stores/matches.store'
import SwipeDeck from '@/components/ui/SwipeDeck.vue'

const matchesStore = useMatchesStore()

onMounted(() => {
  if (matchesStore.candidates.length === 0) {
    matchesStore.loadDiscoveryFeed()
  }
})
</script>

<template>
  <div class="flex-1 flex flex-col justify-center items-center px-4 py-3 relative overflow-hidden">
    <!-- Componente Interactivo SwipeDeck con Gestos Táctiles y Pila 3D -->
    <SwipeDeck />
  </div>
</template>
