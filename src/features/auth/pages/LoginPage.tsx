import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@app/providers/useAuth'
import { createKakaoAuthorizeUrl } from '@shared/api/adminAuthApi'
import {
  createOauthState,
  saveKakaoOauthState,
} from '@shared/auth/tokenStorage'
import { getKakaoOauthConfig } from '@shared/config/authConfig'

export function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    isAuthenticated,
    isLoading,
  } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleKakaoLogin = () => {
    const kakaoConfig = getKakaoOauthConfig()

    if (!kakaoConfig) {
      setErrorMessage('카카오 로그인 환경변수(VITE_KAKAO_REST_API_KEY, VITE_KAKAO_REDIRECT_URI)를 확인해주세요.')
      return
    }

    const state = createOauthState()
    saveKakaoOauthState(state)
    window.location.href = createKakaoAuthorizeUrl(kakaoConfig, state)
  }

  return (
    <main className="app-page flex items-center justify-center">
      <section className="surface w-full max-w-md p-6 md:p-8">
        <h1 className="page-title auth-title">
          <span className="auth-title-main">BETA</span>
          <span className="auth-title-sub">Admin Login</span>
        </h1>

        <p className="page-subtitle mt-3 text-center">
          관리자 권한의 계정만 로그인할 수 있습니다.
        </p>

        <div className="mt-6 space-y-3">
          <button className="btn-base btn-lg btn-kakao w-full" onClick={handleKakaoLogin} type="button">
            관리자 카카오 로그인
          </button>
          {errorMessage ? (
            <p className="text-sm text-[rgb(var(--color-danger))]" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
