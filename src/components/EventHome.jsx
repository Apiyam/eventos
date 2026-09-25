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
      <section className="mostla-hero">
        <img src="/landing/mostla-header.png" alt="MOSTLA DAY 2026. 13 de octubre | 10:00 - 15:00 hrs" />
      </section>

      <section className="mostla-intro">
        <div className="mostla-wrap">
          <span className="plane plane-left" aria-hidden="true" />
          <p>
            Ven a <strong>MOSTLA DAY</strong> y descubre las tecnologías
            <br />
            del presente para cambiar el futuro.
            <br />
            De la inteligencia artificial a la realidad extendida,
            <br />
            explora nuevas formas de aprender, enseñar
            <br />
            y <strong>hacer realidad tus ideas.</strong>
          </p>
          <span className="plane plane-right" aria-hidden="true" />
        </div>
      </section>

      <figure className="mostla-banner">
        <img src="/landing/mostla-banner.jpg" alt="Tecnologías MOSTLA DAY" />
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

      <footer className="mostla-foot">
        <p>Esta página tiene como único propósito acompañar las actividades de MOSTLA DAY.</p>
      </footer>
    </main>
  )
}
