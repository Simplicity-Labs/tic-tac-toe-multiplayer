import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// ─── BetterAuth Tables ─────────────────────────────────────────────────────

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  isAnonymous: integer('isAnonymous', { mode: 'boolean' }).default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
})

// ─── Application Tables ────────────────────────────────────────────────────

export const profiles = sqliteTable('profiles', {
  id: text('id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  avatar: text('avatar').default('😀'),
  // Overall stats
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  // PvP stats
  pvpWins: integer('pvp_wins').notNull().default(0),
  pvpLosses: integer('pvp_losses').notNull().default(0),
  pvpDraws: integer('pvp_draws').notNull().default(0),
  // AI easy stats
  aiEasyWins: integer('ai_easy_wins').notNull().default(0),
  aiEasyLosses: integer('ai_easy_losses').notNull().default(0),
  aiEasyDraws: integer('ai_easy_draws').notNull().default(0),
  // AI medium stats
  aiMediumWins: integer('ai_medium_wins').notNull().default(0),
  aiMediumLosses: integer('ai_medium_losses').notNull().default(0),
  aiMediumDraws: integer('ai_medium_draws').notNull().default(0),
  // AI hard stats
  aiHardWins: integer('ai_hard_wins').notNull().default(0),
  aiHardLosses: integer('ai_hard_losses').notNull().default(0),
  aiHardDraws: integer('ai_hard_draws').notNull().default(0),
  // Other stats
  forfeits: integer('forfeits').notNull().default(0),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  isGuest: integer('is_guest', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  playerX: text('player_x').references(() => profiles.id),
  playerO: text('player_o').references(() => profiles.id),
  board: text('board', { mode: 'json' }).notNull().$type<string[]>(),
  currentTurn: text('current_turn'),
  status: text('status', { enum: ['waiting', 'in_progress', 'completed'] })
    .notNull()
    .default('waiting'),
  winner: text('winner'), // player id, 'ai', or null (draw)
  isAiGame: integer('is_ai_game', { mode: 'boolean' }).notNull().default(false),
  aiDifficulty: text('ai_difficulty', { enum: ['easy', 'medium', 'hard'] }),
  boardSize: integer('board_size').notNull().default(3),
  turnDuration: integer('turn_duration').notNull().default(30),
  gameMode: text('game_mode', {
    enum: ['classic', 'misere', 'decay', 'gravity', 'random', 'bomb', 'blocker', 'fog'],
  })
    .notNull()
    .default('classic'),
  turnStartedAt: text('turn_started_at'),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
  invitedPlayerId: text('invited_player_id'),
  forfeitBy: text('forfeit_by'),
  turnCount: integer('turn_count').notNull().default(0),
  placedAt: text('placed_at', { mode: 'json' }).$type<(number | null)[]>(),
  decayTurns: integer('decay_turns'),
  bombedCells: text('bombed_cells', { mode: 'json' }).$type<number[]>(),
})

export const moves = sqliteTable('moves', {
  id: text('id').primaryKey(),
  gameId: text('game_id')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  playerId: text('player_id')
    .notNull()
    .references(() => profiles.id),
  position: integer('position').notNull(),
  createdAt: text('created_at').notNull(),
})

// ─── Types ─────────────────────────────────────────────────────────────────

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
export type Move = typeof moves.$inferSelect
export type NewMove = typeof moves.$inferInsert
