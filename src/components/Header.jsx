import { UserButton, useUser } from '@clerk/clerk-react'
import { Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Header({ attendee, onMenu, site }) {
  const navigate = useNavigate()
  const { isSignedIn } = useUser()

  return (
    <header className={site ? 'top-bar site-bar' : 'top-bar'}>
      <button type="button" className="icon-btn" onClick={onMenu} aria-label="Menú">
        <Menu size={22} strokeWidth={1.8} />
      </button>
      <button type="button" className="logo" onClick={() => navigate('/')}>
        <img src="/landing/mostla-header.png" alt="MOSTLA DAY" />
      </button>
      {site ? (
        <nav className="site-links">
          <button type="button" onClick={() => navigate('/agenda')}>
            Programa
          </button>
          <button type="button" onClick={() => navigate('/store')}>
            Tienda
          </button>
          <button type="button" onClick={() => navigate('/admin')}>
            Admin
          </button>
          {isSignedIn ? (
            <span className="clerk-user">
              <UserButton afterSignOutUrl="/" />
            </span>
          ) : (
            <button type="button" className="btn btn-nav" onClick={() => navigate('/sign-up')}>
              Registro
            </button>
          )}
        </nav>
      ) : (
        <span className="clerk-user">
          {isSignedIn ? <UserButton afterSignOutUrl="/" /> : attendee?.name?.slice(0, 1)}
        </span>
      )}
    </header>
  )
}
