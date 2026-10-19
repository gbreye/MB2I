import { EventEmitter } from 'node:events'

export const userEvents = new EventEmitter()
userEvents.setMaxListeners(0)

export function emitUserUpdate(user) {
  if (!user?.id) return

  userEvents.emit(`user:${user.id}`, user)
}
