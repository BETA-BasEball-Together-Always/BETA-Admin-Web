import {
  useEffect,
  useMemo,
  useRef,
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
  const authRevisionRef = useRef(0)

  useEffect(() => {
    let mounted = true
    const requestRevision = ++authRevisionRef.current

    const bootstrapAuth = async () => {
      try {
        const refreshedAccessToken = await refreshAdminAccessToken()
        setAccessToken(refreshedAccessToken)
        if (mounted && authRevisionRef.current === requestRevision) {
          setStatus('authenticated')
        }
      } catch {
        clearAccessToken()
        if (mounted && authRevisionRef.current === requestRevision) {
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
        authRevisionRef.current += 1
        setAccessToken(accessToken)
        setStatus('authenticated')
      },
      clearAuthentication: () => {
        authRevisionRef.current += 1
        clearAccessToken()
        setStatus('unauthenticated')
      },
    }),
    [status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
