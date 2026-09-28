import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { notifyError, notifySuccess } from '../lib/alert'
import { api } from '../lib/api'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') || '')
  const [code, setCode] = useState(params.get('code') || '')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await api('/auth/verify-email', {
        method: 'POST',
        body: {
          email: email.trim(),
          code: String(code || '').trim(),
        },
      })
      await notifySuccess('Cuenta verificada', 'Ya puedes iniciar sesión.')
      navigate('/admin')
    } catch (err) {
      await notifyError('No se pudo verificar', err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="dash-card login-card" onSubmit={handleSubmit}>
        <h2>Verificar cuenta</h2>
        <p className="muted">Escribe el correo y el código que te enviamos para activar tu acceso.</p>
        <label>
          Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Código
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            required
          />
        </label>
        <button className="dash-cta" disabled={busy} type="submit">
          {busy ? 'Verificando…' : 'Activar cuenta'}
        </button>
        <p className="muted">
          <Link to="/admin">Volver al inicio de sesión</Link>
        </p>
      </form>
    </div>
  )
}
