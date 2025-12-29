import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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
      // Cache valid for 30 days
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(() => getCachedProfile()) // Load from cache initially
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(!getCachedProfile()) // Skip if cached

  useEffect(() => {
    let isMounted = true

    // Safety timeout - reduced to 3 seconds since we have cache fallback
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing load complete')
        setLoading(false)
        setProfileLoading(false)
      }
    }, 3000)

    // Get initial session
    const initSession = async () => {
      try {
        // Start session fetch and warm up Supabase in parallel
        const sessionPromise = supabase.auth.getSession()

        const { data: { session }, error } = await sessionPromise

        if (error) {
          console.error('Error getting session:', error)
          if (isMounted) {
            setLoading(false)
            setProfileLoading(false)
          }
          return
        }

        if (isMounted) {
          setUser(session?.user ?? null)
        }

        if (session?.user && isMounted) {
          // If we have cached profile for this user, use it immediately
          const cached = getCachedProfile()
          if (cached && cached.id === session.user.id) {
            setProfile(cached)
            setLoading(false)
            setProfileLoading(false)
            // Fetch fresh data in background (don't await)
            fetchProfile(session.user.id, true)
          } else {
            // No cache - need to fetch, but with short timeout
            await fetchProfile(session.user.id, false)
          }
        } else if (isMounted) {
          setProfile(null)
          setCachedProfile(null)
          setLoading(false)
          setProfileLoading(false)
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

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setProfileLoading(true) // Set before user to prevent flash
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setProfileLoading(false)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId, isBackground = false) {
    console.log('Fetching profile for user:', userId, isBackground ? '(background)' : '')
    try {
      // Add timeout to prevent hanging - shorter for background refresh
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), isBackground ? 8000 : 5000)
      )

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      console.log('Profile fetch result:', { data, error })

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }

      if (data) {
        setProfile(data)
        setCachedProfile(data)
      } else if (!isBackground) {
        // Profile not found in DB - try expired cache as fallback for returning users
        const expiredCache = getExpiredCachedProfile()
        if (expiredCache && expiredCache.id === userId) {
          console.log('Using expired cache as fallback for returning user')
          setProfile(expiredCache)
          // Refresh the cache timestamp since we're using it
          setCachedProfile(expiredCache)
        } else {
          setProfile(null)
          setCachedProfile(null)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message)
      // On error, try expired cache as fallback
      if (!isBackground) {
        const expiredCache = getExpiredCachedProfile()
        if (expiredCache && expiredCache.id === userId) {
          console.log('Using expired cache as fallback after fetch error')
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  async function signInAnonymously() {
    const { data, error } = await supabase.auth.signInAnonymously()
    return { data, error }
  }

  async function linkEmailToAnonymous(email, password) {
    // Convert anonymous account to a permanent one
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
    })
    if (!error && data.user) {
      setUser(data.user)
    }
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
      setCachedProfile(null)
    }
    return { error }
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { data, error }
  }

  async function createProfile(username, avatar = '😀') {
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data, error } = await supabase.from('profiles').insert({
      id: user.id,
      username,
      avatar,
    }).select().single()

    if (!error && data) {
      setProfile(data)
      setCachedProfile(data)
    }

    return { data, error }
  }

  async function updateProfile(updates) {
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
      setCachedProfile(data)
    }

    return { data, error }
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
    isAnonymous: user?.is_anonymous ?? false,
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
