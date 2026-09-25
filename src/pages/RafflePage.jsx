import { useEffect, useState } from 'react'
import { FilterableTable } from '../components/FilterableTable'
import { notifyError, notifySuccess } from '../lib/alert'
import { fetchEventStudents, fetchTalks } from '../lib/api'

export function RafflePage({ standalone = false }) {
  const [talks, setTalks] = useState([])
  const [eventId, setEventId] = useState('')
  const [students, setStudents] = useState([])
  const [busy, setBusy] = useState(false)
  const [winner, setWinner] = useState(null)

  useEffect(() => {
    fetchTalks()
      .then(setTalks)
      .catch((err) => notifyError('No se pudieron cargar las pláticas', err.message))
  }, [])

  useEffect(() => {
    setWinner(null)
    if (!eventId) {
      setStudents([])
      return undefined
    }
    let cancelled = false
    setBusy(true)
    fetchEventStudents(eventId)
      .then((list) => {
        if (!cancelled) {
          setStudents(list.filter((row) => /^A/i.test(String(row.enrollment_number || ''))))
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStudents([])
          notifyError('No se pudieron cargar los inscritos', err.message)
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  async function draw() {
    if (!students.length) return
    const picked = students[Math.floor(Math.random() * students.length)]
    setWinner(picked)
    await notifySuccess('Ganador', picked.enrollment_number || picked.card_number || '')
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
      {busy ? <p className="muted">Cargando inscritos…</p> : null}
      <FilterableTable
        rows={students}
        rowKey={(row) => row.enrollment_number || row.student_id || row.id}
        emptyText={eventId ? 'No hay inscritos en este evento.' : 'Selecciona una plática o taller.'}
        rowClassName={(row) =>
          winner && String(winner.enrollment_number) === String(row.enrollment_number) ? 'is-winner' : ''
        }
        columns={[
          { key: 'enrollment_number', label: 'Matrícula', className: 'dash-mono' },
          {
            key: 'card_number',
            label: 'NFC',
            className: 'dash-mono',
            value: (row) => row.card_number || row.nfc_id,
          },
        ]}
      />
    </section>
  )
}
