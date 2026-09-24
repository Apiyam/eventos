import { useEffect, useState } from 'react'
import { fetchEventStudents, fetchTalks } from '../lib/api'

export function RafflePage({ standalone = false }) {
  const [talks, setTalks] = useState([])
  const [eventId, setEventId] = useState('')
  const [students, setStudents] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [winner, setWinner] = useState(null)

  useEffect(() => {
    fetchTalks()
      .then(setTalks)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    setWinner(null)
    if (!eventId) {
      setStudents([])
      return undefined
    }
    let cancelled = false
    setBusy(true)
    setError('')
    fetchEventStudents(eventId)
      .then((list) => {
        if (!cancelled) setStudents(list)
      })
      .catch((err) => {
        if (!cancelled) {
          setStudents([])
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  function draw() {
    if (!students.length) return
    setWinner(students[Math.floor(Math.random() * students.length)])
  }

  return (
    <section className={`dash-card dash-table-wrap ${standalone ? 'raffle-page' : ''}`}>
      <div className="dash-card-head">
        <h3>Rifa</h3>
        <button className="dash-cta" type="button" disabled={!students.length} onClick={draw}>
          Sortear
        </button>
      </div>
      <label>
        Evento
        <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">Selecciona una plática o taller</option>
          {talks.map((talk) => (
            <option key={talk.id} value={talk.rawId || talk.id}>
              {talk.title}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="error">{error}</p> : null}
      {winner ? (
        <p className="staff-ok">
          {winner.enrollment_number || winner.card_number}
        </p>
      ) : null}
      {busy ? <p className="muted">Cargando inscritos…</p> : null}
      <table>
        <thead>
          <tr>
            <th>Matrícula</th>
            <th>NFC</th>
          </tr>
        </thead>
        <tbody>
          {students.map((row) => (
            <tr
              key={row.enrollment_number || row.student_id || row.id}
              className={
                winner && String(winner.enrollment_number) === String(row.enrollment_number) ? 'is-winner' : ''
              }
            >
              <td className="dash-mono">{row.enrollment_number || '—'}</td>
              <td className="dash-mono">{row.card_number || row.nfc_id || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {eventId && !busy && !students.length ? <p className="muted">No hay inscritos en este evento.</p> : null}
    </section>
  )
}
