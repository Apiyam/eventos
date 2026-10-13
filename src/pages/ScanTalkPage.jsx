import { useEffect, useState } from 'react'
import { CheckInModal } from '../components/CheckInModal'
import { StaffScanBar } from '../components/StaffScanBar'
import { StudentCredential } from '../components/StudentCredential'
import { useCodeScanner } from '../hooks/useCodeScanner'
import { ActivationGroups } from '../components/ActivationGroups'
import {
  asStudentProfile,
  extractStudentId,
  fetchStudentActivations,
  fetchStudents,
  fetchTalks,
  registerTalkAttendance,
} from '../lib/api'
import { findStudentByCode } from '../lib/nfc'
import { formatTime, talkStatus } from '../lib/time'

export function ScanTalkPage({ token }) {
  const [students, setStudents] = useState([])
  const [talks, setTalks] = useState([])
  const [code, setCode] = useState('')
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [talkId, setTalkId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    fetchStudents(token).then(setStudents).catch((err) => setError(err.message))
    fetchTalks()
      .then(setTalks)
      .catch((err) => setError(err.message))
  }, [token])

  const available = talks.filter((talk) => talkStatus(talk, now) !== 'ended')

  function loadHistory(student) {
    const rows = fetchStudentActivations(student)
    setHistory(rows)
    return rows
  }

  async function openProfile(raw, list = students) {
    const found = findStudentByCode(list, raw)
    if (!found) {
      setProfile(null)
      setHistory([])
      setError('No hay un estudiante con ese NFC o matrícula.')
      return
    }
    setError('')
    setCode(raw)
    setProfile(found)
    setTalkId('')
    try {
      await loadHistory(found)
    } catch (err) {
      setHistory(fetchStudentActivations(found))
      setError(err.message)
    }
  }

  const { videoRef, scanning, scanError, scanHint, startCamera, stopCamera, startNfc } = useCodeScanner((next) => {
    setCode(next)
    openProfile(next)
  })

  async function acceptTalk() {
    if (!profile || !talkId) return
    const talk = talks.find((item) => item.id === String(talkId))
    if (!extractStudentId(profile) && !profile.enrollment_number) {
      setError('Este registro no tiene matrícula.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await registerTalkAttendance(profile, talk?.rawId || talkId)
      const rows = [...history, { talkId: String(talkId), at: '', index: history.length }]
      const next = asStudentProfile({
        ...profile,
        talks: [...(profile.talks || []), { id: talk?.rawId || talkId, name: talk?.title, created_at: new Date().toISOString() }],
      })
      setHistory(rows)
      setProfile(next)
      setStudents((current) => current.map((row) => (row.student_id === next.student_id ? next : row)))
      setTalkId('')
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
    setTalkId('')
    setCode('')
    setError('')
  }

  return (
    <section className="dash-card staff-panel">
      <h3>Ingreso a plática</h3>
      <p className="muted">Escanea el NFC o QR del estudiante y confirma la plática.</p>
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
          openProfile(code)
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
          <h4>Historial de pláticas</h4>
          <ActivationGroups
            activations={history}
            talks={talks}
            empty="Aún no tiene pláticas registradas."
          />

          <div className="staff-confirm">
            <label>
              Plática
              <select value={talkId} onChange={(e) => setTalkId(e.target.value)}>
                <option value="">Selecciona una plática</option>
                {available.map((talk) => (
                  <option key={talk.id} value={talk.id}>
                    {talk.title} · {formatTime(talk.start)}
                  </option>
                ))}
              </select>
            </label>
            <button className="dash-cta" type="button" disabled={busy || !talkId} onClick={acceptTalk}>
              Registrar entrada
            </button>
          </div>
        </>
      ) : null}
      <CheckInModal open={accepted} onClose={clearStudent} />
    </section>
  )
}
