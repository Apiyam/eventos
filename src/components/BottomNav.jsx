import { CalendarDays, Radio, ShoppingBag } from 'lucide-react'

export function BottomNav({ view, onChange }) {
  const items = [
    { id: 'home', label: 'Evento', icon: Radio },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays },
    { id: 'store', label: 'Tienda', icon: ShoppingBag },
  ]

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon
        const active = view === item.id
        return (
          <button
            key={item.id}
            type="button"
            className={active ? 'is-active' : ''}
            onClick={() => onChange(item.id)}
          >
            <span className="nav-icon">
              <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
            </span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
