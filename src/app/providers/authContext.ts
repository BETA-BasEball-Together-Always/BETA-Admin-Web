import { createContext } from 'react'

export type AuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  setAuthenticated: (accessToken: string) => void
  clearAuthentication: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
