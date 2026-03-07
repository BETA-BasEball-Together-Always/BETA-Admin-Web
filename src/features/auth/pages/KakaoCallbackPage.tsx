import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@app/providers/useAuth'
import { toApiError } from '@shared/api/apiError'
import {
  exchangeKakaoCodeForAccessToken,
  loginAdminWithKakao,
} from '@shared/api/adminAuthApi'
import {
  consumeKakaoOauthState,
} from '@shared/auth/tokenStorage'
import { getKakaoOauthConfig } from '@shared/config/authConfig'

type CallbackState = {
  loading: boolean
  message: string
}

const INITIAL_STATE: CallbackState = {
  loading: true,
  message: '카카오 로그인 처리 중입니다...',
}

export function KakaoCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthenticated, clearAuthentication } = useAuth()
  const [state, setState] = useState<CallbackState>(INITIAL_STATE)

  useEffect(() => {
    let cancelled = false

    const completeLogin = async () => {
      try {
        const kakaoConfig = getKakaoOauthConfig()
        if (!kakaoConfig) {
          throw new Error('카카오 로그인 환경변수 설정이 없습니다.')
        }

        const searchParams = new URLSearchParams(location.search)
        const code = searchParams.get('code')
        const oauthState = searchParams.get('state')
        const oauthError = searchParams.get('error')
        const oauthErrorDescription = searchParams.get('error_description')

        if (oauthError) {
          if (oauthErrorDescription) {
            throw new Error(`${oauthError}: ${oauthErrorDescription}`)
          }
          throw new Error('카카오 로그인 인증이 취소되었거나 실패했습니다.')
        }

        if (!code || !oauthState) {
          throw new Error('카카오 인가 코드가 없습니다. 다시 로그인해주세요.')
        }

        const storedState = consumeKakaoOauthState()
        if (!storedState || storedState !== oauthState) {
          throw new Error('잘못된 로그인 요청입니다. 다시 시도해주세요.')
        }

        const kakaoAccessToken = await exchangeKakaoCodeForAccessToken(kakaoConfig, code)
        if (cancelled) {
          return
        }
        const loginResponse = await loginAdminWithKakao(kakaoAccessToken)
        if (cancelled) {
          return
        }
        setAuthenticated(loginResponse.accessToken)
        navigate('/', { replace: true })
      } catch (error) {
        if (cancelled) {
          return
        }
        clearAuthentication()
        const apiError = toApiError(error)
        setState({
          loading: false,
          message: apiError.message,
        })
      }
    }

    void completeLogin()

    return () => {
      cancelled = true
    }
  }, [clearAuthentication, location.search, navigate, setAuthenticated])

  return (
    <main className="app-page flex items-center justify-center">
      <section className="surface w-full max-w-md p-6 md:p-8 text-center">
        <h1 className="page-title auth-title">
          <span className="auth-title-sub">Admin Login</span>
        </h1>
        <p className="page-subtitle mt-4">{state.message}</p>
        {!state.loading ? (
          <button className="btn-base btn-neutral mt-5" onClick={() => navigate('/login', { replace: true })} type="button">
            로그인 페이지로 이동
          </button>
        ) : null}
      </section>
    </main>
  )
}
