import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { notifyError, notifySuccess } from '../../lib/alert'

export function AdminProfile() {
  const { profile, updateProfile } = useOutletContext()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    password: '',
    password_confirmation: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (form.password && form.password !== form.password_confirmation) {
      notifyError('Las contraseñas no coinciden')
      return
    }
    setSaving(true)
    try {
      const body = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
      }
      if (form.password) {
        body.password = form.password
        body.password_confirmation = form.password_confirmation
      }
      await updateProfile(body)
      setForm({ ...form, password: '', password_confirmation: '' })
      await notifySuccess('Perfil actualizado')
    } catch (err) {
      await notifyError('No se pudo guardar', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="dash-card">
      <div className="dash-card-head">
        <h3>Mi perfil</h3>
      </div>
      <form onSubmit={handleSubmit}>
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
          Nueva contraseña
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} />
        </label>
        <label>
          Confirmar contraseña
          <input
            type="password"
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            minLength={8}
          />
        </label>
        <div className="dash-modal-actions">
          <button className="dash-cta" disabled={saving} type="submit">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </section>
  )
}
