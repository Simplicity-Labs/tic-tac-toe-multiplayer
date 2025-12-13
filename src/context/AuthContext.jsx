import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true) // Start true to prevent flash

  useEffect(() => {
    let isMounted = true

    // Safety timeout - if loading takes more than 10 seconds, stop loading
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing load complete')
        setLoading(false)
        setProfileLoading(false)
      }
    }, 10000)

    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

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
          await fetchProfile(session.user.id)
        } else if (isMounted) {
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

  async function fetchProfile(userId) {
    console.log('Fetching profile for user:', userId)
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
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
      setProfile(data || null)
    } catch (error) {
      console.error('Error fetching profile:', error.message)
      setProfile(null)
    } finally {
      setLoading(false)
      setProfileLoading(false)
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
    }
    return { error }
  }

  async function createProfile(username) {
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data, error } = await supabase.from('profiles').insert({
      id: user.id,
      username,
    }).select().single()

    if (!error) {
      setProfile(data)
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

    if (!error) {
      setProfile(data)
    }

    return { data, error }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    isAnonymous: user?.is_anonymous ?? false,
    signUp,
    signIn,
    signInAnonymously,
    linkEmailToAnonymous,
    signOut,
    createProfile,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
