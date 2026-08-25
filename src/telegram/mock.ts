import type { TelegramWebApp, TelegramThemeParams, TelegramUser } from './types'

const MOCK_USER: TelegramUser = {
  id: 987654321,
  first_name: 'Elena',
  last_name: 'Vargas',
  username: 'elena_fematch',
  language_code: 'es',
  is_premium: true,
  photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
}

const MOCK_THEME: TelegramThemeParams = {
  bg_color: '#ffffff',
  secondary_bg_color: '#fdf2f8',
  text_color: '#1e1e24',
  hint_color: '#9ca3af',
  link_color: '#ec4899',
  button_color: '#ec4899',
  button_text_color: '#ffffff',
  header_bg_color: '#ffffff',
  section_bg_color: '#ffffff',
  section_header_text_color: '#be185d',
  subtitle_text_color: '#9ca3af',
  destructive_text_color: '#ef4444',
  accent_text_color: '#ec4899',
}

// Genera initData realista para desarrollo local únicamente
const mockInitDataQuery = `query_id=AAHdF6IQAAAAAN0XohD3Z9xP&user=${encodeURIComponent(
  JSON.stringify(MOCK_USER)
)}&auth_date=${Math.floor(Date.now() / 1000)}&hash=mock_fematch_hash_for_development_purposes`

export function setupTelegramMock(): void {
  if (typeof window === 'undefined') return

  // Comprobar estrictamente si estamos en localhost
  const host = window.location.hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.localhost')
  if (!isLocal) {
    return
  }

  // Only mock if Telegram WebApp is not already present
  if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initData) {
    console.info('🛠️ [Fematch TMA] Inyectando entorno Mock de Telegram para desarrollo local (localhost).')

    const mockWebApp: TelegramWebApp = {
      initData: mockInitDataQuery,
      initDataUnsafe: {
        query_id: 'AAHdF6IQAAAAAN0XohD3Z9xP',
        user: MOCK_USER,
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'mock_fematch_hash_for_development_purposes',
      },
      version: '8.0',
      platform: 'macos',
      colorScheme: 'light',
      themeParams: MOCK_THEME,
      isExpanded: true,
      viewportHeight: window.innerHeight,
      viewportStableHeight: window.innerHeight,
      headerColor: '#ffffff',
      backgroundColor: '#ffffff',
      isClosingConfirmationEnabled: false,
      BackButton: {
        isVisible: false,
        onClick: (cb) => console.log('[Mock TG] BackButton onClick registered', cb),
        offClick: (cb) => console.log('[Mock TG] BackButton offClick registered', cb),
        show: () => console.log('[Mock TG] BackButton shown'),
        hide: () => console.log('[Mock TG] BackButton hidden'),
      },
      MainButton: {
        text: 'CONTINUAR',
        color: '#ec4899',
        textColor: '#ffffff',
        isVisible: false,
        isActive: true,
        isProgressVisible: false,
        setText: (text) => console.log('[Mock TG] MainButton text:', text),
        onClick: (cb) => console.log('[Mock TG] MainButton onClick registered', cb),
        offClick: (cb) => console.log('[Mock TG] MainButton offClick registered', cb),
        show: () => console.log('[Mock TG] MainButton shown'),
        hide: () => console.log('[Mock TG] MainButton hidden'),
        enable: () => console.log('[Mock TG] MainButton enabled'),
        disable: () => console.log('[Mock TG] MainButton disabled'),
        showProgress: () => console.log('[Mock TG] MainButton showProgress'),
        hideProgress: () => console.log('[Mock TG] MainButton hideProgress'),
        setParams: (p) => console.log('[Mock TG] MainButton setParams', p),
      },
      HapticFeedback: {
        impactOccurred: (style) => console.log(`[Mock TG Haptic] Impact: ${style}`),
        notificationOccurred: (type) => console.log(`[Mock TG Haptic] Notification: ${type}`),
        selectionChanged: () => console.log('[Mock TG Haptic] Selection changed'),
      },
      ready: () => console.log('[Mock TG] WebApp.ready() called'),
      expand: () => console.log('[Mock TG] WebApp.expand() called'),
      close: () => console.log('[Mock TG] WebApp.close() called'),
      setHeaderColor: (color) => console.log('[Mock TG] setHeaderColor:', color),
      setBackgroundColor: (color) => console.log('[Mock TG] setBackgroundColor:', color),
      enableClosingConfirmation: () => console.log('[Mock TG] enableClosingConfirmation'),
      disableClosingConfirmation: () => console.log('[Mock TG] disableClosingConfirmation'),
      onEvent: (event, handler) => console.log(`[Mock TG] onEvent: ${event}`, handler),
      offEvent: (event, handler) => console.log(`[Mock TG] offEvent: ${event}`, handler),
      sendData: (data) => console.log('[Mock TG] sendData:', data),
      openLink: (url) => window.open(url, '_blank'),
      openTelegramLink: (url) => window.open(url, '_blank'),
      openInvoice: (url, cb) => {
        console.log('[Mock TG] openInvoice:', url)
        cb?.('paid')
      },
      showPopup: (params, cb) => {
        alert(`${params.title || 'Fematch'}\n${params.message}`)
        cb?.('ok')
      },
      showAlert: (msg, cb) => {
        alert(msg)
        cb?.()
      },
      showConfirm: (msg, cb) => {
        const res = confirm(msg)
        cb?.(res)
      },
    }

    window.Telegram = {
      WebApp: mockWebApp,
    }
  }
}
