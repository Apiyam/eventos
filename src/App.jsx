import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { EventHome } from './components/EventHome'
import { useAdminSession, useStudent } from './hooks/useStudent'
import { AdminLogin } from './pages/AdminLogin'
import { StudentPassPage } from './pages/StudentPassPage'

const NfcCheckinPage = lazy(() => import('./pages/NfcCheckinPage').then((m) => ({ default: m.NfcCheckinPage })))
const RafflePage = lazy(() => import('./pages/RafflePage').then((m) => ({ default: m.RafflePage })))
const Scoreboard = lazy(() => import('./pages/Scoreboard').then((m) => ({ default: m.Scoreboard })))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminHome = lazy(() => import('./pages/admin/AdminHome').then((m) => ({ default: m.AdminHome })))
const AdminTalks = lazy(() => import('./pages/admin/AdminTalks').then((m) => ({ default: m.AdminTalks })))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })))
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents').then((m) => ({ default: m.AdminStudents })))
const AdminStore = lazy(() => import('./pages/admin/AdminStore').then((m) => ({ default: m.AdminStore })))
const AdminScan = lazy(() => import('./pages/admin/AdminOutletPage').then((m) => ({ default: m.AdminScan })))
const AdminRedeem = lazy(() => import('./pages/admin/AdminOutletPage').then((m) => ({ default: m.AdminRedeem })))
const AdminRaffle = lazy(() => import('./pages/admin/AdminOutletPage').then((m) => ({ default: m.AdminRaffle })))

function Fallback() {
  return <div className="clerk-screen" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/nfc/:code" element={<NfcCheckinPage />} />
          <Route path="/nfc" element={<NfcCheckinPage />} />
          <Route path="/marcador" element={<Scoreboard />} />
          <Route path="/rifa" element={<RafflePage standalone />} />
          <Route path="/admin" element={<AdminRoot />}>
            <Route index element={<AdminHome />} />
            <Route path="ingreso" element={<AdminScan />} />
            <Route path="canje" element={<AdminRedeem />} />
            <Route path="rifa" element={<AdminRaffle />} />
            <Route path="charlas" element={<AdminTalks />} />
            <Route path="estudiantes" element={<AdminStudents />} />
            <Route path="asistentes" element={<Navigate to="/admin/estudiantes" replace />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="tienda" element={<AdminStore />} />
          </Route>
          <Route path="/*" element={<StudentRoot />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function AdminRoot() {
  const { token, profile, ready, login, logout } = useAdminSession()
  if (!ready) return <Fallback />
  if (!profile) return <AdminLogin onLogin={login} />
  return <AdminLayout token={token} profile={profile} onLogout={logout} />
}

function StudentRoot() {
  const { student, ready, login, register, checkout, error } = useStudent()
  if (!ready) return <Fallback />
  if (student) return <StudentPassPage student={student} onCheckout={checkout} />
  return <EventHome onLogin={login} onRegister={register} loginError={error} />
}
