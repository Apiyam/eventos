import { api, asStudentProfile, fetchTalks, imageUrl, unwrapList } from '../lib/api'
import { formatTime, parseTalkDate, talkStatus } from '../lib/time'
import { useEffect, useMemo, useState } from 'react'

function RankTable({ title, rows, start = 1 }) {
  return (
    <section className="board-table">
      <h2 className="board-block-title">{title}</h2>
      <div className="board-table-head">
        <span>Asistente</span>
        <span>PTS</span>
      </div>
      <ol>
        {rows.map((user, index) => (
          <li key={user.enrollment_number || user.student_id || user.id}>
            <em>{start + index}.</em>
            {user.image_url ? <img src={user.image_url} alt="" /> : <i />}
            <strong>{user.full_name || user.enrollment_number}</strong>
            <b>{user.points || 0}</b>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Scoreboard() {
  const [users, setUsers] = useState([])
  const [talks, setTalks] = useState([])
  const [now, setNow] = useState(() => new Date())
  const [error, setError] = useState('')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    api('/students')
      .then((res) => setUsers(unwrapList(res).map(asStudentProfile)))
      .catch((err) => setError(err.message))
    fetchTalks()
      .then(setTalks)
      .catch(() => setTalks([]))
  }, [])

  const ranking = useMemo(() => {
    return [...users]
      .filter((user) => user.enrollment_number || user.full_name)
      .sort((a, b) => Number(b.points || 0) - Number(a.points || 0))
      .slice(0, 8)
  }, [users])

  const leaders = ranking.slice(0, 4)
  const chase = ranking.slice(4, 8)

  const upcoming = useMemo(() => {
    return talks
      .filter((talk) => talkStatus(talk, now) !== 'ended')
      .sort((a, b) => parseTalkDate(a.start) - parseTalkDate(b.start))
      .slice(0, 6)
  }, [now, talks])

  const clock = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <div className="board">
      <span className="board-flare board-flare-a" />
      <span className="board-flare board-flare-b" />
      <header className="board-top">
        <div>
          <p>MOSTLA DAY 2026</p>
          <h1>Clasificación</h1>
        </div>
        <strong className="board-clock">{clock}</strong>
      </header>
      {error ? <p className="board-error">{error}</p> : null}
      <div className="board-grid">
        <div className="board-col">
          <RankTable title="Líderes" rows={leaders} start={1} />
          {chase.length ? <RankTable title="En disputa" rows={chase} start={5} /> : null}
        </div>
        <div className="board-col">
          <p className="board-kicker">Próximas charlas</p>
          <div className="board-talks">
            {upcoming.map((talk) => {
              const live = talkStatus(talk, now) === 'live'
              const photo = talk.image ? imageUrl(talk.image) : ''
              return (
                <article key={talk.id} className={`board-card ${live ? 'is-live' : ''}`}>
                  <div className="board-card-photo">
                    {photo ? <img src={photo} alt="" /> : <div className="board-card-fallback" />}
                  </div>
                  <div className="board-card-body">
                    <time>{formatTime(talk.start)}</time>
                    <h3>{talk.title}</h3>
                    {talk.speaker ? <p>{talk.speaker}</p> : null}
                    <div className="board-card-meta">
                      <span>{live ? 'En curso' : 'Próxima'}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
