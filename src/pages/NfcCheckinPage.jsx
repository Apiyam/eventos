import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
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
import { findStudentByCode, findTalkByCode, normalizeScanCode } from '../lib/nfc'
import { formatTime } from '../lib/time'

export function NfcCheckinPage() {
  const { code: routeCode } = useParams()
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

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchStudents(undefined, { force: true }).catch(() => []),
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

  const assignedIds = useMemo(() => new Set(history.map(String)), [history])
  const available = talks.filter((talk) => !assignedIds.has(talk.id))

  async function loadHistory(student) {
    const ids = await fetchStudentTalks(student)
    setHistory(ids)
    return ids
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
      setHistory(found.talk_ids || [])
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

  const { videoRef, scanning, scanError, scanHint, startCamera, startNfc, canDetectQr } = useCodeScanner((next) => {
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
      const ids = await loadHistory(profile).catch(() => [...assignedIds, String(selected.id)])
      const next = asStudentProfile({ ...profile, talk_ids: ids })
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

  const historyTalks = talks.filter((talk) => assignedIds.has(talk.id))
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
          canDetectQr={canDetectQr}
          onScanQr={startCamera}
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

            {lockedTalk ? (
              <p className="nfc-gate-talk">Plática: {lockedTalk.title}</p>
            ) : (
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
            )}
            <button className="dash-cta" type="button" disabled={busy || !selectedTalkId} onClick={acceptTalk}>
              Registrar entrada
            </button>
          </>
        ) : null}
      </section>

      <CheckInModal open={accepted} onClose={() => setAccepted(false)} />
    </div>
  )
}
