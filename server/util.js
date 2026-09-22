import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const next = scryptSync(password, salt, 64)
  return timingSafeEqual(Buffer.from(hash, 'hex'), next)
}

export function nfcId() {
  const hex = randomBytes(6).toString('hex').toUpperCase()
  return `NX-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

export function talkWindow(talk) {
  const start = new Date(talk.start_time.replace(' ', 'T'))
  const end = new Date(start.getTime() + Number(talk.duration) * 60000)
  return { start, end }
}

export function publicUser(user) {
  const { password_hash, ...rest } = user
  return rest
}
