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
 * 2. Si no hay initData (acceso directo en navegador), App.vue mostrará la pantalla bloqueante.
 * 3. Si hay initData:
 *    - Antes de permitir la entrada a rutas protegidas ('/discover', '/matches', '/profile', '/chat'):
 *      * Si no se ha validado el estado en el store, llama a GET /api/user/me.
 *      * Si el endpoint responde isNewUser: true o no existe user.id en BD, REDIRIGE FORZOSAMENTE a '/onboarding'.
 *      * Bloquea la navegación al menú hasta que el usuario exista realmente en base de datos.
 *    - Si ya existe en BD y trata de entrar a '/onboarding', redirige a '/discover'.
 */
router.beforeEach(async (to, _from, next) => {
  // 1. Si no hay initData de Telegram, permitir la navegación para que App.vue muestre la pantalla bloqueante
  if (!hasValidTelegramInitData()) {
    return next()
  }

  const userStore = useUserStore()

  // 2. Si aún no se ha cargado el usuario, consultar al backend vía fetchMe() (GET /api/user/me)
  if (!userStore.isLoaded) {
    try {
      await userStore.fetchMe()
    } catch (error) {
      console.warn('⚠️ [Router Guard] Error al consultar usuario en backend:', error)
    }
  }

  // 3. Comprobar si el usuario existe fehacientemente en la base de datos con ID válido
  const hasRegisteredProfileInDb = Boolean(
    userStore.isLoaded &&
    !userStore.isNewUser &&
    !userStore.isProfileIncomplete &&
    userStore.profile &&
    userStore.profile.id
  )

  // 4. Si NO existe en BD o es nuevo usuario: REDIRIGIR FORZOSAMENTE a /onboarding
  if (!hasRegisteredProfileInDb) {
    if (to.name !== 'onboarding') {
      return next({ name: 'onboarding' })
    }
    return next()
  }

  // 5. Si YA existe en BD e intenta acceder a /onboarding, redirigir a /discover
  if (hasRegisteredProfileInDb && to.name === 'onboarding') {
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
