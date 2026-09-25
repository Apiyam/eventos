import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  api,
  createStudentRecord,
  getAdminProfile,
  getAdminToken,
  getStudentEnrollment,
  loginStudentByEnrollment,
  setAdminProfile,
  setAdminToken,
  setStudentEnrollment,
  unwrapToken,
  unwrapUser,
} from '../lib/api'

export function useStudent() {
  const [student, setStudent] = useState(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  const hydrate = useCallback(async (enrollment) => {
    const next = await loginStudentByEnrollment(enrollment)
    setStudent(next)
    setStudentEnrollment(next.enrollment_number)
    setError('')
    return next
  }, [])

  useEffect(() => {
    const enrollment = getStudentEnrollment()
    if (!enrollment) {
      setReady(true)
      return undefined
    }
    let cancelled = false
    hydrate(enrollment)
      .catch(() => {
        if (!cancelled) {
          setStudentEnrollment('')
          setStudent(null)
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [hydrate])

  const login = useCallback(
    async (enrollment) => {
      setError('')
      return hydrate(enrollment)
    },
    [hydrate],
  )

  const register = useCallback(
    async ({ enrollment_number, card_number }) => {
      setError('')
      const created = await createStudentRecord({
        enrollment_number: String(enrollment_number || '').trim(),
        card_number: String(card_number || '').trim(),
      })
      try {
        return await hydrate(enrollment_number)
      } catch {
        setStudent(created)
        setStudentEnrollment(created.enrollment_number)
        return created
      }
    },
    [hydrate],
  )

  const checkout = useCallback(() => {
    setStudentEnrollment('')
    setStudent(null)
  }, [])

  const attendee = useMemo(() => {
    if (!student) return null
    return {
      id: student.id,
      studentId: student.student_id || student.id,
      name: student.full_name || student.enrollment_number || 'Estudiante',
      enrollment: student.enrollment_number,
      nfcId: student.card_number || student.nfc_id,
      points: student.points ?? 0,
      talkIds: (student.talk_ids || []).map(String),
    }
  }, [student])

  return { attendee, student, setStudent, error, ready, signedIn: Boolean(student), login, register, checkout }
}

export function useAdminSession() {
  const [token, setToken] = useState(() => getAdminToken())
  const [profile, setProfile] = useState(() => getAdminProfile())
  const [ready, setReady] = useState(() => Boolean(getAdminProfile()))

  useEffect(() => {
    let cancelled = false
    const stored = getAdminToken()
    const cached = getAdminProfile()
    if (!stored && !cached) {
      setReady(true)
      return undefined
    }
    setReady(true)
    api('/auth/profile', { token: stored })
      .then((res) => {
        if (cancelled) return
        const user = unwrapUser(res)
        if (user?.id || user?.email) {
          setProfile(user)
          setAdminProfile(user)
        }
      })
      .catch(() => {
        if (!cancelled && !cached) {
          setAdminToken('')
          setAdminProfile(null)
          setToken('')
          setProfile(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password } })
    const nextUser = unwrapUser(res)
    if (!nextUser?.id && !nextUser?.email) throw new Error('Login incompleto')
    const nextToken = unwrapToken(res)
    setAdminToken(nextToken)
    setAdminProfile(nextUser)
    setToken(nextToken)
    setProfile(nextUser)
    setReady(true)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST', token }).catch(() => {})
    setAdminToken('')
    setAdminProfile(null)
    setToken('')
    setProfile(null)
  }, [token])

  return { token, profile, ready, login, logout }
}
