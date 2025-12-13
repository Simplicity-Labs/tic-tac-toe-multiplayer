import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  checkWinner,
  checkDraw,
  getAIMove,
  createEmptyBoard,
  isEmpty,
} from '../lib/gameLogic'

const TURN_DURATION = 10 // seconds

export function useGame(gameId) {
  const { user, profile } = useAuth()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playerX, setPlayerX] = useState(null)
  const [playerO, setPlayerO] = useState(null)

  // Fetch game data
  const fetchGame = useCallback(async () => {
    if (!gameId) return

    try {
      const { data, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (fetchError) throw fetchError

      setGame(data)

      // Fetch player profiles
      if (data.player_x) {
        const { data: xProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.player_x)
          .single()
        setPlayerX(xProfile)
      }

      if (data.player_o) {
        const { data: oProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.player_o)
          .single()
        setPlayerO(oProfile)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gameId])

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return

    fetchGame()

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        async (payload) => {
          if (payload.new) {
            setGame(payload.new)

            // Fetch player O profile if it just joined
            if (payload.new.player_o && !playerO) {
              const { data: oProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', payload.new.player_o)
                .single()
              setPlayerO(oProfile)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, fetchGame, playerO])

  // Make a move
  const makeMove = useCallback(
    async (position) => {
      if (!game || !user) return { error: 'No game or user' }

      // Validate it's the player's turn
      if (game.current_turn !== user.id) {
        return { error: "It's not your turn" }
      }

      // Validate position is empty
      if (!isEmpty(game.board[position])) {
        return { error: 'Position already taken' }
      }

      // Determine the player's symbol
      const symbol = game.player_x === user.id ? 'X' : 'O'
      const newBoard = [...game.board]
      newBoard[position] = symbol

      // Check for winner or draw
      const winResult = checkWinner(newBoard)
      const isDraw = checkDraw(newBoard)

      let updates = {
        board: newBoard,
        turn_started_at: new Date().toISOString(),
      }

      if (winResult) {
        updates.status = 'completed'
        updates.winner = user.id
        updates.completed_at = new Date().toISOString()
      } else if (isDraw) {
        updates.status = 'completed'
        updates.winner = null
        updates.completed_at = new Date().toISOString()
      } else {
        // Switch turns - for AI games, set to 'ai' marker; otherwise switch to other player
        if (game.is_ai_game) {
          updates.current_turn = null // null indicates AI's turn
        } else {
          updates.current_turn =
            game.player_x === user.id ? game.player_o : game.player_x
        }
      }

      const { data, error: updateError } = await supabase
        .from('games')
        .update(updates)
        .eq('id', game.id)
        .select()
        .single()

      if (updateError) {
        return { error: updateError.message }
      }

      // Record the move
      await supabase.from('moves').insert({
        game_id: game.id,
        player_id: user.id,
        position,
      })

      // Update stats if game is over
      if (updates.status === 'completed') {
        await updateStats(winResult ? user.id : null)
      }

      setGame(data)
      return { data }
    },
    [game, user]
  )

  // Make AI move
  const makeAIMove = useCallback(async () => {
    if (!game || game.status !== 'in_progress') return

    const difficulty = game.ai_difficulty || 'hard'
    const aiPosition = getAIMove(game.board, difficulty)
    if (aiPosition === null) return

    const newBoard = [...game.board]
    newBoard[aiPosition] = 'O'

    const winResult = checkWinner(newBoard)
    const isDraw = checkDraw(newBoard)

    let updates = {
      board: newBoard,
      turn_started_at: new Date().toISOString(),
    }

    if (winResult) {
      updates.status = 'completed'
      updates.winner = 'ai'
      updates.completed_at = new Date().toISOString()
    } else if (isDraw) {
      updates.status = 'completed'
      updates.winner = null
      updates.completed_at = new Date().toISOString()
    } else {
      updates.current_turn = game.player_x
    }

    const { data, error: updateError } = await supabase
      .from('games')
      .update(updates)
      .eq('id', game.id)
      .select()
      .single()

    if (!updateError) {
      // Update stats if game is over
      if (updates.status === 'completed') {
        if (winResult) {
          // AI won - player lost
          await supabase
            .from('profiles')
            .update({ losses: (profile?.losses || 0) + 1 })
            .eq('id', user.id)
        } else if (isDraw) {
          await supabase
            .from('profiles')
            .update({ draws: (profile?.draws || 0) + 1 })
            .eq('id', user.id)
        }
      }
      setGame(data)
    }
  }, [game, profile, user])

  // Update player stats
  const updateStats = useCallback(
    async (winnerId) => {
      if (!game) return

      const players = [game.player_x, game.player_o].filter(Boolean)

      for (const playerId of players) {
        const { data: playerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', playerId)
          .single()

        if (playerProfile) {
          if (winnerId === null) {
            // Draw
            await supabase
              .from('profiles')
              .update({ draws: (playerProfile.draws || 0) + 1 })
              .eq('id', playerId)
          } else if (winnerId === playerId) {
            // Win
            await supabase
              .from('profiles')
              .update({ wins: (playerProfile.wins || 0) + 1 })
              .eq('id', playerId)
          } else {
            // Loss
            await supabase
              .from('profiles')
              .update({ losses: (playerProfile.losses || 0) + 1 })
              .eq('id', playerId)
          }
        }
      }
    },
    [game]
  )

  // Handle timeout (forfeit)
  const handleTimeout = useCallback(async () => {
    if (!game || game.status !== 'in_progress') return

    const winner =
      game.current_turn === game.player_x ? game.player_o : game.player_x

    const { data, error: updateError } = await supabase
      .from('games')
      .update({
        status: 'completed',
        winner: game.is_ai_game ? (game.current_turn === game.player_x ? 'ai' : game.player_x) : winner,
        completed_at: new Date().toISOString(),
      })
      .eq('id', game.id)
      .select()
      .single()

    if (!updateError) {
      await updateStats(winner)
      setGame(data)
    }
  }, [game, updateStats])

  // Get current player's symbol
  const getPlayerSymbol = useCallback(() => {
    if (!game || !user) return null
    return game.player_x === user.id ? 'X' : 'O'
  }, [game, user])

  // Check if it's the current user's turn
  const isMyTurn = useCallback(() => {
    if (!game || !user) return false
    return game.current_turn === user.id
  }, [game, user])

  return {
    game,
    loading,
    error,
    playerX,
    playerO,
    makeMove,
    makeAIMove,
    handleTimeout,
    getPlayerSymbol,
    isMyTurn,
    refetch: fetchGame,
  }
}

// Hook to create a new game
export function useCreateGame() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const createGame = async (isAI = false, aiDifficulty = 'hard') => {
    if (!user) return { error: 'Not authenticated' }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          player_x: user.id,
          player_o: isAI ? null : null,
          board: createEmptyBoard(),
          current_turn: user.id,
          status: isAI ? 'in_progress' : 'waiting',
          is_ai_game: isAI,
          ai_difficulty: isAI ? aiDifficulty : null,
          turn_started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (err) {
      return { error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return { createGame, loading }
}

// Hook to join an existing game
export function useJoinGame() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const joinGame = async (gameId) => {
    if (!user) return { error: 'Not authenticated' }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('games')
        .update({
          player_o: user.id,
          status: 'in_progress',
          turn_started_at: new Date().toISOString(),
        })
        .eq('id', gameId)
        .eq('status', 'waiting')
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (err) {
      return { error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return { joinGame, loading }
}

// Hook to fetch available games
export function useAvailableGames() {
  const { user } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGames = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          creator:profiles!games_player_x_fkey(id, username)
        `)
        .eq('status', 'waiting')
        .neq('player_x', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGames(data || [])
    } catch (err) {
      console.error('Error fetching games:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchGames()

    // Subscribe to new games
    const channel = supabase
      .channel('available-games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: 'status=eq.waiting',
        },
        () => {
          fetchGames()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchGames])

  return { games, loading, refetch: fetchGames }
}

// Hook to fetch game history
export function useGameHistory() {
  const { user } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select(`
            *,
            player_x_profile:profiles!games_player_x_fkey(id, username),
            player_o_profile:profiles!games_player_o_fkey(id, username)
          `)
          .eq('status', 'completed')
          .or(`player_x.eq.${user.id},player_o.eq.${user.id}`)
          .order('completed_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setGames(data || [])
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

// Hook to fetch global leaderboard
export function useLeaderboard(limit = 50) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, wins, losses, draws')
        .order('wins', { ascending: false })
        .limit(limit)

      if (error) throw error
      setPlayers(data || [])
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return { players, loading, refetch: fetchLeaderboard }
}
