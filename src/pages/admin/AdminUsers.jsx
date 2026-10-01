import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FilterableTable } from '../../components/FilterableTable'
import { confirmAction, notifyError, notifySuccess } from '../../lib/alert'
import { api, unwrapList } from '../../lib/api'
import { STAFF_ROLES, isManager, isSuperUser, userRole } from '../../lib/roles'

const emptyUser = {
  full_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  role_id: 2,
}

function roleIdFromName(name) {
  const found = STAFF_ROLES.find((role) => role.name.toLowerCase() === String(name || '').toLowerCase())
  if (found) return found.id
  if (/^admin$/i.test(name)) return 2
  return 2
}

function roleNameFromId(id) {
  return STAFF_ROLES.find((role) => role.id === Number(id))?.name || 'Administrador'
}

function isActive(user) {
  return String(user?.status || '').toLowerCase() === 'active'
}

export function AdminUsers() {
  const { token, profile } = useOutletContext()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyUser)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const viewerIsManager = isManager(profile)
  const viewerIsSuper = isSuperUser(profile)
  const assignableRoles = viewerIsSuper ? STAFF_ROLES : STAFF_ROLES.filter((role) => role.id !== 1)
  const visibleUsers = viewerIsSuper ? users : users.filter((user) => !isSuperUser(user))

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
    if (isSuperUser(user) && !viewerIsSuper) return
    const nextRoleId = roleIdFromName(userRole(user))
    setEditingId(user.id)
    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      password_confirmation: '',
      phone: user.phone || '',
      role_id: !viewerIsSuper && nextRoleId === 1 ? 2 : nextRoleId,
    })
    setOpen(true)
  }

  async function saveUser(event) {
    event.preventDefault()
    if (!editingId && form.password !== form.password_confirmation) {
      notifyError('Las contraseñas no coinciden')
      return
    }
    const roleId = !viewerIsSuper && Number(form.role_id) === 1 ? 2 : Number(form.role_id)
    if (!viewerIsSuper && roleId === 1) {
      notifyError('No puedes asignar el rol Superuser')
      return
    }
    setSaving(true)
    try {
      const roleName = roleNameFromId(roleId)
      if (editingId) {
        await api(`/users/${editingId}`, {
          token,
          method: 'PUT',
          body: {
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            role: roleName,
            role_id: roleId,
          },
        })
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
            role_id: roleId,
            role: roleName,
          },
        })
      }
      close()
      await loadUsers()
      const verifyUrl = `${window.location.origin}/verificar`
      await notifySuccess(
        editingId ? 'Usuario actualizado' : 'Usuario creado',
        editingId ? '' : `Se envió el correo de verificación. El usuario debe entrar a ${verifyUrl} con su código.`,
      )
    } catch (err) {
      await notifyError('No se pudo guardar', err.message)
    } finally {
      setSaving(false)
    }
  }

  function canDelete(target) {
    if (!viewerIsManager) return false
    if (profile?.id && target.id === profile.id) return false
    if (isSuperUser(target) && !viewerIsSuper) return false
    return true
  }

  async function removeUser(user) {
    if (!canDelete(user)) return
    if (!(await confirmAction('¿Eliminar este usuario?'))) return
    try {
      await api(`/users/${user.id}`, { token, method: 'DELETE' })
      await loadUsers()
      await notifySuccess('Usuario eliminado')
    } catch (err) {
      await notifyError('No se pudo eliminar', err.message)
    }
  }

  function canManage(target) {
    if (!viewerIsManager) return false
    if (isSuperUser(target) && !viewerIsSuper) return false
    return true
  }

  async function toggleUser(user) {
    if (!canManage(user)) return
    try {
      await api(`/toggle-access/${user.id}`, { token, method: 'POST' })
      await loadUsers()
      await notifySuccess(isActive(user) ? 'Usuario desactivado' : 'Usuario activado')
    } catch (err) {
      await notifyError('No se pudo actualizar', err.message)
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
          rows={visibleUsers}
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
                  {canManage(user) ? (
                    <button type="button" onClick={() => openEdit(user)}>
                      Editar
                    </button>
                  ) : null}
                  {canManage(user) ? (
                    <button type="button" onClick={() => toggleUser(user)}>
                      {isActive(user) ? 'Desactivar' : 'Activar'}
                    </button>
                  ) : null}
                  {canDelete(user) ? (
                    <button type="button" onClick={() => removeUser(user)}>
                      Eliminar
                    </button>
                  ) : null}
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
              <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}>
                {assignableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
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
