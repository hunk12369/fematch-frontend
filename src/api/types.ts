import type { TelegramUser } from '@/telegram/types'

export type GenderIdentity = 'FEMBOY' | 'TRANS_FEM' | 'TRANS_MASC' | 'CROSSDRESSER' | 'MAN' | 'OTHER'

export const GENDER_IDENTITY_LABELS: Record<string, string> = {
  FEMBOY: 'Femboy',
  TRANS_FEM: 'Trans Femenina',
  TRANS_MASC: 'Trans Masculino',
  CROSSDRESSER: 'Crossdresser',
  MAN: 'Hombre',
  MALE: 'Hombre',
  HOMBRE: 'Hombre',
  OTHER: 'Otro',
}

export const GENDER_IDENTITY_OPTIONS: { value: GenderIdentity; label: string }[] = [
  { value: 'FEMBOY', label: 'Femboy' },
  { value: 'TRANS_FEM', label: 'Trans Femenina' },
  { value: 'TRANS_MASC', label: 'Trans Masculino' },
  { value: 'CROSSDRESSER', label: 'Crossdresser' },
  { value: 'MAN', label: 'Hombre' },
  { value: 'OTHER', label: 'Otro' },
]

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
  isNewUser?: boolean
  isProfileIncomplete?: boolean
}

export interface ApiErrorPayload {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface UserPhoto {
  id: string
  url: string
  orderIndex: number
}

export interface Preference {
  targetGenders: string[]
  minAge: number
  maxAge: number
  maxDistanceKm: number
}

export interface User {
  id: string
  telegramId: string
  firstName: string
  username?: string
  birthDate: string
  age: number
  genderIdentity: GenderIdentity | string
  bio?: string
  city?: string
  latitude?: number | null
  longitude?: number | null
  isVip: boolean
  photos: UserPhoto[]
  preference?: Preference
  distanceKm?: number
  verified?: boolean
  online?: boolean
  likesCount?: number
  matchesCount?: number
}

// Alias de compatibilidad
export type UserProfile = User
export type MatchCandidate = User

export interface MatchInteraction {
  targetUserId: string
  action: 'like' | 'pass' | 'superlike'
}

export interface MatchResult {
  isMatch: boolean
  matchId?: string
  matchedUser?: User
}

export interface AuthTelegramResponse {
  success: boolean
  isNewUser: boolean
  isProfileIncomplete: boolean
  data: {
    user: User
    telegramUser: TelegramUser
  }
}

export interface AuthMeResponse {
  telegramUser: TelegramUser
  initData: string
  user?: User
}

export interface OnboardingPayload {
  gender_identity: GenderIdentity | string
  birth_date: string // "YYYY-MM-DD"
  bio?: string
  city?: string
  latitude?: number | null
  longitude?: number | null
  target_genders: string[]
  min_age: number
  max_age: number
  max_distance_km: number
}

export interface FeedResponse {
  profiles: User[]
  pagination?: {
    page: number
    limit: number
    total?: number
    totalPages?: number
    hasMore?: boolean
  }
}

export type SwipeType = 'LIKE' | 'DISLIKE' | 'SUPERLIKE'

export interface SwipePayload {
  targetUserId: string
  type: SwipeType
}

export interface SwipeResponse {
  success: boolean
  match: boolean
  matchId?: string
  matchedUser?: User
  swipe?: Record<string, unknown>
}

export type StarsItemType = 'VIP_MONTHLY' | 'BOOST' | 'SUPERLIKE'

export interface CreateStarsInvoicePayload {
  itemType: StarsItemType
}

export interface StarsInvoiceResponse {
  invoiceLink: string
  product?: {
    itemType: StarsItemType
    title?: string
    stars?: number
    starsAmount?: number
  }
}
