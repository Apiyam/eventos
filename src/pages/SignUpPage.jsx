import { SignUp, useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { registerStudent } from '../lib/api'

const appearance = {
  elements: {
    socialButtonsRoot: { display: 'none' },
    dividerRow: { display: 'none' },
  },
}

export function SignUpPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [synced, setSynced] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSignedIn || !user) return undefined
    let cancelled = false
    registerStudent(user.id, {
      ...user.publicMetadata,
      full_name: user.fullName || '',
      email: user.primaryEmailAddress?.emailAddress || '',
    })
      .then(() => user.reload())
      .then(() => {
        if (!cancelled) setSynced(true)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'No se pudo crear el estudiante')
          setSynced(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [isSignedIn, user])

  if (!isLoaded) return <div className="clerk-screen" />

  if (isSignedIn && !synced) {
    return (
      <div className="clerk-screen">
        <p className="muted">Creando tu ficha de estudiante…</p>
      </div>
    )
  }

  if (isSignedIn && error) {
    return (
      <div className="clerk-screen">
        <div className="dash-card login-card">
          <h2>Registro incompleto</h2>
          <p className="error">{error}</p>
        </div>
      </div>
    )
  }

  if (isSignedIn) return <Navigate to="/agenda" replace />

  return (
    <div className="clerk-screen">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/sign-up"
        fallbackRedirectUrl="/sign-up"
        appearance={appearance}
      />
    </div>
  )
}
