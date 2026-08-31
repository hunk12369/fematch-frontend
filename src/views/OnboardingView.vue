<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.store'
import { useTelegramStore } from '@/stores/telegram.store'
import { userService } from '@/api/services/user.service'
import { useHaptics } from '@/composables/useHaptics'
import {
  GENDER_IDENTITY_OPTIONS,
  type GenderIdentity,
} from '@/api/types'
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
  Calendar,
  Navigation,
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
const isDetectingLocation = ref(false)
const locationDetected = ref(false)
const locationError = ref<string | null>(null)
const uploadErrorMessage = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Formulario reactivo de Onboarding alineado con el contrato del backend
const form = reactive({
  gender_identity: 'TRANS_FEM' as GenderIdentity,
  birth_date: '2000-01-01',
  bio: '¡Hola! Acabo de unirme a Fematch. Me encanta conectar con personas afines en la comunidad.',
  city: 'Madrid',
  latitude: null as number | null,
  longitude: null as number | null,
  target_genders: ['FEMBOY', 'TRANS_FEM', 'TRANS_MASC', 'CROSSDRESSER', 'MAN', 'OTHER'] as string[],
  min_age: 18,
  max_age: 35,
  max_distance_km: 30,
  photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  ],
})

// Cálculo reactivo de la edad
const calculatedAge = computed(() => {
  if (!form.birth_date) return 0
  const birth = new Date(form.birth_date)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
})

const isAdult = computed(() => calculatedAge.value >= 18)

onMounted(() => {
  if (tgStore.user?.photo_url) {
    form.photos = [tgStore.user.photo_url]
  }
})

const progressPercentage = computed(() => {
  return (currentStep.value / totalSteps) * 100
})

// Validación de cada paso
const isStepValid = computed(() => {
  if (currentStep.value === 1) {
    return Boolean(form.gender_identity)
  }
  if (currentStep.value === 2) {
    return Boolean(form.birth_date) && isAdult.value && form.city.trim().length >= 2
  }
  if (currentStep.value === 3) {
    return form.target_genders.length >= 1
  }
  if (currentStep.value === 4) {
    return form.photos.length >= 1
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

function toggleTargetGender(identity: string) {
  haptics.selection()
  const idx = form.target_genders.indexOf(identity)
  if (idx >= 0) {
    if (form.target_genders.length > 1) {
      form.target_genders.splice(idx, 1)
    }
  } else {
    form.target_genders.push(identity)
  }
}

/**
 * Solicita coordenadas GPS mediante la API de Geolocalización del navegador
 */
function requestGeolocation() {
  if (!navigator.geolocation) {
    locationError.value = 'Geolocalización no soportada en este dispositivo.'
    haptics.notification('error')
    return
  }

  isDetectingLocation.value = true
  locationError.value = null
  haptics.impact('medium')

  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.latitude = position.coords.latitude
      form.longitude = position.coords.longitude
      locationDetected.value = true
      isDetectingLocation.value = false
      haptics.notification('success')
    },
    (error) => {
      console.warn('GPS denegado o no disponible:', error.message)
      form.latitude = null
      form.longitude = null
      isDetectingLocation.value = false
      locationDetected.value = false
      if (error.code === error.PERMISSION_DENIED) {
        locationError.value = 'Permiso de ubicación denegado.'
      } else {
        locationError.value = 'No se pudo obtener la ubicación GPS.'
      }
      haptics.notification('warning')
    },
    { enableHighAccuracy: true, timeout: 8000 }
  )
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
    const newPhotoUrl = await userService.uploadPhoto(file, 0)
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
    // Guardar datos mediante POST /api/user/onboarding
    await userStore.completeOnboarding({
      gender_identity: form.gender_identity,
      birth_date: form.birth_date,
      bio: form.bio.trim(),
      city: form.city.trim(),
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
      target_genders: [...form.target_genders],
      min_age: Number(form.min_age),
      max_age: Number(form.max_age),
      max_distance_km: Number(form.max_distance_km),
    })

    haptics.notification('success')
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
            Fematch es un espacio seguro para conectar con autenticidad.
          </p>
        </div>

        <div class="space-y-3">
          <label class="text-xs font-bold text-tg-text">Selecciona tu identidad:</label>
          <div class="grid grid-cols-1 gap-2.5">
            <button
              v-for="opt in GENDER_IDENTITY_OPTIONS"
              :key="opt.value"
              type="button"
              @click="form.gender_identity = opt.value"
              class="p-3.5 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between text-left"
              :class="[
                form.gender_identity === opt.value
                  ? 'border-fematch-pink-500 bg-gradient-to-r from-fematch-pink-500/15 to-fematch-violet-500/15 text-fematch-pink-600 dark:text-fematch-pink-300 shadow-sm'
                  : 'border-fematch-pink-100 dark:border-fematch-violet-900/40 bg-tg-secondary-bg text-tg-text'
              ]"
            >
              <span class="text-sm font-extrabold">{{ opt.label }}</span>
              <span v-if="form.gender_identity === opt.value" class="w-5 h-5 rounded-full bg-fematch-pink-500 text-white flex items-center justify-center">
                <Check class="w-3 h-3 stroke-[3]" />
              </span>
            </button>
          </div>
        </div>
      </section>

      <!-- ============================================== -->
      <!-- PASO 2: FECHA DE NACIMIENTO Y UBICACIÓN        -->
      <!-- ============================================== -->
      <section v-else-if="currentStep === 2" class="space-y-5 animate-fade-in">
        <div>
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fematch-violet-50 dark:bg-fematch-violet-950/60 text-fematch-violet-600 dark:text-fematch-violet-300 text-xs font-bold mb-2">
            <Calendar class="w-3.5 h-3.5" />
            <span>Paso 2</span>
          </div>
          <h2 class="text-2xl font-black tracking-tight text-tg-text mb-1">
            Edad y Ubicación
          </h2>
          <p class="text-xs text-tg-hint leading-relaxed">
            Solo mostramos perfiles de personas mayores de 18 años (+18).
          </p>
        </div>

        <div class="space-y-4">
          <!-- Fecha de Nacimiento -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-tg-text flex items-center justify-between">
              <span>Fecha de Nacimiento (YYYY-MM-DD)</span>
              <span v-if="calculatedAge > 0" class="text-fematch-pink-500 font-extrabold text-xs">
                {{ calculatedAge }} años
              </span>
            </label>
            <div class="relative">
              <input
                v-model="form.birth_date"
                type="date"
                max="2008-01-01"
                min="1940-01-01"
                class="w-full px-4 py-3 rounded-2xl bg-tg-secondary-bg border border-fematch-violet-200 dark:border-fematch-violet-800 text-sm font-bold text-tg-text text-center focus:outline-none focus:ring-2 focus:ring-fematch-violet-400"
              />
            </div>
            <span v-if="!isAdult" class="text-[11px] text-rose-500 font-bold block text-center">
              ⚠️ Debes tener al menos 18 años para utilizar Fematch.
            </span>
          </div>

          <!-- Ciudad / Ubicación -->
          <div class="space-y-2">
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

            <!-- Botón interactivo: Usar mi ubicación actual -->
            <button
              type="button"
              :disabled="isDetectingLocation"
              @click="requestGeolocation"
              class="w-full py-2.5 px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 text-xs font-bold active:scale-95 disabled:opacity-50"
              :class="[
                locationDetected
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 dark:text-emerald-400'
                  : 'bg-tg-secondary-bg border-fematch-cyan-200 dark:border-fematch-cyan-900/40 text-fematch-cyan-600 dark:text-fematch-cyan-400 hover:bg-fematch-cyan-500/10'
              ]"
            >
              <Loader2 v-if="isDetectingLocation" class="w-4 h-4 animate-spin text-fematch-cyan-500" />
              <Check v-else-if="locationDetected" class="w-4 h-4 text-emerald-500 stroke-[3]" />
              <Navigation v-else class="w-4 h-4 text-fematch-cyan-500" />

              <span>
                {{
                  isDetectingLocation
                    ? 'Obteniendo coordenadas GPS...'
                    : locationDetected
                    ? '📍 Coordenadas GPS vinculadas con éxito'
                    : '📍 Usar mi ubicación actual'
                }}
              </span>
            </button>

            <!-- Mensaje de error/aviso si falla GPS -->
            <div v-if="locationError" class="text-[10px] text-amber-500 text-center font-medium">
              {{ locationError }}
            </div>
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
            Configura las preferencias de tu radar de afinidad.
          </p>
        </div>

        <div class="space-y-4">
          <!-- Identidades que desea ver (target_genders) -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-tg-text">Identidades a descubrir:</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in GENDER_IDENTITY_OPTIONS"
                :key="opt.value"
                type="button"
                @click="toggleTargetGender(opt.value)"
                class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                :class="[
                  form.target_genders.includes(opt.value)
                    ? 'bg-gradient-to-r from-fematch-violet-500 to-fematch-cyan-500 text-white shadow-pastel-violet'
                    : 'bg-tg-secondary-bg text-tg-text border border-fematch-pink-100 dark:border-fematch-violet-900/40'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Rango de Edad (min_age y max_age) -->
          <div class="p-3.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-200 dark:border-fematch-violet-900/40 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold">
              <span>Rango de Edad</span>
              <span class="text-fematch-pink-500">{{ form.min_age }} - {{ form.max_age }} años</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-[10px] text-tg-hint">Edad Mínima</span>
                <input
                  v-model.number="form.min_age"
                  type="number"
                  min="18"
                  :max="form.max_age - 1"
                  class="w-full p-2 text-center rounded-xl bg-tg-bg border border-fematch-pink-200 text-xs font-bold"
                />
              </div>
              <div>
                <span class="text-[10px] text-tg-hint">Edad Máxima</span>
                <input
                  v-model.number="form.max_age"
                  type="number"
                  :min="form.min_age + 1"
                  max="90"
                  class="w-full p-2 text-center rounded-xl bg-tg-bg border border-fematch-pink-200 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <!-- Distancia Máxima (max_distance_km) -->
          <div class="p-3.5 rounded-2xl bg-tg-secondary-bg border border-fematch-cyan-200 dark:border-fematch-cyan-900/40 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-tg-text flex items-center gap-1">
                <Compass class="w-3.5 h-3.5 text-fematch-cyan-500" />
                <span>Distancia Máxima</span>
              </span>
              <span class="font-black text-fematch-cyan-500">Hasta {{ form.max_distance_km }} km</span>
            </div>
            <input
              v-model.number="form.max_distance_km"
              type="range"
              min="5"
              max="100"
              class="w-full accent-fematch-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </section>

      <!-- ============================================== -->
      <!-- PASO 4: FOTO DE PORTADA Y BIO                 -->
      <!-- ============================================== -->
      <section v-else-if="currentStep === 4" class="space-y-5 animate-fade-in">
        <div>
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fematch-pink-50 dark:bg-fematch-pink-950/60 text-fematch-pink-600 dark:text-fematch-pink-300 text-xs font-bold mb-2">
            <Camera class="w-3.5 h-3.5" />
            <span>Paso Final</span>
          </div>
          <h2 class="text-2xl font-black tracking-tight text-tg-text mb-1">
            Foto de Portada y Bio
          </h2>
          <p class="text-xs text-tg-hint leading-relaxed">
            Tu foto principal y biografía para empezar a descubrir conexiones.
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
              rows="3"
              placeholder="Cuéntanos un poco sobre ti..."
              class="w-full p-3 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400 leading-relaxed resize-none"
            />
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
