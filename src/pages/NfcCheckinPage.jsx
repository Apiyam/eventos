import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ActivationGroups } from '../components/ActivationGroups'
import { CheckInModal } from '../components/CheckInModal'
import { StaffScanBar } from '../components/StaffScanBar'
import { StudentCredential } from '../components/StudentCredential'
import { useCodeScanner } from '../hooks/useCodeScanner'
import {
  asStudentProfile,
  extractStudentId,
  fetchStudentActivations,
  fetchStudents,
  fetchTalks,
  getAdminProfile,
  registerTalkAttendance,
} from '../lib/api'
import { findStudentByCode, findTalkByCode, normalizeScanCode } from '../lib/nfc'
import { roleKey } from '../lib/roles'
import { formatTime, talkStatus } from '../lib/time'

export function NfcCheckinPage() {
  const { code: routeCode } = useParams()
  const navigate = useNavigate()
  const staffRole = roleKey(getAdminProfile())
  const initialCode = normalizeScanCode(routeCode || '')
  const [students, setStudents] = useState([])
  const [talks, setTalks] = useState([])
  const [code, setCode] = useState(initialCode)
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [talkId, setTalkId] = useState('')
  const [lockedTalk, setLockedTalk] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!initialCode || staffRole !== 'tienda') return
    navigate(`/admin/canje?code=${encodeURIComponent(initialCode)}`, { replace: true })
  }, [initialCode, navigate, staffRole])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchStudents().catch(() => []),
      fetchTalks(),
    ])
      .then(([list, nextTalks]) => {
        if (cancelled) return
        setStudents(list)
        setTalks(nextTalks)
        resolveCode(initialCode, list, nextTalks)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'No se pudieron cargar las pláticas')
      })
    return () => {
      cancelled = true
    }
  }, [initialCode])

  const available = talks.filter((talk) => talkStatus(talk, now) !== 'ended')

  function loadHistory(student) {
    const rows = fetchStudentActivations(student)
    setHistory(rows)
    return rows
  }

  async function openStudent(raw, list = students) {
    const found = findStudentByCode(list, raw)
    if (!found) {
      setProfile(null)
      setHistory([])
      setError('No hay un estudiante con ese NFC o matrícula.')
      return null
    }
    setError('')
    setCode(raw)
    setProfile(found)
    try {
      await loadHistory(found)
    } catch (err) {
      setHistory(fetchStudentActivations(found))
      setError(err.message)
    }
    return found
  }

  function resolveCode(raw, list = students, nextTalks = talks) {
    const needle = normalizeScanCode(raw)
    if (!needle) return
    const talk = findTalkByCode(nextTalks, needle)
    if (talk) {
      setLockedTalk(talk)
      setTalkId(talk.id)
      setError('')
      return
    }
    openStudent(needle, list)
  }

  const { videoRef, scanning, scanError, scanHint, startCamera, stopCamera, startNfc } = useCodeScanner((next) => {
    setCode(next)
    const talk = findTalkByCode(talks, next)
    if (talk && !profile) {
      setLockedTalk(talk)
      setTalkId(talk.id)
      setError('')
      return
    }
    openStudent(next)
  })

  async function acceptTalk() {
    const selected = lockedTalk || talks.find((item) => item.id === String(talkId))
    if (!profile || !selected) return
    if (!extractStudentId(profile) && !profile.enrollment_number) {
      setError('Este registro no tiene matrícula.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await registerTalkAttendance(profile, selected.rawId || selected.id)
      const next = asStudentProfile({
        ...profile,
        talks: [
          ...(profile.talks || []),
          { id: selected.rawId || selected.id, name: selected.title, created_at: new Date().toISOString() },
        ],
      })
      setHistory([...history, { talkId: String(selected.id), at: next.talks.at(-1)?.created_at || '', index: history.length }])
      setProfile(next)
      setStudents((current) =>
        current.map((row) => (row.student_id === next.student_id ? next : row)),
      )
      if (!lockedTalk) setTalkId('')
      setAccepted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function clearStudent() {
    setAccepted(false)
    setProfile(null)
    setHistory([])
    setCode('')
    setError('')
    if (!lockedTalk) setTalkId('')
  }

  const selectedTalkId = lockedTalk?.id || talkId

  return (
    <div className="nfc-gate">
      <header className="nfc-gate-top">
        <p>MOSTLA DAY 2026</p>
        <h1>Entrada a plática</h1>
        {lockedTalk ? <strong>{lockedTalk.title}</strong> : null}
      </header>

      <section className="dash-card staff-panel nfc-gate-card">
        <p className="muted">Escanea el NFC o QR del estudiante y confirma el ingreso.</p>
        <StaffScanBar
          videoRef={videoRef}
          scanning={scanning}
          onScanQr={startCamera}
          onStopQr={stopCamera}
          onScanNfc={startNfc}
        />
        <form
          className="staff-lookup"
          onSubmit={(event) => {
            event.preventDefault()
            openStudent(code)
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="NFC, QR o matrícula"
            autoCapitalize="characters"
          />
          <button className="dash-cta" type="submit">
            Buscar
          </button>
        </form>

        {scanError ? <p className="error">{scanError}</p> : null}
        {scanHint ? <p className="staff-ok">{scanHint}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {profile ? <StudentCredential student={profile} /> : null}

        {profile ? (
          <>
            <h3>Pláticas registradas</h3>
            <ActivationGroups
              activations={history}
              talks={talks}
              empty="Aún no tiene pláticas registradas."
            />

            <div className="staff-confirm">
              {lockedTalk ? (
                <p className="nfc-gate-talk">Plática: {lockedTalk.title}</p>
              ) : (
                <label>
                  <h3>Registrar entrada</h3>
                  <select value={talkId} onChange={(e) => setTalkId(e.target.value)}>
                    <option value="">Selecciona una plática</option>
                    {available.map((talk) => (
                      <option key={talk.id} value={talk.id}>
                        {talk.title} · {formatTime(talk.start)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button className="dash-cta" type="button" disabled={busy || !selectedTalkId} onClick={acceptTalk}>
                Registrar entrada
              </button>
            </div>
          </>
        ) : null}
      </section>

      <CheckInModal open={accepted} onClose={clearStudent} />
    </div>
  )
}
