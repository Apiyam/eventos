import { Nfc } from 'lucide-react'

function initials(student) {
  const name = student?.full_name || student?.enrollment_number
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
  const name = student.full_name || student.enrollment_number || 'Asistente'
  const card = student.card_number || student.nfc_id || 'Sin NFC'
  return (
    <article className="id-card">
      <header className="id-card-band">
        <span>MOSTLA DAY 2026</span>
        <em>ASISTENTE</em>
      </header>
      <div className="id-card-body">
        <div className="id-card-photo">
          {student.image_url ? <img src={student.image_url} alt="" /> : <span>{initials(student)}</span>}
        </div>
        <div className="id-card-meta">
          <h3>{name}</h3>
          <p>{student.enrollment_number || 'Sin matrícula'}</p>
          <p className="id-card-nfc">
            <Nfc size={14} />
            {card}
          </p>
        </div>
      </div>
    </article>
  )
}
