import { useEffect, useMemo, useState } from 'react'
import { CheckInModal } from '../components/CheckInModal'
import { StaffScanBar } from '../components/StaffScanBar'
import { StudentCredential } from '../components/StudentCredential'
import { useCodeScanner } from '../hooks/useCodeScanner'
import {
  asStudentProfile,
  extractStudentId,
  fetchStudentTalks,
  fetchStudents,
  fetchTalks,
  registerTalkAttendance,
} from '../lib/api'
import { findStudentByCode } from '../lib/nfc'
import { formatTime } from '../lib/time'

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

  useEffect(() => {
    fetchStudents(token, { force: true }).then(setStudents).catch((err) => setError(err.message))
    fetchTalks()
      .then(setTalks)
      .catch((err) => setError(err.message))
  }, [token])

  const assignedIds = useMemo(() => new Set(history.map(String)), [history])
  const available = talks.filter((talk) => !assignedIds.has(talk.id))

  async function loadHistory(student) {
    const ids = await fetchStudentTalks(student)
    setHistory(ids)
    return ids
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
      setHistory(found.talk_ids || [])
      setError(err.message)
    }
  }

  const { videoRef, scanning, scanError, scanHint, startCamera, startNfc, canDetectQr } = useCodeScanner((next) => {
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
      const ids = await loadHistory(profile).catch(() => [...assignedIds, String(talkId)])
      const next = asStudentProfile({ ...profile, talk_ids: ids })
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

  const historyTalks = talks.filter((talk) => assignedIds.has(talk.id))

  return (
    <section className="dash-card staff-panel">
      <h3>Ingreso a plática</h3>
      <p className="muted">Escanea el NFC o QR del estudiante y confirma la plática.</p>
      <StaffScanBar
        videoRef={videoRef}
        scanning={scanning}
        canDetectQr={canDetectQr}
        onScanQr={startCamera}
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
          {historyTalks.length ? (
            <ul className="staff-history">
              {historyTalks.map((talk) => (
                <li key={talk.id}>
                  <strong>{talk.title}</strong>
                  <span>{formatTime(talk.start)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Aún no tiene pláticas registradas.</p>
          )}

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
        </>
      ) : null}
      <CheckInModal open={accepted} onClose={() => setAccepted(false)} />
    </section>
  )
}
