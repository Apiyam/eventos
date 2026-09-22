import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { useMemo, useState } from 'react'

const WEEK = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO']
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function parseApiDate(value) {
  if (!value) return new Date(2026, 9, 13, 10, 0)
  const [date, time = '10:00:00'] = String(value).split(' ')
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm)
}

export function toApiDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

function startOfGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const weekday = (first.getDay() + 6) % 7
  first.setDate(first.getDate() - weekday)
  return first
}

export function DateTimePicker({ value, onChange }) {
  const selected = parseApiDate(value)
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1))

  const days = useMemo(() => {
    const start = startOfGrid(cursor)
    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      return day
    })
  }, [cursor])

  const label = selected.toLocaleString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  function pickDay(day) {
    const next = new Date(selected)
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate())
    onChange(toApiDate(next))
  }

  function pickTime(part, amount) {
    const next = new Date(selected)
    if (part === 'h') next.setHours(amount)
    if (part === 'm') next.setMinutes(amount)
    onChange(toApiDate(next))
  }

  return (
    <div className="dtp">
      <button type="button" className="dtp-trigger" onClick={() => setOpen((v) => !v)}>
        <Clock3 size={16} />
        {label}
      </button>
      {open ? (
        <div className="dtp-pop">
          <div className="dtp-nav">
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <strong>
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </strong>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="dtp-week">
            {WEEK.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="dtp-grid">
            {days.map((day) => {
              const outside = day.getMonth() !== cursor.getMonth()
              const isSel =
                day.getDate() === selected.getDate() &&
                day.getMonth() === selected.getMonth() &&
                day.getFullYear() === selected.getFullYear()
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`${outside ? 'is-out' : ''} ${isSel ? 'is-sel' : ''}`}
                  onClick={() => pickDay(day)}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
          <div className="dtp-time">
            <label>
              Hora
              <select value={selected.getHours()} onChange={(e) => pickTime('h', Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Min
              <select value={selected.getMinutes()} onChange={(e) => pickTime('m', Number(e.target.value))}>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="dash-cta" onClick={() => setOpen(false)}>
              Listo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
