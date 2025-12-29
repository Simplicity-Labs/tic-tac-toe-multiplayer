import { useState, useEffect, useRef } from 'react'
import { Grid3X3, Mail, Lock, User, ArrowRight, UserX } from 'lucide-react'
import { useAuth, getExpiredCachedProfile } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import { ThemeToggle } from '../components/ThemeToggle'
import { HolidayDecorations } from '../components/HolidayDecorations'
import { cn } from '../lib/utils'

// Holiday-specific configurations with punny names
const HOLIDAY_LOGIN_CONFIG = {
  newyear: {
    title: 'Tic Tac Cheers!',
    subtitle: 'New year, new Xs and Os',
    logoBg: 'bg-gradient-to-br from-amber-500 to-purple-500',
  },
  valentine: {
    title: 'Xs and Os',
    subtitle: 'Hugs, kisses, and tic tac toes',
    logoBg: 'bg-gradient-to-br from-pink-500 to-rose-500',
  },
  stpatricks: {
    title: 'Tic Tac Clover',
    subtitle: 'Three in a row brings luck, you know',
    logoBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
  },
  easter: {
    title: 'Tic Tac Hatch',
    subtitle: 'Get three eggs in a row!',
    logoBg: 'bg-gradient-to-br from-pink-400 to-purple-400',
  },
  halloween: {
    title: 'Trick or Tic Tac',
    subtitle: 'Three in a row or face the ghosts',
    logoBg: 'bg-gradient-to-br from-orange-500 to-purple-600',
  },
  christmas: {
    title: 'Tic Tac Ho Ho Ho',
    subtitle: "Santa's favorite naughts and crosses",
    logoBg: 'bg-gradient-to-br from-red-500 to-green-500',
  },
}

export default function Login() {
  const { signIn, signUp, signInAnonymously, createProfile, profile, user, profileLoading, isAnonymous } = useAuth()
  const { currentTheme } = useSettings()
  const { toast } = useToast()
  const [mode, setMode] = useState('signin') // 'signin', 'signup', 'username'
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })

  const isHolidayTheme = currentTheme.seasonal
  const holidayConfig = isHolidayTheme ? HOLIDAY_LOGIN_CONFIG[currentTheme.id] : null

  // If user is logged in but no profile (and profile check is complete), show username form
  const showUsernameForm = user && !profile && !profileLoading

  // Check if this might be a returning user (has expired cache data)
  const expiredCache = showUsernameForm ? getExpiredCachedProfile() : null
  const isReturningUser = showUsernameForm && isAnonymous && expiredCache !== null

  // Pre-fill username from cached profile for returning users
  const hasPrefilledUsername = useRef(false)
  useEffect(() => {
    if (isReturningUser && expiredCache?.username && !hasPrefilledUsername.current) {
      hasPrefilledUsername.current = true
      setFormData(prev => ({ ...prev, username: expiredCache.username }))
    }
  }, [isReturningUser, expiredCache?.username])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (showUsernameForm) {
        const { error } = await createProfile(formData.username.trim())
        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          })
        }
      } else if (mode === 'signin') {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          toast({
            title: 'Error signing in',
            description: error.message,
            variant: 'destructive',
          })
        }
      } else {
        const { error } = await signUp(formData.email, formData.password)
        if (error) {
          toast({
            title: 'Error signing up',
            description: error.message,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Account created!',
            description: 'Please check your email to verify your account.',
            variant: 'success',
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setLoading(true)
    try {
      const { error } = await signInAnonymously()
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking for existing profile
  if (user && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 relative">
      {/* Holiday Decorations */}
      <HolidayDecorations />

      {/* Header */}
      <header className="p-4 flex justify-end relative z-10">
        <ThemeToggle />
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4",
              holidayConfig ? holidayConfig.logoBg : "bg-primary-500"
            )}>
              {isHolidayTheme ? (
                <span className="text-3xl">{currentTheme.x.symbol}</span>
              ) : (
                <Grid3X3 className="h-10 w-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold">
              {holidayConfig ? holidayConfig.title : 'Tic Tac Toe'}
            </h1>
            <p className="text-slate-500 mt-2">
              {holidayConfig ? holidayConfig.subtitle : 'Multiplayer game with friends'}
            </p>
            {isHolidayTheme && (
              <div className="mt-2 flex justify-center gap-2 text-xl opacity-60">
                <span>{currentTheme.x.symbol}</span>
                <span>{currentTheme.o.symbol}</span>
                <span>{currentTheme.x.symbol}</span>
              </div>
            )}
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {showUsernameForm
                  ? isReturningUser
                    ? 'Welcome back!'
                    : 'Choose a username'
                  : mode === 'signin'
                  ? 'Welcome back'
                  : 'Create an account'}
              </CardTitle>
              <CardDescription>
                {showUsernameForm
                  ? isReturningUser
                    ? 'Your session expired. Please choose a username to continue.'
                    : 'Pick a display name for your profile'
                  : mode === 'signin'
                  ? 'Sign in to continue playing'
                  : 'Join the game and challenge others'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {showUsernameForm ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="username">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        className="pl-10"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        required
                        minLength={3}
                        maxLength={20}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="email">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="password">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {showUsernameForm
                        ? 'Continue'
                        : mode === 'signin'
                        ? 'Sign In'
                        : 'Sign Up'}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              {!showUsernameForm && (
                <>
                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">
                      {mode === 'signin'
                        ? "Don't have an account?"
                        : 'Already have an account?'}
                      <button
                        type="button"
                        className="ml-1 text-primary-500 hover:underline font-medium"
                        onClick={() =>
                          setMode(mode === 'signin' ? 'signup' : 'signin')
                        }
                      >
                        {mode === 'signin' ? 'Sign up' : 'Sign in'}
                      </button>
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={handleGuestLogin}
                      disabled={loading}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Play as Guest
                    </Button>
                    <p className="text-xs text-slate-400 text-center mt-2">
                      You can create an account later to save your progress
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-slate-500 relative z-10">
        Built with React & Supabase
      </footer>
    </div>
  )
}
