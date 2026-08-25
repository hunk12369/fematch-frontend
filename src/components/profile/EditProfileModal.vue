<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { User, UserPhoto, GenderIdentity } from '@/api/types'
import { GENDER_IDENTITY_OPTIONS } from '@/api/types'
import { userService } from '@/api/services/user.service'
import { useHaptics } from '@/composables/useHaptics'
import {
  X,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sliders,
  User as UserIcon,
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
  profile: User | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', updatedProfile: User): void
}>()

const haptics = useHaptics()
const isSaving = ref(false)
const isUploadingPhoto = ref(false)
const uploadErrorMessage = ref<string | null>(null)
const activeTab = ref<'profile' | 'preferences'>('profile')

// Referencia al selector nativo de archivos oculto
const fileInputRef = ref<HTMLInputElement | null>(null)

// Formulario reactivo local adaptado al esquema de Prisma
const form = reactive({
  gender_identity: 'TRANS_FEM' as GenderIdentity,
  birth_date: '2000-01-01',
  bio: '',
  city: 'Madrid',
  photos: [] as UserPhoto[],
  target_genders: ['FEMBOY', 'TRANS_FEM', 'TRANS_MASC', 'CROSSDRESSER', 'MAN', 'OTHER'] as string[],
  min_age: 18,
  max_age: 35,
  max_distance_km: 30,
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

// Sincronizar datos cuando se abre el modal
watch(
  () => props.profile,
  (p) => {
    if (p) {
      form.gender_identity = (p.genderIdentity as GenderIdentity) || 'TRANS_FEM'
      form.birth_date = p.birthDate || '2000-01-01'
      form.bio = p.bio || ''
      form.city = p.city || 'Madrid'
      form.photos = p.photos ? [...p.photos] : []
      form.target_genders = p.preference?.targetGenders
        ? [...p.preference.targetGenders]
        : ['FEMBOY', 'TRANS_FEM', 'TRANS_MASC', 'CROSSDRESSER', 'MAN', 'OTHER']
      form.min_age = p.preference?.minAge || 18
      form.max_age = p.preference?.maxAge || 35
      form.max_distance_km = p.preference?.maxDistanceKm || 30
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
  const MAX_SIZE_BYTES = 5 * 1024 * 1024
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
    const nextOrder = form.photos.length
    const newPhotoUrl = await userService.uploadPhoto(file, nextOrder)

    if (newPhotoUrl && !form.photos.some((p) => p.url === newPhotoUrl)) {
      form.photos.push({
        id: `photo_${Date.now()}`,
        url: newPhotoUrl,
        orderIndex: nextOrder,
      })
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

async function removePhoto(index: number) {
  if (form.photos.length <= 1) {
    alert('Debes mantener al menos 1 foto principal en tu perfil.')
    return
  }
  const photo = form.photos[index]
  haptics.impact('medium')

  if (photo?.id) {
    await userService.deletePhoto(photo.id)
  }
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

// Toggle de identidades deseadas en preferencias
function toggleTargetGender(identity: string) {
  haptics.selection()
  const idx = form.target_genders.indexOf(identity)
  if (idx >= 0) {
    if (form.target_genders.length <= 1) {
      alert('Debes seleccionar al menos una identidad de búsqueda.')
      return
    }
    form.target_genders.splice(idx, 1)
  } else {
    form.target_genders.push(identity)
  }
}

// Guardar cambios del perfil vía POST /api/user/onboarding
async function onSave() {
  if (!form.birth_date || !isAdult.value) {
    alert('Debes ingresar una fecha de nacimiento válida (mayor de 18 años).')
    return
  }
  if (form.photos.length === 0) {
    alert('Por favor agrega al menos una foto.')
    return
  }

  isSaving.value = true
  haptics.impact('medium')

  try {
    const updated = await userService.saveOnboarding({
      gender_identity: form.gender_identity,
      birth_date: form.birth_date,
      bio: form.bio.trim(),
      city: form.city.trim(),
      target_genders: [...form.target_genders],
      min_age: Number(form.min_age),
      max_age: Number(form.max_age),
      max_distance_km: Number(form.max_distance_km),
    })

    haptics.notification('success')
    emit('saved', updated)
    emit('close')
  } catch (error) {
    console.error('Error al guardar perfil:', error)
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
          :disabled="isSaving || isUploadingPhoto || !isAdult"
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
          <UserIcon class="w-3.5 h-3.5" />
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
                :key="photo.id || `photo-${idx}`"
                class="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-fematch-pink-300 dark:border-fematch-violet-700 bg-neutral-900 group shadow-sm"
              >
                <img :src="photo.url" class="w-full h-full object-cover" />

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
            <!-- Fecha de Nacimiento -->
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-tg-hint flex items-center justify-between">
                <span>Fecha de Nacimiento (YYYY-MM-DD)</span>
                <span v-if="calculatedAge > 0" class="text-fematch-pink-500 font-bold text-xs">
                  {{ calculatedAge }} años
                </span>
              </label>
              <input
                v-model="form.birth_date"
                type="date"
                max="2008-01-01"
                min="1940-01-01"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text font-bold text-center focus:outline-none focus:ring-2 focus:ring-fematch-pink-400"
              />
              <span v-if="!isAdult" class="text-[10px] text-rose-500 font-semibold block text-center">
                ⚠️ Debes ser mayor de 18 años (+18)
              </span>
            </div>

            <!-- Ciudad -->
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-tg-hint">Ciudad actual</label>
              <input
                v-model="form.city"
                type="text"
                placeholder="ej. Madrid, Barcelona..."
                class="w-full px-3.5 py-2.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400 font-semibold"
              />
            </div>

            <!-- Identidad de Género (Enum) -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-tg-hint flex items-center justify-between">
                <span>Mi Identidad de Género</span>
              </label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="opt in GENDER_IDENTITY_OPTIONS"
                  :key="opt.value"
                  type="button"
                  @click="form.gender_identity = opt.value"
                  class="px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center"
                  :class="[
                    form.gender_identity === opt.value
                      ? 'bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white shadow-pastel-pink font-bold'
                      : 'bg-tg-secondary-bg text-tg-text border border-fematch-pink-100 dark:border-fematch-violet-900/40'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Bio -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-bold text-tg-hint">Sobre Mí (Bio)</label>
                <span class="text-[10px] text-tg-hint">{{ form.bio.length }}/300</span>
              </div>
              <textarea
                v-model="form.bio"
                maxlength="300"
                rows="3"
                placeholder="Cuéntanos un poco sobre ti, lo que te apasiona y lo que buscas..."
                class="w-full p-3.5 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs text-tg-text focus:outline-none focus:ring-2 focus:ring-fematch-pink-400 leading-relaxed resize-none"
              />
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
                Hasta {{ form.max_distance_km }} km
              </span>
            </div>

            <input
              v-model.number="form.max_distance_km"
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
                {{ form.min_age }} - {{ form.max_age }} años
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-1">
              <div class="space-y-1">
                <span class="text-[10px] text-tg-hint">Edad Mínima</span>
                <input
                  v-model.number="form.min_age"
                  type="number"
                  min="18"
                  :max="form.max_age - 1"
                  class="w-full px-3 py-2 rounded-xl bg-tg-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs font-bold text-center"
                />
              </div>

              <div class="space-y-1">
                <span class="text-[10px] text-tg-hint">Edad Máxima</span>
                <input
                  v-model.number="form.max_age"
                  type="number"
                  :min="form.min_age + 1"
                  max="90"
                  class="w-full px-3 py-2 rounded-xl bg-tg-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 text-xs font-bold text-center"
                />
              </div>
            </div>
          </div>

          <!-- 3. Interesada en Conectar con (target_genders) -->
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
                v-for="opt in GENDER_IDENTITY_OPTIONS"
                :key="opt.value"
                type="button"
                @click="toggleTargetGender(opt.value)"
                class="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                :class="[
                  form.target_genders.includes(opt.value)
                    ? 'bg-gradient-to-r from-fematch-violet-500 to-fematch-cyan-500 text-white shadow-pastel-violet'
                    : 'bg-tg-bg text-tg-hint border border-fematch-pink-100 dark:border-fematch-violet-900/40 hover:text-tg-text'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
