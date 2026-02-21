import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()

  const handleLogin = () => {
    localStorage.setItem('accessToken', 'dummy-admin-token')
    navigate('/admin', { replace: true })
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-zinc-900">
      <h1 className="text-2xl font-semibold">Admin Login</h1>
      <p className="mt-2 text-zinc-600">로그인이 필요한 페이지입니다.</p>

      <div className="mt-6">
        <button
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50"
          onClick={handleLogin}
          type="button"
        >
          테스트 로그인
        </button>
      </div>
    </main>
  )
}
