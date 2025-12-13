import { useNavigate } from 'react-router-dom'
import { XCircle, Home } from 'lucide-react'
import { Button } from '../ui/Button'

export function GameClosedOverlay({ show, reason = 'declined' }) {
  const navigate = useNavigate()

  if (!show) return null

  const messages = {
    declined: {
      title: 'Invite Declined',
      subtitle: 'The player declined your game invitation.',
    },
    cancelled: {
      title: 'Game Cancelled',
      subtitle: 'This game has been cancelled.',
    },
    deleted: {
      title: 'Game Closed',
      subtitle: 'This game is no longer available.',
    },
  }

  const { title, subtitle } = messages[reason] || messages.deleted

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full animate-bounce-in">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-slate-100 dark:bg-slate-800">
          <XCircle className="w-10 h-10 text-slate-500" />
        </div>

        {/* Text */}
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-700 dark:text-slate-300">
          {title}
        </h2>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
          {subtitle}
        </p>

        {/* Action */}
        <Button
          className="w-full"
          onClick={() => navigate('/')}
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
