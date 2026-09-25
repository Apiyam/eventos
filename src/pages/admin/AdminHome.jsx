import { Star, ThumbsUp, Trophy, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { notifyError } from '../../lib/alert'
import { fetchStudents, fetchTalks } from '../../lib/api'

export function AdminHome() {
  const { token } = useOutletContext()
  const [students, setStudents] = useState([])
  const [talks, setTalks] = useState([])
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    Promise.all([fetchStudents(token, { force: true }), fetchTalks(token)])
      .then(([nextStudents, nextTalks]) => {
        if (cancelled) return
        setStudents(nextStudents)
        setTalks(nextTalks)
      })
      .catch((err) => {
        if (!cancelled) notifyError('No se pudo cargar el inicio', err.message)
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const ranking = useMemo(
    () =>
      [...students]
        .sort((a, b) => Number(b.points || 0) - Number(a.points || 0))
        .slice(0, 8),
    [students],
  )
  const maxPoints = Math.max(1, ...ranking.map((row) => Number(row.points || 0)))
  const totalPoints = students.reduce((sum, row) => sum + Number(row.points || 0), 0)
  const enrolled = talks.reduce((sum, talk) => sum + Number(talk.enrolled || 0), 0)
  const capacity = talks.reduce((sum, talk) => sum + Number(talk.maxForum || 0), 0)
  const occupancy = capacity ? Math.round((enrolled / capacity) * 100) : 0

  return (
    <>
      <section className="dash-kpis">
        <article className="kpi">
          <span>
            Estudiantes <Users size={16} />
          </span>
          <strong>{busy ? '…' : students.length}</strong>
        </article>
        <article className="kpi">
          <span>
            Inscripciones <ThumbsUp size={16} />
          </span>
          <strong>{busy ? '…' : enrolled}</strong>
        </article>
        <article className="kpi">
          <span>
            Puntos <Trophy size={16} />
          </span>
          <strong>{busy ? '…' : totalPoints}</strong>
        </article>
        <article className="kpi kpi-dark">
          <span>
            Ocupación <Star size={16} />
          </span>
          <strong>{busy ? '…' : `${occupancy}%`}</strong>
        </article>
      </section>

      <section className="dash-charts">
        <article className="dash-card">
          <div className="dash-card-head">
            <h3>Top estudiantes</h3>
            <span>{ranking.length} líderes</span>
          </div>
          {ranking.length ? (
            <ol className="rank-list">
              {ranking.map((row, index) => {
                const points = Number(row.points || 0)
                const width = Math.max(6, (points / maxPoints) * 100)
                return (
                  <li key={row.enrollment_number || row.student_id || row.id} className="rank-row">
                    <em>{index + 1}</em>
                    <div>
                      <div className="rank-meta">
                        <strong>{row.full_name || row.enrollment_number || 'Estudiante'}</strong>
                        <small>{row.enrollment_number || '—'}</small>
                      </div>
                      <div className="rank-track">
                        <span className="rank-fill" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                    <b>{points}</b>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="muted">{busy ? 'Cargando…' : 'Aún no hay estudiantes con puntos.'}</p>
          )}
        </article>

        <article className="dash-card">
          <div className="dash-card-head">
            <h3>Charlas</h3>
            <span>{talks.length} sesiones</span>
          </div>
          <TalkBars talks={talks} />
        </article>
      </section>
    </>
  )
}

function TalkBars({ talks }) {
  const rows = talks.slice(0, 8)
  const max = Math.max(1, ...rows.map((talk) => Number(talk.enrolled || 0)))
  if (!rows.length) return <p className="muted">Sin charlas todavía.</p>
  return (
    <div className="bars">
      {rows.map((talk, index) => (
        <div key={talk.id} className="bar">
          <span
            className={index % 2 ? 'gold' : 'navy'}
            style={{ height: `${Math.max(12, (Number(talk.enrolled || 0) / max) * 100)}%` }}
          />
          <small>{String(talk.title || '').slice(0, 8)}</small>
        </div>
      ))}
    </div>
  )
}
