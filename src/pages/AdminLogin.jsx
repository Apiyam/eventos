import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function AdminLogin({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onLogin(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="dash-card login-card" onSubmit={handleSubmit}>
        <h2>Panel MOSTLA</h2>
        <label>
          Correo
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Contraseña
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="dash-cta" disabled={busy} type="submit">
          Iniciar sesión
        </button>
      </form>
    </div>
  )
}
