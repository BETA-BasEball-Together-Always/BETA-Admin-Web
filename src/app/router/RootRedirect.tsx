import { Navigate } from 'react-router-dom'
import { useAuth } from '@app/providers/useAuth'

export function RootRedirect() {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return null
  }

  return isAuthenticated
    ? <Navigate to="/" replace />
    : <Navigate to="/login" replace />
}
