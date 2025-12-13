import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext({})

export function useSettings() {
  return useContext(SettingsContext)
}

const SETTINGS_STORAGE_KEY = 'tic-tac-toe-settings'

// Check if it's December
const isDecember = () => new Date().getMonth() === 11

// Board size options
export const BOARD_SIZE_OPTIONS = [
  { size: 3, label: '3x3', description: 'Classic - 3 in a row to win' },
  { size: 4, label: '4x4', description: 'Extended - 3 in a row to win' },
  { size: 5, label: '5x5', description: 'Large - 4 in a row to win' },
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
  christmas: {
    id: 'christmas',
    name: 'Christmas',
    description: 'Holiday spirit!',
    x: { symbol: '🎄', color: '', winColor: '' },
    o: { symbol: '🎅', color: '', winColor: '' },
    seasonal: true,
    availableMonth: 11, // December (0-indexed)
  },
}

// Get available themes (filter seasonal ones)
export function getAvailableThemes() {
  return Object.values(SYMBOL_THEMES).filter(theme => {
    if (theme.seasonal && theme.availableMonth !== undefined) {
      return new Date().getMonth() === theme.availableMonth
    }
    return true
  })
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
  const [symbolTheme, setSymbolThemeState] = useState(() => {
    const stored = getStoredSettings()
    // Validate stored theme exists and is available
    if (stored?.symbolTheme && SYMBOL_THEMES[stored.symbolTheme]) {
      const theme = SYMBOL_THEMES[stored.symbolTheme]
      // Check if seasonal theme is still available
      if (theme.seasonal && theme.availableMonth !== new Date().getMonth()) {
        return 'classic'
      }
      return stored.symbolTheme
    }
    return 'classic'
  })

  const [boardSize, setBoardSizeState] = useState(() => {
    const stored = getStoredSettings()
    if (stored?.boardSize && [3, 4, 5].includes(stored.boardSize)) {
      return stored.boardSize
    }
    return 3
  })

  const setSymbolTheme = (themeId) => {
    if (SYMBOL_THEMES[themeId]) {
      setSymbolThemeState(themeId)
      const stored = getStoredSettings() || {}
      storeSettings({ ...stored, symbolTheme: themeId })
    }
  }

  const setBoardSize = (size) => {
    if ([3, 4, 5].includes(size)) {
      setBoardSizeState(size)
      const stored = getStoredSettings() || {}
      storeSettings({ ...stored, boardSize: size })
    }
  }

  const currentTheme = SYMBOL_THEMES[symbolTheme] || SYMBOL_THEMES.classic
  const currentBoardSizeOption = BOARD_SIZE_OPTIONS.find(o => o.size === boardSize) || BOARD_SIZE_OPTIONS[0]

  const value = {
    symbolTheme,
    setSymbolTheme,
    currentTheme,
    availableThemes: getAvailableThemes(),
    isChristmasSeason: isDecember(),
    boardSize,
    setBoardSize,
    currentBoardSizeOption,
    boardSizeOptions: BOARD_SIZE_OPTIONS,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
