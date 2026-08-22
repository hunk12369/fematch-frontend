<script setup lang="ts">
import { ref } from 'vue'
import type { MatchCandidate } from '@/api/types'
import {
  Heart,
  X,
  Star,
  MapPin,
  BadgeCheck,
  Sparkles,
  Info,
} from 'lucide-vue-next'

const props = defineProps<{
  candidate: MatchCandidate
}>()

const emit = defineEmits<{
  (e: 'swipe', action: 'like' | 'pass' | 'superlike'): void
}>()

const activePhotoIndex = ref(0)
const showFullBio = ref(false)

function nextPhoto() {
  if (activePhotoIndex.value < props.candidate.photos.length - 1) {
    activePhotoIndex.value++
  } else {
    activePhotoIndex.value = 0
  }
}

function prevPhoto() {
  if (activePhotoIndex.value > 0) {
    activePhotoIndex.value--
  } else {
    activePhotoIndex.value = props.candidate.photos.length - 1
  }
}
</script>

<template>
  <div class="relative w-full h-[66vh] max-h-[580px] rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-fematch-pink-200/30 dark:border-fematch-violet-900/50 select-none flex flex-col justify-end">
    <!-- Profile Photos Carousel -->
    <img
      :src="candidate.photos[activePhotoIndex] || candidate.photos[0]"
      :alt="candidate.name"
      class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
    />

    <!-- Touch photo switch zones -->
    <div class="absolute inset-0 flex z-10">
      <div class="w-1/2 h-4/5" @click="prevPhoto" />
      <div class="w-1/2 h-4/5" @click="nextPhoto" />
    </div>

    <!-- Photo indicators -->
    <div
      v-if="candidate.photos.length > 1"
      class="absolute top-3 inset-x-4 flex gap-1.5 z-20"
    >
      <div
        v-for="(_, index) in candidate.photos"
        :key="index"
        class="h-1 flex-1 rounded-full transition-all duration-200"
        :class="[
          index === activePhotoIndex
            ? 'bg-white shadow-sm'
            : 'bg-white/40 backdrop-blur-xs'
        ]"
      />
    </div>

    <!-- Compatibility & Distance Badges (Top) -->
    <div class="absolute top-7 inset-x-4 flex justify-between items-center z-20">
      <div
        class="flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-sm"
      >
        <MapPin class="w-3.5 h-3.5 text-fematch-cyan-400" />
        <span>{{ candidate.distanceKm || 2 }} km</span>
      </div>

      <div
        class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 text-xs font-extrabold text-white shadow-pastel-pink animate-pulse-gentle"
      >
        <Sparkles class="w-3.5 h-3.5 text-white" />
        <span>{{ candidate.compatibilityScore }}% Compatible</span>
      </div>
    </div>

    <!-- Dark Gradient Overlay for legible text -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10"
    />

    <!-- Profile Information Container -->
    <div class="relative z-20 p-5 text-white flex flex-col gap-2.5">
      <!-- Name, Age & Verified -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-2xl font-black tracking-tight drop-shadow-md">
            {{ candidate.name }}, {{ candidate.age }}
          </h2>
          <BadgeCheck
            v-if="candidate.verified"
            class="w-6 h-6 text-fematch-cyan-400 fill-fematch-cyan-400/20"
          />
        </div>

        <button
          @click="showFullBio = !showFullBio"
          class="p-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"
        >
          <Info class="w-4 h-4 text-white" />
        </button>
      </div>

      <!-- Bio -->
      <p
        class="text-xs text-gray-200 leading-relaxed drop-shadow"
        :class="{ 'line-clamp-2': !showFullBio }"
      >
        {{ candidate.bio }}
      </p>

      <!-- Interests Tags -->
      <div class="flex flex-wrap gap-1.5 pt-1">
        <span
          v-for="(interest, i) in candidate.interests"
          :key="interest"
          class="px-2.5 py-0.8 rounded-full text-[11px] font-semibold backdrop-blur-md border shadow-xs"
          :class="[
            i % 3 === 0
              ? 'bg-fematch-pink-500/30 border-fematch-pink-400/50 text-fematch-pink-200'
              : i % 3 === 1
              ? 'bg-fematch-violet-500/30 border-fematch-violet-400/50 text-fematch-violet-200'
              : 'bg-fematch-cyan-500/30 border-fematch-cyan-400/50 text-fematch-cyan-200'
          ]"
        >
          {{ interest }}
        </span>
      </div>

      <!-- Swipe Action Buttons -->
      <div class="flex items-center justify-center gap-5 pt-3 pb-1">
        <!-- Pass Button -->
        <button
          @click="emit('swipe', 'pass')"
          class="w-13 h-13 rounded-full bg-white/15 backdrop-blur-lg border border-white/20 text-rose-400 flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-rose-500 hover:text-white"
          title="Pasar"
        >
          <X class="w-6 h-6 stroke-[3]" />
        </button>

        <!-- Super Like Button (Turquoise/Cyan) -->
        <button
          @click="emit('swipe', 'superlike')"
          class="w-11 h-11 rounded-full bg-gradient-to-tr from-fematch-cyan-500 to-fematch-cyan-300 text-white flex items-center justify-center shadow-pastel-cyan active:scale-90 transition-all"
          title="Super Like"
        >
          <Star class="w-5 h-5 fill-white stroke-none" />
        </button>

        <!-- Like Button (Pink/Violet) -->
        <button
          @click="emit('swipe', 'like')"
          class="w-14 h-14 rounded-full bg-gradient-to-tr from-fematch-pink-500 via-fematch-violet-500 to-fematch-pink-400 text-white flex items-center justify-center shadow-pastel-pink active:scale-90 transition-all hover:scale-105"
          title="Like"
        >
          <Heart class="w-7 h-7 fill-white stroke-none" />
        </button>
      </div>
    </div>
  </div>
</template>
