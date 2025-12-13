import { Trophy, X as XIcon, Handshake, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { cn } from '../../lib/utils'

export function StatsCard({ profile }) {
  const wins = profile?.wins || 0
  const losses = profile?.losses || 0
  const draws = profile?.draws || 0
  const total = wins + losses + draws
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-500" />
          Your Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <StatItem
            icon={Trophy}
            label="Wins"
            value={wins}
            colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
          />
          <StatItem
            icon={XIcon}
            label="Losses"
            value={losses}
            colorClass="text-rose-500 bg-rose-50 dark:bg-rose-900/20"
          />
          <StatItem
            icon={Handshake}
            label="Draws"
            value={draws}
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
