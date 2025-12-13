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
            if (payload.new.player_o) {
              setPlayerO((currentPlayerO) => {
                // Only fetch if we don't have the profile yet
                if (!currentPlayerO) {
                  supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', payload.new.player_o)
                    .single()
                    .then(({ data: oProfile }) => {
                      if (oProfile) setPlayerO(oProfile)
                    })
                }
                return currentPlayerO
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, fetchGame])

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
        if (game.is_ai_game) {
          // AI game - player wins or draws
          const difficulty = game.ai_difficulty || 'hard'
          const diffPrefix = `ai_${difficulty}`
          const { data: playerProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (playerProfile) {
            const statsUpdates = {}
            if (winResult) {
              statsUpdates[`${diffPrefix}_wins`] = (playerProfile[`${diffPrefix}_wins`] || 0) + 1
              statsUpdates.wins = (playerProfile.wins || 0) + 1
            } else if (isDraw) {
              statsUpdates[`${diffPrefix}_draws`] = (playerProfile[`${diffPrefix}_draws`] || 0) + 1
              statsUpdates.draws = (playerProfile.draws || 0) + 1
            }
            await supabase.from('profiles').update(statsUpdates).eq('id', user.id)
          }
        } else {
          // PvP game - update both players
          const players = [game.player_x, game.player_o].filter(Boolean)
          for (const playerId of players) {
            const { data: playerProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', playerId)
              .single()

            if (playerProfile) {
              const statsUpdates = {}
              if (winResult && user.id === playerId) {
                // This player won
                statsUpdates.pvp_wins = (playerProfile.pvp_wins || 0) + 1
                statsUpdates.wins = (playerProfile.wins || 0) + 1
              } else if (winResult) {
                // This player lost
                statsUpdates.pvp_losses = (playerProfile.pvp_losses || 0) + 1
                statsUpdates.losses = (playerProfile.losses || 0) + 1
              } else if (isDraw) {
                statsUpdates.pvp_draws = (playerProfile.pvp_draws || 0) + 1
                statsUpdates.draws = (playerProfile.draws || 0) + 1
              }
              await supabase.from('profiles').update(statsUpdates).eq('id', playerId)
            }
          }
        }
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
        const diffPrefix = `ai_${difficulty}`
        const { data: playerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', game.player_x)
          .single()

        if (playerProfile) {
          const statsUpdates = {}

          if (winResult) {
            // AI won - player lost
            statsUpdates[`${diffPrefix}_losses`] = (playerProfile[`${diffPrefix}_losses`] || 0) + 1
            statsUpdates.losses = (playerProfile.losses || 0) + 1
          } else if (isDraw) {
            statsUpdates[`${diffPrefix}_draws`] = (playerProfile[`${diffPrefix}_draws`] || 0) + 1
            statsUpdates.draws = (playerProfile.draws || 0) + 1
          }

          await supabase.from('profiles').update(statsUpdates).eq('id', game.player_x)
        }
      }
      setGame(data)
    }
  }, [game])

  // Get stat column names based on game type
  const getStatColumns = useCallback((isAI, difficulty) => {
    if (!isAI) {
      return { wins: 'pvp_wins', losses: 'pvp_losses', draws: 'pvp_draws' }
    }
    const diffPrefix = `ai_${difficulty || 'hard'}`
    return {
      wins: `${diffPrefix}_wins`,
      losses: `${diffPrefix}_losses`,
      draws: `${diffPrefix}_draws`,
    }
  }, [])

  // Update player stats
  const updateStats = useCallback(
    async (winnerId, forfeiterId = null) => {
      if (!game) return

      const isAI = game.is_ai_game
      const difficulty = game.ai_difficulty
      const statCols = getStatColumns(isAI, difficulty)

      // For AI games, only update the human player's stats
      if (isAI) {
        const { data: playerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', game.player_x)
          .single()

        if (playerProfile) {
          const updates = {}

          if (winnerId === null) {
            // Draw
            updates[statCols.draws] = (playerProfile[statCols.draws] || 0) + 1
            updates.draws = (playerProfile.draws || 0) + 1
          } else if (winnerId === 'ai') {
            // AI won - player lost
            updates[statCols.losses] = (playerProfile[statCols.losses] || 0) + 1
            updates.losses = (playerProfile.losses || 0) + 1
          } else {
            // Player won
            updates[statCols.wins] = (playerProfile[statCols.wins] || 0) + 1
            updates.wins = (playerProfile.wins || 0) + 1
          }

          if (forfeiterId === game.player_x) {
            updates.forfeits = (playerProfile.forfeits || 0) + 1
          }

          await supabase.from('profiles').update(updates).eq('id', game.player_x)
        }
        return
      }

      // For PvP games, update both players
      const players = [game.player_x, game.player_o].filter(Boolean)

      for (const playerId of players) {
        const { data: playerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', playerId)
          .single()

        if (playerProfile) {
          const updates = {}

          if (winnerId === null) {
            // Draw
            updates[statCols.draws] = (playerProfile[statCols.draws] || 0) + 1
            updates.draws = (playerProfile.draws || 0) + 1
          } else if (winnerId === playerId) {
            // Win
            updates[statCols.wins] = (playerProfile[statCols.wins] || 0) + 1
            updates.wins = (playerProfile.wins || 0) + 1
          } else {
            // Loss
            updates[statCols.losses] = (playerProfile[statCols.losses] || 0) + 1
            updates.losses = (playerProfile.losses || 0) + 1
          }

          if (forfeiterId === playerId) {
            updates.forfeits = (playerProfile.forfeits || 0) + 1
          }

          await supabase.from('profiles').update(updates).eq('id', playerId)
        }
      }
    },
    [game, getStatColumns]
  )

  // Handle timeout (forfeit by timeout)
  const handleTimeout = useCallback(async () => {
    if (!game || game.status !== 'in_progress') return

    const forfeiterId = game.current_turn // Person who timed out
    const winner = game.is_ai_game
      ? (forfeiterId === game.player_x ? 'ai' : game.player_x)
      : (forfeiterId === game.player_x ? game.player_o : game.player_x)

    const { data, error: updateError } = await supabase
      .from('games')
      .update({
        status: 'completed',
        winner: winner,
        forfeit_by: forfeiterId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', game.id)
      .select()
      .single()

    if (!updateError) {
      await updateStats(winner, forfeiterId)
      setGame(data)
    }
  }, [game, updateStats])

  // Forfeit the game (current user loses) or cancel if waiting
  const forfeit = useCallback(async () => {
    if (!game || !user) return { error: 'No game or user' }
    if (game.status !== 'in_progress' && game.status !== 'waiting') {
      return { error: 'Game is not active' }
    }

    // If game is waiting (no opponent yet), just delete it
    if (game.status === 'waiting') {
      const { error: deleteError } = await supabase
        .from('games')
        .delete()
        .eq('id', game.id)

      if (deleteError) {
        return { error: deleteError.message }
      }

      setGame(null)
      return { data: null, cancelled: true }
    }

    // Game is in progress - determine the winner (opponent)
    const forfeiterId = user.id
    let winner
    if (game.is_ai_game) {
      winner = 'ai'
    } else {
      winner = game.player_x === user.id ? game.player_o : game.player_x
    }

    const { data, error: updateError } = await supabase
      .from('games')
      .update({
        status: 'completed',
        winner: winner,
        forfeit_by: forfeiterId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', game.id)
      .select()
      .single()

    if (updateError) {
      return { error: updateError.message }
    }

    // Update stats - forfeiter loses, opponent wins
    await updateStats(winner, forfeiterId)

    setGame(data)
    return { data }
  }, [game, user, updateStats])

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
    forfeit,
    getPlayerSymbol,
    isMyTurn,
    refetch: fetchGame,
  }
}

// Hook to get user's active game (waiting or in_progress)
export function useActiveGame() {
  const { user } = useAuth()
  const [activeGame, setActiveGame] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchActiveGame = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .or(`player_x.eq.${user.id},player_o.eq.${user.id}`)
        .in('status', ['waiting', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        console.error('Error fetching active game:', error)
      }

      setActiveGame(data || null)
    } catch (err) {
      console.error('Error fetching active game:', err)
      setActiveGame(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchActiveGame()
  }, [fetchActiveGame])

  return { activeGame, loading, refetch: fetchActiveGame }
}

// Hook to create a new game
export function useCreateGame() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const checkForActiveGame = async () => {
    const { data } = await supabase
      .from('games')
      .select('id')
      .or(`player_x.eq.${user.id},player_o.eq.${user.id}`)
      .in('status', ['waiting', 'in_progress'])
      .limit(1)
      .single()

    return data
  }

  const createGame = async (isAI = false, aiDifficulty = 'hard') => {
    if (!user) return { error: 'Not authenticated' }

    setLoading(true)

    try {
      // Check if user already has an active game
      const existingGame = await checkForActiveGame()
      if (existingGame) {
        return { error: 'You already have an active game', existingGameId: existingGame.id }
      }

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

// Hook to fetch global leaderboard (PvP only)
export function useLeaderboard(limit = 50, period = 'all-time') {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)

      if (period === 'all-time') {
        // All-time stats from profiles
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id, username,
            pvp_wins, pvp_losses, pvp_draws,
            ai_easy_wins, ai_easy_losses, ai_easy_draws,
            ai_medium_wins, ai_medium_losses, ai_medium_draws,
            ai_hard_wins, ai_hard_losses, ai_hard_draws,
            forfeits,
            wins, losses, draws
          `)
          .order('pvp_wins', { ascending: false })
          .limit(limit)

        if (error) throw error
        setPlayers(data || [])
      } else if (period === 'this-month') {
        // Monthly stats calculated from games
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        // Fetch completed PvP games from this month
        const { data: games, error: gamesError } = await supabase
          .from('games')
          .select(`
            id, player_x, player_o, winner, is_ai_game,
            player_x_profile:profiles!games_player_x_fkey(id, username),
            player_o_profile:profiles!games_player_o_fkey(id, username)
          `)
          .eq('status', 'completed')
          .eq('is_ai_game', false)
          .gte('completed_at', startOfMonth.toISOString())

        if (gamesError) throw gamesError

        // Calculate stats per player
        const playerStats = {}

        for (const game of games || []) {
          const players = [
            { id: game.player_x, profile: game.player_x_profile },
            { id: game.player_o, profile: game.player_o_profile },
          ].filter((p) => p.id && p.profile)

          for (const player of players) {
            if (!playerStats[player.id]) {
              playerStats[player.id] = {
                id: player.id,
                username: player.profile.username,
                pvp_wins: 0,
                pvp_losses: 0,
                pvp_draws: 0,
              }
            }

            if (game.winner === null) {
              playerStats[player.id].pvp_draws++
            } else if (game.winner === player.id) {
              playerStats[player.id].pvp_wins++
            } else {
              playerStats[player.id].pvp_losses++
            }
          }
        }

        // Convert to array and sort by wins
        const sortedPlayers = Object.values(playerStats).sort(
          (a, b) => b.pvp_wins - a.pvp_wins
        )

        setPlayers(sortedPlayers.slice(0, limit))
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [limit, period])

  useEffect(() => {
    fetchLeaderboard()

    const channel = supabase
      .channel(`leaderboard-${period}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: period === 'all-time' ? 'profiles' : 'games',
        },
        () => {
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard, period])

  return { players, loading, refetch: fetchLeaderboard }
}
