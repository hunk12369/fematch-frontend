<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTelegramStore } from '@/stores/telegram.store'
import { usePremiumStore } from '@/stores/premium.store'
import { userService } from '@/api/services/user.service'
import type { User } from '@/api/types'
import { GENDER_IDENTITY_LABELS } from '@/api/types'
import { useHaptics } from '@/composables/useHaptics'
import EditProfileModal from '@/components/profile/EditProfileModal.vue'
import {
  ShieldCheck,
  Crown,
  Heart,
  Sparkles,
  Zap,
  Star,
  ChevronRight,
  Edit3,
  Sliders,
  MapPin,
  Camera,
  Loader2,
} from 'lucide-vue-next'

const tgStore = useTelegramStore()
const premiumStore = usePremiumStore()
const haptics = useHaptics()

const profile = ref<User | null>(null)
const isLoading = ref(true)
const isEditModalOpen = ref(false)
const isUploadingAvatar = ref(false)
const avatarFileInputRef = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  try {
    const res = await userService.getMe()
    profile.value = res.user
  } finally {
    isLoading.value = false
  }
})

function openEditModal() {
  haptics.selection()
  isEditModalOpen.value = true
}

function handleProfileSaved(updated: User) {
  profile.value = updated
}

function triggerAvatarUpload() {
  if (isUploadingAvatar.value) return
  haptics.impact('light')
  avatarFileInputRef.value?.click()
}

async function onAvatarFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validación de tamaño < 5MB
  const MAX_SIZE_BYTES = 5 * 1024 * 1024
  if (file.size > MAX_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1)
    alert(`La imagen (${sizeInMb}MB) supera el límite máximo de 5MB.`)
    haptics.notification('error')
    target.value = ''
    return
  }

  isUploadingAvatar.value = true
  haptics.impact('medium')

  try {
    const newPhotoUrl = await userService.uploadPhoto(file, 0)
    if (newPhotoUrl && profile.value) {
      profile.value.photos = [
        { id: `photo_${Date.now()}`, url: newPhotoUrl, orderIndex: 0 },
        ...profile.value.photos.filter((p) => p.url !== newPhotoUrl),
      ]
      haptics.notification('success')
    }
  } catch (error: any) {
    console.error('Error al subir avatar:', error)
    haptics.notification('error')
    alert(error.message || 'Error al subir la imagen')
  } finally {
    isUploadingAvatar.value = false
    target.value = ''
  }
}

function openShop(tab: 'vip_subscription' | 'boost' | 'superlikes') {
  premiumStore.openModal(tab)
}

function testHaptic(style: 'light' | 'medium' | 'heavy') {
  haptics.impact(style)
}
</script>

<template>
  <div class="flex flex-col min-h-full overflow-y-auto pb-28 p-4 space-y-4 select-none">
    <!-- Hidden Avatar File Input -->
    <input
      ref="avatarFileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="onAvatarFileSelected"
    />

    <!-- ======================================================== -->
    <!-- 1. USER HERO CARD CON AVATAR PROPORCIONAL Y NÍTIDO      -->
    <!-- ======================================================== -->
    <div
      class="relative p-6 rounded-3xl bg-tg-secondary-bg border border-fematch-pink-200 dark:border-fematch-violet-900/60 shadow-sm overflow-hidden flex flex-col items-center text-center flex-shrink-0"
    >
      <!-- Background Ambient Glows -->
      <div class="absolute -top-12 -right-12 w-44 h-44 bg-fematch-pink-400/20 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-12 -left-12 w-44 h-44 bg-fematch-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

      <!-- Avatar Container con dimensiones w-28 h-28 sm:w-32 sm:h-32 y botón de edición flotante -->
      <div class="relative mb-4 flex-shrink-0">
        <div
          class="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 shadow-pastel-pink cursor-pointer group"
          @click="triggerAvatarUpload"
          title="Cambiar foto de perfil"
        >
          <div class="w-full h-full rounded-full overflow-hidden border-4 border-fematch-pink-400/30 bg-tg-bg relative">
            <img
              :src="profile?.photos[0]?.url || tgStore.user?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'"
              :alt="profile?.firstName || tgStore.userFullName"
              class="w-full h-full object-cover"
              :class="{ 'opacity-50 blur-xs': isUploadingAvatar }"
            />

            <!-- Loading Spinner overlay while uploading to R2 -->
            <div
              v-if="isUploadingAvatar"
              class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
            >
              <Loader2 class="w-8 h-8 animate-spin text-white" />
            </div>

            <!-- Hover overlay -->
            <div
              v-else
              class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full"
            >
              <Camera class="w-6 h-6 text-white drop-shadow" />
            </div>
          </div>
        </div>

        <!-- Botón Flotante de Cámara / Edición de Foto -->
        <button
          type="button"
          @click="triggerAvatarUpload"
          class="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white shadow-lg active:scale-90 transition-transform border-2 border-tg-secondary-bg flex items-center justify-center z-10"
          title="Subir nueva foto"
        >
          <Camera class="w-4 h-4" />
        </button>

        <!-- VIP Crown Badge -->
        <div
          v-if="profile?.isVip || tgStore.user?.is_premium || premiumStore.isVip"
          class="absolute top-0 right-0 p-1.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full text-white shadow-md border-2 border-tg-secondary-bg z-10"
          title="VIP Fematch"
        >
          <Crown class="w-3.5 h-3.5 fill-white" />
        </div>
      </div>

      <!-- Nombre, Edad y Verificación -->
      <h2 class="text-2xl font-black text-tg-text flex items-center justify-center gap-1.5 mb-1">
        <span>{{ profile?.firstName || tgStore.userFullName }}, {{ profile?.age || 26 }}</span>
        <ShieldCheck class="w-5 h-5 text-fematch-cyan-500" />
      </h2>

      <!-- Username & Identidad de Género Badge -->
      <div class="flex items-center justify-center gap-2 text-xs text-fematch-pink-600 dark:text-fematch-pink-400 font-semibold mb-2">
        <span>@{{ profile?.username || tgStore.user?.username || 'fematch_user' }}</span>
        <span>•</span>
        <span class="px-2.5 py-0.5 rounded-full bg-fematch-pink-100 dark:bg-fematch-pink-950/80 text-[11px] font-bold">
          {{ profile?.genderIdentity ? (GENDER_IDENTITY_LABELS[profile.genderIdentity as keyof typeof GENDER_IDENTITY_LABELS] || profile.genderIdentity) : 'Trans Femenina' }}
        </span>
      </div>

      <!-- Ubicación / Ciudad -->
      <div v-if="profile?.city" class="flex items-center justify-center gap-1 text-xs text-tg-hint mb-4">
        <MapPin class="w-3.5 h-3.5 text-fematch-cyan-500" />
        <span>{{ profile.city }}</span>
      </div>

      <!-- Botones de Acción (Editar Perfil & Filtros) -->
      <div class="flex items-center gap-2 w-full mb-4">
        <button
          type="button"
          @click="openEditModal"
          class="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-extrabold text-xs shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Edit3 class="w-4 h-4" />
          <span>Editar Mi Perfil</span>
        </button>

        <button
          type="button"
          @click="openEditModal"
          class="p-3 rounded-2xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-tg-text active:scale-95 transition-transform flex items-center justify-center"
          title="Filtros de Búsqueda"
        >
          <Sliders class="w-4 h-4 text-fematch-violet-500" />
        </button>
      </div>

      <!-- Stats Bar (Matches, Likes, Superlikes) -->
      <div class="grid grid-cols-3 gap-2 w-full pt-4 border-t border-fematch-pink-100 dark:border-fematch-violet-900/40">
        <div class="p-2.5 rounded-2xl bg-tg-bg">
          <span class="block text-base font-black text-fematch-pink-500">
            {{ profile?.matchesCount || 28 }}
          </span>
          <span class="text-[10px] text-tg-hint font-bold uppercase tracking-wider">Matches</span>
        </div>
        <div class="p-2.5 rounded-2xl bg-tg-bg">
          <span class="block text-base font-black text-fematch-violet-500">
            {{ profile?.likesCount || 142 }}
          </span>
          <span class="text-[10px] text-tg-hint font-bold uppercase tracking-wider">Likes</span>
        </div>
        <div class="p-2.5 rounded-2xl bg-tg-bg">
          <span class="block text-base font-black text-amber-500">
            {{ premiumStore.superlikesCount }} ⭐
          </span>
          <span class="text-[10px] text-tg-hint font-bold uppercase tracking-wider">Superlikes</span>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- 2. BANNER VIP ("Fematch VIP & Stars") FLUIDO Y COMPLETO -->
    <!-- ======================================================== -->
    <div
      class="relative p-4 rounded-3xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white shadow-pastel-pink overflow-hidden cursor-pointer active:scale-[0.99] transition-transform flex-shrink-0 min-h-[72px] flex items-center justify-between"
      @click="openShop('vip_subscription')"
    >
      <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div class="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
        <div class="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
          <Crown class="w-6 h-6 text-amber-300 fill-amber-300" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-0.5">
            <h3 class="text-sm font-black truncate">Fematch VIP & Stars</h3>
            <span class="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex-shrink-0">
              NUEVO
            </span>
          </div>
          <p class="text-[11px] text-white/90 leading-tight truncate">
            Likes ilimitados, Boosts y compras en Telegram Stars.
          </p>
        </div>
      </div>

      <ChevronRight class="w-5 h-5 flex-shrink-0 text-white/80" />
    </div>

    <!-- ======================================================== -->
    <!-- 3. COMPRAS RÁPIDAS (BOOST & SUPERLIKES)                  -->
    <!-- ======================================================== -->
    <div class="grid grid-cols-2 gap-3 flex-shrink-0">
      <div
        @click="openShop('boost')"
        class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-violet-200 dark:border-fematch-violet-900/60 cursor-pointer active:scale-95 transition-transform shadow-xs"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="p-2 rounded-xl bg-fematch-violet-500/15 text-fematch-violet-500">
            <Zap class="w-4 h-4 fill-fematch-violet-500" />
          </div>
          <span class="text-[11px] font-extrabold text-amber-500">100 ⭐</span>
        </div>
        <h4 class="text-xs font-bold text-tg-text">Boost de 24 Horas</h4>
        <span class="text-[10px] text-tg-hint">x10 Visibilidad en Swipes</span>
      </div>

      <div
        @click="openShop('superlikes')"
        class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-cyan-200 dark:border-fematch-cyan-900/60 cursor-pointer active:scale-95 transition-transform shadow-xs"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="p-2 rounded-xl bg-fematch-cyan-500/15 text-fematch-cyan-500">
            <Star class="w-4 h-4 fill-fematch-cyan-500" />
          </div>
          <span class="text-[11px] font-extrabold text-amber-500">Desde 50 ⭐</span>
        </div>
        <h4 class="text-xs font-bold text-tg-text">Pack Superlikes</h4>
        <span class="text-[10px] text-tg-hint">Destaca en el feed</span>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- 4. BIO DEL USUARIO                                       -->
    <!-- ======================================================== -->
    <div v-if="profile?.bio" class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 space-y-2 flex-shrink-0">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-tg-hint flex items-center gap-1.5">
          <Heart class="w-3.5 h-3.5 text-fematch-pink-500" />
          <span>Sobre Mí</span>
        </h3>
        <button
          type="button"
          @click="openEditModal"
          class="text-xs font-bold text-fematch-pink-500 hover:underline"
        >
          Editar
        </button>
      </div>

      <p class="text-xs text-tg-text leading-relaxed">
        {{ profile.bio }}
      </p>
    </div>

    <!-- ======================================================== -->
    <!-- 5. PREFERENCIAS DEL RADAR                                -->
    <!-- ======================================================== -->
    <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 space-y-2.5 flex-shrink-0">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-tg-hint flex items-center gap-1.5">
          <MapPin class="w-3.5 h-3.5 text-fematch-cyan-400" />
          <span>Mis Preferencias de Radar</span>
        </h3>
        <button
          type="button"
          @click="openEditModal"
          class="text-xs font-bold text-fematch-violet-500 hover:underline"
        >
          Cambiar
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs text-tg-text">
        <div class="p-2.5 rounded-xl bg-tg-bg">
          <span class="text-[10px] text-tg-hint block">Distancia Máxima</span>
          <span class="font-extrabold text-fematch-cyan-500">
            Hasta {{ profile?.preference?.maxDistanceKm || 30 }} km
          </span>
        </div>

        <div class="p-2.5 rounded-xl bg-tg-bg">
          <span class="text-[10px] text-tg-hint block">Rango de Edad</span>
          <span class="font-extrabold text-fematch-pink-500">
            {{ profile?.preference?.minAge || 18 }} - {{ profile?.preference?.maxAge || 35 }} años
          </span>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- 6. HAPTICS PLAYGROUND                                    -->
    <!-- ======================================================== -->
    <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-cyan-100 dark:border-fematch-cyan-900/40 space-y-2.5 flex-shrink-0">
      <h3 class="text-xs font-bold uppercase tracking-wider text-fematch-cyan-600 dark:text-fematch-cyan-400 flex items-center gap-1.5">
        <Sparkles class="w-3.5 h-3.5" />
        <span>Vibración Háptica Telegram</span>
      </h3>

      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          @click="testHaptic('light')"
          class="py-2.5 px-2 rounded-xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-bold text-tg-text active:scale-95 transition-transform"
        >
          Suave
        </button>
        <button
          type="button"
          @click="testHaptic('medium')"
          class="py-2.5 px-2 rounded-xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-bold text-tg-text active:scale-95 transition-transform"
        >
          Media
        </button>
        <button
          type="button"
          @click="testHaptic('heavy')"
          class="py-2.5 px-2 rounded-xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-bold text-tg-text active:scale-95 transition-transform"
        >
          Fuerte
        </button>
      </div>
    </div>

    <!-- Modal de Edición de Perfil -->
    <EditProfileModal
      :is-open="isEditModalOpen"
      :profile="profile"
      @close="isEditModalOpen = false"
      @saved="handleProfileSaved"
    />
  </div>
</template>
