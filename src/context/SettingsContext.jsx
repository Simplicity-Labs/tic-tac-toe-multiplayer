import { createContext, useContext, useState } from 'react'

const SettingsContext = createContext({})

export function useSettings() {
  return useContext(SettingsContext)
}

const SETTINGS_STORAGE_KEY = 'tic-tac-toe-settings'

// Get current month (0-indexed)
const getCurrentMonth = () => new Date().getMonth()

// Holiday months mapping (0-indexed: Jan=0, Dec=11)
const HOLIDAY_MONTHS = {
  0: 'newyear',     // January
  1: 'valentine',   // February
  2: 'stpatricks',  // March
  3: 'easter',      // April
  9: 'halloween',   // October
  11: 'christmas',  // December
}

// Get current holiday theme ID if any
const getCurrentHolidayThemeId = () => {
  return HOLIDAY_MONTHS[getCurrentMonth()] || null
}

// Board size options
export const BOARD_SIZE_OPTIONS = [
  { size: 3, label: '3×3', description: 'Classic - 3 in a row to win' },
  { size: 4, label: '4×4', description: 'Extended - 3 in a row to win' },
  { size: 5, label: '5×5', description: 'Large - 4 in a row to win' },
  { size: 7, label: '7×6', description: 'Connect 4 - 4 in a row to win' },
]

// Game mode options
export const GAME_MODE_OPTIONS = [
  { id: 'classic', name: 'Classic', description: 'Standard Tic Tac Toe', icon: '🎮' },
  { id: 'decay', name: 'Decay', description: 'Pieces fade after 4 turns', icon: '⏳' },
  { id: 'gravity', name: 'Gravity', description: 'Pieces fall to the bottom', icon: '⬇️' },
]

// Symbol theme definitions
export const SYMBOL_THEMES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional X and O',
    x: { symbol: 'X', color: 'text-primary-500', winColor: 'text-primary-600' },
    o: { symbol: 'O', color: 'text-rose-500', winColor: 'text-rose-600' },
  },
  emoji: {
    id: 'emoji',
    name: 'Emoji',
    description: 'Fun emoji symbols',
    x: { symbol: '😎', color: '', winColor: '' },
    o: { symbol: '🤩', color: '', winColor: '' },
  },
  animals: {
    id: 'animals',
    name: 'Animals',
    description: 'Cat vs Dog',
    x: { symbol: '🐱', color: '', winColor: '' },
    o: { symbol: '🐶', color: '', winColor: '' },
  },
  space: {
    id: 'space',
    name: 'Space',
    description: 'Rocket vs UFO',
    x: { symbol: '🚀', color: '', winColor: '' },
    o: { symbol: '🛸', color: '', winColor: '' },
  },
  food: {
    id: 'food',
    name: 'Food',
    description: 'Pizza vs Burger',
    x: { symbol: '🍕', color: '', winColor: '' },
    o: { symbol: '🍔', color: '', winColor: '' },
  },
  connect4: {
    id: 'connect4',
    name: 'Connect 4',
    description: 'Classic red & yellow discs',
    x: { symbol: '●', color: 'text-yellow-500', winColor: 'text-yellow-400', isDisc: true },
    o: { symbol: '●', color: 'text-red-500', winColor: 'text-red-400', isDisc: true },
  },
  // Holiday themes
  newyear: {
    id: 'newyear',
    name: 'New Year',
    description: 'Happy New Year!',
    x: { symbol: '🎆', color: '', winColor: '' },
    o: { symbol: '🥳', color: '', winColor: '' },
    seasonal: true,
    availableMonth: 0, // January
    holidayName: "New Year's Day",
  },
  valentine: {
    id: 'valentine',
    name: 'Valentine',
    description: 'Love is in the air!',
    x: { symbol: '💘', color: '', winColor: '' },
    o: { symbol: '🌹', color: '', winColor: '' },
    seasonal: true,
    availableMonth: 1, // February
    holidayName: "Valentine's Day",
  },
  stpatricks: {
    id: 'stpatricks',
    name: "St. Patrick's",
    description: 'Luck of the Irish!',
    x: { symbol: '☘️', color: '', winColor: '' },
    o: { symbol: '🍀', color: '', winColor: '' },
    seasonal: true,
    availableMonth: 2, // March
    holidayName: "St. Patrick's Day",
  },
  easter: {
    id: 'easter',
    name: 'Easter',
    description: 'Spring celebration!',
    x: { symbol: '🐰', color: '', winColor: '' },
    o: { symbol: '🥚', color: '', winColor: '' },
    seasonal: true,
    availableMonth: 3, // April
    holidayName: 'Easter',
  },
  halloween: {
    id: 'halloween',
    name: 'Halloween',
    description: 'Spooky season!',
    x: { symbol: '🎃', color: '', winColor: '' },
    o: { symbol: '👻', color: '', winColor: '' },
    seasonal: true,
    availableMonth: 9, // October
    holidayName: 'Halloween',
  },
  christmas: {
    id: 'christmas',
    name: 'Christmas',
    description: 'Holiday spirit!',
    x: { symbol: '🎄', color: '', winColor: '' },
    o: { symbol: '🎅', color: '', winColor: '' },
    seasonal: true,
    availableMonth: 11, // December
    holidayName: 'Christmas',
  },
}

// Get available themes (filter seasonal ones unless admin mode)
export function getAvailableThemes(adminMode = false) {
  return Object.values(SYMBOL_THEMES).filter(theme => {
    // Admin mode shows all themes
    if (adminMode) return true
    // Normal mode filters seasonal themes by month
    if (theme.seasonal && theme.availableMonth !== undefined) {
      return new Date().getMonth() === theme.availableMonth
    }
    return true
  })
}

// Get all holiday themes (for admin display)
export function getAllHolidayThemes() {
  return Object.values(SYMBOL_THEMES).filter(theme => theme.seasonal)
}

function getStoredSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    // Ignore storage errors
  }
  return null
}

function storeSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    // Ignore storage errors
  }
}

export function SettingsProvider({ children }) {
  const [adminMode, setAdminModeState] = useState(() => {
    const stored = getStoredSettings()
    return stored?.adminMode === true
  })

  const [autoEnableHoliday, setAutoEnableHolidayState] = useState(() => {
    const stored = getStoredSettings()
    // Default to true if not set
    return stored?.autoEnableHoliday !== false
  })

  const [symbolTheme, setSymbolThemeState] = useState(() => {
    const stored = getStoredSettings()
    const currentHolidayId = getCurrentHolidayThemeId()
    const autoEnable = stored?.autoEnableHoliday !== false

    // If auto-enable is on and there's a holiday theme available, use it
    if (autoEnable && currentHolidayId) {
      return currentHolidayId
    }

    // Validate stored theme exists and is available
    if (stored?.symbolTheme && SYMBOL_THEMES[stored.symbolTheme]) {
      const theme = SYMBOL_THEMES[stored.symbolTheme]
      // Check if seasonal theme is still available
      if (theme.seasonal && theme.availableMonth !== getCurrentMonth()) {
        return 'classic'
      }
      return stored.symbolTheme
    }
    return 'classic'
  })

  const [boardSize, setBoardSizeState] = useState(() => {
    const stored = getStoredSettings()
    if (stored?.boardSize && [3, 4, 5, 7].includes(stored.boardSize)) {
      return stored.boardSize
    }
    return 3
  })

  const [turnDuration, setTurnDurationState] = useState(() => {
    const stored = getStoredSettings()
    // null = no timer, otherwise a number in seconds
    if (stored?.turnDuration !== undefined) {
      return stored.turnDuration
    }
    return 30 // Default 30 seconds
  })

  const [gameMode, setGameModeState] = useState(() => {
    const stored = getStoredSettings()
    if (stored?.gameMode && ['classic', 'decay', 'gravity'].includes(stored.gameMode)) {
      return stored.gameMode
    }
    return 'classic' // Default to classic
  })

  const [opponentType, setOpponentTypeState] = useState(() => {
    const stored = getStoredSettings()
    if (stored?.opponentType && ['human', 'bot'].includes(stored.opponentType)) {
      return stored.opponentType
    }
    return 'human' // Default to human
  })

  const [soundEnabled, setSoundEnabledState] = useState(() => {
    const stored = getStoredSettings()
    // Default to true if not set
    return stored?.soundEnabled !== false
  })

  const [soundVolume, setSoundVolumeState] = useState(() => {
    const stored = getStoredSettings()
    if (typeof stored?.soundVolume === 'number') {
      return Math.max(0, Math.min(1, stored.soundVolume))
    }
    return 0.5 // Default 50% volume
  })

  const setAdminMode = (enabled) => {
    setAdminModeState(enabled)
    const stored = getStoredSettings() || {}
    storeSettings({ ...stored, adminMode: enabled })
  }

  const setAutoEnableHoliday = (enabled) => {
    setAutoEnableHolidayState(enabled)
    const stored = getStoredSettings() || {}
    storeSettings({ ...stored, autoEnableHoliday: enabled })

    // If enabling and there's a holiday theme, switch to it
    if (enabled) {
      const currentHolidayId = getCurrentHolidayThemeId()
      if (currentHolidayId) {
        setSymbolThemeState(currentHolidayId)
        storeSettings({ ...stored, autoEnableHoliday: enabled, symbolTheme: currentHolidayId })
      }
    }
  }

  const setSymbolTheme = (themeId) => {
    if (SYMBOL_THEMES[themeId]) {
      setSymbolThemeState(themeId)
      // Disable auto-enable when user explicitly selects a theme
      setAutoEnableHolidayState(false)
      const stored = getStoredSettings() || {}
      storeSettings({ ...stored, symbolTheme: themeId, autoEnableHoliday: false })
    }
  }

  const setBoardSize = (size) => {
    if ([3, 4, 5, 7].includes(size)) {
      setBoardSizeState(size)
      const stored = getStoredSettings() || {}
      storeSettings({ ...stored, boardSize: size })
    }
  }

  const setTurnDuration = (duration) => {
    // duration can be null (no timer) or a positive number
    setTurnDurationState(duration)
    const stored = getStoredSettings() || {}
    storeSettings({ ...stored, turnDuration: duration })
  }

  const setGameMode = (mode) => {
    if (['classic', 'decay', 'gravity'].includes(mode)) {
      setGameModeState(mode)
      const stored = getStoredSettings() || {}
      storeSettings({ ...stored, gameMode: mode })
    }
  }

  const setOpponentType = (type) => {
    if (['human', 'bot'].includes(type)) {
      setOpponentTypeState(type)
      const stored = getStoredSettings() || {}
      storeSettings({ ...stored, opponentType: type })
    }
  }

  const setSoundEnabled = (enabled) => {
    setSoundEnabledState(enabled)
    const stored = getStoredSettings() || {}
    storeSettings({ ...stored, soundEnabled: enabled })
  }

  const setSoundVolume = (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    setSoundVolumeState(clampedVolume)
    const stored = getStoredSettings() || {}
    storeSettings({ ...stored, soundVolume: clampedVolume })
  }

  const currentTheme = SYMBOL_THEMES[symbolTheme] || SYMBOL_THEMES.classic
  const currentGameModeOption = GAME_MODE_OPTIONS.find(o => o.id === gameMode) || GAME_MODE_OPTIONS[0]
  const currentBoardSizeOption = BOARD_SIZE_OPTIONS.find(o => o.size === boardSize) || BOARD_SIZE_OPTIONS[0]
  const currentHolidayTheme = getCurrentHolidayThemeId() ? SYMBOL_THEMES[getCurrentHolidayThemeId()] : null

  const value = {
    symbolTheme,
    setSymbolTheme,
    currentTheme,
    availableThemes: getAvailableThemes(adminMode),
    allHolidayThemes: getAllHolidayThemes(),
    adminMode,
    setAdminMode,
    autoEnableHoliday,
    setAutoEnableHoliday,
    currentHolidayTheme,
    isHolidaySeason: !!getCurrentHolidayThemeId(),
    boardSize,
    setBoardSize,
    currentBoardSizeOption,
    boardSizeOptions: BOARD_SIZE_OPTIONS,
    turnDuration,
    setTurnDuration,
    gameMode,
    setGameMode,
    currentGameModeOption,
    gameModeOptions: GAME_MODE_OPTIONS,
    opponentType,
    setOpponentType,
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
