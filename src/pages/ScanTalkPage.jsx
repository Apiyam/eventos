import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { StaffScanBar } from '../components/StaffScanBar'
import { StudentCredential } from '../components/StudentCredential'
import { useCodeScanner } from '../hooks/useCodeScanner'
import { api, asStudentProfile, extractStudentId, extractTalkIds, fetchStudents, mapTalk, unwrapList } from '../lib/api'
import { patchClerkPublic } from '../lib/clerk'
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
  const [ok, setOk] = useState('')

  useEffect(() => {
    fetchStudents(token, { force: true }).then(setStudents).catch((err) => setError(err.message))
    api('/talks', { token })
      .then((res) => setTalks(unwrapList(res).map(mapTalk)))
      .catch(() => setTalks([]))
  }, [token])

  const assignedIds = useMemo(() => new Set(history.map(String)), [history])
  const available = talks.filter((talk) => !assignedIds.has(talk.id))

  async function loadHistory(studentId) {
    if (!studentId) {
      setHistory([])
      return []
    }
    const res = await api(`/student-talks/${studentId}`, { token })
    const ids = extractTalkIds(res)
    setHistory(ids)
    return ids
  }

  async function openProfile(raw, list = students) {
    const found = findStudentByCode(list, raw)
    if (!found) {
      setProfile(null)
      setHistory([])
      setError('No hay un estudiante con ese NFC o código.')
      return
    }
    setError('')
    setOk('')
    setCode(raw)
    setProfile(found)
    setTalkId('')
    try {
      await loadHistory(found.student_id)
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
    const studentId = extractStudentId(profile)
    if (!studentId) {
      setError('Este registro no tiene student_id.')
      return
    }
    const talk = talks.find((item) => item.id === String(talkId))
    setBusy(true)
    setError('')
    setOk('')
    try {
      await api('/student-talks', {
        token,
        method: 'POST',
        body: { student_id: studentId, talk_id: Number(talk?.rawId || talkId) },
      })
      const ids = await loadHistory(studentId).catch(() => [...assignedIds, String(talkId)])
      const points = profile.staff ? Number(profile.points || 0) : Number(profile.points || 0) + Number(talk?.benefit || 0)
      const next = asStudentProfile({ ...profile, points, talk_ids: ids })
      setProfile(next)
      setStudents((current) => current.map((row) => (row.student_id === studentId ? next : row)))
      if (profile.clerk_user_id) {
        await patchClerkPublic(profile.clerk_user_id, {
          nfc_id: profile.nfc_id,
          student_id: studentId,
          staff: Boolean(profile.staff),
          points,
          talk_ids: ids,
        }).catch(() => {})
      }
      setTalkId('')
      setOk(`Asistencia registrada. +${talk?.benefit || 0} pts`)
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
      <p className="muted">Escanea el NFC o QR del estudiante, revisa su ficha y confirma la plática.</p>
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
          placeholder="NX-XXXX-XXXX-XXXX"
          autoCapitalize="characters"
        />
        <button className="dash-cta" type="submit">
          Buscar
        </button>
      </form>

      {scanError ? <p className="error">{scanError}</p> : null}
      {scanHint || ok ? <p className="staff-ok">{scanHint || ok}</p> : null}

      {profile ? <StudentCredential student={profile} /> : null}

      {profile ? (
        <>
          <h4>Historial de pláticas</h4>
          {historyTalks.length ? (
            <ul className="staff-history">
              {historyTalks.map((talk) => (
                <li key={talk.id}>
                  <strong>{talk.title}</strong>
                  <span>
                    {formatTime(talk.start)} · {talk.benefit} pts
                  </span>
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
                  {talk.title} · {formatTime(talk.start)} · {talk.benefit} pts
                </option>
              ))}
            </select>
          </label>
          <button className="dash-cta" type="button" disabled={busy || !talkId} onClick={acceptTalk}>
            <Check size={16} /> Aceptar y sumar puntos
          </button>
        </>
      ) : null}
    </section>
  )
}
