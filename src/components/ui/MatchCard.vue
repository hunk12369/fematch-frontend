<script setup lang="ts">
import { ref, computed } from 'vue'
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
import { useHaptics } from '@/composables/useHaptics'

const props = withDefaults(
  defineProps<{
    candidate: MatchCandidate
    isTop?: boolean
    indexOffset?: number
  }>(),
  {
    isTop: false,
    indexOffset: 0,
  }
)

const emit = defineEmits<{
  (e: 'swipe', action: 'like' | 'pass' | 'superlike'): void
  (e: 'drag', data: { dx: number; dy: number; action: 'like' | 'pass' | 'superlike' | null }): void
}>()

const haptics = useHaptics()

// Estado interno de fotos y bio
const activePhotoIndex = ref(0)
const showFullBio = ref(false)

// Estado de arrastre (Touch / Pointer Gestures)
const isDragging = ref(false)
const isAnimatingOut = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const currentX = ref(0)
const currentY = ref(0)
const lastThresholdState = ref<'like' | 'pass' | 'superlike' | null>(null)

// Umbrales de activación en píxeles
const THRESHOLD_X = 90
const THRESHOLD_Y_SUPERLIKE = -85

// Distancia total movida para diferenciar Tap de Drag
const totalDragDistance = ref(0)

// Cálculo reactivo de desplazamientos
const deltaX = computed(() => (isDragging.value ? currentX.value - dragStartX.value : 0))
const deltaY = computed(() => (isDragging.value ? currentY.value - dragStartY.value : 0))

// Rotación angular progresiva (máx aprox +/- 18 grados)
const rotationDeg = computed(() => {
  if (isAnimatingOut.value) return currentX.value > 0 ? 25 : -25
  return (deltaX.value / 250) * 18
})

// Opacidades de sellos visuales superpuestos (0 a 1)
const likeOpacity = computed(() => {
  if (deltaX.value <= 10) return 0
  return Math.min(1, deltaX.value / THRESHOLD_X)
})

const nopeOpacity = computed(() => {
  if (deltaX.value >= -10) return 0
  return Math.min(1, Math.abs(deltaX.value) / THRESHOLD_X)
})

const superlikeOpacity = computed(() => {
  if (deltaY.value >= -15 || Math.abs(deltaX.value) > Math.abs(deltaY.value)) return 0
  return Math.min(1, Math.abs(deltaY.value) / Math.abs(THRESHOLD_Y_SUPERLIKE))
})

// Estilo de transformación dinámico
const cardTransformStyle = computed(() => {
  // Tarjetas secundarias en la pila (Stack Depth)
  if (!props.isTop) {
    const scale = 1 - props.indexOffset * 0.05
    const translateY = props.indexOffset * 10
    return {
      transform: `scale3d(${scale}, ${scale}, 1) translate3d(0, ${translateY}px, 0)`,
      zIndex: 10 - props.indexOffset,
      opacity: 1 - props.indexOffset * 0.15,
      transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease',
    }
  }

  // Tarjeta superior siendo arrastrada
  if (isDragging.value) {
    return {
      transform: `translate3d(${deltaX.value}px, ${deltaY.value}px, 0) rotate(${rotationDeg.value}deg)`,
      zIndex: 20,
      transition: 'none',
      cursor: 'grabbing',
    }
  }

  // Animación de salida al confirmar swipe
  if (isAnimatingOut.value) {
    return {
      transform: `translate3d(${currentX.value}px, ${currentY.value}px, 0) rotate(${rotationDeg.value}deg)`,
      zIndex: 25,
      opacity: 0,
      transition: 'transform 0.4s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.3s ease-out',
    }
  }

  // Tarjeta en reposo (rebote suave al centro)
  return {
    transform: 'translate3d(0, 0, 0) rotate(0deg)',
    zIndex: 20,
    transition: 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.25)',
    cursor: 'grab',
  }
})

// Handlers de gestos (Pointer Events compatibles con Touch y Mouse)
function onPointerDown(e: PointerEvent) {
  if (!props.isTop || isAnimatingOut.value) return

  // Evitar iniciar drag si se hace clic en botones de acción inferiores
  const target = e.target as HTMLElement
  if (target.closest('button')) return

  isDragging.value = true
  totalDragDistance.value = 0
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  currentX.value = e.clientX
  currentY.value = e.clientY
  lastThresholdState.value = null

  // Captura de eventos en el elemento para no perder el tracking al salir de los bordes
  ;(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || !props.isTop) return

  currentX.value = e.clientX
  currentY.value = e.clientY

  const dx = currentX.value - dragStartX.value
  const dy = currentY.value - dragStartY.value
  totalDragDistance.value = Math.hypot(dx, dy)

  // Detectar estado de umbral actual
  let currentAction: 'like' | 'pass' | 'superlike' | null = null
  if (dy < THRESHOLD_Y_SUPERLIKE && Math.abs(dx) < Math.abs(dy) * 0.8) {
    currentAction = 'superlike'
  } else if (dx > THRESHOLD_X) {
    currentAction = 'like'
  } else if (dx < -THRESHOLD_X) {
    currentAction = 'pass'
  }

  // Disparar vibración háptica ligera al cruzar o cambiar de umbral
  if (currentAction !== lastThresholdState.value) {
    if (currentAction !== null) {
      haptics.impact('light')
    }
    lastThresholdState.value = currentAction
  }

  emit('drag', { dx, dy, action: currentAction })
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value || !props.isTop) return
  isDragging.value = false

  try {
    ;(e.currentTarget as HTMLElement)?.releasePointerCapture?.(e.pointerId)
  } catch {
    // Ignorar si el puntero ya no está capturado
  }

  const dx = currentX.value - dragStartX.value
  const dy = currentY.value - dragStartY.value

  // Si el usuario solo hizo un "tap" rápido (< 10px), no procesar swipe (permitir cambio de foto)
  if (totalDragDistance.value < 10) {
    return
  }

  // Evaluar si se superó algún umbral de decisión
  if (dy < THRESHOLD_Y_SUPERLIKE && Math.abs(dx) < Math.abs(dy) * 0.8) {
    triggerSwipeOut('superlike')
  } else if (dx > THRESHOLD_X) {
    triggerSwipeOut('like')
  } else if (dx < -THRESHOLD_X) {
    triggerSwipeOut('pass')
  } else {
    // No se superó el umbral -> Retorno elástico al centro
    emit('drag', { dx: 0, dy: 0, action: null })
  }
}

function onPointerCancel() {
  if (!isDragging.value) return
  isDragging.value = false
  emit('drag', { dx: 0, dy: 0, action: null })
}

/**
 * Ejecuta la animación de salida de la tarjeta en la dirección elegida
 */
function triggerSwipeOut(action: 'like' | 'pass' | 'superlike') {
  isAnimatingOut.value = true

  if (action === 'like') {
    currentX.value = window.innerWidth * 1.5
    currentY.value = deltaY.value
  } else if (action === 'pass') {
    currentX.value = -window.innerWidth * 1.5
    currentY.value = deltaY.value
  } else {
    currentX.value = deltaX.value
    currentY.value = -window.innerHeight * 1.2
  }

  // Esperar a que concluya la animación antes de emitir swipe al componente padre
  setTimeout(() => {
    emit('swipe', action)
    isAnimatingOut.value = false
  }, 280)
}

// Navegación de fotos con tap en la mitad izquierda o derecha
function handlePhotoTap(direction: 'prev' | 'next') {
  // Solo permitir si no se estaba arrastrando
  if (totalDragDistance.value > 10) return

  haptics.selection()
  if (direction === 'next') {
    if (activePhotoIndex.value < props.candidate.photos.length - 1) {
      activePhotoIndex.value++
    } else {
      activePhotoIndex.value = 0
    }
  } else {
    if (activePhotoIndex.value > 0) {
      activePhotoIndex.value--
    } else {
      activePhotoIndex.value = props.candidate.photos.length - 1
    }
  }
}

// Exponer método para disparar swipes programáticos desde botones externos
defineExpose({
  swipeProgrammatically: (action: 'like' | 'pass' | 'superlike') => {
    triggerSwipeOut(action)
  },
})
</script>

<template>
  <div
    class="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-fematch-pink-200/30 dark:border-fematch-violet-900/50 select-none flex flex-col justify-end touch-none will-change-transform"
    :style="cardTransformStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <!-- Profile Photos Carousel -->
    <img
      :src="candidate.photos[activePhotoIndex] || candidate.photos[0]"
      :alt="candidate.name"
      draggable="false"
      class="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 select-none"
    />

    <!-- ============================================== -->
    <!-- OVERLAY VISUAL STAMP INDICATORS                -->
    <!-- ============================================== -->

    <!-- LIKE Indicator (Right Swipe Stamp: Vibrant Pink & Emerald) -->
    <div
      class="absolute top-10 left-6 z-30 pointer-events-none transform -rotate-12 transition-opacity duration-100 ease-out"
      :style="{ opacity: likeOpacity }"
    >
      <div
        class="flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-fematch-pink-400 bg-black/40 backdrop-blur-md shadow-pastel-pink"
      >
        <Heart class="w-7 h-7 text-fematch-pink-400 fill-fematch-pink-400" />
        <span class="text-2xl font-black tracking-wider text-fematch-pink-400 uppercase">
          LIKE
        </span>
      </div>
    </div>

    <!-- NOPE / PASS Indicator (Left Swipe Stamp: Vibrant Red / Rose) -->
    <div
      class="absolute top-10 right-6 z-30 pointer-events-none transform rotate-12 transition-opacity duration-100 ease-out"
      :style="{ opacity: nopeOpacity }"
    >
      <div
        class="flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-rose-500 bg-black/40 backdrop-blur-md shadow-lg"
      >
        <X class="w-7 h-7 text-rose-500 stroke-[3.5]" />
        <span class="text-2xl font-black tracking-wider text-rose-500 uppercase">
          NOPE
        </span>
      </div>
    </div>

    <!-- SUPER LIKE Indicator (Up Swipe Stamp: Cyan / Turquoise) -->
    <div
      class="absolute top-12 inset-x-0 mx-auto w-max z-30 pointer-events-none transition-opacity duration-100 ease-out"
      :style="{ opacity: superlikeOpacity }"
    >
      <div
        class="flex items-center gap-2 px-5 py-2 rounded-2xl border-4 border-fematch-cyan-400 bg-black/50 backdrop-blur-md shadow-pastel-cyan animate-pulse-gentle"
      >
        <Star class="w-7 h-7 text-fematch-cyan-400 fill-fematch-cyan-400" />
        <span class="text-xl font-black tracking-wider text-fematch-cyan-400 uppercase">
          SUPER LIKE
        </span>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TOUCH ZONES FOR PHOTO SWITCHING                -->
    <!-- ============================================== -->
    <div class="absolute inset-0 flex z-10">
      <div class="w-1/2 h-3/5" @click.stop="handlePhotoTap('prev')" />
      <div class="w-1/2 h-3/5" @click.stop="handlePhotoTap('next')" />
    </div>

    <!-- Photo Navigation Dots -->
    <div
      v-if="candidate.photos.length > 1"
      class="absolute top-3 inset-x-4 flex gap-1.5 z-20 pointer-events-none"
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

    <!-- Badges (Top: Distance & Compatibility) -->
    <div class="absolute top-7 inset-x-4 flex justify-between items-center z-20 pointer-events-none">
      <div
        class="flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-sm"
      >
        <MapPin class="w-3.5 h-3.5 text-fematch-cyan-400" />
        <span>{{ candidate.distanceKm || 2 }} km</span>
      </div>

      <div
        class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 text-xs font-extrabold text-white shadow-pastel-pink"
      >
        <Sparkles class="w-3.5 h-3.5 text-white" />
        <span>{{ candidate.compatibilityScore }}% Compatible</span>
      </div>
    </div>

    <!-- Dark Gradient Overlay for optimal readability -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-10"
    />

    <!-- Profile Information Container -->
    <div class="relative z-20 p-5 text-white flex flex-col gap-2.5">
      <!-- Name, Age & Verified Badge -->
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
          type="button"
          @click.stop="showFullBio = !showFullBio"
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

      <!-- Bottom Swiping Controls (For manual button clicks) -->
      <div class="flex items-center justify-center gap-5 pt-3 pb-1">
        <!-- Pass Button -->
        <button
          type="button"
          @click.stop="triggerSwipeOut('pass')"
          class="w-13 h-13 rounded-full bg-white/15 backdrop-blur-lg border border-white/20 text-rose-400 flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-rose-500 hover:text-white"
          title="Pasar"
        >
          <X class="w-6 h-6 stroke-[3]" />
        </button>

        <!-- Super Like Button -->
        <button
          type="button"
          @click.stop="triggerSwipeOut('superlike')"
          class="w-11 h-11 rounded-full bg-gradient-to-tr from-fematch-cyan-500 to-fematch-cyan-300 text-white flex items-center justify-center shadow-pastel-cyan active:scale-90 transition-all"
          title="Super Like"
        >
          <Star class="w-5 h-5 fill-white stroke-none" />
        </button>

        <!-- Like Button -->
        <button
          type="button"
          @click.stop="triggerSwipeOut('like')"
          class="w-14 h-14 rounded-full bg-gradient-to-tr from-fematch-pink-500 via-fematch-violet-500 to-fematch-pink-400 text-white flex items-center justify-center shadow-pastel-pink active:scale-90 transition-all hover:scale-105"
          title="Like"
        >
          <Heart class="w-7 h-7 fill-white stroke-none" />
        </button>
      </div>
    </div>
  </div>
</template>
