import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, getCachedProfile } from './context/AuthContext'
import Layout from './components/Layout'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Game from './pages/Game'
import History from './pages/History'

function ProtectedRoute({ children }) {
  const { user, profile, loading, profileLoading } = useAuth()
  const cachedProfile = getCachedProfile()

  // Show skeleton if we have cached profile (likely returning user)
  if (loading || profileLoading) {
    if (cachedProfile) {
      return <DashboardSkeleton />
    }
    // No cache - show minimal spinner (likely new user)
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

  // If we have a cached profile, show skeleton and wait for auth to confirm
  // This prevents the login page flash
  if (loading || profileLoading) {
    if (cachedProfile) {
      return <DashboardSkeleton />
    }
    // No cache - show minimal spinner briefly
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Only redirect to dashboard if user has both auth AND profile
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
