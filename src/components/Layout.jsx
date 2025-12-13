import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Grid3X3, Home, History, Trophy, LogOut, User, UserPlus, Mail, Lock, X, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useInvitations } from '../context/InvitationsContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from './ui/Toast'
import { ThemeToggle } from './ThemeToggle'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Avatar, AvatarFallback } from './ui/Avatar'
import { InviteNotification } from './InviteNotification'
import { HolidayDecorations, HolidayHeaderBar } from './HolidayDecorations'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '../lib/utils'

export default function Layout() {
  const { user, profile, signOut, isAnonymous, linkEmailToAnonymous } = useAuth()
  const { pendingInvite, sentInvite, acceptInvite, declineInvite } = useInvitations()
  const { currentTheme } = useSettings()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const isHolidayTheme = currentTheme.seasonal

  // Show toast when invite is declined (Game page handles the overlay)
  useEffect(() => {
    if (sentInvite?.declined && !location.pathname.startsWith('/game/')) {
      toast({
        title: 'Invite declined',
        description: `${sentInvite.to?.username || 'Player'} declined your game invite.`,
        variant: 'destructive',
      })
    }
  }, [sentInvite?.declined, sentInvite?.to?.username, toast, location.pathname])
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeForm, setUpgradeForm] = useState({ email: '', password: '' })

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'History', href: '/history', icon: History },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const handleAcceptInvite = async () => {
    const { gameId, error } = await acceptInvite()
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    } else if (gameId) {
      navigate(`/game/${gameId}`)
    }
  }

  const handleDeclineInvite = async () => {
    await declineInvite()
    toast({
      title: 'Invite declined',
      description: 'You declined the game invite.',
    })
  }

  const handleUpgrade = async (e) => {
    e.preventDefault()
    setUpgradeLoading(true)
    try {
      const { error } = await linkEmailToAnonymous(upgradeForm.email, upgradeForm.password)
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Account upgraded!',
          description: 'Please check your email to verify your account.',
          variant: 'success',
        })
        setShowUpgradeModal(false)
        setUpgradeForm({ email: '', password: '' })
      }
    } finally {
      setUpgradeLoading(false)
    }
  }

  // Get holiday-specific logo icon
  const getHolidayIcon = () => {
    if (!isHolidayTheme) return null
    return currentTheme.x.symbol
  }

  // Get holiday-specific logo background
  const getHolidayLogoBg = () => {
    const bgColors = {
      newyear: 'bg-gradient-to-br from-amber-500 to-purple-500',
      valentine: 'bg-gradient-to-br from-pink-500 to-rose-500',
      stpatricks: 'bg-gradient-to-br from-green-500 to-emerald-500',
      easter: 'bg-gradient-to-br from-pink-400 to-purple-400',
      halloween: 'bg-gradient-to-br from-orange-500 to-purple-600',
      christmas: 'bg-gradient-to-br from-red-500 to-green-500',
    }
    return bgColors[currentTheme.id] || 'bg-primary-500'
  }

  // Get holiday-specific title
  const getHolidayTitle = () => {
    const titles = {
      newyear: 'Tic Tac Cheers!',
      valentine: 'Xs and Os',
      stpatricks: 'Tic Tac Clover',
      easter: 'Tic Tac Hatch',
      halloween: 'Trick or Tic Tac',
      christmas: 'Tic Tac Ho Ho Ho',
    }
    return titles[currentTheme.id] || 'Tic Tac Toe'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      {/* Holiday Decorations */}
      <HolidayDecorations />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {/* Holiday accent bar */}
        <HolidayHeaderBar />
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                isHolidayTheme ? getHolidayLogoBg() : "bg-primary-500"
              )}>
                {isHolidayTheme ? (
                  <span className="text-xl">{getHolidayIcon()}</span>
                ) : (
                  <Grid3X3 className="h-6 w-6 text-white" />
                )}
              </div>
              <span className="text-xl font-bold hidden md:block">
                {isHolidayTheme ? getHolidayTitle() : 'Tic Tac Toe'}
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'gap-2',
                        isActive && 'bg-slate-100 dark:bg-slate-800'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.name}</span>
                    </Button>
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* User menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-sm">
                        {profile?.username?.charAt(0).toUpperCase() || (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">
                      {profile?.username || 'User'}
                    </span>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[12rem] overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-800"
                    align="end"
                  >
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="font-medium">
                        {profile?.username}
                        {isAnonymous && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                            Guest
                          </span>
                        )}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">
                          {user.email}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {profile?.wins || 0}W / {profile?.losses || 0}L / {profile?.draws || 0}D
                      </p>
                    </div>
                    {isAnonymous && (
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-600 outline-none hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                        onClick={() => setShowUpgradeModal(true)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Create Account
                      </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => navigate('/settings')}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-rose-600 outline-none hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Upgrade Account Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Account</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Save your game history and stats by creating a permanent account.
            </p>
            <form onSubmit={handleUpgrade} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="upgrade-email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="upgrade-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={upgradeForm.email}
                    onChange={(e) => setUpgradeForm({ ...upgradeForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="upgrade-password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="upgrade-password"
                    type="password"
                    placeholder="Create a password"
                    className="pl-10"
                    value={upgradeForm.password}
                    onChange={(e) => setUpgradeForm({ ...upgradeForm, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={upgradeLoading}>
                  {upgradeLoading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Game Invite Notification */}
      <InviteNotification
        invite={pendingInvite}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />
    </div>
  )
}
