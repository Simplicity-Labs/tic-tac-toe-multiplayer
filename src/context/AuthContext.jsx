import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, profileApi } from '../lib/api'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

const PROFILE_CACHE_KEY = 'tic-tac-toe-profile-cache'
const PROFILE_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

// Export for use in routing
export function getCachedProfile() {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (cached) {
      const { profile, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < PROFILE_CACHE_DURATION) {
        return profile
      }
    }
  } catch (e) {
    // Ignore cache errors
  }
  return null
}

// Get cached profile even if expired (for fallback)
export function getExpiredCachedProfile() {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (cached) {
      const { profile } = JSON.parse(cached)
      return profile
    }
  } catch (e) {
    // Ignore cache errors
  }
  return null
}

function setCachedProfile(profile) {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
        profile,
        timestamp: Date.now()
      }))
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY)
    }
  } catch (e) {
    // Ignore cache errors
  }
}

/** Normalize server profile (camelCase) to the shape the UI expects (snake_case) */
function normalizeProfile(p) {
  if (!p) return null
  // If the profile already has snake_case keys (from cache), pass through
  if ('pvp_wins' in p) return p
  return {
    id: p.id,
    username: p.username,
    avatar: p.avatar,
    wins: p.wins ?? 0,
    losses: p.losses ?? 0,
    draws: p.draws ?? 0,
    pvp_wins: p.pvpWins ?? 0,
    pvp_losses: p.pvpLosses ?? 0,
    pvp_draws: p.pvpDraws ?? 0,
    ai_easy_wins: p.aiEasyWins ?? 0,
    ai_easy_losses: p.aiEasyLosses ?? 0,
    ai_easy_draws: p.aiEasyDraws ?? 0,
    ai_medium_wins: p.aiMediumWins ?? 0,
    ai_medium_losses: p.aiMediumLosses ?? 0,
    ai_medium_draws: p.aiMediumDraws ?? 0,
    ai_hard_wins: p.aiHardWins ?? 0,
    ai_hard_losses: p.aiHardLosses ?? 0,
    ai_hard_draws: p.aiHardDraws ?? 0,
    forfeits: p.forfeits ?? 0,
    is_admin: p.isAdmin ?? false,
    is_guest: p.isGuest ?? false,
    createdAt: p.createdAt,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(() => getCachedProfile())
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(!getCachedProfile())

  useEffect(() => {
    let isMounted = true

    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing load complete')
        setLoading(false)
        setProfileLoading(false)
      }
    }, 5000)

    const initSession = async () => {
      try {
        const { data, error } = await authApi.getSession()

        if (error || !data?.user) {
          if (isMounted) {
            setUser(null)
            setProfile(null)
            setCachedProfile(null)
            setLoading(false)
            setProfileLoading(false)
          }
          return
        }

        if (isMounted) {
          setUser(data.user)
        }

        if (data.user && isMounted) {
          const cached = getCachedProfile()
          if (cached && cached.id === data.user.id) {
            setProfile(cached)
            setLoading(false)
            setProfileLoading(false)
            // Refresh in background
            fetchProfile(data.user.id, true)
          } else {
            await fetchProfile(data.user.id, false)
          }
        }
      } catch (error) {
        console.error('Error in session init:', error)
        if (isMounted) {
          setLoading(false)
          setProfileLoading(false)
        }
      }
    }

    initSession()

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [])

  async function fetchProfile(userId, isBackground = false) {
    try {
      const { data, error } = await profileApi.get(userId)

      if (error && error.message !== 'Profile not found') {
        console.error('Error fetching profile:', error)
      }

      const normalized = normalizeProfile(data)

      if (normalized) {
        setProfile(normalized)
        setCachedProfile(normalized)
      } else if (!isBackground) {
        const expiredCache = getExpiredCachedProfile()
        if (expiredCache && expiredCache.id === userId) {
          setProfile(expiredCache)
          setCachedProfile(expiredCache)
        } else {
          setProfile(null)
          setCachedProfile(null)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message)
      if (!isBackground) {
        const expiredCache = getExpiredCachedProfile()
        if (expiredCache && expiredCache.id === userId) {
          setProfile(expiredCache)
          setCachedProfile(expiredCache)
        } else {
          setProfile(null)
        }
      }
    } finally {
      if (!isBackground) {
        setLoading(false)
        setProfileLoading(false)
      }
    }
  }

  async function signUp(email, password) {
    const name = email.split('@')[0]
    const { data, error } = await authApi.signUp(email, password, name)
    if (!error && data) {
      // Auto-login after signup with BetterAuth
      setUser(data.user || data)
      if (data.user) {
        await fetchProfile(data.user.id, false)
      }
    }
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await authApi.signIn(email, password)
    if (!error && data) {
      const u = data.user || data
      setUser(u)
      setProfileLoading(true)
      await fetchProfile(u.id, false)
    }
    return { data, error }
  }

  async function signInAnonymously() {
    const { data, error } = await authApi.signInAnonymously()
    if (!error && data) {
      const u = data.user || data
      setUser(u)
      setProfileLoading(true)
      // Profile will be created in the username step
      setProfileLoading(false)
    }
    return { data, error }
  }

  async function linkEmailToAnonymous(email, password) {
    const { data, error } = await authApi.linkEmail(email, password)
    if (!error && data) {
      setUser(data.user || data)
    }
    return { data, error }
  }

  async function signOut() {
    const { error } = await authApi.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
      setCachedProfile(null)
    }
    return { error }
  }

  async function resetPassword(email) {
    return authApi.resetPassword(email)
  }

  async function updatePassword(newPassword) {
    return authApi.updatePassword(newPassword)
  }

  async function createProfile(username, avatar = '😀') {
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data, error } = await profileApi.create(username, avatar)
    const normalized = normalizeProfile(data)

    if (!error && normalized) {
      setProfile(normalized)
      setCachedProfile(normalized)
    }

    return { data: normalized, error }
  }

  async function updateProfile(updates) {
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data, error } = await profileApi.update(user.id, updates)
    const normalized = normalizeProfile(data)

    if (!error && normalized) {
      setProfile(normalized)
      setCachedProfile(normalized)
    }

    return { data: normalized, error }
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user])

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    isAnonymous: user?.isAnonymous ?? false,
    isAdmin: profile?.is_admin ?? false,
    signUp,
    signIn,
    signInAnonymously,
    linkEmailToAnonymous,
    signOut,
    resetPassword,
    updatePassword,
    createProfile,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
