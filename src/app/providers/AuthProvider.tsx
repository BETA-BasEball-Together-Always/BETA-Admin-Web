import {
  useCallback,
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

  const setAuthenticated = useCallback((accessToken: string) => {
    authRevisionRef.current += 1
    setAccessToken(accessToken)
    setStatus('authenticated')
  }, [])

  const clearAuthentication = useCallback(() => {
    authRevisionRef.current += 1
    clearAccessToken()
    setStatus('unauthenticated')
  }, [])

  useEffect(() => {
    let mounted = true
    const requestRevision = ++authRevisionRef.current
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

    if (currentPath.endsWith('/auth/kakao/callback')) {
      return () => {
        mounted = false
      }
    }

    const bootstrapAuth = async () => {
      try {
        const refreshedAccessToken = await refreshAdminAccessToken()
        if (!mounted || authRevisionRef.current !== requestRevision) {
          return
        }
        setAccessToken(refreshedAccessToken)
        setStatus('authenticated')
      } catch {
        if (!mounted || authRevisionRef.current !== requestRevision) {
          return
        }
        clearAccessToken()
        setStatus('unauthenticated')
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
      setAuthenticated,
      clearAuthentication,
    }),
    [clearAuthentication, setAuthenticated, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
