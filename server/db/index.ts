import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'fs'
import * as schema from './schema'

const dataDir = process.env.DATA_DIR || 'data'

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = `${dataDir}/tictactoe.db`
const sqlite = new Database(dbPath)

// Enable WAL mode for better concurrent read performance
sqlite.exec('PRAGMA journal_mode = WAL')
sqlite.exec('PRAGMA foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export { schema }
