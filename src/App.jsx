import { ClerkProvider } from '@clerk/clerk-react'
import { esMX } from '@clerk/localizations'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { Agenda } from './components/Agenda'
import { BottomNav } from './components/BottomNav'
import { Header } from './components/Header'
import { EventHome } from './components/EventHome'
import { MenuSheet } from './components/MenuSheet'
import { Shop } from './components/Shop'
import { Toasts } from './components/Toasts'
import { useAdminSession, useStudent } from './hooks/useStudent'
import { useClock } from './hooks/useClock'
import { useSchedule } from './hooks/useSchedule'
import { useTalkReminders } from './hooks/useTalkReminders'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminLogin } from './pages/AdminLogin'
import { SignInPage } from './pages/SignInPage'
import { Scoreboard } from './pages/Scoreboard'
import { SignUpPage } from './pages/SignUpPage'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export default function App() {
  return (
    <BrowserRouter>
      {clerkKey ? (
        <ClerkProvider
          publishableKey={clerkKey}
          localization={esMX}
          appearance={{
            variables: { colorPrimary: '#5b4eff', fontFamily: 'Poppins, sans-serif' },
            elements: { socialButtonsRoot: { display: 'none' }, dividerRow: { display: 'none' } },
          }}
        >
          <Routes>
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="/marcador" element={<Scoreboard />} />
            <Route path="/admin/*" element={<AdminRoot />} />
            <Route path="/*" element={<PublicShell />} />
          </Routes>
        </ClerkProvider>
      ) : (
        <Routes>
          <Route path="/admin/*" element={<AdminRoot />} />
          <Route path="/marcador" element={<Scoreboard />} />
          <Route path="/*" element={<MissingClerk />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}

function AdminRoot() {
  const { token, profile, ready, login, logout } = useAdminSession()
  if (!ready) return <div className="clerk-screen" />
  if (!profile) return <AdminLogin onLogin={login} />
  return <AdminDashboard token={token} profile={profile} onLogout={logout} />
}

function MissingClerk() {
  return (
    <div className="clerk-screen">
      <div className="modal">
        <h2>Clerk requerido</h2>
        <p className="muted">Define VITE_CLERK_PUBLISHABLE_KEY en .env para el registro de asistentes.</p>
        <p className="muted">El dashboard admin no usa Clerk: /admin</p>
      </div>
    </div>
  )
}

function PublicShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const clock = useClock()
  const { attendee, student, setStudent, signedIn, ready, checkout, error: studentError } = useStudent()
  const schedule = useSchedule(clock.now, student, setStudent)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  const view = location.pathname.startsWith('/agenda')
    ? 'agenda'
    : location.pathname.startsWith('/store')
      ? 'store'
      : 'home'

  const goRegister = () => navigate('/sign-up')

  useEffect(() => {
    if (location.pathname.startsWith('/pass') || location.pathname.startsWith('/alerts')) {
      navigate('/agenda', { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    if (!ready) return
    if ((view === 'agenda' || view === 'store') && !signedIn) {
      navigate('/sign-in', { replace: true })
    }
  }, [navigate, ready, signedIn, view])

  const pushToast = useCallback((toast) => {
    setToasts((current) => [...current.filter((item) => item.id !== toast.id), toast])
  }, [])

  useEffect(() => {
    if (studentError) pushToast({ id: 'student-sync', title: studentError })
  }, [pushToast, studentError])

  const onReminder = useCallback((toast) => {
    pushToast(toast)
  }, [pushToast])

  useEffect(() => {
    if (!toasts.length) return undefined
    const id = setTimeout(() => setToasts((items) => items.slice(1)), 5000)
    return () => clearTimeout(id)
  }, [toasts])

  useTalkReminders(schedule.selectedTalks, clock.now, onReminder)

  const isHome = view === 'home'

  if (!isHome && !ready) {
    return <div className="clerk-screen" />
  }

  return (
    <div className={isHome ? 'site mostla-site' : 'app-frame'}>
      {isHome ? null : <Header attendee={attendee} onMenu={() => setMenuOpen(true)} site={false} />}

      {view === 'home' ? (
        <EventHome attendee={attendee} onOpenRegister={goRegister} onGoAgenda={() => navigate('/agenda')} />
      ) : null}

      {view === 'agenda' ? (
        <Agenda
          talks={schedule.talks}
          selectedIds={schedule.selectedIds}
          attendee={attendee}
          onOpenRegister={goRegister}
        />
      ) : null}

      {view === 'store' ? (
        <Shop student={student} />
      ) : null}

      {isHome ? null : (
        <BottomNav view={view} onChange={(next) => navigate(next === 'home' ? '/' : `/${next}`)} />
      )}

      <MenuSheet
        open={menuOpen}
        attendee={attendee}
        onClose={() => setMenuOpen(false)}
        onRequestNotify={() => Notification.requestPermission?.()}
        onCheckout={checkout}
      />
      <Toasts items={toasts} onDismiss={(id) => setToasts((items) => items.filter((t) => t.id !== id))} />
    </div>
  )
}
