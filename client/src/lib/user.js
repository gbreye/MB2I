export function normalizeUser(user) {
  if (!user) return null

  const name =
    user.name ||
    user.username ||
    (typeof user.email === 'string' ? user.email.split('@')[0] : '') ||
    'Jardineiro'

  return {
    ...user,
    name,
    plant: Array.isArray(user.plant) ? user.plant : [],
  }
}
