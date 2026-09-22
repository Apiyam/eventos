import { useClerk, useUser } from '@clerk/clerk-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, localStudent, registerStudent, writeStudentCache, unwrapUser } from '../lib/api'
import { patchClerkPublic } from '../lib/clerk'

export function useStudent() {
  const { isSignedIn, isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const [student, setStudentState] = useState(null)
  const [error, setError] = useState('')
  const syncOnce = useRef('')

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      setStudentState(null)
      syncOnce.current = ''
      return
    }
    const meta = user.publicMetadata || {}
    const next = localStudent(user, {
      nfc_id: meta.nfc_id,
      student_id: meta.student_id,
      staff: Boolean(meta.staff),
      points: meta.staff ? 0 : meta.points,
      talk_ids: Array.isArray(meta.talk_ids) ? meta.talk_ids.map(String) : undefined,
    })
    setStudentState(next)
    setError('')
    if ((!meta.nfc_id || !meta.student_id) && syncOnce.current !== user.id) {
      syncOnce.current = user.id
      registerStudent(user.id, {
        ...meta,
        full_name: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
      })
        .then((student) => {
          writeStudentCache(user.id, student)
          return user.reload()
        })
        .catch((err) => setError(err.message))
    } else if (next.nfc_id && next.student_id) {
      writeStudentCache(user.id, next)
    }
  }, [isLoaded, isSignedIn, user])

  useEffect(() => {
    if (!user) return undefined
    const onFocus = () => {
      user.reload().catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user])

  const setStudent = useCallback((value) => {
    setStudentState((current) => {
      const next = typeof value === 'function' ? value(current) : value
      if (next?.clerk_user_id) {
        writeStudentCache(next.clerk_user_id, next)
        if (!next.staff) {
          patchClerkPublic(next.clerk_user_id, {
            points: next.points || 0,
            nfc_id: next.nfc_id,
            student_id: next.student_id || next.id || 0,
            talk_ids: next.talk_ids || [],
          }).catch(() => {})
        }
      }
      return next
    })
  }, [])

  const attendee = useMemo(() => {
    if (!student || !user) return null
    return {
      id: student.id,
      studentId: student.student_id || student.id,
      clerkId: student.clerk_user_id,
      name: student.full_name || user.fullName || 'Asistente',
      email: student.email || user.primaryEmailAddress?.emailAddress || '',
      nfcId: student.nfc_id,
      points: student.staff ? Number.POSITIVE_INFINITY : student.points ?? 0,
      staff: Boolean(student.staff),
      talkIds: (student.talk_ids || []).map(String),
    }
  }, [student, user])

  const checkout = useCallback(async () => {
    await signOut()
    setStudent(null)
  }, [signOut])

  return { attendee, student, setStudent, error, ready: isLoaded, signedIn: Boolean(isSignedIn), checkout }
}

export function useAdminSession() {
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    api('/auth/profile')
      .then((res) => {
        if (!cancelled) setProfile(unwrapUser(res))
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password } })
    const nextUser = unwrapUser(res)
    if (!nextUser?.id && !nextUser?.email) throw new Error('Login incompleto')
    setProfile(nextUser)
    setReady(true)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setProfile(null)
  }, [])

  return { token: '', profile, ready, login, logout }
}

export function clerkEnabled() {
  return Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
}
