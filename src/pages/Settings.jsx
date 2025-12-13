import { Settings as SettingsIcon, Check, Sparkles, X, Circle, Grid3X3 } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { cn } from '../lib/utils'

export default function Settings() {
  const {
    symbolTheme,
    setSymbolTheme,
    availableThemes,
    isChristmasSeason,
    boardSize,
    setBoardSize,
    boardSizeOptions,
  } = useSettings()

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

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Default Board Size
          </h2>
          <p className="text-sm text-slate-500">Choose the default grid size for new games</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {boardSizeOptions.map((option) => {
              const isSelected = boardSize === option.size

              return (
                <button
                  key={option.size}
                  onClick={() => setBoardSize(option.size)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-center',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary-500" />
                    </div>
                  )}

                  {/* Grid Preview */}
                  <div className="flex justify-center mb-3">
                    <MiniGridPreview size={option.size} />
                  </div>

                  <p className="font-bold text-lg">{option.label}</p>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </button>
              )
            })}
          </div>
          <p className="text-sm text-slate-500 mt-4 text-center">
            You can also choose a different size when creating each game.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function MiniGridPreview({ size }) {
  return (
    <div
      className={cn(
        'grid gap-0.5 bg-slate-200 dark:bg-slate-700 rounded p-0.5',
        size === 3 && 'grid-cols-3 w-10 h-10',
        size === 4 && 'grid-cols-4 w-12 h-12',
        size === 5 && 'grid-cols-5 w-14 h-14'
      )}
    >
      {Array(size * size)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-sm"
          />
        ))}
    </div>
  )
}
