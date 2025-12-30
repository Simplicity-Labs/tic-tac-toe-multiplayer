import { checkWinner, getBestMove, getAvailableMoves } from './gameLogic'

/**
 * AI Personality System
 *
 * Difficulty affects personality:
 * - Easy: Friendly, encouraging, rarely taunts
 * - Medium: Competitive, reacts to good/bad moves
 * - Hard: Confident/smug, taunts mistakes, respects good plays
 */

// Reaction pools by mood
const REACTIONS = {
  // AI is happy/taunting
  happy: ['😄', '😊', '🎉'],
  smug: ['😏', '😎', '🧠'],
  taunting: ['😏', '🤭', '💅'],

  // AI is frustrated/impressed
  frustrated: ['😤', '😠', '🙄'],
  impressed: ['👏', '😮', '🔥'],
  thinking: ['🤔', '🧐', '💭'],

  // Neutral/friendly
  friendly: ['👍', '😄', '👋'],
  encouraging: ['👍', '💪', '😊'],

  // Responding to player emotions
  consoling: ['😊', '👍', '💪'],
  rubbingItIn: ['😏', '🤭', '😂'],

  // Game end
  winning: ['🎉', '😎', '🏆'],
  losing: ['😤', '👏', 'GG'],
  draw: ['🤔', '🤝', 'GG'],
}

// Pick random from array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Random chance check
const chance = (probability) => Math.random() < probability

// Random delay between min and max ms
const randomDelay = (min = 500, max = 2000) =>
  Math.floor(Math.random() * (max - min + 1)) + min

/**
 * Evaluate if a move was "good" or "bad" for the player
 */
function evaluatePlayerMove(boardBefore, boardAfter, playerSymbol) {
  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X'

  // Check if player just won
  if (checkWinner(boardAfter)) {
    return 'player_won'
  }

  // Check if player blocked AI's winning move
  // (AI could have won on boardBefore, but can't on boardAfter)
  const aiWinningMoveBefore = findWinningMove(boardBefore, aiSymbol)
  if (aiWinningMoveBefore !== null) {
    const aiWinningMoveAfter = findWinningMove(boardAfter, aiSymbol)
    if (aiWinningMoveAfter === null) {
      return 'blocked_win'
    }
  }

  // Check if player missed their own winning move
  const playerWinningMove = findWinningMove(boardBefore, playerSymbol)
  if (playerWinningMove !== null) {
    // Player had a winning move but didn't take it
    const playerPosition = boardAfter.findIndex(
      (cell, i) => cell === playerSymbol && boardBefore[i] !== playerSymbol
    )
    if (playerPosition !== playerWinningMove) {
      return 'missed_win'
    }
  }

  // Check if player made a move that lets AI win
  const aiWinningMoveAfter = findWinningMove(boardAfter, aiSymbol)
  if (aiWinningMoveAfter !== null && aiWinningMoveBefore === null) {
    return 'blunder'
  }

  return 'neutral'
}

/**
 * Find a winning move for the given symbol
 */
function findWinningMove(board, symbol) {
  const available = getAvailableMoves(board)
  for (const pos of available) {
    const testBoard = [...board]
    testBoard[pos] = symbol
    if (checkWinner(testBoard)) {
      return pos
    }
  }
  return null
}

/**
 * Get AI reaction to a player's move
 */
export function getAIReactionToPlayerMove(context) {
  const { boardBefore, boardAfter, difficulty, playerSymbol } = context

  const evaluation = evaluatePlayerMove(boardBefore, boardAfter, playerSymbol)

  // Reaction probabilities by difficulty
  const reactionChance = {
    easy: { neutral: 0.1, significant: 0.4 },
    medium: { neutral: 0.2, significant: 0.6 },
    hard: { neutral: 0.3, significant: 0.8 },
  }[difficulty] || { neutral: 0.2, significant: 0.6 }

  switch (evaluation) {
    case 'player_won':
      // Player won - AI reacts based on difficulty
      if (difficulty === 'easy') {
        return { emoji: pick(REACTIONS.friendly), delay: randomDelay() }
      } else if (difficulty === 'hard') {
        return { emoji: pick(REACTIONS.frustrated), delay: randomDelay() }
      }
      return { emoji: pick(['👏', '😤']), delay: randomDelay() }

    case 'blocked_win':
      // Player blocked AI's win - impressive!
      if (!chance(reactionChance.significant)) return null
      if (difficulty === 'easy') {
        return { emoji: pick(REACTIONS.friendly), delay: randomDelay() }
      }
      return { emoji: pick(REACTIONS.impressed), delay: randomDelay() }

    case 'missed_win':
      // Player missed their winning move - taunt (hard) or stay quiet (easy)
      if (!chance(reactionChance.significant)) return null
      if (difficulty === 'hard') {
        return { emoji: pick(REACTIONS.smug), delay: randomDelay() }
      }
      return null

    case 'blunder':
      // Player made a bad move that lets AI win
      if (!chance(reactionChance.significant)) return null
      if (difficulty === 'hard') {
        return { emoji: pick(REACTIONS.taunting), delay: randomDelay() }
      } else if (difficulty === 'medium') {
        return { emoji: pick(REACTIONS.thinking), delay: randomDelay() }
      }
      return null

    case 'neutral':
    default:
      // Normal move - occasional reaction
      if (!chance(reactionChance.neutral)) return null
      return { emoji: pick(REACTIONS.thinking), delay: randomDelay(800, 2500) }
  }
}

/**
 * Get AI reaction after making its own move
 */
export function getAIReactionToOwnMove(context) {
  const { boardAfter, difficulty, isWinningMove, isBlockingMove } = context

  const reactionChance = {
    easy: 0.2,
    medium: 0.3,
    hard: 0.4,
  }[difficulty] || 0.3

  if (isWinningMove) {
    // AI just won
    if (difficulty === 'hard') {
      return { emoji: pick(REACTIONS.smug), delay: randomDelay(300, 800) }
    }
    return { emoji: pick(REACTIONS.happy), delay: randomDelay(300, 800) }
  }

  if (isBlockingMove) {
    // AI blocked player's win
    if (!chance(reactionChance)) return null
    if (difficulty === 'hard') {
      return { emoji: pick(['🛡️', '😏', '🧠']), delay: randomDelay() }
    }
    return null
  }

  // Normal move - rare reaction
  if (!chance(reactionChance * 0.5)) return null
  return { emoji: pick(REACTIONS.thinking), delay: randomDelay(1000, 3000) }
}

/**
 * Get AI reaction to player's emoji
 */
export function getAIReactionToPlayerEmoji(context) {
  const { playerEmoji, difficulty, isAIWinning, isPlayerWinning, gameOver } = context

  // Always respond to player emojis (with delay)
  const delay = randomDelay(800, 2000)

  // Categorize player emoji
  const happyEmojis = ['😄', '🎉', '👏', '🔥', '😊']
  const sadEmojis = ['😢', '😤', '😱']
  const neutralEmojis = ['👍', '🤔', 'GG']
  const teasingEmojis = ['😏', '🤭', '💅']

  const isHappy = happyEmojis.includes(playerEmoji)
  const isSad = sadEmojis.includes(playerEmoji)
  const isTeasing = teasingEmojis.includes(playerEmoji)
  const isGG = playerEmoji === 'GG'

  // GG always gets a respectful response
  if (isGG) {
    return { emoji: 'GG', delay }
  }

  // Player is happy/celebrating
  if (isHappy) {
    if (isPlayerWinning || gameOver) {
      // Player celebrating their win
      if (difficulty === 'hard') {
        return { emoji: pick(['😤', '🙄', 'GG']), delay }
      }
      return { emoji: pick(['👏', 'GG', '😊']), delay }
    }
    // Player happy during game
    if (difficulty === 'hard' && isAIWinning) {
      return { emoji: pick(REACTIONS.smug), delay }
    }
    return { emoji: pick(REACTIONS.friendly), delay }
  }

  // Player is sad/frustrated
  if (isSad) {
    if (difficulty === 'hard') {
      // Hard AI rubs it in
      return { emoji: pick(REACTIONS.rubbingItIn), delay }
    } else if (difficulty === 'easy') {
      // Easy AI is encouraging
      return { emoji: pick(REACTIONS.consoling), delay }
    }
    // Medium - 50/50
    return {
      emoji: pick(chance(0.5) ? REACTIONS.consoling : REACTIONS.rubbingItIn),
      delay,
    }
  }

  // Player is teasing
  if (isTeasing) {
    if (difficulty === 'hard') {
      return { emoji: pick(REACTIONS.smug), delay }
    }
    return { emoji: pick(REACTIONS.thinking), delay }
  }

  // Neutral emoji - mirror or acknowledge
  return { emoji: pick(REACTIONS.friendly), delay }
}

/**
 * Get AI reaction at game end
 */
export function getAIReactionToGameEnd(context) {
  const { winner, difficulty, isAIWinner } = context

  const delay = randomDelay(500, 1500)

  if (winner === null) {
    // Draw
    return { emoji: pick(REACTIONS.draw), delay }
  }

  if (isAIWinner) {
    // AI won
    if (difficulty === 'hard') {
      return { emoji: pick(REACTIONS.smug), delay }
    }
    return { emoji: pick(REACTIONS.winning), delay }
  }

  // Player won
  if (difficulty === 'hard') {
    return { emoji: pick(REACTIONS.frustrated), delay }
  } else if (difficulty === 'easy') {
    return { emoji: pick(['👏', 'GG', '🎉']), delay }
  }
  return { emoji: pick(REACTIONS.losing), delay }
}
