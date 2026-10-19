import sqlite3 from 'sqlite3'
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
let writeQueue = Promise.resolve()

function getDatabase() {
  if (!database) {
    throw new Error('Banco de dados não inicializado')
  }

  return database
}

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function onRun(error) {
      if (error) {
        reject(error)
        return
      }

      resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (error, row) => {
      if (error) {
        reject(error)
        return
      }

      resolve(row ?? null)
    })
  })
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (error, rows) => {
      if (error) {
        reject(error)
        return
      }

      resolve(rows)
    })
  })
}

export function dbExec(sql) {
  return new Promise((resolve, reject) => {
    getDatabase().exec(sql, (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

/**
 * SQLite has a single write lock per database. This queue keeps
 * multi-statement operations (read + update) from interleaving.
 */
export function serializeWrite(operation) {
  const result = writeQueue.then(operation, operation)

  writeQueue = result.then(
    () => undefined,
    () => undefined,
  )

  return result
}

export async function initializeDatabase() {
  if (database) return database

  fs.mkdirSync(path.dirname(databasePath), { recursive: true })

  await new Promise((resolve, reject) => {
    database = new sqlite3.Database(databasePath, (error) => {
      if (error) {
        database = null
        reject(error)
        return
      }

      resolve()
    })
  })

  await dbExec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `)

  await dbExec(SCHEMA)

  console.log(`SQLite conectado em ${databasePath}`)

  return database
}

export async function closeDatabase() {
  if (!database) return

  const current = database
  database = null

  await new Promise((resolve, reject) => {
    current.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}
