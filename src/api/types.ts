import type { TelegramUser } from '@/telegram/types'

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
}

export interface ApiErrorPayload {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface SearchPreferences {
  minAge: number
  maxAge: number
  maxDistanceKm: number
  interestedIn: string[]
}

export interface UserPhoto {
  id: string
  url: string
  orderIndex: number
  userId?: string
  createdAt?: string
  updatedAt?: string
}

export interface UserProfile {
  id: string
  telegramId: number
  name: string
  age: number
  bio: string
  gender: 'female' | 'non-binary' | 'other'
  gender_identity?: string
  pronouns?: string
  occupation?: string
  city?: string
  relationship_intent?: string
  isNewUser?: boolean
  onboardingCompleted?: boolean
  photos: string[]
  userPhotos?: UserPhoto[]
  interests: string[]
  search_preferences?: SearchPreferences
  distanceKm?: number
  verified: boolean
  online: boolean
  premium: boolean
  likesCount?: number
  matchesCount?: number
}

export interface MatchCandidate extends UserProfile {
  compatibilityScore?: number
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

export interface MatchInteraction {
  targetUserId: string
  action: 'like' | 'pass' | 'superlike'
}

export interface MatchResult {
  isMatch: boolean
  chatId?: string
  matchedUser?: MatchCandidate | UserProfile
}

export interface AuthTelegramResponse {
  user: UserProfile
  telegramUser: TelegramUser
}

export interface AuthMeResponse {
  telegramUser: TelegramUser
  initData: string
  user?: UserProfile
}

export interface FeedResponse {
  profiles: MatchCandidate[]
  pagination: {
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
  matchedUser?: MatchCandidate
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
  }
}

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  isRead: boolean
}
