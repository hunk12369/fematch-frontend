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
  Send,
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
const apiTestStatus = ref<string | null>(null)
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

async function testApiCall() {
  haptics.impact('medium')
  apiTestStatus.value = 'Enviando petición a la API con Axios...'
  try {
    await userService.getMe()
    apiTestStatus.value = '✅ Petición exitosa con encabezado Authorization: tma ...'
    haptics.notification('success')
  } catch (err: any) {
    apiTestStatus.value = `❌ Error: ${err.message}`
    haptics.notification('error')
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
  <div class="flex-1 flex flex-col px-4 py-4 overflow-y-auto no-scrollbar gap-4 pb-12 select-none">
    <!-- Hidden Avatar File Input -->
    <input
      ref="avatarFileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="onAvatarFileSelected"
    />

    <!-- User Hero Card -->
    <div
      class="relative p-5 rounded-3xl bg-tg-secondary-bg border border-fematch-pink-200 dark:border-fematch-violet-900/60 shadow-sm overflow-hidden flex flex-col items-center text-center"
    >
      <!-- Background Ambient Glow -->
      <div class="absolute -top-10 -right-10 w-36 h-36 bg-fematch-pink-400/20 rounded-full blur-2xl pointer-events-none" />
      <div class="absolute -bottom-10 -left-10 w-36 h-36 bg-fematch-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

      <!-- Edit Profile Floating Action Button -->
      <button
        type="button"
        @click="openEditModal"
        class="absolute top-4 right-4 p-2 rounded-full bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-fematch-pink-600 dark:text-fematch-pink-400 shadow-sm active:scale-90 transition-transform"
        title="Editar mi perfil"
      >
        <Edit3 class="w-4 h-4" />
      </button>

      <!-- Avatar with Gradient Ring & Direct Upload Trigger -->
      <div class="relative mb-3 group cursor-pointer" @click="triggerAvatarUpload" title="Cambiar foto de portada">
        <div class="p-1 rounded-full bg-gradient-to-tr from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-400 shadow-pastel-pink relative overflow-hidden">
          <img
            :src="profile?.photos[0]?.url || tgStore.user?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'"
            :alt="profile?.firstName || tgStore.userFullName"
            class="w-20 h-20 rounded-full object-cover border-2 border-tg-bg"
            :class="{ 'opacity-50 blur-xs': isUploadingAvatar }"
          />

          <!-- Loading Spinner overlay while uploading -->
          <div
            v-if="isUploadingAvatar"
            class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full"
          >
            <Loader2 class="w-6 h-6 animate-spin text-white" />
          </div>

          <!-- Camera Icon Overlay on Hover/Touch -->
          <div
            v-else
            class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full"
          >
            <Camera class="w-5 h-5 text-white drop-shadow" />
          </div>
        </div>

        <div
          v-if="profile?.isVip || tgStore.user?.is_premium || premiumStore.isVip"
          class="absolute bottom-0 right-0 p-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full text-white shadow-sm"
          title="Telegram Premium & Fematch VIP"
        >
          <Crown class="w-3.5 h-3.5 fill-white" />
        </div>
      </div>

      <!-- Names, Age & Verification -->
      <h2 class="text-xl font-extrabold text-tg-text flex items-center gap-1.5">
        <span>{{ profile?.firstName || tgStore.userFullName }}, {{ profile?.age || 26 }}</span>
        <ShieldCheck class="w-5 h-5 text-fematch-cyan-500" />
      </h2>

      <div class="flex items-center gap-2 text-xs text-fematch-pink-600 dark:text-fematch-pink-400 font-semibold mb-1">
        <span>@{{ profile?.username || tgStore.user?.username || 'fematch_user' }}</span>
        <span>•</span>
        <span class="px-2 py-0.5 rounded-full bg-fematch-pink-100 dark:bg-fematch-pink-950 text-[10px]">
          {{ profile?.genderIdentity ? (GENDER_IDENTITY_LABELS[profile.genderIdentity as keyof typeof GENDER_IDENTITY_LABELS] || profile.genderIdentity) : 'Trans Femenina' }}
        </span>
      </div>

      <!-- City / Location -->
      <div v-if="profile?.city" class="flex items-center gap-1 text-[11px] text-tg-hint mb-3">
        <MapPin class="w-3 h-3 text-fematch-cyan-500" />
        <span>{{ profile.city }}</span>
      </div>

      <!-- Action Buttons Row (Editar & Filtros) -->
      <div class="flex items-center gap-2 w-full mb-3">
        <button
          type="button"
          @click="openEditModal"
          class="flex-1 py-2 px-3 rounded-2xl bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white font-bold text-xs shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          <Edit3 class="w-3.5 h-3.5" />
          <span>Editar Perfil</span>
        </button>

        <button
          type="button"
          @click="openEditModal"
          class="p-2 rounded-2xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-tg-text active:scale-95 transition-transform flex items-center justify-center"
          title="Filtros de Búsqueda"
        >
          <Sliders class="w-4 h-4 text-fematch-violet-500" />
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-3 gap-2 w-full pt-3 border-t border-fematch-pink-100 dark:border-fematch-violet-900/40">
        <div class="p-2 rounded-2xl bg-tg-bg">
          <span class="block text-sm font-black text-fematch-pink-500">
            {{ profile?.matchesCount || 28 }}
          </span>
          <span class="text-[10px] text-tg-hint font-medium">Matches</span>
        </div>
        <div class="p-2 rounded-2xl bg-tg-bg">
          <span class="block text-sm font-black text-fematch-violet-500">
            {{ profile?.likesCount || 142 }}
          </span>
          <span class="text-[10px] text-tg-hint font-medium">Likes</span>
        </div>
        <div class="p-2 rounded-2xl bg-tg-bg">
          <span class="block text-sm font-black text-amber-500">
            {{ premiumStore.superlikesCount }} ⭐
          </span>
          <span class="text-[10px] text-tg-hint font-medium">Superlikes</span>
        </div>
      </div>
    </div>

    <!-- VIP / Premium Promotion Banner (Tienda) -->
    <div
      class="relative p-4 rounded-3xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white shadow-pastel-pink overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      @click="openShop('vip_subscription')"
    >
      <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
            <Crown class="w-6 h-6 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h3 class="text-sm font-black">Fematch VIP & Stars</h3>
              <span class="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">NUEVO</span>
            </div>
            <p class="text-[11px] text-white/90">
              Likes ilimitados, Boosts y pagos nativos con Telegram Stars.
            </p>
          </div>
        </div>

        <ChevronRight class="w-5 h-5 flex-shrink-0 text-white/80" />
      </div>
    </div>

    <!-- Quick Purchase Grid (Boost & Superlikes) -->
    <div class="grid grid-cols-2 gap-3">
      <div
        @click="openShop('boost')"
        class="p-3.5 rounded-2xl bg-tg-secondary-bg border border-fematch-violet-200 dark:border-fematch-violet-900/60 cursor-pointer active:scale-95 transition-transform"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="p-2 rounded-xl bg-fematch-violet-500/15 text-fematch-violet-500">
            <Zap class="w-4 h-4 fill-fematch-violet-500" />
          </div>
          <span class="text-[10px] font-bold text-amber-500">100 ⭐</span>
        </div>
        <h4 class="text-xs font-bold text-tg-text">Boost de 24 Horas</h4>
        <span class="text-[10px] text-tg-hint">x10 Visibilidad en Swipes</span>
      </div>

      <div
        @click="openShop('superlikes')"
        class="p-3.5 rounded-2xl bg-tg-secondary-bg border border-fematch-cyan-200 dark:border-fematch-cyan-900/60 cursor-pointer active:scale-95 transition-transform"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="p-2 rounded-xl bg-fematch-cyan-500/15 text-fematch-cyan-500">
            <Star class="w-4 h-4 fill-fematch-cyan-500" />
          </div>
          <span class="text-[10px] font-bold text-amber-500">Desde 50 ⭐</span>
        </div>
        <h4 class="text-xs font-bold text-tg-text">Pack Superlikes</h4>
        <span class="text-[10px] text-tg-hint">Destaca en el feed</span>
      </div>
    </div>

    <!-- Bio Card -->
    <div v-if="profile?.bio" class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 space-y-2">
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

    <!-- Search Preferences Info Card -->
    <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-pink-100 dark:border-fematch-violet-900/40 space-y-2.5">
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
        <div class="p-2 rounded-xl bg-tg-bg">
          <span class="text-[10px] text-tg-hint block">Distancia Máxima</span>
          <span class="font-bold text-fematch-cyan-500">
            Hasta {{ profile?.preference?.maxDistanceKm || 30 }} km
          </span>
        </div>

        <div class="p-2 rounded-xl bg-tg-bg">
          <span class="text-[10px] text-tg-hint block">Rango de Edad</span>
          <span class="font-bold text-fematch-pink-500">
            {{ profile?.preference?.minAge || 18 }} - {{ profile?.preference?.maxAge || 35 }} años
          </span>
        </div>
      </div>
    </div>

    <!-- Centralized Axios & TMA Authorization Demo Card -->
    <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-violet-200 dark:border-fematch-violet-900/60 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-fematch-violet-600 dark:text-fematch-violet-400 flex items-center gap-1.5">
          <Zap class="w-3.5 h-3.5" />
          <span>API & Auth Header TMA</span>
        </h3>
        <span class="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          Axios Ready
        </span>
      </div>

      <p class="text-xs text-tg-hint leading-relaxed">
        Todas las peticiones a la API adjuntan automáticamente la cabecera:
      </p>

      <div class="p-2.5 rounded-xl bg-black/80 font-mono text-[11px] text-emerald-400 break-all select-all">
        Authorization: tma {{ tgStore.initData || 'query_id=...&user=...' }}
      </div>

      <button
        @click="testApiCall"
        class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-fematch-pink-500 via-fematch-violet-500 to-fematch-cyan-500 text-white font-bold text-xs shadow-pastel-pink active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        <Send class="w-3.5 h-3.5" />
        <span>Probar Petición con Axios Interceptor</span>
      </button>

      <div v-if="apiTestStatus" class="text-xs font-semibold text-fematch-pink-600 dark:text-fematch-pink-300">
        {{ apiTestStatus }}
      </div>
    </div>

    <!-- Haptics Test Playground -->
    <div class="p-4 rounded-2xl bg-tg-secondary-bg border border-fematch-cyan-100 dark:border-fematch-cyan-900/40 space-y-2.5">
      <h3 class="text-xs font-bold uppercase tracking-wider text-fematch-cyan-600 dark:text-fematch-cyan-400 flex items-center gap-1.5">
        <Sparkles class="w-3.5 h-3.5" />
        <span>Telegram Haptic Feedback</span>
      </h3>

      <div class="grid grid-cols-3 gap-2">
        <button
          @click="testHaptic('light')"
          class="py-2 px-2 rounded-xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-semibold text-tg-text active:scale-95"
        >
          Light
        </button>
        <button
          @click="testHaptic('medium')"
          class="py-2 px-2 rounded-xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-semibold text-tg-text active:scale-95"
        >
          Medium
        </button>
        <button
          @click="testHaptic('heavy')"
          class="py-2 px-2 rounded-xl bg-tg-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs font-semibold text-tg-text active:scale-95"
        >
          Heavy
        </button>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <EditProfileModal
      :is-open="isEditModalOpen"
      :profile="profile"
      @close="isEditModalOpen = false"
      @saved="handleProfileSaved"
    />
  </div>
</template>
