import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  AuthContext,
  type AuthContextValue,
} from '@app/providers/authContext'
import { refreshAdminAccessToken } from '@shared/api/adminAuthApi'
import {
  clearAccessToken,
  setAccessToken,
} from '@shared/auth/tokenStorage'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let mounted = true

    const bootstrapAuth = async () => {
      try {
        const refreshedAccessToken = await refreshAdminAccessToken()
        setAccessToken(refreshedAccessToken)
        if (mounted) {
          setStatus('authenticated')
        }
      } catch {
        clearAccessToken()
        if (mounted) {
          setStatus('unauthenticated')
        }
      }
    }

    void bootstrapAuth()

    return () => {
      mounted = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      setAuthenticated: (accessToken: string) => {
        setAccessToken(accessToken)
        setStatus('authenticated')
      },
      clearAuthentication: () => {
        clearAccessToken()
        setStatus('unauthenticated')
      },
    }),
    [status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
