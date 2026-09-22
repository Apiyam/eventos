const KEYS = {
  attendee: 'nexus.attendee',
  selection: 'nexus.selection',
  notified: 'nexus.notified',
  demoOffset: 'nexus.demoOffset',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const storage = {
  getAttendee: () => read(KEYS.attendee, null),
  setAttendee: (value) => write(KEYS.attendee, value),
  clearAttendee: () => localStorage.removeItem(KEYS.attendee),

  getSelection: () => read(KEYS.selection, []),
  setSelection: (ids) => write(KEYS.selection, ids),

  getNotified: () => read(KEYS.notified, []),
  setNotified: (ids) => write(KEYS.notified, ids),

  getDemoOffset: () => {
    const stored = read(KEYS.demoOffset, null)
    return typeof stored === 'number' ? stored : null
  },
  setDemoOffset: (ms) => write(KEYS.demoOffset, ms),
}
