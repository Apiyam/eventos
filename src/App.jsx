import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { EventHome } from './components/EventHome'
import { useAdminSession, useStudent } from './hooks/useStudent'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminLogin } from './pages/AdminLogin'
import { NfcCheckinPage } from './pages/NfcCheckinPage'
import { RafflePage } from './pages/RafflePage'
import { Scoreboard } from './pages/Scoreboard'
import { StudentPassPage } from './pages/StudentPassPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/nfc/:code" element={<NfcCheckinPage />} />
        <Route path="/nfc" element={<NfcCheckinPage />} />
        <Route path="/marcador" element={<Scoreboard />} />
        <Route path="/rifa" element={<RafflePage standalone />} />
        <Route path="/admin/*" element={<AdminRoot />} />
        <Route path="/*" element={<StudentRoot />} />
      </Routes>
    </BrowserRouter>
  )
}

function AdminRoot() {
  const { token, profile, ready, login, logout } = useAdminSession()
  if (!ready) return <div className="clerk-screen" />
  if (!profile) return <AdminLogin onLogin={login} />
  return <AdminDashboard token={token} profile={profile} onLogout={logout} />
}

function StudentRoot() {
  const { student, ready, login, register, checkout, error } = useStudent()
  if (!ready) return <div className="clerk-screen" />
  if (student) return <StudentPassPage student={student} onCheckout={checkout} />
  return <EventHome onLogin={login} onRegister={register} loginError={error} />
}
