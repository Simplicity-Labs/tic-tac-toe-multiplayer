import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { gameApi, profileApi } from '../lib/api'
import { wsClient } from '../lib/ws'
import { getAIMove } from '../lib/gameLogic'
import { normalizeGame, makeLocalMove, makeLocalAIMove } from './useGameHelpers'

const DEFAULT_TURN_DURATION = 30

// ─── Hook: Single Game ───────────────────────────────────────────────────

export function useGame(gameId) {
  const { user } = useAuth()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playerX, setPlayerX] = useState(null)
  const [playerO, setPlayerO] = useState(null)
  const fetchedGameIdRef = useRef(null)
  const playerOIdRef = useRef(null)

  // Fetch game and subscribe to WS updates
  useEffect(() => {
    if (!gameId) return

    if (fetchedGameIdRef.current !== gameId) {
      setGame(null)
      setPlayerX(null)
      setPlayerO(null)
      setLoading(true)
      setError(null)
      playerOIdRef.current = null
    }

    fetchedGameIdRef.current = gameId

    const fetchGameData = async () => {
      try {
        const { data, error: fetchError } = await gameApi.get(gameId)
        if (fetchError) throw new Error(fetchError.message)

        const normalized = normalizeGame(data)
        setGame(normalized)

        if (normalized.player_x) {
          const { data: xProfile } = await profileApi.get(normalized.player_x)
          if (xProfile) setPlayerX(xProfile)
        }
        if (normalized.player_o && playerOIdRef.current !== normalized.player_o) {
          playerOIdRef.current = normalized.player_o
          const { data: oProfile } = await profileApi.get(normalized.player_o)
          if (oProfile) setPlayerO(oProfile)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGameData()

    wsClient.subscribe(`game:${gameId}`)

    const unsubUpdate = wsClient.on('game:updated', async (data) => {
      const normalized = normalizeGame(data)
      if (normalized && normalized.id === gameId) {
        setGame(normalized)

        if (normalized.player_o && playerOIdRef.current !== normalized.player_o) {
          playerOIdRef.current = normalized.player_o
          const { data: oProfile } = await profileApi.get(normalized.player_o)
          if (oProfile) setPlayerO(oProfile)
        }
      }
    })

    const unsubDeleted = wsClient.on('game:deleted', (data) => {
      if (data?.gameId === gameId) setGame(null)
    })

    return () => {
      wsClient.unsubscribe(`game:${gameId}`)
      unsubUpdate()
      unsubDeleted()
    }
  }, [gameId])

  const makeMove = useCallback(
    async (position) => {
      if (!game || !user) return { error: 'No game or user' }
      if (game.current_turn !== user.id) return { error: "It's not your turn" }

      if (game.is_ai_game) {
        return await makeLocalMove(game, user, position, setGame)
      }

      wsClient.gameMove(game.id, position)
      return { data: true }
    },
    [game, user]
  )

  const makeAIMove = useCallback(async () => {
    if (!game || game.status !== 'in_progress') return

    const difficulty = game.ai_difficulty || 'hard'
    const isGravityMode = game.game_mode === 'gravity'
    const aiPosition = getAIMove(game.board, difficulty, isGravityMode)
    if (aiPosition === null) return

    await makeLocalAIMove(game, aiPosition, difficulty, setGame)
  }, [game])

  const handleTimeout = useCallback(async () => {
    if (!game || game.status !== 'in_progress') return
    wsClient.gameTimeout(game.id)
  }, [game])

  const forfeit = useCallback(async () => {
    if (!game || !user) return { error: 'No game or user' }
    if (game.status !== 'in_progress' && game.status !== 'waiting') {
      return { error: 'Game is not active' }
    }

    if (game.status === 'waiting') {
      const { error } = await gameApi.delete(game.id)
      if (error) return { error: error.message }
      setGame(null)
      return { data: null, cancelled: true }
    }

    wsClient.gameForfeit(game.id)
    return { data: true }
  }, [game, user])

  const getPlayerSymbol = useCallback(() => {
    if (!game || !user) return null
    return game.player_x === user.id ? 'X' : 'O'
  }, [game, user])

  const isMyTurn = useCallback(() => {
    if (!game || !user) return false
    return game.current_turn === user.id
  }, [game, user])

  return {
    game, loading, error, playerX, playerO,
    makeMove, makeAIMove, handleTimeout, forfeit, getPlayerSymbol, isMyTurn,
  }
}

// ─── Hook: Active Game ───────────────────────────────────────────────────

export function useActiveGame() {
  const { user } = useAuth()
  const [activeGame, setActiveGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [forfeitLoading, setForfeitLoading] = useState(false)

  const fetchActiveGame = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const { data, error } = await gameApi.active()
      if (error) console.error('Error fetching active game:', error)
      setActiveGame(data ? normalizeGame(data) : null)
    } catch (err) {
      console.error('Error fetching active game:', err)
      setActiveGame(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  const forfeitGame = useCallback(async () => {
    if (!activeGame || !user) return { error: 'No active game' }
    setForfeitLoading(true)
    try {
      if (activeGame.status === 'waiting') {
        const { error } = await gameApi.delete(activeGame.id)
        if (error) return { error: error.message }
        setActiveGame(null)
        return { data: null, cancelled: true }
      }
      wsClient.gameForfeit(activeGame.id)
      setActiveGame(null)
      return { data: null }
    } finally {
      setForfeitLoading(false)
    }
  }, [activeGame, user])

  useEffect(() => { fetchActiveGame() }, [fetchActiveGame])

  return { activeGame, loading, refetch: fetchActiveGame, forfeitGame, forfeitLoading }
}

// ─── Hook: Create Game ───────────────────────────────────────────────────

export function useCreateGame() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const createGame = async (isAI = false, aiDifficulty = 'hard', boardSize = 3, turnDuration = DEFAULT_TURN_DURATION, gameMode = 'classic') => {
    if (!user) return { error: 'Not authenticated' }
    setLoading(true)
    try {
      const { data, error } = await gameApi.create({ isAI, aiDifficulty, boardSize, turnDuration, gameMode })
      if (error) {
        if (error.message?.includes('already have an active game')) {
          return { error: error.message, existingGameId: data?.existingGameId }
        }
        return { error: error.message }
      }
      return { data: normalizeGame(data) }
    } catch (err) {
      return { error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return { createGame, loading }
}

// ─── Hook: Join Game ─────────────────────────────────────────────────────

export function useJoinGame() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const joinGame = async (gameId) => {
    if (!user) return { error: 'Not authenticated' }
    setLoading(true)
    try {
      const { data, error } = await gameApi.join(gameId)
      if (error) return { error: error.message }
      return { data: normalizeGame(data) }
    } catch (err) {
      return { error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return { joinGame, loading }
}

// ─── Hook: Available Games ───────────────────────────────────────────────

export function useAvailableGames() {
  const { user } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGames = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await gameApi.available()
      if (error) throw new Error(error.message)
      setGames((data || []).map(normalizeGame))
    } catch (err) {
      console.error('Error fetching games:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchGames()
    const unsub = wsClient.on('lobby:updated', () => { fetchGames() })
    return () => unsub()
  }, [fetchGames, user])

  return { games, loading, refetch: fetchGames }
}

// ─── Hook: Live Games ────────────────────────────────────────────────────

export function useLiveGames() {
  const { user } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGames = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await gameApi.live()
      if (error) throw new Error(error.message)
      setGames((data || []).map(normalizeGame))
    } catch (err) {
      console.error('Error fetching live games:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchGames()
    const unsub = wsClient.on('live:updated', () => { fetchGames() })
    return () => unsub()
  }, [fetchGames, user])

  return { games, loading, refetch: fetchGames }
}

// ─── Hook: Game History ──────────────────────────────────────────────────

export function useGameHistory() {
  const { user } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchHistory = async () => {
      try {
        const { data, error } = await gameApi.history(50)
        if (error) throw new Error(error.message)
        setGames((data || []).map(normalizeGame))
      } catch (err) {
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [user])

  return { games, loading }
}

// ─── Hook: Leaderboard ──────────────────────────────────────────────────

export function useLeaderboard(limit = 50, period = 'all-time') {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      const { data: completedGames, error } = await gameApi.leaderboard(period)
      if (error) throw new Error(error.message)

      const playerStats = {}

      for (const game of completedGames || []) {
        const gamePlayers = [
          { id: game.player_x, profile: game.player_x_profile },
          { id: game.player_o, profile: game.player_o_profile },
        ].filter((p) => p.id && p.profile)

        for (const player of gamePlayers) {
          if (!playerStats[player.id]) {
            playerStats[player.id] = {
              id: player.id,
              username: player.profile.username,
              avatar: player.profile.avatar,
              pvp_wins: 0, pvp_losses: 0, pvp_draws: 0,
            }
          }

          if (game.winner === null) playerStats[player.id].pvp_draws++
          else if (game.winner === player.id) playerStats[player.id].pvp_wins++
          else playerStats[player.id].pvp_losses++
        }
      }

      // Fetch full profiles
      const playerIds = Object.keys(playerStats)
      for (const pid of playerIds) {
        const { data: fullProfile } = await profileApi.get(pid)
        if (fullProfile) {
          playerStats[pid] = {
            ...fullProfile,
            pvp_wins: playerStats[pid].pvp_wins,
            pvp_losses: playerStats[pid].pvp_losses,
            pvp_draws: playerStats[pid].pvp_draws,
          }
        }
      }

      const sortedPlayers = Object.values(playerStats).sort(
        (a, b) => b.pvp_wins - a.pvp_wins
      )
      setPlayers(sortedPlayers.slice(0, limit))
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [limit, period])

  useEffect(() => {
    fetchLeaderboard()
    const unsub = wsClient.on('lobby:updated', () => { fetchLeaderboard() })
    return () => unsub()
  }, [fetchLeaderboard])

  return { players, loading, refetch: fetchLeaderboard }
}
