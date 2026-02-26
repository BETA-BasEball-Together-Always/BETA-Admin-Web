import { Navigate } from 'react-router-dom'

function hasAccessToken() {
  return Boolean(localStorage.getItem('accessToken'))
}

export function RootRedirect() {
  return hasAccessToken()
    ? <Navigate to="/" replace />
    : <Navigate to="/login" replace />
}
