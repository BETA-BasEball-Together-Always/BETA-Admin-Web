import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'

function hasAccessToken() {
  return Boolean(localStorage.getItem('accessToken'))
}

export function RequireAuth({ children }: PropsWithChildren) {
  if (!hasAccessToken()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

