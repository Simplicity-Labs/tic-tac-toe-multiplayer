import { useState } from 'react'
import { Grid3X3, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import { ThemeToggle } from '../components/ThemeToggle'

export default function Login() {
  const { signIn, signUp, createProfile, profile, user, profileLoading } = useAuth()
  const { toast } = useToast()
  const [mode, setMode] = useState('signin') // 'signin', 'signup', 'username'
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })

  // If user is logged in but no profile (and profile check is complete), show username form
  const showUsernameForm = user && !profile && !profileLoading

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

  // Show loading while checking for existing profile
  if (user && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="p-4 flex justify-end">
        <ThemeToggle />
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 mb-4">
              <Grid3X3 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Tic Tac Toe</h1>
            <p className="text-slate-500 mt-2">Multiplayer game with friends</p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {showUsernameForm
                  ? 'Choose a username'
                  : mode === 'signin'
                  ? 'Welcome back'
                  : 'Create an account'}
              </CardTitle>
              <CardDescription>
                {showUsernameForm
                  ? 'Pick a display name for your profile'
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-slate-500">
        Built with React & Supabase
      </footer>
    </div>
  )
}
