import { useSignIn, useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function EventHome({ attendee, onGoAgenda }) {
  const { isSignedIn } = useUser()
  const { signIn, setActive, isLoaded } = useSignIn()
  const [matricula, setMatricula] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()
    if (!isLoaded) return
    setBusy(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: matricula.trim(), password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        onGoAgenda()
        return
      }
      setError('Completa el registro para continuar.')
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.message || 'No se pudo iniciar sesión')
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
          {isSignedIn || attendee ? (
            <>
              <h2>Ingresa para comenzar tu experiencia</h2>
              <button type="button" className="mostla-btn" onClick={onGoAgenda}>
                Ir a la agenda
              </button>
            </>
          ) : (
            <form onSubmit={handleLogin}>
              <h2>Ingresa para comenzar tu experiencia</h2>
              <label>
                Matrícula
                <input
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              {error ? <p className="error">{error}</p> : null}
              <button className="mostla-btn" disabled={busy} type="submit">
                Iniciar sesión
              </button>
              <p className="mostla-links">
                <Link to="/sign-in">¿Has olvidado tu contraseña?</Link>
                <br />
                ¿Es tu primera vez? <Link to="/sign-up">Regístrate ahora.</Link>
              </p>
            </form>
          )}
        </div>
      </section>

      <footer className="mostla-foot">
        <p>Esta página tiene como único propósito acompañar las actividades de MOSTLA DAY.</p>
      </footer>
    </main>
  )
}
