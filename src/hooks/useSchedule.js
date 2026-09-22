import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, extractTalkIds, mapTalk, unwrapList } from '../lib/api'

export function useSchedule(now, student, setStudent) {
  const [talks, setTalks] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const studentId = student?.student_id || student?.id

  useEffect(() => {
    api('/talks')
      .then((res) => setTalks(unwrapList(res).map(mapTalk)))
      .catch(() => setTalks([]))
  }, [])

  useEffect(() => {
    if (!studentId) return undefined
    let cancelled = false
    api(`/student-talks/${studentId}`)
      .then((res) => {
        if (cancelled) return
        const ids = extractTalkIds(res)
        setStudent((current) => {
          if (!current) return current
          const prev = (current.talk_ids || []).map(String)
          if (prev.join('|') === ids.join('|')) return current
          return { ...current, talk_ids: ids }
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [setStudent, studentId])

  const selectedIds = useMemo(() => (student?.talk_ids || []).map(String), [student])

  const selectedTalks = useMemo(
    () => talks.filter((talk) => selectedIds.includes(talk.id)),
    [selectedIds, talks],
  )

  const toggleTalk = useCallback(async () => {
    setMessage('El registro de pláticas lo hace el staff en el evento.')
    return { ok: false, reason: 'El registro de pláticas lo hace el staff en el evento.' }
  }, [])

  return { talks, selectedIds, selectedTalks, toggleTalk, message, busy, setBusy, now }
}
