import { useState } from 'react'

export function EventHome({ onLogin, onRegister, loginError = '' }) {
  const [mode, setMode] = useState('login')
  const [matricula, setMatricula] = useState('')
  const [nfc, setNfc] = useState('')
  const [error, setError] = useState(loginError)
  const [busy, setBusy] = useState(false)

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'register') {
        await onRegister({ enrollment_number: matricula.trim(), card_number: nfc.trim() })
      } else {
        await onLogin(matricula.trim())
      }
    } catch (err) {
      setError(err.message || (mode === 'register' ? 'No se pudo registrar' : 'No se pudo iniciar sesión'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mostla">
      <figure className="mostla-banner">
        <img src="/landing/mostla-banner.jpg" alt="MOSTLA DAY. Robot y tecnologías del evento" />
      </figure>

      <section className="mostla-login">
        <div className="mostla-wrap">
          <form onSubmit={handleSubmit}>
            <h2>{mode === 'register' ? 'Regístrate para comenzar' : 'Ingresa para comenzar tu experiencia'}</h2>
            <label>
              Matrícula
              <input
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="A0 / L0"
                autoComplete="username"
                required
              />
            </label>
            {mode === 'register' ? (
              <label>
                Tarjeta NFC
                <input
                  value={nfc}
                  onChange={(e) => setNfc(e.target.value)}
                  autoCapitalize="characters"
                  required
                />
              </label>
            ) : null}
            {error ? <p className="error">{error}</p> : null}
            <button className="mostla-btn" disabled={busy} type="submit">
              {mode === 'register' ? 'Registrarme' : 'Iniciar sesión'}
            </button>
            <p className="mostla-links">
              {mode === 'register' ? (
                <button type="button" className="mostla-text-link" onClick={() => switchMode('login')}>
                  Ya tengo cuenta. Iniciar sesión
                </button>
              ) : (
                <>
                  ¿Es tu primera vez?{' '}
                  <button type="button" className="mostla-text-link" onClick={() => switchMode('register')}>
                    Regístrate aquí
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </section>

      <figure className="mostla-agenda">
        <img src="/landing/mostla-agenda.jpg" alt="Agenda MOSTLA DAY. 13 de octubre: Pabellón, Jardinera, MOSTLA, Zona XR y Biblioteca" />
      </figure>

      <footer className="mostla-foot">
        <p>Esta página tiene como único propósito acompañar las actividades de MOSTLA DAY.</p>
      </footer>
    </main>
  )
}
