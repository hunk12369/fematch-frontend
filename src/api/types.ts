export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

export interface ApiErrorPayload {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface UserProfile {
  id: string
  telegramId: number
  name: string
  age: number
  bio: string
  gender: 'female' | 'non-binary' | 'other'
  photos: string[]
  interests: string[]
  distanceKm?: number
  verified: boolean
  online: boolean
  premium: boolean
  likesCount?: number
  matchesCount?: number
}

export interface MatchCandidate extends UserProfile {
  compatibilityScore: number
}

export interface MatchInteraction {
  targetUserId: string
  action: 'like' | 'pass' | 'superlike'
}

export interface MatchResult {
  isMatch: boolean
  chatId?: string
  matchedUser?: UserProfile
}

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  isRead: boolean
}
