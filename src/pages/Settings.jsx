import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, Check, Sparkles, X, Circle, Grid3X3, ArrowLeft, Calendar, Shield } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { cn } from '../lib/utils'

export default function Settings() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const {
    symbolTheme,
    setSymbolTheme,
    availableThemes,
    adminMode,
    setAdminMode,
    autoEnableHoliday,
    setAutoEnableHoliday,
    currentHolidayTheme,
    isHolidaySeason,
    boardSize,
    setBoardSize,
    boardSizeOptions,
  } = useSettings()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-slate-500">Customize your game experience</p>
      </div>

      {/* Auto-enable Holiday Theme Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">Auto-enable Holiday Themes</p>
                <p className="text-sm text-slate-500">
                  {isHolidaySeason && currentHolidayTheme
                    ? `Currently: ${currentHolidayTheme.holidayName}`
                    : 'Automatically use holiday themes when available'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAutoEnableHoliday(!autoEnableHoliday)}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors',
                autoEnableHoliday ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  autoEnableHoliday ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Game Symbols</h2>
          <p className="text-sm text-slate-500">Choose how X and O appear on the board</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableThemes.map((theme) => {
              const isSelected = symbolTheme === theme.id
              const isHoliday = theme.seasonal

              return (
                <button
                  key={theme.id}
                  onClick={() => setSymbolTheme(theme.id)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-left',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                    isHoliday && getHolidayGradient(theme.id)
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary-500" />
                    </div>
                  )}
                  {isHoliday && !isSelected && (
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

                  {isHoliday && (
                    <p className={cn('text-xs mt-1', getHolidayTextColor(theme.id))}>
                      {theme.holidayName} special!
                    </p>
                  )}
                </button>
              )
            })}
          </div>

          {isHolidaySeason && currentHolidayTheme && (
            <p className="text-sm text-slate-500 mt-4 text-center">
              {getHolidayMessage(currentHolidayTheme.id)}
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

      {/* Admin Mode Toggle - Only visible to admins */}
      {isAdmin && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    Admin Mode
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                      Admin Only
                    </span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {adminMode
                      ? 'All holiday themes are visible'
                      : 'Enable to see all holiday themes'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdminMode(!adminMode)}
                className={cn(
                  'relative w-12 h-7 rounded-full transition-colors',
                  adminMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    adminMode ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      )}
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

// Helper functions for holiday theming
function getHolidayGradient(themeId) {
  const gradients = {
    newyear: 'bg-gradient-to-br from-amber-50 to-purple-50 dark:from-amber-900/10 dark:to-purple-900/10',
    valentine: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10',
    stpatricks: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10',
    easter: 'bg-gradient-to-br from-pink-50 to-sky-50 dark:from-pink-900/10 dark:to-sky-900/10',
    halloween: 'bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-900/10 dark:to-purple-900/10',
    christmas: 'bg-gradient-to-br from-red-50 to-green-50 dark:from-red-900/10 dark:to-green-900/10',
  }
  return gradients[themeId] || ''
}

function getHolidayTextColor(themeId) {
  const colors = {
    newyear: 'text-amber-600 dark:text-amber-400',
    valentine: 'text-pink-600 dark:text-pink-400',
    stpatricks: 'text-green-600 dark:text-green-400',
    easter: 'text-pink-600 dark:text-pink-400',
    halloween: 'text-orange-600 dark:text-orange-400',
    christmas: 'text-green-600 dark:text-green-400',
  }
  return colors[themeId] || 'text-slate-600 dark:text-slate-400'
}

function getHolidayMessage(themeId) {
  const messages = {
    newyear: 'Happy New Year! The New Year theme is available this month.',
    valentine: "Happy Valentine's Day! The Valentine theme is available this month.",
    stpatricks: "Happy St. Patrick's Day! The Irish theme is available this month.",
    easter: 'Happy Easter! The Easter theme is available this month.',
    halloween: 'Happy Halloween! The spooky theme is available this month.',
    christmas: 'Happy Holidays! The Christmas theme is available this month.',
  }
  return messages[themeId] || 'A holiday theme is available this month!'
}
