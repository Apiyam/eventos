import { EVENT, TALKS } from '../data/event'
import { storage } from '../lib/storage'

const wait = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms))

function makeNfcId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `NX-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`
}

export const mockApi = {
  async getEvent() {
    await wait(120)
    return EVENT
  },

  async getTalks() {
    await wait(180)
    return TALKS
  },

  async register({ name, email }) {
    await wait(420)
    const attendee = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      nfcId: makeNfcId(),
      createdAt: new Date().toISOString(),
    }
    storage.setAttendee(attendee)
    storage.setSelection([])
    storage.setNotified([])
    return attendee
  },

  async getAttendee() {
    await wait(80)
    return storage.getAttendee()
  },

  async saveAgenda(talkIds) {
    await wait(220)
    storage.setSelection(talkIds)
    return { ok: true, talkIds }
  },

  async checkout() {
    await wait(160)
    storage.clearAttendee()
    storage.setSelection([])
    storage.setNotified([])
    return { ok: true }
  },
}
