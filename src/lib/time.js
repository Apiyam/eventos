const RELEASE_MINUTES = 30
const REMINDER_MINUTES = 10

export { RELEASE_MINUTES, REMINDER_MINUTES }

function pad(n) {
  return String(n).padStart(2, '0')
}

function wallClock(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
      hour: value.getHours(),
      minute: value.getMinutes(),
      second: value.getSeconds(),
    }
  }
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
      second: Number(match[6] || 0),
    }
  }
  return null
}

export function parseTalkDate(value) {
  if (value instanceof Date) return value
  const clock = wallClock(value)
  if (clock) {
    return new Date(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second)
  }
  const parsed = new Date(String(value || '').trim())
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function toWallClockString(value) {
  const clock = wallClock(value) || wallClock(parseTalkDate(value))
  if (!clock) return ''
  return `${clock.year}-${pad(clock.month)}-${pad(clock.day)} ${pad(clock.hour)}:${pad(clock.minute)}:${pad(clock.second)}`
}

export function toDate(value) {
  return value instanceof Date ? value : parseTalkDate(value)
}

export function formatTime(value) {
  const clock = wallClock(value) || wallClock(parseTalkDate(value))
  if (!clock) return ''
  const period = clock.hour >= 12 ? 'PM' : 'AM'
  const hour12 = clock.hour % 12 || 12
  return `${pad(hour12)}:${pad(clock.minute)} ${period}`
}

export function formatDateTime(value) {
  const clock = wallClock(value) || wallClock(parseTalkDate(value))
  if (!clock) return ''
  return `${pad(clock.day)}/${pad(clock.month)}/${clock.year} ${formatTime(value)}`
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
