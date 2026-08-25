<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.store'
import { useTelegramStore } from '@/stores/telegram.store'
import { userService } from '@/api/services/user.service'
import { useHaptics } from '@/composables/useHaptics'
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Camera,
  MapPin,
  Heart,
  User,
  UploadCloud,
  Loader2,
  AlertCircle,
  Compass,
} from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const tgStore = useTelegramStore()
const haptics = useHaptics()

// Paso actual del asistente (1 a 4)
const currentStep = ref(1)
const totalSteps = 4
const isSubmitting = ref(false)
const isUploadingPhoto = ref(false)
const uploadErrorMessage = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Opciones de Identidad
const GENDER_IDENTITIES = [
  'Mujer cis',
  'Mujer trans',
  'No binaria',
  'Lesbiana',
  'Bisexual',
  'Pansexual',
  'Queer',
  'Asexual',
  'Otro',
]

// Opciones de Intención
const RELATIONSHIP_INTENTS = [
  'Citas y romance 💖',
  'Amistad y comunidad ☕',
  'Conexión seria 💍',
  'Charlar y ver qué surge 🌊',
]

// Intereses disponibles
const POPULAR_INTERESTS = [
  'Fotografía',
  'Café',
  'Indie Rock',
  'Arte Moderno',
  'Plantas',
  'Yoga',
  'Ciclismo',
  'Cine',
  'Literatura',
  'Videojuegos',
  'Mascotas',
  'Gastronomía',
  'Viajes',
  'Música en Vivo',
]

// Formulario reactivo de Onboarding
const form = reactive({
  name: '',
  pronouns: 'Ella / She',
  gender_identity: 'Lesbiana',
  age: 24,
  city: 'Madrid',
  occupation: '',
  relationship_intent: 'Citas y romance 💖',
  search_preferences: {
    minAge: 20,
    maxAge: 35,
    maxDistanceKm: 30,
    interestedIn: ['Mujer cis', 'Mujer trans', 'No binaria', 'Lesbiana', 'Bisexual'] as string[],
  },
  photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  ],
  bio: '¡Hola! Acabo de unirme a Fematch. Me encanta el café, la buena música y conectar con personas auténticas.',
  interests: ['Fotografía', 'Café', 'Indie Rock', 'Arte Moderno'] as string[],
})

onMounted(() => {
  // Pre-cargar nombre desde Telegram si está disponible
  if (tgStore.user?.first_name) {
    form.name = `${tgStore.user.first_name} ${tgStore.user.last_name || ''}`.trim()
  }
  if (tgStore.user?.photo_url) {
    form.photos = [tgStore.user.photo_url]
  }
})

const progressPercentage = computed(() => {
  return ((currentStep.value) / totalSteps) * 100
})

// Validación de cada paso
const isStepValid = computed(() => {
  if (currentStep.value === 1) {
    return form.name.trim().length >= 2 && Boolean(form.gender_identity)
  }
  if (currentStep.value === 2) {
    return form.age >= 18 && form.city.trim().length >= 2
  }
  if (currentStep.value === 3) {
    return form.search_preferences.interestedIn.length >= 1
  }
  if (currentStep.value === 4) {
    return form.photos.length >= 1 && form.interests.length >= 2
  }
  return true
})

function nextStep() {
  if (!isStepValid.value) return

  haptics.impact('light')
  if (currentStep.value < totalSteps) {
    currentStep.value++
  } else {
    finishOnboarding()
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    haptics.selection()
    currentStep.value--
  }
}

function toggleInterestedIn(identity: string) {
  haptics.selection()
  const idx = form.search_preferences.interestedIn.indexOf(identity)
  if (idx >= 0) {
    if (form.search_preferences.interestedIn.length > 1) {
      form.search_preferences.interestedIn.splice(idx, 1)
    }
  } else {
    form.search_preferences.interestedIn.push(identity)
  }
}

function toggleInterest(interest: string) {
  haptics.selection()
  const idx = form.interests.indexOf(interest)
  if (idx >= 0) {
    form.interests.splice(idx, 1)
  } else {
    if (form.interests.length >= 6) return
    form.interests.push(interest)
  }
}

function triggerPhotoSelect() {
  if (isUploadingPhoto.value) return
  haptics.impact('light')
  uploadErrorMessage.value = null
  fileInputRef.value?.click()
}

async function onPhotoFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validación de tamaño en cliente (< 5MB)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024
  if (file.size > MAX_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1)
    uploadErrorMessage.value = `La imagen (${sizeInMb}MB) excede el tamaño máximo permitido de 5MB.`
    haptics.notification('error')
    target.value = ''
    return
  }

  isUploadingPhoto.value = true
  uploadErrorMessage.value = null
  haptics.impact('medium')

  try {
    const newPhotoUrl = await userService.uploadPhoto(file)
    if (newPhotoUrl) {
      form.photos = [newPhotoUrl, ...form.photos.filter((p) => p !== newPhotoUrl)]
      haptics.notification('success')
    }
  } catch (err: any) {
    uploadErrorMessage.value = err.message || 'Error al subir la imagen'
    haptics.notification('error')
  } finally {
    isUploadingPhoto.value = false
    target.value = ''
  }
}

async function finishOnboarding() {
  isSubmitting.value = true
  haptics.impact('medium')

  try {
    // Guardar datos y marcar onboardingCompleted = true
    await userStore.completeOnboarding({
      name: form.name.trim(),
      pronouns: form.pronouns.trim(),
      gender_identity: form.gender_identity,
      age: Number(form.age),
      city: form.city.trim(),
      occupation: form.occupation.trim(),
      relationship_intent: form.relationship_intent,
      search_preferences: { ...form.search_preferences },
      photos: [...form.photos],
      bio: form.bio.trim(),
      interests: [...form.interests],
    })

    haptics.notification('success')
    // Redirigir al feed de citas DiscoverView
    router.replace('/discover')
  } catch (error) {
    console.error('Error al completar onboarding:', error)
    haptics.notification('error')
    alert('Ocurrió un error al guardar tus datos. Inténtalo de nuevo.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full bg-tg-bg text-tg-text relative overflow-hidden select-none">
    <!-- Ambient Background Lighting -->
    <div class="absolute -top-20 -right-20 w-64 h-64 bg-fematch-pink-500/20 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-fematch-violet-500/20 rounded-full blur-3xl pointer-events-none" />

    <!-- Hidden Native File Input for Photo Upload -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="onPhotoFileSelected"
    />

    <!-- Header & Progress Bar -->
    <header class="px-5 pt-4 pb-2 z-10">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <button
            v-if="currentStep > 1"
            type="button"
            @click="prevStep"
            class="p-1.5 -ml-1 rounded-full bg-tg-secondary-bg text-tg-text active:scale-95 transition-transform"
          >
            <ArrowLeft class="w-4 h-4" />
          </button>
          <div class="flex items-center gap-1.5">
            <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-fematch-pink-500 to-fematch-violet-500 flex items-center justify-center shadow-xs">
              <Sparkles class="w-3.5 h-3.5 text-white" />
            </div>
            <span class="font-extrabold text-sm bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 bg-clip-text text-transparent">
              Fematch
            </span>
          </div>
        </div>

        <span class="text-xs font-bold text-tg-hint">
          Paso {{ currentStep }} de {{ totalSteps }}
        </span>
      </div>

      <!-- Linear Progress Bar -->
      <div class="w-full h-1.5 bg-tg-secondary-bg rounded-full overflow-hidden border border-fematch-pink-100 dark:border-fematch-violet-900/40">
        <div
          class="h-full bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 transition-all duration-300 rounded-full"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
    </header>

    <!-- Step Content Body (Scrollable) -->
    <main class="flex-1 overflow-y-auto no-scrollbar px-6 py-4 z-10">
      <!-- ============================================== -->
      <!-- PASO 1: ¿CÓMO TE IDENTIFICAS?                  -->
      <!-- ============================================== -->
      <section v-if="currentStep === 1" class="space-y-5 animate-fade-in">
        <div>
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fematch-pink-50 dark:bg-fematch-pink-950/60 text-fematch-pink-600 dark:text-fematch-pink-300 text-xs font-bold mb-2">
            <User class="w-3.5 h-3.5" />
            <span>Paso 1</span>
          </div>
          <h2 class="text-2xl font-black tracking-tight text-tg-text mb-1">
            ¿Cómo te identificas?
          </h2>
          <p class="text-xs text-tg-hint leading-relaxed">
            Fematch es un espacio seguro e inclusivo para conectar con autenticidad.
          </p>
        </div>

        <div class="space-y-4">
          <!-- Nombre -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-tg-text">¿Cómo quieres que te llamen?</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Tu nombre o apodo"
              class="w-full px-4 py-3 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-sm text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400 font-semibold"
            />
          </div>

          <!-- Pronombres -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-tg-text">Tus pronombres</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="pr in ['Ella / She', 'Elle / They', 'Ella / Elle']"
                :key="pr"
                type="button"
                @click="form.pronouns = pr"
                class="py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center"
                :class="[
                  form.pronouns === pr
                    ? 'border-fematch-pink-500 bg-fematch-pink-50 dark:bg-fematch-violet-950/60 text-fematch-pink-600 dark:text-fematch-pink-300 font-bold'
                    : 'border-fematch-pink-100 dark:border-fematch-violet-900/40 bg-tg-secondary-bg text-tg-hint'
                ]"
              >
                {{ pr }}
              </button>
            </div>
          </div>

          <!-- Identidad de Género / Orientación -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-tg-text flex items-center justify-between">
              <span>Tu Identidad / Orientación</span>
              <span class="text-xs text-fematch-pink-500 font-bold">{{ form.gender_identity }}</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="identity in GENDER_IDENTITIES"
                :key="identity"
                type="button"
                @click="form.gender_identity = identity"
                class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                :class="[
                  form.gender_identity === identity
                    ? 'bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white shadow-pastel-pink scale-[1.02]'
                    : 'bg-tg-secondary-bg text-tg-text border border-fematch-pink-100 dark:border-fematch-violet-900/40'
                ]"
              >
                {{ identity }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================== -->
      <!-- PASO 2: EDAD Y UBICACIÓN                       -->
      <!-- ============================================== -->
      <section v-else-if="currentStep === 2" class="space-y-5 animate-fade-in">
        <div>
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fematch-violet-50 dark:bg-fematch-violet-950/60 text-fematch-violet-600 dark:text-fematch-violet-300 text-xs font-bold mb-2">
            <MapPin class="w-3.5 h-3.5" />
            <span>Paso 2</span>
          </div>
          <h2 class="text-2xl font-black tracking-tight text-tg-text mb-1">
            Edad y Ubicación
          </h2>
          <p class="text-xs text-tg-hint leading-relaxed">
            Solo mostramos perfiles de personas mayores de 18 años cercanas a tu zona.
          </p>
        </div>

        <div class="space-y-4">
          <!-- Edad -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-tg-text">¿Cuál es tu edad?</label>
            <input
              v-model="form.age"
              type="number"
              min="18"
              max="99"
              class="w-full px-4 py-3 rounded-2xl bg-tg-secondary-bg border border-fematch-violet-200 dark:border-fematch-violet-800 text-lg font-black text-tg-text text-center focus:outline-none focus:ring-2 focus:ring-fematch-violet-400"
            />
            <span class="text-[10px] text-tg-hint block text-center">Debes ser mayor de 18 años para usar Fematch</span>
          </div>

          <!-- Ciudad / Ubicación -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-tg-text">Ciudad actual</label>
            <div class="relative">
              <MapPin class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fematch-cyan-500" />
              <input
                v-model="form.city"
                type="text"
                placeholder="ej. Madrid, Barcelona, Santiago..."
                class="w-full pl-10 pr-4 py-3 rounded-2xl bg-tg-secondary-bg border border-fematch-violet-200 dark:border-fematch-violet-800 text-sm text-tg-text font-semibold focus:outline-none focus:ring-2 focus:ring-fematch-violet-400"
              />
            </div>
          </div>

          <!-- Ocupación -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-tg-text">Ocupación / A qué te dedicas (opcional)</label>
            <input
              v-model="form.occupation"
              type="text"
              placeholder="ej. Arquitecta, Diseñadora, Estudiante..."
              class="w-full px-4 py-3 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400"
            />
          </div>
        </div>
      </section>

      <!-- ============================================== -->
      <!-- PASO 3: ¿A QUIÉN BUSCAS? (RADAR)               -->
      <!-- ============================================== -->
      <section v-else-if="currentStep === 3" class="space-y-5 animate-fade-in">
        <div>
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fematch-cyan-50 dark:bg-fematch-cyan-950/60 text-fematch-cyan-600 dark:text-fematch-cyan-300 text-xs font-bold mb-2">
            <Heart class="w-3.5 h-3.5" />
            <span>Paso 3</span>
          </div>
          <h2 class="text-2xl font-black tracking-tight text-tg-text mb-1">
            ¿A quién buscas?
          </h2>
          <p class="text-xs text-tg-hint leading-relaxed">
            Configura las preferencias de tu radar para descubrir personas compatibles.
          </p>
        </div>

        <div class="space-y-4">
          <!-- Intención de conexión -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-tg-text">¿Qué buscas en Fematch?</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="intent in RELATIONSHIP_INTENTS"
                :key="intent"
                type="button"
                @click="form.relationship_intent = intent"
                class="p-3 rounded-2xl text-xs font-bold border transition-all text-left flex items-center"
                :class="[
                  form.relationship_intent === intent
                    ? 'border-fematch-pink-500 bg-fematch-pink-50/80 dark:bg-fematch-violet-950/60 text-fematch-pink-600 dark:text-fematch-pink-300 shadow-xs'
                    : 'border-fematch-pink-100 dark:border-fematch-violet-900/40 bg-tg-secondary-bg text-tg-text'
                ]"
              >
                <span>{{ intent }}</span>
              </button>
            </div>
          </div>

          <!-- Identidades que desea ver -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-tg-text">Interesada en descubrir (Selecciona una o más):</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="identity in GENDER_IDENTITIES"
                :key="identity"
                type="button"
                @click="toggleInterestedIn(identity)"
                class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                :class="[
                  form.search_preferences.interestedIn.includes(identity)
                    ? 'bg-gradient-to-r from-fematch-violet-500 to-fematch-cyan-500 text-white shadow-pastel-violet'
                    : 'bg-tg-secondary-bg text-tg-text border border-fematch-pink-100 dark:border-fematch-violet-900/40'
                ]"
              >
                {{ identity }}
              </button>
            </div>
          </div>

          <!-- Distancia Máxima -->
          <div class="p-3.5 rounded-2xl bg-tg-secondary-bg border border-fematch-cyan-200 dark:border-fematch-cyan-900/40 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-tg-text flex items-center gap-1">
                <Compass class="w-3.5 h-3.5 text-fematch-cyan-500" />
                <span>Distancia Máxima</span>
              </span>
              <span class="font-black text-fematch-cyan-500">Hasta {{ form.search_preferences.maxDistanceKm }} km</span>
            </div>
            <input
              v-model="form.search_preferences.maxDistanceKm"
              type="range"
              min="5"
              max="100"
              class="w-full accent-fematch-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </section>

      <!-- ============================================== -->
      <!-- PASO 4: FOTO DE PORTADA E INTERESES           -->
      <!-- ============================================== -->
      <section v-else-if="currentStep === 4" class="space-y-5 animate-fade-in">
        <div>
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fematch-pink-50 dark:bg-fematch-pink-950/60 text-fematch-pink-600 dark:text-fematch-pink-300 text-xs font-bold mb-2">
            <Camera class="w-3.5 h-3.5" />
            <span>Paso Final</span>
          </div>
          <h2 class="text-2xl font-black tracking-tight text-tg-text mb-1">
            Foto de Portada
          </h2>
          <p class="text-xs text-tg-hint leading-relaxed">
            Tu foto principal es la primera impresión que verán las demás chicas.
          </p>
        </div>

        <div class="space-y-4">
          <!-- Error Alert si excede 5MB -->
          <div
            v-if="uploadErrorMessage"
            class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-500 font-medium"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ uploadErrorMessage }}</span>
          </div>

          <!-- Preview de Foto Principal con Botón de Subida R2 -->
          <div class="flex flex-col items-center gap-3">
            <div class="relative w-40 h-52 rounded-3xl overflow-hidden border-3 border-fematch-pink-400 shadow-pastel-pink bg-neutral-900">
              <img
                :src="form.photos[0]"
                alt="Foto de portada"
                class="w-full h-full object-cover"
                :class="{ 'opacity-50 blur-xs': isUploadingPhoto }"
              />

              <div
                v-if="isUploadingPhoto"
                class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white"
              >
                <Loader2 class="w-8 h-8 animate-spin text-fematch-pink-400" />
                <span class="text-[10px] font-bold">Subiendo a R2...</span>
              </div>

              <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white text-[9px] font-black shadow-sm">
                Portada
              </span>
            </div>

            <button
              type="button"
              :disabled="isUploadingPhoto"
              @click="triggerPhotoSelect"
              class="px-4 py-2 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-bold text-fematch-pink-600 dark:text-fematch-pink-400 flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <UploadCloud class="w-4 h-4" />
              <span>Subir Foto (&lt; 5MB)</span>
            </button>
          </div>

          <!-- Bio -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-tg-text">Tu Bio (Breve descripción)</label>
            <textarea
              v-model="form.bio"
              maxlength="300"
              rows="2"
              placeholder="Cuéntanos un poco sobre ti..."
              class="w-full p-3 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400 leading-relaxed resize-none"
            />
          </div>

          <!-- Intereses favoritos -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-tg-text flex items-center justify-between">
              <span>Elige tus intereses (mínimo 2):</span>
              <span class="text-xs text-fematch-violet-500 font-bold">{{ form.interests.length }}/6</span>
            </label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="interest in POPULAR_INTERESTS"
                :key="interest"
                type="button"
                @click="toggleInterest(interest)"
                class="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                :class="[
                  form.interests.includes(interest)
                    ? 'bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white shadow-pastel-pink'
                    : 'bg-tg-secondary-bg text-tg-hint border border-fematch-pink-100 dark:border-fematch-violet-900/40 hover:text-tg-text'
                ]"
              >
                {{ interest }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Bottom Action Navigation Bar -->
    <footer class="p-5 bg-tg-bg border-t border-fematch-pink-100 dark:border-fematch-violet-900/40 pb-safe z-10">
      <button
        type="button"
        :disabled="!isStepValid || isSubmitting || isUploadingPhoto"
        @click="nextStep"
        class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-extrabold text-sm shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
        <template v-else-if="currentStep < totalSteps">
          <span>Continuar</span>
          <ArrowRight class="w-4 h-4" />
        </template>
        <template v-else>
          <span>Finalizar y Explorar</span>
          <Check class="w-4 h-4 stroke-[3]" />
        </template>
      </button>
    </footer>
  </div>
</template>
