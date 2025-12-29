import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid3X3, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import { ThemeToggle } from '../components/ThemeToggle'
import { HolidayDecorations } from '../components/HolidayDecorations'
import { cn } from '../lib/utils'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const { currentTheme } = useSettings()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const isHolidayTheme = currentTheme.seasonal

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Password updated',
          description: 'Your password has been reset successfully.',
          variant: 'success',
        })
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 relative">
      <HolidayDecorations />

      <header className="p-4 flex justify-end relative z-10">
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4",
              isHolidayTheme ? "bg-gradient-to-br from-amber-500 to-purple-500" : "bg-primary-500"
            )}>
              {isHolidayTheme ? (
                <span className="text-3xl">{currentTheme.x.symbol}</span>
              ) : (
                <Grid3X3 className="h-10 w-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold">Tic Tac Toe</h1>
            <p className="text-slate-500 mt-2">Reset your password</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Set new password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Update Password
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="p-4 text-center text-sm text-slate-500 relative z-10">
        Built with React & Supabase
      </footer>
    </div>
  )
}
