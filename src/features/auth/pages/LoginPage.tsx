import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    localStorage.setItem('accessToken', 'dummy-admin-token')
    navigate('/', { replace: true })
  }

  return (
    <main className="app-page flex items-center justify-center">
      <section className="surface w-full max-w-md p-6 md:p-8">
        <h1 className="page-title auth-title">
          <span className="auth-title-main">BETA CD TEST</span>
          <span className="auth-title-sub">Admin Login</span>
        </h1>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="form-label" htmlFor="login-id">
              ID
            </label>
            <input
              autoComplete="username"
              className="input-base"
              id="login-id"
              name="loginId"
              placeholder="아이디를 입력하세요"
              type="text"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="input-base"
              id="login-password"
              name="password"
              placeholder="비밀번호를 입력하세요"
              type="password"
            />
          </div>

          <button className="btn-base btn-lg btn-primary w-full" type="submit">
            테스트 로그인
          </button>
        </form>
      </section>
    </main>
  )
}
