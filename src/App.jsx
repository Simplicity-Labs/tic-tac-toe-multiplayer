import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, getCachedProfile } from './context/AuthContext'
import Layout from './components/Layout'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Game from './pages/Game'
import History from './pages/History'
import Leaderboard from './pages/Leaderboard'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user, profile, loading, profileLoading } = useAuth()
  const cachedProfile = getCachedProfile()

  // If we have cached profile, skip loading states and render immediately
  // This eliminates jitter from skeleton → content transition
  if (cachedProfile) {
    // Still check if we have a user after auth loads (might be logged out)
    if (!loading && !profileLoading && !user) {
      return <Navigate to="/login" replace />
    }
    // Render immediately with cached data
    return children
  }

  // No cache - show spinner while loading
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // User exists but no profile - redirect to login to create profile
  if (!profile) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { user, profile, loading, profileLoading } = useAuth()
  const cachedProfile = getCachedProfile()

  // If we have cached profile, redirect to dashboard immediately
  // This prevents login page flash entirely
  if (cachedProfile) {
    return <Navigate to="/" replace />
  }

  // No cache - show minimal spinner while loading
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Redirect to dashboard if user has auth AND profile
  if (user && profile) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="game/:gameId" element={<Game />} />
        <Route path="history" element={<History />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
