import { SignIn, useUser } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

const appearance = {
  elements: {
    socialButtonsRoot: { display: 'none' },
    dividerRow: { display: 'none' },
  },
}

export function SignInPage() {
  const { isLoaded, isSignedIn } = useUser()
  if (!isLoaded) return <div className="clerk-screen" />
  if (isSignedIn) return <Navigate to="/agenda" replace />

  return (
    <div className="clerk-screen">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/agenda"
        appearance={appearance}
      />
    </div>
  )
}
