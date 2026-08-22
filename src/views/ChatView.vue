<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { matchService } from '@/api/services/match.service'
import type { ChatMessage, MatchCandidate } from '@/api/types'
import { useHaptics } from '@/composables/useHaptics'
import { Send, ArrowLeft, MoreVertical, ShieldCheck } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const haptics = useHaptics()

const chatId = (route.params.id as string) || 'cand_01'
const messages = ref<ChatMessage[]>([])
const newMessage = ref('')
const candidate = ref<MatchCandidate | null>(null)

onMounted(async () => {
  messages.value = await matchService.getMessages(chatId)
  const feed = await matchService.getDiscoveryFeed()
  candidate.value = feed.find((c) => c.id === chatId) || feed[0]
})

function onSendMessage() {
  if (!newMessage.value.trim()) return

  haptics.impact('light')

  const msg: ChatMessage = {
    id: `m_${Date.now()}`,
    senderId: 'usr_local_01',
    receiverId: chatId,
    content: newMessage.value.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: true,
  }

  messages.value.push(msg)
  newMessage.value = ''
}

function goBack() {
  haptics.selection()
  router.back()
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full bg-tg-bg">
    <!-- Chat Header -->
    <header class="px-4 py-2.5 bg-tg-bg/95 backdrop-blur-md border-b border-fematch-pink-100 dark:border-fematch-violet-900/40 flex items-center justify-between sticky top-0 z-20">
      <div class="flex items-center gap-3">
        <button
          @click="goBack"
          class="p-1.5 -ml-1 rounded-full text-tg-text active:scale-95 transition-transform"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>

        <div class="relative">
          <img
            :src="candidate?.photos[0] || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80'"
            :alt="candidate?.name"
            class="w-10 h-10 rounded-full object-cover ring-2 ring-fematch-pink-300"
          />
          <span
            v-if="candidate?.online"
            class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-fematch-cyan-400 border-2 border-tg-bg rounded-full"
          />
        </div>

        <div>
          <div class="flex items-center gap-1">
            <h2 class="text-sm font-bold text-tg-text">{{ candidate?.name || 'Match' }}</h2>
            <ShieldCheck class="w-3.5 h-3.5 text-fematch-cyan-500" />
          </div>
          <span class="text-[10px] text-tg-hint">
            {{ candidate?.online ? 'En línea' : 'Activa recientemente' }}
          </span>
        </div>
      </div>

      <button class="p-2 text-tg-hint hover:text-tg-text">
        <MoreVertical class="w-4 h-4" />
      </button>
    </header>

    <!-- Messages Container -->
    <div class="flex-1 p-4 overflow-y-auto space-y-3">
      <!-- Match Announcement Banner inside chat -->
      <div class="py-4 text-center">
        <div class="inline-block px-3 py-1 rounded-full bg-fematch-pink-50 dark:bg-fematch-violet-950/60 border border-fematch-pink-200 dark:border-fematch-violet-800 text-[11px] font-semibold text-fematch-pink-700 dark:text-fematch-pink-300">
          ¡Hicieron Match! Inicia una conversación respetuosa ✨
        </div>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex flex-col"
        :class="[msg.senderId === 'usr_local_01' ? 'items-end' : 'items-start']"
      >
        <div
          class="max-w-[78%] px-4 py-2.5 rounded-2xl text-xs shadow-xs leading-relaxed"
          :class="[
            msg.senderId === 'usr_local_01'
              ? 'bg-gradient-to-r from-fematch-pink-500 to-fematch-violet-500 text-white rounded-br-none shadow-pastel-pink'
              : 'bg-tg-secondary-bg text-tg-text border border-fematch-pink-100 dark:border-fematch-violet-900/40 rounded-bl-none'
          ]"
        >
          <p>{{ msg.content }}</p>
          <span
            class="block text-[9px] mt-1 text-right"
            :class="[msg.senderId === 'usr_local_01' ? 'text-white/80' : 'text-tg-hint']"
          >
            {{ msg.timestamp }}
          </span>
        </div>
      </div>
    </div>

    <!-- Message Input Bar -->
    <div class="p-3 bg-tg-bg border-t border-fematch-pink-100 dark:border-fematch-violet-900/40 pb-safe">
      <form @submit.prevent="onSendMessage" class="flex items-center gap-2">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Escribe un mensaje cariñoso..."
          class="flex-1 px-4 py-2.5 rounded-full bg-tg-secondary-bg border border-fematch-pink-200 dark:border-fematch-violet-800 text-xs text-tg-text placeholder-tg-hint focus:outline-none focus:ring-2 focus:ring-fematch-pink-400"
        />
        <button
          type="submit"
          class="w-10 h-10 rounded-full bg-gradient-to-tr from-fematch-pink-500 to-fematch-violet-500 text-white flex items-center justify-center shadow-pastel-pink active:scale-90 transition-transform flex-shrink-0"
        >
          <Send class="w-4 h-4 -ml-0.5" />
        </button>
      </form>
    </div>
  </div>
</template>
