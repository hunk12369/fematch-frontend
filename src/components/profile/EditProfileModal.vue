<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { UserProfile } from '@/api/types'
import { userService } from '@/api/services/user.service'
import { useHaptics } from '@/composables/useHaptics'
import {
  X,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Sliders,
  User,
  Heart,
  Save,
  Loader2,
  Camera,
  MapPin,
  Compass,
  UploadCloud,
  AlertCircle,
} from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  profile: UserProfile | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', updatedProfile: UserProfile): void
}>()

const haptics = useHaptics()
const isSaving = ref(false)
const isUploadingPhoto = ref(false)
const uploadErrorMessage = ref<string | null>(null)
const activeTab = ref<'profile' | 'preferences'>('profile')

// Referencia al selector nativo de archivos oculto
const fileInputRef = ref<HTMLInputElement | null>(null)

// Lista predefinida de identidades para la comunidad Fematch
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

// Lista de etiquetas de intereses disponibles
const AVAILABLE_INTERESTS = [
  'Fotografía',
  'Indie Rock',
  'Diseño UI',
  'Café',
  'Viajes',
  'Arte Moderno',
  'Plantas',
  'Yoga',
  'Ciclismo',
  'Cine',
  'Literatura',
  'Videojuegos',
  'Mascotas',
  'Música en Vivo',
  'Gastronomía',
  'Senderismo',
  'Tatuajes',
  'Moda Vintage',
]

// Formulario reactivo local
const form = reactive({
  name: '',
  age: 26,
  bio: '',
  gender_identity: 'Lesbiana',
  pronouns: 'Ella / She',
  occupation: '',
  photos: [] as string[],
  interests: [] as string[],
  search_preferences: {
    minAge: 20,
    maxAge: 38,
    maxDistanceKm: 35,
    interestedIn: ['Mujer cis', 'Mujer trans', 'No binaria', 'Lesbiana', 'Bisexual'] as string[],
  },
})

// Sincronizar datos cuando se abre el modal
watch(
  () => props.profile,
  (p) => {
    if (p) {
      form.name = p.name || ''
      form.age = p.age || 26
      form.bio = p.bio || ''
      form.gender_identity = p.gender_identity || 'Lesbiana'
      form.pronouns = p.pronouns || 'Ella / She'
      form.occupation = p.occupation || ''
      form.photos = p.photos ? [...p.photos] : []
      form.interests = p.interests ? [...p.interests] : []
      form.search_preferences = {
        minAge: p.search_preferences?.minAge || 20,
        maxAge: p.search_preferences?.maxAge || 38,
        maxDistanceKm: p.search_preferences?.maxDistanceKm || 35,
        interestedIn: p.search_preferences?.interestedIn
          ? [...p.search_preferences.interestedIn]
          : ['Mujer cis', 'Mujer trans', 'No binaria', 'Lesbiana', 'Bisexual'],
      }
      uploadErrorMessage.value = null
    }
  },
  { immediate: true }
)

// Disparador del selector de archivos
function triggerFileInput() {
  if (isUploadingPhoto.value || form.photos.length >= 6) return
  haptics.impact('light')
  uploadErrorMessage.value = null
  fileInputRef.value?.click()
}

// Handler de selección y validación de archivos (< 5MB) y subida a Cloudflare R2
async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 1. Validación de tamaño en cliente (< 5MB)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 Megabytes
  if (file.size > MAX_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1)
    uploadErrorMessage.value = `El archivo (${sizeInMb}MB) excede el tamaño máximo permitido de 5MB.`
    haptics.notification('error')
    target.value = ''
    return
  }

  // 2. Validación de tipo de archivo
  if (!file.type.startsWith('image/')) {
    uploadErrorMessage.value = 'Por favor selecciona un formato de imagen válido (JPEG, PNG, WebP).'
    haptics.notification('error')
    target.value = ''
    return
  }

  isUploadingPhoto.value = true
  uploadErrorMessage.value = null
  haptics.impact('medium')

  try {
    // 3. Subir archivo a través de userService.uploadPhoto (POST a /api/user/photos vía apiClient)
    const newPhotoUrl = await userService.uploadPhoto(file)

    // 4. Actualización reactiva inmediata sin recargar
    if (newPhotoUrl && !form.photos.includes(newPhotoUrl)) {
      form.photos.push(newPhotoUrl)
      haptics.notification('success')
    }
  } catch (error: any) {
    console.error('Error al subir imagen:', error)
    uploadErrorMessage.value = error.message || 'Error al subir la imagen a Cloudflare R2'
    haptics.notification('error')
  } finally {
    isUploadingPhoto.value = false
    target.value = ''
  }
}

function removePhoto(index: number) {
  if (form.photos.length <= 1) {
    alert('Debes mantener al menos 1 foto principal en tu perfil.')
    return
  }
  haptics.impact('medium')
  form.photos.splice(index, 1)
}

function movePhoto(index: number, direction: 'left' | 'right') {
  haptics.selection()
  const targetIndex = direction === 'left' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= form.photos.length) return
  const temp = form.photos[index]
  form.photos[index] = form.photos[targetIndex]
  form.photos[targetIndex] = temp
}

// Toggle de intereses
function toggleInterest(interest: string) {
  haptics.selection()
  const idx = form.interests.indexOf(interest)
  if (idx >= 0) {
    form.interests.splice(idx, 1)
  } else {
    if (form.interests.length >= 8) {
      alert('Puedes seleccionar un máximo de 8 intereses.')
      return
    }
    form.interests.push(interest)
  }
}

// Toggle de identidades deseadas en preferencias
function toggleInterestedIn(identity: string) {
  haptics.selection()
  const idx = form.search_preferences.interestedIn.indexOf(identity)
  if (idx >= 0) {
    if (form.search_preferences.interestedIn.length <= 1) {
      alert('Debes seleccionar al menos una identidad de búsqueda.')
      return
    }
    form.search_preferences.interestedIn.splice(idx, 1)
  } else {
    form.search_preferences.interestedIn.push(identity)
  }
}

// Guardar cambios del perfil
async function onSave() {
  if (!form.name.trim()) {
    alert('Por favor ingresa tu nombre.')
    return
  }
  if (form.photos.length === 0) {
    alert('Por favor agrega al menos una foto.')
    return
  }

  isSaving.value = true
  haptics.impact('medium')

  try {
    const updated = await userService.updateProfile({
      name: form.name.trim(),
      age: Number(form.age),
      bio: form.bio.trim(),
      gender_identity: form.gender_identity,
      pronouns: form.pronouns.trim(),
      occupation: form.occupation.trim(),
      photos: [...form.photos],
      interests: [...form.interests],
      search_preferences: { ...form.search_preferences },
    })

    haptics.notification('success')
    emit('saved', updated)
    emit('close')
  } catch (error) {
    console.error('Error saving profile:', error)
    haptics.notification('error')
    alert('Hubo un error al guardar los cambios. Intenta nuevamente.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
  >
    <!-- Hidden Native File Input for Client Size Validation & Upload -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
      class="hidden"
      @change="onFileSelected"
    />

    <div
      class="relative w-full max-w-md h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-tg-bg border border-fematch-pink-200/50 dark:border-fematch-violet-900/60 shadow-2xl overflow-hidden"
    >
      <!-- Modal Header -->
      <header class="px-5 pt-4 pb-3 flex items-center justify-between border-b border-fematch-pink-100 dark:border-fematch-violet-900/40 bg-tg-bg/95 backdrop-blur-md sticky top-0 z-20">
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('close')"
            class="p-1.5 rounded-full bg-tg-secondary-bg text-tg-hint hover:text-tg-text"
          >
            <X class="w-5 h-5" />
          </button>
          <h2 class="text-base font-extrabold text-tg-text">
            Editar Perfil
          </h2>
        </div>

        <button
          type="button"
          :disabled="isSaving || isUploadingPhoto"
          @click="onSave"
          class="px-4 py-1.5 rounded-full bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white font-bold text-xs shadow-pastel-pink active:scale-95 transition-transform flex items-center gap-1.5 disabled:opacity-50"
        >
          <Loader2 v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
          <Save v-else class="w-3.5 h-3.5" />
          <span>Guardar</span>
        </button>
      </header>

      <!-- Tabs Navigation (Datos de Perfil vs Filtros de Búsqueda) -->
      <div class="grid grid-cols-2 gap-1 p-1 mx-5 mt-3 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40">
        <button
          type="button"
          @click="activeTab = 'profile'"
          class="py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          :class="[
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white shadow-pastel-pink'
              : 'text-tg-hint hover:text-tg-text'
          ]"
        >
          <User class="w-3.5 h-3.5" />
          <span>Mi Perfil</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'preferences'"
          class="py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          :class="[
            activeTab === 'preferences'
              ? 'bg-gradient-to-r from-fematch-violet-500 to-fematch-cyan-500 text-white shadow-pastel-violet'
              : 'text-tg-hint hover:text-tg-text'
          ]"
        >
          <Sliders class="w-3.5 h-3.5" />
          <span>Filtros de Búsqueda</span>
        </button>
      </div>

      <!-- Modal Body Form -->
      <div class="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5 pb-safe">
        <!-- ============================================== -->
        <!-- TAB 1: DATOS Y FOTOS DEL PERFIL                -->
        <!-- ============================================== -->
        <div v-if="activeTab === 'profile'" class="space-y-5">
          <!-- 1. Gestor de Fotos con Subida Cloudflare R2 -->
          <section class="space-y-2.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold uppercase tracking-wider text-fematch-pink-600 dark:text-fematch-pink-400 flex items-center gap-1.5">
                <Camera class="w-3.5 h-3.5" />
                <span>Mis Fotos ({{ form.photos.length }}/6)</span>
              </label>
              <button
                type="button"
                :disabled="isUploadingPhoto || form.photos.length >= 6"
                @click="triggerFileInput"
                class="text-[11px] font-bold text-fematch-pink-500 flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <UploadCloud class="w-3.5 h-3.5" />
                <span>Subir Foto (&lt; 5MB)</span>
              </button>
            </div>

            <!-- Error de Tamaño o Formato -->
            <div
              v-if="uploadErrorMessage"
              class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-500 font-medium"
            >
              <AlertCircle class="w-4 h-4 flex-shrink-0" />
              <span>{{ uploadErrorMessage }}</span>
            </div>

            <!-- Grid de 6 Slots de Fotos -->
            <div class="grid grid-cols-3 gap-2.5 relative">
              <div
                v-for="(photo, idx) in form.photos"
                :key="`photo-${idx}`"
                class="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-fematch-pink-300 dark:border-fematch-violet-700 bg-neutral-900 group shadow-sm"
              >
                <img :src="photo" class="w-full h-full object-cover" />

                <!-- Badge Principal -->
                <span
                  v-if="idx === 0"
                  class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-[8px] font-black text-white shadow-xs"
                >
                  Principal
                </span>

                <!-- Controles sobre la foto -->
                <div class="absolute inset-x-0 bottom-0 p-1 bg-black/70 backdrop-blur-xs flex items-center justify-between">
                  <div class="flex items-center gap-0.5">
                    <button
                      v-if="idx > 0"
                      type="button"
                      @click="movePhoto(idx, 'left')"
                      class="p-1 rounded bg-white/20 text-white hover:bg-white/40 active:scale-90"
                      title="Mover a la izquierda"
                    >
                      <ArrowLeft class="w-3 h-3" />
                    </button>
                    <button
                      v-if="idx < form.photos.length - 1"
                      type="button"
                      @click="movePhoto(idx, 'right')"
                      class="p-1 rounded bg-white/20 text-white hover:bg-white/40 active:scale-90"
                      title="Mover a la derecha"
                    >
                      <ArrowRight class="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    @click="removePhoto(idx)"
                    class="p-1 rounded bg-rose-500/80 text-white hover:bg-rose-600 active:scale-90"
                    title="Eliminar foto"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <!-- Slot de Carga / Spinner mientras se sube a Cloudflare R2 -->
              <div
                v-if="isUploadingPhoto"
                class="aspect-[3/4] rounded-2xl border-2 border-fematch-pink-400 bg-fematch-pink-50/50 dark:bg-fematch-violet-950/60 flex flex-col items-center justify-center gap-2 text-fematch-pink-500 shadow-pastel-pink animate-pulse"
              >
                <Loader2 class="w-7 h-7 animate-spin text-fematch-pink-500" />
                <span class="text-[10px] font-bold text-center px-1">Subiendo a R2...</span>
              </div>

              <!-- Slot para añadir nueva foto -->
              <div
                v-else-if="form.photos.length < 6"
                @click="triggerFileInput"
                class="aspect-[3/4] rounded-2xl border-2 border-dashed border-fematch-pink-300 dark:border-fematch-violet-800 bg-tg-secondary-bg flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform text-fematch-pink-500 hover:border-fematch-pink-500"
              >
                <Plus class="w-6 h-6 stroke-[2.5]" />
                <span class="text-[10px] font-bold">Añadir Foto</span>
                <span class="text-[8px] text-tg-hint">&lt; 5MB</span>
              </div>
            </div>
          </section>

          <!-- 2. Información General -->
          <section class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2 space-y-1">
                <label class="text-[11px] font-bold text-tg-hint">Nombre</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full px-3.5 py-2.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400 font-semibold"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold text-tg-hint">Edad</label>
                <input
                  v-model="form.age"
                  type="number"
                  min="18"
                  max="99"
                  class="w-full px-3.5 py-2.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400 font-semibold text-center"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-tg-hint">Pronombres</label>
                <input
                  v-model="form.pronouns"
                  type="text"
                  placeholder="ej. Ella / She"
                  class="w-full px-3.5 py-2.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold text-tg-hint">Ocupación / Pasión</label>
                <input
                  v-model="form.occupation"
                  type="text"
                  placeholder="ej. Diseñadora & Melómana"
                  class="w-full px-3.5 py-2.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400"
                />
              </div>
            </div>

            <!-- Identidad de Género / Rol -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-tg-hint flex items-center justify-between">
                <span>Mi Identidad de Género</span>
                <span class="text-fematch-pink-500 font-bold">{{ form.gender_identity }}</span>
              </label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="identity in GENDER_IDENTITIES"
                  :key="identity"
                  type="button"
                  @click="form.gender_identity = identity"
                  class="px-3 py-1 rounded-full text-xs font-semibold transition-all"
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

            <!-- Bio -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-bold text-tg-hint">Sobre Mí (Bio)</label>
                <span class="text-[10px] text-tg-hint">{{ form.bio.length }}/500</span>
              </div>
              <textarea
                v-model="form.bio"
                maxlength="500"
                rows="3"
                placeholder="Cuéntanos un poco sobre ti, lo que te inspira y lo que buscas en Fematch..."
                class="w-full p-3.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400 leading-relaxed resize-none"
              />
            </div>
          </section>

          <!-- 3. Intereses -->
          <section class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold uppercase tracking-wider text-fematch-violet-600 dark:text-fematch-violet-400 flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5" />
                <span>Mis Intereses ({{ form.interests.length }}/8)</span>
              </label>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="interest in AVAILABLE_INTERESTS"
                :key="interest"
                type="button"
                @click="toggleInterest(interest)"
                class="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                :class="[
                  form.interests.includes(interest)
                    ? 'bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white shadow-pastel-pink'
                    : 'bg-tg-secondary-bg text-tg-hint border border-fematch-pink-100 dark:border-fematch-violet-900/40 hover:text-tg-text'
                ]"
              >
                {{ interest }}
              </button>
            </div>
          </section>
        </div>

        <!-- ============================================== -->
        <!-- TAB 2: FILTROS Y PREFERENCIAS DE BÚSQUEDA      -->
        <!-- ============================================== -->
        <div v-else class="space-y-5">
          <!-- 1. Distancia Máxima Slider -->
          <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-tg-text flex items-center gap-1.5">
                <MapPin class="w-4 h-4 text-fematch-cyan-400" />
                <span>Distancia Máxima</span>
              </label>
              <span class="text-xs font-extrabold text-fematch-cyan-500 bg-fematch-cyan-500/10 px-2 py-0.5 rounded-full">
                Hasta {{ form.search_preferences.maxDistanceKm }} km
              </span>
            </div>

            <input
              v-model="form.search_preferences.maxDistanceKm"
              type="range"
              min="2"
              max="100"
              step="1"
              class="w-full accent-fematch-cyan-400 cursor-pointer"
            />
            <div class="flex justify-between text-[10px] text-tg-hint">
              <span>2 km (Cercanas)</span>
              <span>100 km (Toda la región)</span>
            </div>
          </div>

          <!-- 2. Rango de Edad -->
          <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-tg-text flex items-center gap-1.5">
                <Compass class="w-4 h-4 text-fematch-pink-500" />
                <span>Rango de Edad</span>
              </label>
              <span class="text-xs font-extrabold text-fematch-pink-500 bg-fematch-pink-500/10 px-2 py-0.5 rounded-full">
                {{ form.search_preferences.minAge }} - {{ form.search_preferences.maxAge }} años
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-1">
              <div class="space-y-1">
                <span class="text-[10px] text-tg-hint">Edad Mínima</span>
                <input
                  v-model="form.search_preferences.minAge"
                  type="number"
                  min="18"
                  :max="form.search_preferences.maxAge - 1"
                  class="w-full px-3 py-2 rounded-xl bg-tg-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs font-bold text-center"
                />
              </div>

              <div class="space-y-1">
                <span class="text-[10px] text-tg-hint">Edad Máxima</span>
                <input
                  v-model="form.search_preferences.maxAge"
                  type="number"
                  :min="form.search_preferences.minAge + 1"
                  max="90"
                  class="w-full px-3 py-2 rounded-xl bg-tg-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs font-bold text-center"
                />
              </div>
            </div>
          </div>

          <!-- 3. Interesada en Conectar con -->
          <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 space-y-3">
            <label class="text-xs font-bold text-tg-text flex items-center gap-1.5">
              <Heart class="w-4 h-4 text-fematch-violet-500" />
              <span>Interesada en Descubrir</span>
            </label>
            <p class="text-[11px] text-tg-hint">
              Selecciona las identidades que deseas ver en tu radar de descubrimientos.
            </p>

            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="identity in GENDER_IDENTITIES"
                :key="identity"
                type="button"
                @click="toggleInterestedIn(identity)"
                class="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                :class="[
                  form.search_preferences.interestedIn.includes(identity)
                    ? 'bg-gradient-to-r from-fematch-violet-500 to-fematch-cyan-500 text-white shadow-pastel-violet'
                    : 'bg-tg-bg text-tg-hint border border-fematch-pink-100 dark:border-fematch-violet-900/40 hover:text-tg-text'
                ]"
              >
                {{ identity }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
