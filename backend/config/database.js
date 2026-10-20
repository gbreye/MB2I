import Database from 'better-sqlite3'
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(currentDirectory, '..', '..')
const defaultDatabasePath = path.join(currentDirectory, '..', 'data', 'mb2i.sqlite')
const configuredDatabasePath = process.env.DATABASE_PATH

export const databasePath = configuredDatabasePath
  ? path.isAbsolute(configuredDatabasePath)
    ? configuredDatabasePath
    : path.resolve(projectRoot, configuredDatabasePath)
  : defaultDatabasePath

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password TEXT NOT NULL,
    is_email_verify INTEGER NOT NULL DEFAULT 0 CHECK (is_email_verify IN (0, 1)),
    plant TEXT NOT NULL DEFAULT '[]',
    esp TEXT NOT NULL DEFAULT '',
    admin INTEGER NOT NULL DEFAULT 0 CHECK (admin IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_esp_unique
    ON users (esp)
    WHERE esp <> '';

  CREATE INDEX IF NOT EXISTS idx_users_email
    ON users (email);
`

let database = null

function getDatabase() {
  if (!database) {
    throw new Error('Banco de dados não inicializado')
  }

  return database
}

function bind(statement, method, params) {
  return Array.isArray(params)
    ? statement[method](...params)
    : statement[method](params)
}

export function dbRun(sql, params = []) {
  const result = bind(getDatabase().prepare(sql), 'run', params)

  return {
    lastID: Number(result.lastInsertRowid),
    changes: result.changes,
  }
}

export function dbGet(sql, params = []) {
  return bind(getDatabase().prepare(sql), 'get', params) ?? null
}

export function dbAll(sql, params = []) {
  return bind(getDatabase().prepare(sql), 'all', params)
}

export function dbExec(sql) {
  getDatabase().exec(sql)
}

export function dbTransaction(operation) {
  return getDatabase().transaction(operation)()
}

export function initializeDatabase() {
  if (database) return database

  fs.mkdirSync(path.dirname(databasePath), { recursive: true })

  try {
    database = new Database(databasePath, { timeout: 5_000 })

    database.pragma('journal_mode = WAL')
    database.pragma('synchronous = NORMAL')
    database.pragma('foreign_keys = ON')
    database.pragma('busy_timeout = 5000')
    database.exec(SCHEMA)

    console.log(`SQLite conectado em ${databasePath}`)

    return database
  } catch (error) {
    database?.close()
    database = null
    throw error
  }
}

export function closeDatabase() {
  if (!database) return

  const current = database
  database = null
  current.close()
}
