import { Bell } from 'lucide-react'

export function Alerts({ items }) {
  if (!items.length) {
    return (
      <section className="page">
        <div className="empty-pass">
          <Bell size={32} strokeWidth={1.6} />
          <h2>Avisos</h2>
          <p className="muted">Aquí verás recordatorios de tus sesiones.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <ul className="alert-list">
        {items.map((item) => (
          <li key={item.id}>
            <Bell size={16} />
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
