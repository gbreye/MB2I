import { dbGet, dbRun, dbTransaction } from '../config/database.js'

const USER_COLUMNS = `
  id,
  username,
  email,
  password,
  is_email_verify AS isEmailVerify,
  plant,
  esp,
  admin,
  created_at AS createdAt,
  updated_at AS updatedAt
`

function parsePlant(value) {
  if (typeof value !== 'string' || value.length === 0) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeRow(row) {
  if (!row) return null

  return {
    ...row,
    id: String(row.id),
    isEmailVerify: Boolean(row.isEmailVerify),
    admin: Boolean(row.admin),
    plant: parsePlant(row.plant),
  }
}

function toPublic(user) {
  if (!user) return null

  const { password: _password, ...publicUser } = user
  return publicUser
}

function findById(id) {
  const row = dbGet(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`,
    [id],
  )

  return normalizeRow(row)
}

function findAuthById(id) {
  const row = dbGet(
    'SELECT id, admin FROM users WHERE id = ?',
    [id],
  )

  if (!row) return null

  return { id: String(row.id), admin: Boolean(row.admin) }
}

function findByEmail(email) {
  const row = dbGet(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = ? COLLATE NOCASE`,
    [email],
  )

  return normalizeRow(row)
}

function findByEsp(esp) {
  if (!esp) return null

  const row = dbGet(
    `SELECT ${USER_COLUMNS} FROM users WHERE esp = ?`,
    [esp],
  )

  return normalizeRow(row)
}

function create({ username, email, password }) {
  return dbTransaction(() => {
    const now = new Date().toISOString()
    const result = dbRun(
      `
        INSERT INTO users (username, email, password, plant, esp, admin, created_at, updated_at)
        VALUES (?, ?, ?, '[]', '', 0, ?, ?)
      `,
      [username, email, password, now, now],
    )

    return findById(result.lastID)
  })
}

function setEsp(userId, esp) {
  return dbTransaction(() => {
    const conflict = dbGet(
      'SELECT id FROM users WHERE esp = ? AND id <> ?',
      [esp, userId],
    )

    if (conflict) {
      const error = new Error('ESP já associado a outro usuário')
      error.code = 'ESP_CONFLICT'
      throw error
    }

    const now = new Date().toISOString()
    const result = dbRun(
      'UPDATE users SET esp = ?, updated_at = ? WHERE id = ?',
      [esp, now, userId],
    )

    if (result.changes === 0) return null

    return findById(userId)
  })
}

function appendPlantReading(esp, reading, maxReadings = 100) {
  return dbTransaction(() => {
    const row = dbGet(
      'SELECT id, plant FROM users WHERE esp = ?',
      [esp],
    )

    if (!row) return null

    const plant = parsePlant(row.plant)
    const receivedAt = new Date().toISOString()

    plant.push({ ...reading, receivedAt })

    dbRun(
      'UPDATE users SET plant = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(plant.slice(-maxReadings)), receivedAt, row.id],
    )

    return findById(row.id)
  })
}

const User = {
  create,
  findById,
  findAuthById,
  findByEmail,
  findByEsp,
  setEsp,
  appendPlantReading,
  toPublic,
}

export default User
