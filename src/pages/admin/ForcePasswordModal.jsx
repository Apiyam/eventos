import { useState } from 'react'
import { notifyError, notifySuccess } from '../../lib/alert'

export function ForcePasswordModal({ profile, onSave }) {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (password !== passwordConfirmation) {
      notifyError('Las contraseñas no coinciden')
      return
    }
    setSaving(true)
    try {
      await onSave({
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        password,
        password_confirmation: passwordConfirmation,
        must_change_password: false,
      })
      await notifySuccess('Contraseña actualizada')
    } catch (err) {
      await notifyError('No se pudo actualizar', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dash-modal-bg">
      <form className="dash-card dash-modal" onSubmit={handleSubmit}>
        <div className="dash-card-head">
          <h3>Cambia tu contraseña</h3>
        </div>
        <p className="muted">Por seguridad debes definir una nueva contraseña antes de continuar.</p>
        <label>
          Nueva contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </label>
        <label>
          Confirmar contraseña
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <div className="dash-modal-actions">
          <button className="dash-cta" disabled={saving} type="submit">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
