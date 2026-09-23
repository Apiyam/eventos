import { Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Header({ attendee, onMenu }) {
  const navigate = useNavigate()

  return (
    <header className="top-bar">
      <button type="button" className="icon-btn" onClick={onMenu} aria-label="Menú">
        <Menu size={22} strokeWidth={1.8} />
      </button>
      <button type="button" className="logo" onClick={() => navigate('/')}>
        <img src="/landing/mostla-header.png" alt="MOSTLA DAY" />
      </button>
      <span className="pass-enroll">{attendee?.enrollment || attendee?.name?.slice(0, 1) || ''}</span>
    </header>
  )
}
