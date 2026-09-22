import { useCallback, useEffect, useState } from 'react'
import { mockApi } from '../api/mockApi'
import { storage } from '../lib/storage'

export function useAttendee() {
  const [attendee, setAttendee] = useState(() => storage.getAttendee())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    mockApi.getAttendee().then(setAttendee)
  }, [])

  const register = useCallback(async ({ name, email }) => {
    setBusy(true)
    setError('')
    try {
      const next = await mockApi.register({ name, email })
      setAttendee(next)
      return next
    } catch (err) {
      setError(err.message || 'No se pudo registrar.')
      throw err
    } finally {
      setBusy(false)
    }
  }, [])

  const checkout = useCallback(async () => {
    setBusy(true)
    await mockApi.checkout()
    setAttendee(null)
    setBusy(false)
  }, [])

  return { attendee, busy, error, register, checkout }
}
