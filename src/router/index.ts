import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user.store'
import { hasValidTelegramInitData } from '@/telegram/init'
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
 * 1. Verifica si existe initData de Telegram válido.
 * 2. Si no hay initData (acceso directo en navegador), App.vue mostrará la modal/pantalla bloqueante.
 * 3. Si hay initData:
 *    - Llama al servicio de usuario (GET /api/user/me).
 *    - Si isNewUser === true o el perfil no existe en BD, fuerza la redirección a '/onboarding'
 *      y no permite acceder a '/discover', '/matches', '/profile' ni '/chat'.
 *    - Si isNewUser === false, permite continuar a '/discover' y bloquea '/onboarding'.
 */
router.beforeEach(async (to, _from, next) => {
  // 1. Si no hay initData de Telegram, permitir la navegación para que App.vue muestre la pantalla de bienvenida/bloqueo de Telegram
  if (!hasValidTelegramInitData()) {
    return next()
  }

  const userStore = useUserStore()

  // 2. Si aún no se ha cargado el usuario, consultar al backend
  if (!userStore.isLoaded) {
    try {
      await userStore.fetchMe()
    } catch (error) {
      console.warn('⚠️ [Router Guard] Error al obtener datos de usuario:', error)
    }
  }

  const needsOnboarding = userStore.isNewUser || userStore.isProfileIncomplete || !userStore.profile

  // 3. Si es nuevo usuario o perfil incompleto, forzar /onboarding
  if (needsOnboarding) {
    if (to.name !== 'onboarding') {
      return next({ name: 'onboarding' })
    }
    return next()
  }

  // 4. Si ya completó el onboarding y trata de entrar a /onboarding, enviar a /discover
  if (!needsOnboarding && to.name === 'onboarding') {
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
    webApp.BackButton?.hide?.()
  } else {
    webApp.BackButton?.show?.()
    webApp.BackButton?.onClick?.(() => {
      router.back()
    })
  }
})

export default router
