import { Nfc } from 'lucide-react'

function initials(student) {
  const name = student?.full_name || [student?.first_name, student?.last_name].filter(Boolean).join(' ')
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'MD'
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function StudentCredential({ student }) {
  if (!student) return null
  const name = student.full_name || [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Asistente'
  return (
    <article className={`id-card ${student.staff ? 'is-staff' : ''}`}>
      <header className="id-card-band">
        <span>MOSTLA DAY 2026</span>
        <em>{student.staff ? 'STAFF' : 'ASISTENTE'}</em>
      </header>
      <div className="id-card-body">
        <div className="id-card-photo">
          {student.image_url ? <img src={student.image_url} alt="" /> : <span>{initials(student)}</span>}
        </div>
        <div className="id-card-meta">
          <h3>{name}</h3>
          <p>{student.email || 'Sin correo'}</p>
          <p className="id-card-nfc">
            <Nfc size={14} />
            {student.nfc_id || 'Sin NFC'}
          </p>
          <div className="id-card-stats">
            <span>ID {student.student_id || '—'}</span>
            <b>{student.staff ? '∞ pts' : `${student.points || 0} pts`}</b>
          </div>
        </div>
      </div>
    </article>
  )
}
