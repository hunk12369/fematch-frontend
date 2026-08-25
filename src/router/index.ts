import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user.store'
import DiscoverView from '@/views/DiscoverView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/discover',
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/views/OnboardingView.vue'),
    meta: {
      title: 'Bienvenida a Fematch',
      showBottomNav: false,
      isRoot: true,
    },
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

/**
 * Navigation Guard Global:
 * Al iniciar la app, llama a /api/user/me (a través de userStore.fetchMe()).
 * Si isNewUser === true, redirige automáticamente a la pantalla de OnboardingView.
 */
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  // 1. Obtener perfil de /api/user/me si no está cargado todavía
  if (!userStore.isLoaded) {
    try {
      await userStore.fetchMe()
    } catch (error) {
      console.warn('⚠️ [Router Guard] Error al cargar /api/user/me:', error)
    }
  }

  // 2. Si es un nuevo usuario (isNewUser === true) y no está en /onboarding, redirigir a Onboarding
  if (userStore.isNewUser && to.name !== 'onboarding') {
    return next({ name: 'onboarding' })
  }

  // 3. Si ya completó el onboarding e intenta acceder a /onboarding, redirigir a /discover
  if (!userStore.isNewUser && to.name === 'onboarding') {
    return next({ name: 'discover' })
  }

  next()
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
