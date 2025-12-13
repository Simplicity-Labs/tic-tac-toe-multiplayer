import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext({})

export function useSettings() {
  return useContext(SettingsContext)
}

const SETTINGS_STORAGE_KEY = 'tic-tac-toe-settings'

// Check if it's December
const isDecember = () => new Date().getMonth() === 11

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

  const setSymbolTheme = (themeId) => {
    if (SYMBOL_THEMES[themeId]) {
      setSymbolThemeState(themeId)
      storeSettings({ symbolTheme: themeId })
    }
  }

  const currentTheme = SYMBOL_THEMES[symbolTheme] || SYMBOL_THEMES.classic

  const value = {
    symbolTheme,
    setSymbolTheme,
    currentTheme,
    availableThemes: getAvailableThemes(),
    isChristmasSeason: isDecember(),
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
