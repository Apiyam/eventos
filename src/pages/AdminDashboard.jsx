import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Folder,
  Gift,
  Home,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  PieChart,
  Plus,
  QrCode,
  Share2,
  Star,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react'
import { DateTimePicker } from '../components/DateTimePicker'
import { api, createStudentRecord, fetchStudents, imageUrl, unwrapImagePath, unwrapList } from '../lib/api'
import { publicNfcUrl } from '../lib/nfc'
import { RedeemPage } from './RedeemPage'
import { ScanTalkPage } from './ScanTalkPage'

const emptyTalk = {
  name: '',
  speaker: '',
  start_time: '2026-10-13 10:00:00',
  duration: 45,
  benefit: 20,
  max_forum: 100,
  url_nfc: '',
  image_path: '',
}

function makeNfcUrl() {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
  return publicNfcUrl(`${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`)
}

function blankTalk() {
  return {
    ...emptyTalk,
    url_nfc: makeNfcUrl(),
  }
}

function talkToForm(talk) {
  return {
    name: talk.name || '',
    speaker: talk.speaker || '',
    start_time: talk.start_time || emptyTalk.start_time,
    duration: talk.duration ?? 45,
    benefit: talk.benefit ?? 20,
    max_forum: talk.max_forum ?? 100,
    url_nfc: talk.url_nfc || '',
    image_path: talk.image_path || '',
  }
}

const emptyUser = {
  full_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  role_id: 2,
}

const emptyStudent = {
  enrollment_number: '',
  card_number: '',
}

function visiblePoints(row, talks = []) {
  const stored = Number(row?.points || 0)
  const ids = new Set((row?.talk_ids || []).map(String))
  const fromTalks = talks.reduce((sum, talk) => {
    if (!ids.has(String(talk.id))) return sum
    return sum + Number(talk.benefit || 0)
  }, 0)
  return Math.max(stored, fromTalks)
}

export function AdminDashboard({ token, profile, onLogout }) {
  const [tab, setTab] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [talks, setTalks] = useState([])
  const [users, setUsers] = useState([])
  const [store, setStore] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(emptyTalk)
  const [error, setError] = useState('')
  const [talkModal, setTalkModal] = useState(false)
  const [editingTalkId, setEditingTalkId] = useState(null)
  const [storeModal, setStoreModal] = useState(false)
  const [productForm, setProductForm] = useState({ product: '', cost: 20, quantity: 10 })
  const [userModal, setUserModal] = useState(false)
  const [userForm, setUserForm] = useState(emptyUser)
  const [studentModal, setStudentModal] = useState(false)
  const [studentForm, setStudentForm] = useState(emptyStudent)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const [t, u, s, list] = await Promise.all([
      api('/talks', { token }),
      api('/users', { token }),
      api('/store', { token }),
      fetchStudents(token, { force: true }),
    ])
    setTalks(unwrapList(t))
    setUsers(unwrapList(u))
    setStore(unwrapList(s))
    setStudents(list.map((row) => ({ ...row, points: visiblePoints(row, unwrapList(t)) })))
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message))
  }, [token])

  useEffect(() => {
    if (tab !== 'students') return undefined
    fetchStudents(token, { force: true })
      .then((list) => setStudents(list.map((row) => ({ ...row, points: visiblePoints(row, talks) }))))
      .catch((err) => setError(err.message))
    return undefined
  }, [tab, token])

  const enrolled = talks.reduce((sum, talk) => sum + Number(talk.enrolled_count || 0), 0)
  const capacity = talks.reduce((sum, talk) => sum + Number(talk.max_forum || 0), 0)
  const occupancy = capacity ? Math.round((enrolled / capacity) * 100) : 0
  const points = store.reduce((sum, item) => sum + Number(item.cost || 0) * Number(item.quantity || 0), 0)

  async function saveTalk(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      let image_path = form.image_path || ''
      if (imageFile) {
        const payload = new FormData()
        payload.append('image', imageFile)
        const uploaded = await api('/images', { token, method: 'POST', form: true, body: payload })
        image_path = unwrapImagePath(uploaded)
        if (!image_path) throw new Error('La API no devolvió la ruta de la imagen')
      }
      const payload = {
        name: form.name,
        speaker: form.speaker,
        company: form.speaker,
        start_time: form.start_time,
        duration: form.duration,
        benefit: form.benefit,
        max_forum: form.max_forum,
        url_nfc: form.url_nfc,
        image_path,
      }
      if (editingTalkId) {
        await api(`/talks/${editingTalkId}`, { token, method: 'PUT', body: payload })
      } else {
        await api('/talks', { token, method: 'POST', body: payload })
      }
      setForm(emptyTalk)
      setEditingTalkId(null)
      setImageFile(null)
      setImagePreview('')
      setTalkModal(false)
      await refresh()
      setTab('talks')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveProduct(event) {
    event.preventDefault()
    setError('')
    await api('/store', { token, method: 'POST', body: productForm })
    setProductForm({ product: '', cost: 20, quantity: 10 })
    setStoreModal(false)
    await refresh()
    setTab('store')
  }

  async function saveUser(event) {
    event.preventDefault()
    setError('')
    if (userForm.password !== userForm.password_confirmation) {
      setError('Las contraseñas no coinciden')
      return
    }
    setSaving(true)
    try {
      await api('/users', {
        token,
        method: 'POST',
        body: {
          full_name: userForm.full_name,
          email: userForm.email,
          password: userForm.password,
          password_confirmation: userForm.password_confirmation,
          phone: userForm.phone,
          role_id: Number(userForm.role_id),
        },
      })
      setUserForm(emptyUser)
      setUserModal(false)
      await refresh()
      setTab('users')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function closeTalkModal() {
    setTalkModal(false)
    setEditingTalkId(null)
    setImageFile(null)
    setImagePreview('')
  }

  function openCreateTalk() {
    setEditingTalkId(null)
    setForm(blankTalk())
    setImageFile(null)
    setImagePreview('')
    setTalkModal(true)
  }

  function openEditTalk(talk) {
    setEditingTalkId(talk.id)
    setForm(talkToForm(talk))
    setImageFile(null)
    setImagePreview(talk.image_path ? imageUrl(talk.image_path) : '')
    setTalkModal(true)
  }

  async function removeTalk(id) {
    await api(`/talks/${id}`, { token, method: 'DELETE' })
    await refresh()
  }

  async function saveStudent(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createStudentRecord(studentForm, token)
      setStudentForm(emptyStudent)
      setStudentModal(false)
      await refresh()
      setTab('students')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleUser(id) {
    await api(`/users/${id}/toggle-access`, { token, method: 'PUT' })
    await refresh()
  }

  const nav = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'scan', label: 'Ingreso', icon: QrCode },
    { id: 'redeem', label: 'Canje', icon: Gift },
    { id: 'talks', label: 'Charlas', icon: Folder },
    { id: 'students', label: 'Asistentes', icon: MessageSquare },
    { id: 'users', label: 'Usuarios', icon: Bell },
    { id: 'store', label: 'Tienda', icon: MapPin },
    { id: 'home', label: 'Gráficas', icon: PieChart, alias: 'charts' },
  ]

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
              <button
                key={item.label}
                type="button"
                className={tab === item.id ? 'is-active' : ''}
                onClick={() => {
                  setTab(item.id)
                  setMenuOpen(false)
                }}
              >
                <Icon size={18} /> {item.label}
              </button>
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

        {error ? <p className="error">{error}</p> : null}

        {tab === 'home' ? (
          <Overview
            students={students.length}
            talks={talks.length}
            enrolled={enrolled}
            occupancy={occupancy}
            points={points}
            talksData={talks}
          />
        ) : null}

        {tab === 'scan' ? <ScanTalkPage token={token} /> : null}
        {tab === 'redeem' ? <RedeemPage token={token} /> : null}

        {tab === 'talks' ? (
          <section className="dash-card dash-table-wrap">
            <div className="dash-card-head">
              <h3>Charlas</h3>
              <button type="button" className="dash-cta" onClick={openCreateTalk}>
                <Plus size={16} /> Añadir charla
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Imagen</th>
                  <th>Ponente</th>
                  <th>Inicio</th>
                  <th>Min</th>
                  <th>Cupo</th>
                  <th>Puntos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {talks.map((talk) => (
                  <tr key={talk.id}>
                    <td>{talk.name}</td>
                    <td>
                      {talk.image_path ? (
                        <img className="dash-thumb" src={imageUrl(talk.image_path)} alt="" />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{talk.speaker || '—'}</td>
                    <td>{talk.start_time}</td>
                    <td>{talk.duration}</td>
                    <td>
                      {talk.enrolled_count}/{talk.max_forum}
                    </td>
                    <td>{talk.benefit}</td>
                    <td className="dash-actions">
                      <button type="button" onClick={() => openEditTalk(talk)}>
                        Editar
                      </button>
                      <button type="button" onClick={() => removeTalk(talk.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === 'users' ? (
          <section className="dash-card dash-table-wrap">
            <div className="dash-card-head">
              <h3>Usuarios internos</h3>
              <button
                type="button"
                className="dash-cta"
                onClick={() => {
                  setUserForm(emptyUser)
                  setUserModal(true)
                }}
              >
                <Plus size={16} /> Añadir usuario
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Activo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role === 'admin' ? 'Admin' : 'Usuario'}</td>
                    <td>{user.active ? 'Sí' : 'No'}</td>
                    <td>
                      <button type="button" onClick={() => toggleUser(user.id)}>
                        Alternar acceso
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === 'students' ? (
          <section className="dash-card dash-table-wrap">
            <div className="dash-card-head">
              <h3>Asistentes</h3>
              <button
                type="button"
                className="dash-cta"
                onClick={() => {
                  setStudentForm(emptyStudent)
                  setStudentModal(true)
                }}
              >
                <Plus size={16} /> Añadir asistente
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>NFC</th>
                  <th>ID</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {students.map((row) => (
                  <tr key={row.enrollment_number || row.student_id || row.id}>
                    <td className="dash-mono">{row.enrollment_number || '—'}</td>
                    <td className="dash-mono">{row.card_number || row.nfc_id || '—'}</td>
                    <td className="dash-mono">{row.student_id || row.id || '—'}</td>
                    <td>{visiblePoints(row, talks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === 'store' ? (
          <section className="dash-card dash-table-wrap">
            <div className="dash-card-head">
              <h3>Tienda</h3>
              <button
                type="button"
                className="dash-cta"
                onClick={() => {
                  setProductForm({ product: '', cost: 20, quantity: 10 })
                  setStoreModal(true)
                }}
              >
                <Plus size={16} /> Añadir producto
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Costo</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {store.map((row) => (
                  <tr key={row.id}>
                    <td>{row.product}</td>
                    <td>{row.cost}</td>
                    <td>{row.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </main>

      {talkModal ? (
        <div className="dash-modal-bg" onClick={closeTalkModal}>
          <form
            className="dash-card dash-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveTalk}
          >
            <div className="dash-card-head">
              <h3>{editingTalkId ? 'Editar charla' : 'Nueva charla'}</h3>
              <button type="button" className="dash-icon-btn" onClick={closeTalkModal} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <label>
              Nombre
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Ponente
              <input
                value={form.speaker}
                onChange={(e) => setForm({ ...form, speaker: e.target.value })}
              />
            </label>
            <label>
              Inicio
              <DateTimePicker value={form.start_time} onChange={(start_time) => setForm({ ...form, start_time })} />
            </label>
            <label>
              Duración (min)
              <input
                type="number"
                min="5"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </label>
            <label>
              Puntos
              <input
                type="number"
                value={form.benefit}
                onChange={(e) => setForm({ ...form, benefit: e.target.value })}
              />
            </label>
            <label>
              Cupo
              <input
                type="number"
                value={form.max_forum}
                onChange={(e) => setForm({ ...form, max_forum: e.target.value })}
              />
            </label>
            <label>
              URL NFC
              <input value={form.url_nfc} readOnly />
            </label>
            <label>
              Imagen
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setImageFile(file)
                  setImagePreview((current) => {
                    if (current) URL.revokeObjectURL(current)
                    return file ? URL.createObjectURL(file) : ''
                  })
                }}
              />
            </label>
            {imagePreview ? <img className="dash-preview" src={imagePreview} alt="" /> : null}
            <div className="dash-modal-actions">
              <button type="button" onClick={closeTalkModal}>
                Cancelar
              </button>
              <button className="dash-cta" disabled={saving} type="submit">
                {saving ? 'Guardando…' : editingTalkId ? 'Guardar' : 'Publicar'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {storeModal ? (
        <div className="dash-modal-bg" onClick={() => setStoreModal(false)}>
          <form
            className="dash-card dash-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveProduct}
          >
            <div className="dash-card-head">
              <h3>Nuevo producto</h3>
              <button type="button" className="dash-icon-btn" onClick={() => setStoreModal(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <label>
              Producto
              <input
                value={productForm.product}
                onChange={(e) => setProductForm({ ...productForm, product: e.target.value })}
                required
              />
            </label>
            <label>
              Costo (puntos)
              <input
                type="number"
                min="1"
                value={productForm.cost}
                onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                required
              />
            </label>
            <label>
              Cantidad
              <input
                type="number"
                min="0"
                value={productForm.quantity}
                onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                required
              />
            </label>
            <div className="dash-modal-actions">
              <button type="button" onClick={() => setStoreModal(false)}>
                Cancelar
              </button>
              <button className="dash-cta" type="submit">
                Crear
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {studentModal ? (
        <div className="dash-modal-bg" onClick={() => setStudentModal(false)}>
          <form className="dash-card dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveStudent}>
            <div className="dash-card-head">
              <h3>Nuevo asistente</h3>
              <button type="button" className="dash-icon-btn" onClick={() => setStudentModal(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <label>
              Matrícula
              <input
                value={studentForm.enrollment_number}
                onChange={(e) => setStudentForm({ ...studentForm, enrollment_number: e.target.value })}
                required
              />
            </label>
            <label>
              NFC / card_number
              <input
                value={studentForm.card_number}
                onChange={(e) => setStudentForm({ ...studentForm, card_number: e.target.value })}
                required
              />
            </label>
            <div className="dash-modal-actions">
              <button type="button" onClick={() => setStudentModal(false)}>
                Cancelar
              </button>
              <button className="dash-cta" disabled={saving} type="submit">
                {saving ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {userModal ? (
        <div className="dash-modal-bg" onClick={() => setUserModal(false)}>
          <form className="dash-card dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveUser}>
            <div className="dash-card-head">
              <h3>Nuevo usuario interno</h3>
              <button type="button" className="dash-icon-btn" onClick={() => setUserModal(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <label>
              Nombre
              <input
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                required
              />
            </label>
            <label>
              Correo
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
              />
            </label>
            <label>
              Teléfono
              <input
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              />
            </label>
            <label>
              Rol
              <select
                value={userForm.role_id}
                onChange={(e) => setUserForm({ ...userForm, role_id: Number(e.target.value) })}
              >
                <option value={2}>Usuario</option>
                <option value={1}>Admin</option>
              </select>
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                minLength={8}
                required
              />
            </label>
            <label>
              Confirmar contraseña
              <input
                type="password"
                value={userForm.password_confirmation}
                onChange={(e) => setUserForm({ ...userForm, password_confirmation: e.target.value })}
                minLength={8}
                required
              />
            </label>
            <div className="dash-modal-actions">
              <button type="button" onClick={() => setUserModal(false)}>
                Cancelar
              </button>
              <button className="dash-cta" disabled={saving} type="submit">
                {saving ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function Overview({ students, talks, enrolled, occupancy, points, talksData }) {
  return (
    <>
      <section className="dash-kpis">
        <article className="kpi kpi-dark">
          <span>
            Puntos tienda <Share2 size={16} />
          </span>
          <strong>{points}</strong>
        </article>
        <article className="kpi">
          <span>
            Asistentes <Users size={16} />
          </span>
          <strong>{students}</strong>
        </article>
        <article className="kpi">
          <span>
            Inscripciones <ThumbsUp size={16} />
          </span>
          <strong>{enrolled}</strong>
        </article>
        <article className="kpi">
          <span>
            Ocupación <Star size={16} />
          </span>
          <strong>{occupancy}%</strong>
        </article>
      </section>

      <section className="dash-charts">
        <article className="dash-card">
          <div className="dash-card-head">
            <h3>Resultado por charla</h3>
            <span>{talks} sesiones</span>
          </div>
          <BarChart talks={talksData} />
        </article>
        <article className="dash-card donut-card">
          <Donut value={occupancy} />
          <p>Cupo utilizado en el foro</p>
        </article>
      </section>

      <section className="dash-bottom">
        <article className="dash-card">
          <h3>Actividad</h3>
          <AreaChart talks={talksData} />
        </article>
        <article className="dash-card cal-card">
          <MiniCal />
        </article>
      </section>
    </>
  )
}

function BarChart({ talks }) {
  const rows = talks.slice(0, 8)
  const max = Math.max(1, ...rows.map((talk) => Number(talk.enrolled_count || 1)))
  return (
    <div className="bars">
      {rows.map((talk, index) => (
        <div key={talk.id} className="bar">
          <span className={index % 2 ? 'gold' : 'navy'} style={{ height: `${Math.max(12, (Number(talk.enrolled_count || 0) / max) * 100)}%` }} />
          <small>{String(talk.name).slice(0, 8)}</small>
        </div>
      ))}
    </div>
  )
}

function AreaChart({ talks }) {
  const values = talks.length
    ? talks.map((talk) => Number(talk.enrolled_count || 0) + 8)
    : [12, 18, 14, 22, 30, 24, 28, 20]
  const max = Math.max(1, ...values)
  const pts = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 280
      const y = 90 - (value / max) * 70
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox="0 0 280 100" className="area">
      <defs>
        <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f5a623" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#163a5f" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${pts} 280,100`} fill="url(#areaFill)" />
      <polyline points={pts} fill="none" stroke="#163a5f" strokeWidth="2" />
    </svg>
  )
}

function Donut({ value }) {
  const r = 36
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="donut">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e9edf3" strokeWidth="12" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#f5a623"
          strokeWidth="12"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <circle cx="50" cy="50" r="22" fill="#163a5f" />
      </svg>
      <strong>{value}%</strong>
    </div>
  )
}

function MiniCal() {
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), [])
  return (
    <div>
      <h3>Octubre 2026</h3>
      <div className="mini-cal">
        {days.map((day) => (
          <span key={day} className={day === 13 ? 'is-event' : ''}>
            {day}
          </span>
        ))}
      </div>
    </div>
  )
}
