import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FilterableTable } from '../../components/FilterableTable'
import { confirmAction, notifyError, notifySuccess } from '../../lib/alert'
import { api, unwrapList } from '../../lib/api'

const emptyUser = {
  full_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  role_id: 2,
}

function userRole(user) {
  return String(user?.metadata?.role || user?.role || '').trim()
}

function isSuperUser(user) {
  return /^super\s*user$/i.test(userRole(user))
}

function isActive(user) {
  return String(user?.status || '').toLowerCase() === 'active'
}

export function AdminUsers() {
  const { token } = useOutletContext()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyUser)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadUsers() {
    const res = await api('/users', { token })
    setUsers(unwrapList(res))
  }

  useEffect(() => {
    loadUsers().catch((err) => notifyError('No se pudieron cargar los usuarios', err.message))
  }, [token])

  function close() {
    setOpen(false)
    setEditingId(null)
    setForm(emptyUser)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyUser)
    setOpen(true)
  }

  function openEdit(user) {
    const role = userRole(user)
    setEditingId(user.id)
    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      password_confirmation: '',
      phone: user.phone || '',
      role_id: isSuperUser(user) || /^admin$/i.test(role) ? 1 : 2,
    })
    setOpen(true)
  }

  async function saveUser(event) {
    event.preventDefault()
    if (!editingId && form.password !== form.password_confirmation) {
      notifyError('Las contraseñas no coinciden')
      return
    }
    setSaving(true)
    try {
      const current = users.find((row) => row.id === editingId)
      if (editingId) {
        const body = {
          first_name: form.full_name,
          last_name: '',
          email: form.email,
          phone: form.phone,
        }
        if (!isSuperUser(current)) {
          body.role = Number(form.role_id) === 1 ? 'admin' : 'user'
        }
        await api(`/users/${editingId}`, { token, method: 'PUT', body })
      } else {
        await api('/users', {
          token,
          method: 'POST',
          body: {
            full_name: form.full_name,
            email: form.email,
            password: form.password,
            password_confirmation: form.password_confirmation,
            phone: form.phone,
            role_id: Number(form.role_id),
          },
        })
      }
      close()
      await loadUsers()
      await notifySuccess(editingId ? 'Usuario actualizado' : 'Usuario creado')
    } catch (err) {
      await notifyError('No se pudo guardar', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeUser(id) {
    const current = users.find((row) => row.id === id)
    if (isSuperUser(current)) {
      await notifyError('Un Superuser no se puede eliminar')
      return
    }
    if (!(await confirmAction('¿Eliminar este usuario?'))) return
    try {
      await api(`/users/${id}`, { token, method: 'DELETE' })
      await loadUsers()
      await notifySuccess('Usuario eliminado')
    } catch (err) {
      await notifyError('No se pudo eliminar', err.message)
    }
  }

  async function verifyUser(user) {
    if (isSuperUser(user)) {
      await notifyError('Un Superuser no se puede verificar')
      return
    }
    try {
      await api(`/users/${user.id}/toggle-access`, { token, method: 'PUT' })
      await loadUsers()
      await notifySuccess('Usuario verificado')
    } catch (err) {
      await notifyError('No se pudo verificar', err.message)
    }
  }

  return (
    <>
      <section className="dash-card dash-table-wrap">
        <div className="dash-card-head">
          <h3>Usuarios internos</h3>
          <button type="button" className="dash-cta" onClick={openCreate}>
            <Plus size={16} /> Añadir usuario
          </button>
        </div>
        <FilterableTable
          rows={users}
          rowKey={(user) => user.id}
          emptyText="No hay usuarios."
          columns={[
            { key: 'full_name', label: 'Nombre' },
            { key: 'email', label: 'Correo' },
            { key: 'role', label: 'Rol', value: (user) => userRole(user) },
            {
              key: 'status',
              label: 'Estado',
              value: (user) => (isActive(user) ? 'Activo' : user.status || 'Inactivo'),
            },
            {
              key: 'actions',
              label: '',
              sortable: false,
              searchable: false,
              className: 'dash-actions',
              render: (user) => (
                <>
                  <button type="button" onClick={() => openEdit(user)}>
                    Editar
                  </button>
                  {isSuperUser(user) ? null : (
                    <button type="button" onClick={() => verifyUser(user)}>
                      Verificar
                    </button>
                  )}
                  {isSuperUser(user) ? null : (
                    <button type="button" onClick={() => removeUser(user.id)}>
                      Eliminar
                    </button>
                  )}
                </>
              ),
            },
          ]}
        />
      </section>

      {open ? (
        <div className="dash-modal-bg" onClick={close}>
          <form className="dash-card dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveUser}>
            <div className="dash-card-head">
              <h3>{editingId ? 'Editar usuario' : 'Nuevo usuario interno'}</h3>
              <button type="button" className="dash-icon-btn" onClick={close} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <label>
              Nombre
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </label>
            <label>
              Correo
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>
              Teléfono
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Rol
              {editingId && isSuperUser(users.find((row) => row.id === editingId)) ? (
                <input value="Superuser" disabled />
              ) : (
                <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}>
                  <option value={2}>Usuario</option>
                  <option value={1}>Admin</option>
                </select>
              )}
            </label>
            {editingId ? null : (
              <>
                <label>
                  Contraseña
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
                </label>
                <label>
                  Confirmar contraseña
                  <input type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} minLength={8} required />
                </label>
              </>
            )}
            <div className="dash-modal-actions">
              <button type="button" onClick={close}>
                Cancelar
              </button>
              <button className="dash-cta" disabled={saving} type="submit">
                {saving ? 'Guardando…' : editingId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
