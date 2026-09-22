const RELEASE_MINUTES = 30
const REMINDER_MINUTES = 10

export { RELEASE_MINUTES, REMINDER_MINUTES }

export function parseTalkDate(value) {
  if (value instanceof Date) return value
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] || 0),
    )
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function toDate(value) {
  return value instanceof Date ? value : parseTalkDate(value)
}

export function formatTime(value) {
  return toDate(value).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDateTime(value) {
  return toDate(value).toLocaleString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function minutesBetween(from, to) {
  return (toDate(to).getTime() - toDate(from).getTime()) / 60000
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return toDate(aStart) < toDate(bEnd) && toDate(bStart) < toDate(aEnd)
}

export function talkStatus(talk, now) {
  const start = toDate(talk.start)
  const end = toDate(talk.end)
  const current = toDate(now)
  if (current >= end) return 'ended'
  if (current >= start) return 'live'
  return 'upcoming'
}

export function canSelectTalk(talk, selectedTalks, now) {
  const status = talkStatus(talk, now)
  if (status === 'ended') {
    return { ok: false, reason: 'Finalizada' }
  }
  const clash = selectedTalks.find((other) =>
    overlaps(talk.start, talk.end, other.start, other.end),
  )
  if (clash) {
    return { ok: false, reason: 'Horario ocupado' }
  }
  if (Number(talk.enrolled || 0) >= Number(talk.maxForum || 0)) {
    return { ok: false, reason: 'Foro lleno' }
  }
  return { ok: true }
}

export function canReleaseTalk(talk, now) {
  const remaining = minutesBetween(now, talk.start)
  if (remaining < RELEASE_MINUTES) {
    return {
      ok: false,
      reason: 'Ya no se puede liberar',
    }
  }
  return { ok: true }
}

export function reminderDue(talk, now) {
  const mins = minutesBetween(now, talk.start)
  return mins > 0 && mins <= REMINDER_MINUTES
}
