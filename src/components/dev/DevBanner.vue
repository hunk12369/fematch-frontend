<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTelegramStore } from '@/stores/telegram.store'
import { useUserStore } from '@/stores/user.store'
import { Terminal, CheckCircle2, ChevronDown, ChevronUp, KeyRound, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const tgStore = useTelegramStore()
const userStore = useUserStore()
const isExpanded = ref(false)

function testOnboarding() {
  userStore.resetOnboardingForTesting()
  router.push('/onboarding')
}
</script>

<template>
  <aside
    class="bg-slate-900/95 text-slate-200 text-xs border-b border-slate-700 px-3 py-1.5 transition-all z-40"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Terminal class="w-3.5 h-3.5 text-fematch-cyan-400" />
        <span class="font-bold text-[11px] text-white">Fematch TMA Dev Tool</span>
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-bold"
          :class="[
            tgStore.isInsideTelegram
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          ]"
        >
          {{ tgStore.isInsideTelegram ? '🟢 Live Telegram App' : '🟡 Dev Mock Mode' }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="testOnboarding"
          class="px-2 py-0.5 rounded bg-fematch-pink-500/20 border border-fematch-pink-400/40 text-fematch-pink-300 hover:bg-fematch-pink-500/30 text-[10px] font-bold flex items-center gap-1"
          title="Probar flujo de Onboarding"
        >
          <Sparkles class="w-2.5 h-2.5" />
          <span>Test Onboarding</span>
        </button>

        <button
          @click="isExpanded = !isExpanded"
          class="text-slate-400 hover:text-white p-1"
          title="Detalles de autenticación TMA"
        >
          <ChevronDown v-if="!isExpanded" class="w-3.5 h-3.5" />
          <ChevronUp v-else class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Collapsible Details -->
    <div v-if="isExpanded" class="mt-2 pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
      <div class="flex items-center justify-between text-slate-300">
        <span class="flex items-center gap-1">
          <KeyRound class="w-3 h-3 text-fematch-pink-400" />
          <span>Header Axios Auth:</span>
        </span>
        <span class="font-mono text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded text-[10px]">
          Authorization: tma {{ tgStore.initData ? `${tgStore.initData.substring(0, 24)}...` : 'N/A' }}
        </span>
      </div>

      <div class="flex items-center justify-between text-slate-300">
        <span class="flex items-center gap-1">
          <CheckCircle2 class="w-3 h-3 text-fematch-cyan-400" />
          <span>Telegram User ID:</span>
        </span>
        <span class="font-mono text-slate-200">
          {{ tgStore.user?.id || 'Desconocido' }} ({{ tgStore.user?.first_name }})
        </span>
      </div>
    </div>
  </aside>
</template>
