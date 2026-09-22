import { useCallback, useEffect, useMemo, useState } from 'react'
import { EVENT } from '../data/event'
import { storage } from '../lib/storage'

export function useClock() {
  const [offsetMs, setOffsetMs] = useState(0)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date(Date.now() + offsetMs))
    }, 1000)
    return () => clearInterval(id)
  }, [offsetMs])

  const setTo = useCallback((isoTime) => {
    const target = new Date(`${EVENT.day}T${isoTime}:00`).getTime()
    const next = target - Date.now()
    storage.setDemoOffset(next)
    setOffsetMs(next)
    setNow(new Date(target))
  }, [])

  const addMinutes = useCallback((mins) => {
    setOffsetMs((current) => {
      const next = current + mins * 60000
      storage.setDemoOffset(next)
      setNow(new Date(Date.now() + next))
      return next
    })
  }, [])

  const useRealTime = useCallback(() => {
    storage.setDemoOffset(0)
    setOffsetMs(0)
    setNow(new Date())
  }, [])

  const isSimulated = useMemo(() => Math.abs(offsetMs) > 2000, [offsetMs])

  return { now, offsetMs, isSimulated, setTo, addMinutes, useRealTime }
}
