import { useState } from 'react'
import { X } from 'lucide-react'

export function RegisterModal({ open, busy, error, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  if (!open) return null

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ name, email })
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-labelledby="register-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 id="register-title">Registro</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ana Torres"
              autoComplete="name"
            />
          </label>
          <label>
            Correo
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@correo.com"
              autoComplete="email"
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" disabled={busy} type="submit">
            {busy ? 'Guardando…' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
