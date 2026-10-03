import { Bell, Folder, Gift, Home, LogOut, MapPin, Menu, MessageSquare, QrCode, Ticket, UserRound, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { canAccessAdminPath } from '../../lib/roles'

const nav = [
  { to: '/admin', label: 'Inicio', icon: Home, end: true },
  { to: '/admin/ingreso', label: 'Ingreso', icon: QrCode },
  { to: '/admin/canje', label: 'Canje', icon: Gift },
  { to: '/admin/rifa', label: 'Rifa', icon: Ticket },
  { to: '/admin/charlas', label: 'Pláticas/talleres', icon: Folder },
  { to: '/admin/estudiantes', label: 'Estudiantes', icon: MessageSquare },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Bell },
  { to: '/admin/tienda', label: 'Tienda', icon: MapPin },
  { to: '/admin/perfil', label: 'Mi perfil', icon: UserRound },
]

export function AdminLayout({ token, profile, onLogout, updateProfile }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const name = profile?.full_name || 'Administrador'
  const items = nav.filter((item) => canAccessAdminPath(profile, item.to))

  return (
    <div className={`dash${menuOpen ? ' is-nav-open' : ''}`}>
      {menuOpen ? (
        <button type="button" className="dash-scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />
      ) : null}
      <aside className={`dash-side ${menuOpen ? 'is-open' : ''}`}>
        <div className="dash-avatar" aria-hidden="true">
          <Users size={36} />
        </div>
        <h1>{name}</h1>
        <p>{profile?.email}</p>
        <nav>
          {items.map((item) => {
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
        <Outlet context={{ token, profile, updateProfile }} />
      </main>
    </div>
  )
}
