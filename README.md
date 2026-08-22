# 💖 Fematch - Telegram Mini App (TMA) Frontend

Estructura base de Single Page Application (SPA) móvil de alta fidelidad para **Fematch**, desarrollada con **Vite + Vue 3 (Composition API & `<script setup>`)**, **TypeScript**, **Tailwind CSS**, **Pinia**, **Vue Router** y **@telegram-apps/sdk**.

---

## 📱 Características Principales

1. **Telegram Mini Apps SDK & Viewport Completo**:
   - Inicialización con `@telegram-apps/sdk` y fallback nativo a `window.Telegram.WebApp`.
   - Expansión automática a pantalla completa (`viewport.expand()` / `Telegram.WebApp.expand()`).
   - Sincronización automática y reactiva de los colores del usuario de Telegram (`Telegram.WebApp.themeParams`) inyectados dinámicamente como variables CSS (`--tg-theme-*`).
   - Soporte automático para **Dark / Light mode** según el tema de Telegram del usuario.
   - Sincronización del botón nativo `Telegram.WebApp.BackButton` con el historial de `Vue Router`.
   - Gestos hápticos integrados (`HapticFeedback.impactOccurred`, `selectionChanged`, `notificationOccurred`).
   - Detección y bloqueo de deslizamientos verticales accidentales (`swipeBehavior.disableVertical()`).

2. **Cliente Centralizado de Axios con Header TMA**:
   - Todas las peticiones HTTP adjuntan automáticamente la cabecera:
     ```http
     Authorization: tma ${window.Telegram.WebApp.initData}
     ```
   - Manejo centralizado de errores (401 por sesión de Telegram expirada o firma inválida, 403, 500, errores de red).
   - Tipado estricto con TypeScript generics (`http.get<T>`, `http.post<T>`, etc.).

3. **Paleta de Identidad Visual Fematch**:
   - Tonos **Rosa Pastel** (`fematch-pink`: `#fdf2f8` a `#831843`).
   - Tonos **Violeta / Lavanda** (`fematch-violet`: `#faf5ff` a `#581c87`).
   - Toques **Cian / Turquesa Suave** (`fematch-cyan`: `#ecfeff` a `#164e63`).
   - Sombras y gradientes personalizados (`shadow-pastel-pink`, `bg-fematch-gradient`).

4. **Entorno de Desarrollo Local & Mock Provider**:
   - Detección inteligente si se ejecuta dentro del iframe de Telegram o en un navegador estándar de escritorio (`setupTelegramMock`).
   - Banner de desarrollo interactivo para inspeccionar el encabezado de autenticación y datos de usuario en tiempo real.

---

## 📂 Estructura del Proyecto

```text
frontend/
├── index.html                       # Viewport móvil optimizado, script Telegram WebApp
├── package.json                     # Scripts y dependencias
├── tailwind.config.ts               # Paleta pastel Fematch + Variables CSS de Telegram
├── vite.config.ts                   # Configuración de Vite + Vue + Alias @
├── tsconfig.json                    # TypeScript strict mode
├── .env                             # Variables de entorno
├── src/
│   ├── main.ts                      # Punto de entrada Vue 3 + Pinia + Router
│   ├── App.vue                      # Layout principal móvil + Safe area + Transiciones
│   ├── env.d.ts                     # Tipos de Vite client
│   ├── api/
│   │   ├── client.ts                # Instancia centralizada Axios con interceptor TMA
│   │   ├── types.ts                 # Interfaces de respuestas API y modelos de Fematch
│   │   └── services/
│   │       ├── user.service.ts      # Servicio de perfil de usuario
│   │       └── match.service.ts     # Servicio de matches, feed y chats
│   ├── telegram/
│   │   ├── init.ts                  # Inicialización SDK, Viewport full expansion y Swipe
│   │   ├── theme.ts                 # Sincronización reactiva de themeParams -> CSS Vars
│   │   ├── mock.ts                  # Mock data para pruebas locales fuera de Telegram
│   │   └── types.ts                 # Tipos TypeScript para Telegram WebApp
│   ├── stores/
│   │   ├── telegram.store.ts        # Pinia store para estado de TMA y usuario
│   │   └── matches.store.ts         # Pinia store para feed de citas y swipes
│   ├── router/
│   │   └── index.ts                 # Vue Router sincronizado con Telegram BackButton
│   ├── composables/
│   │   └── useHaptics.ts            # Composable para vibración táctil nativa
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue        # Header con logo Fematch y estado de usuario
│   │   │   └── BottomNav.vue        # Barra de navegación inferior móvil
│   │   ├── ui/
│   │   │   ├── MatchCard.vue        # Tarjeta swipe de perfiles con gradientes pastel
│   │   │   └── MatchModal.vue       # Modal celebratorio ¡Es un Match!
│   │   └── dev/
│   │       └── DevBanner.vue        # Banner de estado TMA para depuración
│   └── views/
│       ├── DiscoverView.vue         # Pantalla principal de swipe y descubrimiento
│       ├── MatchesView.vue          # Lista de matches y chats
│       ├── ChatView.vue             # Vista de conversación 1 a 1
│       └── ProfileView.vue          # Perfil, ajustes y playground de pruebas API
```

---

## 🚀 Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en http://localhost:5173
npm run dev

# Verificación de tipos TypeScript
npm run type-check

# Compilar para producción
npm run build

# Vista previa de la compilación de producción
npm run preview
```

---

## 🔐 Ejemplo de Petición con Interceptor Axios

```typescript
import { apiClient } from '@/api/client'

// Cualquier llamada HTTP incluirá automáticamente el encabezado:
// Authorization: tma query_id=...&user=...&auth_date=...&hash=...
const response = await apiClient.get('/matches/feed')
```

---

## 🎨 Paleta Tailwind Configurada

| Color | Tailwind Class | Valor Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Pastel Blush** | `bg-fematch-pink-50` | `#fdf2f8` | Fondos suaves y contenedores |
| **Fematch Pink** | `text-fematch-pink-500` | `#ec4899` | Acciones primarias y Likes |
| **Soft Lilac** | `bg-fematch-violet-100` | `#f3e8ff` | Badges e intereses |
| **Fematch Violet**| `text-fematch-violet-500`| `#a855f7` | Gradientes y acentos secundarios |
| **Soft Cyan** | `bg-fematch-cyan-200` | `#a5f3fc` | Compatibilidad e indicadores online |
| **Electric Cyan**| `text-fematch-cyan-400`| `#22d3ee` | Superlikes e insignias verificadas |
