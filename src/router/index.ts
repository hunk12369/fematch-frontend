import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import DiscoverView from '@/views/DiscoverView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/discover',
  },
  {
    path: '/discover',
    name: 'discover',
    component: DiscoverView,
    meta: {
      title: 'Descubrir',
      showBottomNav: true,
      isRoot: true,
    },
  },
  {
    path: '/matches',
    name: 'matches',
    component: () => import('@/views/MatchesView.vue'),
    meta: {
      title: 'Conexiones',
      showBottomNav: true,
      isRoot: true,
    },
  },
  {
    path: '/chat/:id',
    name: 'chat',
    component: () => import('@/views/ChatView.vue'),
    meta: {
      title: 'Chat',
      showBottomNav: false,
      isRoot: false,
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: {
      title: 'Mi Perfil',
      showBottomNav: true,
      isRoot: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Sincronizar el botón BackButton nativo de Telegram WebApp con la navegación de Vue Router
router.afterEach((to) => {
  const webApp = window.Telegram?.WebApp
  if (!webApp) return

  const isRoot = Boolean(to.meta.isRoot)

  if (isRoot) {
    webApp.BackButton.hide()
  } else {
    webApp.BackButton.show()
    webApp.BackButton.onClick(() => {
      router.back()
    })
  }
})

export default router
