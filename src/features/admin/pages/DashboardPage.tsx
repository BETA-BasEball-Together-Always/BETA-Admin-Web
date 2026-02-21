import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-8 text-zinc-900">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="mt-2 text-zinc-700">관리자 대시보드 기본 페이지입니다.</p>

      <div className="mt-6">
        <button
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50"
          onClick={handleLogout}
          type="button"
        >
          로그아웃
        </button>
      </div>
    </main>
  )
}
