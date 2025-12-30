import { useState } from 'react'
import { Trophy, X as XIcon, Handshake, TrendingUp, Users, Bot } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { cn } from '../../lib/utils'

export function StatsCard({ profile }) {
  const [mode, setMode] = useState('all') // 'all', 'pvp', 'ai'

  const getStats = () => {
    if (mode === 'pvp') {
      return {
        wins: profile?.pvp_wins || 0,
        losses: profile?.pvp_losses || 0,
        draws: profile?.pvp_draws || 0,
      }
    }
    if (mode === 'ai') {
      const aiWins = (profile?.ai_easy_wins || 0) + (profile?.ai_medium_wins || 0) + (profile?.ai_hard_wins || 0)
      const aiLosses = (profile?.ai_easy_losses || 0) + (profile?.ai_medium_losses || 0) + (profile?.ai_hard_losses || 0)
      const aiDraws = (profile?.ai_easy_draws || 0) + (profile?.ai_medium_draws || 0) + (profile?.ai_hard_draws || 0)
      return { wins: aiWins, losses: aiLosses, draws: aiDraws }
    }
    // All stats
    return {
      wins: profile?.wins || 0,
      losses: profile?.losses || 0,
      draws: profile?.draws || 0,
    }
  }

  const stats = getStats()
  const total = stats.wins + stats.losses + stats.draws
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-500" />
            Your Stats
          </CardTitle>

          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setMode('all')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                mode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              All
            </button>
            <button
              onClick={() => setMode('pvp')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                mode === 'pvp'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">PvP</span>
            </button>
            <button
              onClick={() => setMode('ai')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                mode === 'ai'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Bot className="h-3 w-3" />
              <span className="hidden sm:inline">AI</span>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <StatItem
            icon={Trophy}
            label="Wins"
            value={stats.wins}
            colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
          />
          <StatItem
            icon={XIcon}
            label="Losses"
            value={stats.losses}
            colorClass="text-rose-500 bg-rose-50 dark:bg-rose-900/20"
          />
          <StatItem
            icon={Handshake}
            label="Draws"
            value={stats.draws}
            colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/20"
          />
          <StatItem
            icon={TrendingUp}
            label="Win Rate"
            value={`${winRate}%`}
            colorClass="text-primary-500 bg-primary-50 dark:bg-primary-900/20"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function StatItem({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center',
        colorClass
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-center">
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )
}
