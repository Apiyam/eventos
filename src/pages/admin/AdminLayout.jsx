import { Bell, Folder, Gift, Home, LogOut, MapPin, Menu, MessageSquare, QrCode, Ticket, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const nav = [
  { to: '/admin', label: 'Inicio', icon: Home, end: true },
  { to: '/admin/ingreso', label: 'Ingreso', icon: QrCode },
  { to: '/admin/canje', label: 'Canje', icon: Gift },
  { to: '/admin/rifa', label: 'Rifa', icon: Ticket },
  { to: '/admin/charlas', label: 'Charlas', icon: Folder },
  { to: '/admin/estudiantes', label: 'Estudiantes', icon: MessageSquare },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Bell },
  { to: '/admin/tienda', label: 'Tienda', icon: MapPin },
]

export function AdminLayout({ token, profile, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const name = profile?.full_name || 'Administrador'

  return (
    <div className="dash">
      <aside className={`dash-side ${menuOpen ? 'is-open' : ''}`}>
        <div className="dash-avatar" aria-hidden="true">
          <Users size={36} />
        </div>
        <h1>{name}</h1>
        <p>{profile?.email}</p>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : '')}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} /> {item.label}
              </NavLink>
            )
          })}
        </nav>
        <button type="button" className="dash-out" onClick={onLogout}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </aside>

      <main className="dash-main">
        <header className="dash-top">
          <h2>Panel de control</h2>
          <button type="button" className="dash-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menú">
            <Menu size={22} />
          </button>
        </header>
        <Outlet context={{ token, profile }} />
      </main>
    </div>
  )
}
