<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMatchesStore } from '@/stores/matches.store'
import { useUserStore } from '@/stores/user.store'
import SwipeDeck from '@/components/ui/SwipeDeck.vue'
import EditProfileModal from '@/components/profile/EditProfileModal.vue'

const matchesStore = useMatchesStore()
const userStore = useUserStore()
const isFiltersModalOpen = ref(false)

onMounted(() => {
  // Siempre consultar el feed real desde el backend al montar la vista
  matchesStore.loadDiscoveryFeed(true)
})

function handleOpenFilters() {
  isFiltersModalOpen.value = true
}

function handleFiltersSaved() {
  // Recargar el feed con las nuevas preferencias de búsqueda
  matchesStore.loadDiscoveryFeed(true)
}
</script>

<template>
  <div class="flex-1 flex flex-col justify-center items-center px-4 py-3 relative overflow-hidden">
    <!-- Componente Interactivo SwipeDeck con Gestos Táctiles y Pila 3D -->
    <SwipeDeck @open-filters="handleOpenFilters" />

    <!-- Modal de Ajuste de Filtros y Preferencias -->
    <EditProfileModal
      :is-open="isFiltersModalOpen"
      :profile="userStore.profile"
      @close="isFiltersModalOpen = false"
      @saved="handleFiltersSaved"
    />
  </div>
</template>
