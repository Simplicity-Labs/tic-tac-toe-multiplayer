import { Settings as SettingsIcon, Check, Sparkles, X, Circle } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { cn } from '../lib/utils'

export default function Settings() {
  const { symbolTheme, setSymbolTheme, availableThemes, isChristmasSeason } = useSettings()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-slate-500">Customize your game experience</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Game Symbols</h2>
          <p className="text-sm text-slate-500">Choose how X and O appear on the board</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableThemes.map((theme) => {
              const isSelected = symbolTheme === theme.id
              const isChristmas = theme.id === 'christmas'

              return (
                <button
                  key={theme.id}
                  onClick={() => setSymbolTheme(theme.id)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-left',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                    isChristmas && 'bg-gradient-to-br from-red-50 to-green-50 dark:from-red-900/10 dark:to-green-900/10'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary-500" />
                    </div>
                  )}
                  {isChristmas && (
                    <div className="absolute top-2 right-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                  )}

                  {/* Preview */}
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {theme.id === 'classic' ? (
                      <>
                        <X className="h-8 w-8 text-primary-500" strokeWidth={3} />
                        <span className="text-slate-400 text-sm">vs</span>
                        <Circle className="h-7 w-7 text-rose-500" strokeWidth={3} />
                      </>
                    ) : (
                      <>
                        <span className="text-3xl">{theme.x.symbol}</span>
                        <span className="text-slate-400 text-sm">vs</span>
                        <span className="text-3xl">{theme.o.symbol}</span>
                      </>
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-sm">{theme.name}</p>
                    <p className="text-xs text-slate-500">{theme.description}</p>
                  </div>

                  {isChristmas && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Holiday special!
                    </p>
                  )}
                </button>
              )
            })}
          </div>

          {isChristmasSeason && (
            <p className="text-sm text-slate-500 mt-4 text-center">
              Happy Holidays! The Christmas theme is available this month.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
