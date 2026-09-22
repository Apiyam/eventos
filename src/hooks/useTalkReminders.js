import { useEffect, useRef } from 'react'
import { storage } from '../lib/storage'
import { formatTime, reminderDue } from '../lib/time'

export function useTalkReminders(selectedTalks, now, onToast) {
  const notifiedRef = useRef(new Set(storage.getNotified()))

  useEffect(() => {
    for (const talk of selectedTalks) {
      if (!reminderDue(talk, now)) continue
      if (notifiedRef.current.has(talk.id)) continue

      notifiedRef.current.add(talk.id)
      storage.setNotified([...notifiedRef.current])

      const body = formatTime(talk.start)
      onToast({
        id: `remind-${talk.id}`,
        title: talk.title,
        body,
      })

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(talk.title, { body })
      }
    }
  }, [now, onToast, selectedTalks])
}
