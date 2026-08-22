  Reviewing Frontend Setup
  He creado la arquitectura base completa de la Single Page Application móvil para Fematch en Vite + Vue 3 (Composition API con <script setup> 
  y TypeScript) y Tailwind CSS, optimizada específicamente para Telegram Mini Apps (TMA).                                                      
  ──────                                                                                                                                       
  ### 📁 Estructura del Proyecto Creada                                                                                                        
                                                                                                                                               
    frontend/                                                                                                                                  
    ├── index.html                       # Viewport móvil optimizado (viewport-fit=cover) + Script Telegram WebApp                             
    ├── package.json                     # Scripts y dependencias (Vue 3, Pinia, Vue Router, Axios, @telegram-apps/sdk)                        
    ├── tailwind.config.ts               # Paleta de identidad Fematch + Variables CSS de Telegram                                             
    ├── vite.config.ts                   # Configuración Vite con alias `@` y host para pruebas móviles                                        
    ├── tsconfig.json                    # TypeScript estricto con soporte para SFCs de Vue                                                    
    ├── .env                             # Configuración de API y Flags de entorno                                                             
    ├── src/                                                                                                                                   
    │   ├── main.ts                      # Entrada de la app con Pinia y Vue Router                                                            
    │   ├── App.vue                      # Shell móvil con safe-areas, header y navegación inferior                                            
    │   ├── api/                                                                                                                               
    │   │   ├── client.ts                # ⚡ Instancia centralizada Axios con interceptor Authorization TMA                                   
    │   │   ├── types.ts                 # Interfaces TypeScript para respuestas y modelos de citas                                            
    │   │   └── services/                                                                                                                      
    │   │       ├── user.service.ts      # Servicio de perfil de usuario                                                                       
    │   │       └── match.service.ts     # Servicio de swipes, matches y mensajería                                                            
    │   ├── telegram/                                                                                                                          
    │   │   ├── init.ts                  # 🚀 Inicialización SDK, expansión de viewport y configuración gestual                                
    │   │   ├── theme.ts                 # 🎨 Adaptación reactiva de themeParams a CSS Vars y Dark Mode                                        
    │   │   ├── mock.ts                  # 🛠️ Entorno Mock para desarrollo y pruebas en navegadores locales                                    
    │   │   └── types.ts                 # Tipado TypeScript del WebApp de Telegram                                                            
    │   ├── stores/                                                                                                                            
    │   │   ├── telegram.store.ts        # Store reactivo de Telegram (usuario, initData, esquema de color)                                    
    │   │   └── matches.store.ts         # Store de swipes, compatibilidad y matches                                                           
    │   ├── router/                                                                                                                            
    │   │   └── index.ts                 # Vue Router sincronizado con el botón BackButton nativo de Telegram                                  
    │   ├── composables/                                                                                                                       
    │   │   └── useHaptics.ts            # Wrapper reactivo para vibración táctil nativa (impact, selection, notify)                           
    │   ├── components/                                                                                                                        
    │   │   ├── layout/                                                                                                                        
    │   │   │   ├── AppHeader.vue        # Barra superior con logo degradado Fematch y estado del usuario                                      
    │   │   │   └── BottomNav.vue        # Barra de navegación inferior móvil con badges y haptics                                             
    │   │   ├── ui/                                                                                                                            
    │   │   │   ├── MatchCard.vue        # Tarjeta interactiva de citas con degradados pastel y badges                                         
    │   │   │   └── MatchModal.vue       # Modal celebratorio animado "¡Es un Match!"                                                          
    │   │   └── dev/                                                                                                                           
    │   │       └── DevBanner.vue        # Inspector de cabeceras de autorización y estado TMA en dev                                          
    │   └── views/                                                                                                                             
    │       ├── DiscoverView.vue         # Pantalla principal de descubrimiento / feed de swipes                                               
    │       ├── MatchesView.vue          # Lista de matches con indicador online y chats                                                       
    │       ├── ChatView.vue             # Conversación 1-a-1 con burbujas de estilo Fematch                                                   
    │       └── ProfileView.vue          # Perfil, preferencias y consola de prueba de peticiones Axios                                        
  ──────                                                                                                                                       
  ### 1. 🚀 Inicialización del Viewport y Tema de Telegram                                                                                     
                                                                                                                                               
  En init.ts y theme.ts:                                                                                                                       
                                                                                                                                               
  • Expansión a pantalla completa: Ejecuta viewport.mount(), viewport.expand() y window.Telegram.WebApp.expand() + ready().                    
  • Protección contra cierre por deslizamiento: Se llama a swipeBehavior.disableVertical() para prevenir que el usuario cierre la Mini App     
  accidentalmente al arrastrar perfiles hacia abajo.                                                                                           
  • Sincronización del tema: Mapea dinámicamente todas las claves de Telegram.WebApp.themeParams a variables CSS (--tg-theme-bg-color, --tg-   
  theme-text-color, --tg-theme-link-color, etc.) y detecta el contraste de color para activar la clase .dark de Tailwind automáticamente ante  
  cambios de tema del cliente (onEvent('themeChanged')).                                                                                       
  • BackButton sincronizado: En index.ts, cuando el usuario entra en una vista anidada (ej. un chat), el botón de volver nativo de Telegram    
  aparece y redirige el historial de Vue Router.                                                                                               
  ──────                                                                                                                                       
  ### 2. 🔐 Instancia Centralizada de Axios con Header TMA                                                                                     
                                                                                                                                               
  En client.ts:                                                                                                                                
                                                                                                                                               
  • Configura un interceptor de peticiones que extrae window.Telegram.WebApp.initData e inyecta de forma automática:                           
    Authorization: tma <initDataRaw>                                                                                                           
                                                                                                                                               
  • Interceptor de respuestas preparado para gestionar códigos de estado 401 Unauthorized (sesiones expiradas o firmas hash inválidas de       
  Telegram), disparando retroalimentación háptica de error.                                                                                    
  
    // src/api/client.ts
    apiClient.interceptors.request.use((config) => {
      const initData = window.Telegram?.WebApp?.initData || getTelegramInitData()
      if (initData) {
        config.headers.set('Authorization', `tma ${initData}`)
      }
      return config
    })
  ──────
  ### 3. 🎨 Paleta de Colores de Identidad en Tailwind CSS
  
  En tailwind.config.ts:
  
  • Rosa Pastel (fematch-pink): Desde #fdf2f8 (Pastel Blush) hasta #ec4899 (Fematch Pink) para botones de Like, badges y acentos primarios.    
  • Violeta / Lavanda (fematch-violet): Desde #faf5ff hasta #a855f7 para gradientes, sombras suaves y estados secundarios.
  • Cian / Turquesa Suave (fematch-cyan): Desde #ecfeff hasta #22d3ee y #06b6d4 para Superlikes, compatibilidad e insignias verificadas.       
  • Glows y Sombras Suaves: shadow-pastel-pink, shadow-pastel-violet, shadow-pastel-cyan.
  ──────
  ### 4. 🛠️ Comandos para Ejecutar y Compilar
  
    # Iniciar el servidor local de desarrollo (con entorno Mock automático fuera de Telegram)
    npm run dev
  
    # Validar tipos TypeScript
    npm run type-check
  
    # Compilar para producción (Vite + Vue-TSC)
    npm run build
  
  │ Verificación: La compilación con vue-tsc --noEmit && vite build se ejecutó satisfactoriamente con 0 errores de tipado o empaquetado. 
