import { speakerPhoto } from '../data/event'
import { imageUrl } from '../lib/api'
import { qrImageUrl } from '../lib/nfc'
import { formatTime } from '../lib/time'
import { Check, Clock3, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'

function monthLabel(date) {
  return new Date(date).toLocaleDateString('es-MX', { month: 'long' }).toUpperCase()
}

function dayNum(date) {
  return new Date(date).toLocaleDateString('es-MX', { day: '2-digit' })
}

function monthShort(date) {
  return new Date(date).toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', '')
}

export function Agenda({ talks = [], selectedIds, attendee, onOpenRegister }) {
  const [tab, setTab] = useState('all')

  const items = useMemo(() => {
    const source = tab === 'mine' ? talks.filter((talk) => selectedIds.includes(talk.id)) : talks
    return [...source].sort((a, b) => new Date(a.start) - new Date(b.start))
  }, [selectedIds, tab, talks])

  const groups = useMemo(() => {
    const map = new Map()
    for (const talk of items) {
      const key = formatTime(talk.start)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(talk)
    }
    return [...map.entries()]
  }, [items])

  return (
    <section className="page">
      <div className="segmented">
        <button type="button" className={tab === 'all' ? 'is-active' : ''} onClick={() => setTab('all')}>
          Programa
        </button>
        <button type="button" className={tab === 'mine' ? 'is-active' : ''} onClick={() => setTab('mine')}>
          Mi día
        </button>
      </div>

      <p className="month-label">{talks[0] ? monthLabel(talks[0].start) : tab === 'mine' ? 'MI DÍA' : 'PROGRAMA'}</p>

      {attendee?.nfcId && tab === 'mine' ? (
        <article className="nfc-card">
          <img src={qrImageUrl(attendee.nfcId)} alt={`NFC ${attendee.nfcId}`} />
          <div>
            <p>Tu código único</p>
            <strong className="dash-mono">{attendee.nfcId}</strong>
            <small>Muéstralo en el ingreso a cada plática.</small>
          </div>
        </article>
      ) : null}

      {!attendee && tab === 'mine' ? (
        <p className="empty">
          <button type="button" className="btn" onClick={onOpenRegister}>
            Regístrate para ver tu día
          </button>
        </p>
      ) : null}

      {attendee && tab === 'mine' && groups.length === 0 ? (
        <p className="empty">Cuando el staff registre tu ingreso, las pláticas aparecerán aquí.</p>
      ) : null}

      {tab === 'all' && groups.length === 0 ? <p className="empty">Sin sesiones en esta vista.</p> : null}

      {groups.map(([hour, hourTalks]) => (
        <div key={hour} className="time-group">
          <p className="hour-label">{hour}</p>
          {hourTalks.map((talk) => {
            const selected = selectedIds.includes(talk.id)
            const photo = talk.image ? imageUrl(talk.image) : speakerPhoto(talk.speaker)
            return (
              <article
                key={talk.id}
                className={`cal-row is-static ${selected ? 'is-selected' : ''} ${photo ? 'has-photo' : ''}`}
              >
                <div className="cal-date">
                  <span>{monthShort(talk.start)}</span>
                  <strong>{dayNum(talk.start)}</strong>
                </div>
                {photo ? <img className="cal-avatar" src={photo} alt="" /> : null}
                <div className="cal-main">
                  <h3>{talk.title}</h3>
                  <p>
                    <Clock3 size={13} strokeWidth={1.8} />
                    {formatTime(talk.start)} – {formatTime(talk.end)}
                  </p>
                  <p>
                    {talk.speaker}
                  </p>
                  <p>
                    {talk.benefit || 0} pts
                    {selected ? ' · Registrado' : ''}
                  </p>
                </div>
                <span className={`cal-mark ${selected ? 'on' : ''}`} aria-hidden="true">
                  <Check size={16} strokeWidth={2.4} />
                </span>
              </article>
            )
          })}
        </div>
      ))}
    </section>
  )
}
