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
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // Safety timeout - if loading takes more than 5 seconds, stop loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing load complete')
        setLoading(false)
        setProfileLoading(false)
      }
    }, 5000)

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          setProfileLoading(true)
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error)
        setLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setProfileLoading(true)
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setProfileLoading(false)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
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
