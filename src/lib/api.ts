/**
 * API client: wraps fetch calls to the backend.
 * All methods return { data, error } matching the old Supabase pattern.
 */

const API_BASE = import.meta.env.VITE_API_URL || ''

interface ApiResponse<T> {
  data: T | null
  error: { message: string } | null
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Send session cookies
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }))
      return { data: null, error: { message: body.error || res.statusText } }
    }

    const data = await res.json().catch(() => null)
    return { data: data as T, error: null }
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Network error' } }
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────

export const authApi = {
  signUp(email: string, password: string, name: string) {
    return request('/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  },

  signIn(email: string, password: string) {
    return request('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  signInAnonymously() {
    return request('/api/auth/sign-in/anonymous', {
      method: 'POST',
    })
  },

  signInWithGoogle() {
    // BetterAuth handles the OAuth redirect flow
    window.location.href = '/api/auth/sign-in/social?provider=google&callbackURL=/'
  },

  signOut() {
    return request('/api/auth/sign-out', { method: 'POST' })
  },

  getSession() {
    return request<{ user: any; session: any }>('/api/auth/get-session')
  },

  resetPassword(email: string) {
    return request('/api/auth/forget-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      }),
    })
  },

  updatePassword(newPassword: string) {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    })
  },

  linkEmail(email: string, password: string) {
    // BetterAuth anonymous plugin: signing up while anonymous auto-links accounts
    return request('/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: 'Player' }),
    })
  },
}

// ─── Profiles ────────────────────────────────────────────────────────────

export interface ProfileData {
  id: string
  username: string
  avatar: string | null
  wins: number
  losses: number
  draws: number
  pvp_wins: number
  pvp_losses: number
  pvp_draws: number
  ai_easy_wins: number
  ai_easy_losses: number
  ai_easy_draws: number
  ai_medium_wins: number
  ai_medium_losses: number
  ai_medium_draws: number
  ai_hard_wins: number
  ai_hard_losses: number
  ai_hard_draws: number
  forfeits: number
  is_admin: boolean
  is_guest: boolean
  createdAt: string
}

export const profileApi = {
  get(id: string) {
    return request<ProfileData>(`/api/profiles/${id}`)
  },

  create(username: string, avatar?: string) {
    return request<ProfileData>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify({ username, avatar }),
    })
  },

  update(id: string, updates: { username?: string; avatar?: string }) {
    return request<ProfileData>(`/api/profiles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  leaderboard(limit = 50) {
    return request<ProfileData[]>(`/api/profiles?limit=${limit}`)
  },
}

// ─── Games ───────────────────────────────────────────────────────────────

export interface GameData {
  id: string
  player_x: string | null
  player_o: string | null
  board: string[]
  current_turn: string | null
  status: 'waiting' | 'in_progress' | 'completed'
  winner: string | null
  is_ai_game: boolean
  ai_difficulty: string | null
  board_size: number
  turn_duration: number
  game_mode: string
  turn_started_at: string | null
  created_at: string
  completed_at: string | null
  invited_player_id: string | null
  forfeit_by: string | null
  turn_count: number
  placed_at: (number | null)[] | null
  decay_turns: number | null
  bombed_cells: number[] | null
  // Joined profile data
  creator?: { id: string; username: string; avatar: string } | null
  player_x_profile?: { id: string; username: string; avatar: string } | null
  player_o_profile?: { id: string; username: string; avatar: string } | null
}

export const gameApi = {
  create(options: {
    isAI?: boolean
    aiDifficulty?: string
    boardSize?: number
    turnDuration?: number
    gameMode?: string
  }) {
    return request<GameData>('/api/games', {
      method: 'POST',
      body: JSON.stringify(options),
    })
  },

  get(id: string) {
    return request<GameData>(`/api/games/${id}`)
  },

  join(id: string) {
    return request<GameData>(`/api/games/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'join' }),
    })
  },

  delete(id: string) {
    return request(`/api/games/${id}`, { method: 'DELETE' })
  },

  available() {
    return request<GameData[]>('/api/games?filter=available')
  },

  live() {
    return request<GameData[]>('/api/games?filter=live')
  },

  history(limit = 50) {
    return request<GameData[]>(`/api/games?filter=history&limit=${limit}`)
  },

  active() {
    return request<GameData | null>('/api/games?filter=active')
  },

  leaderboard(period = 'all-time') {
    return request<GameData[]>(`/api/games?filter=leaderboard&period=${period}`)
  },
}
