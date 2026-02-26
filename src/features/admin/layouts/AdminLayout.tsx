import {
  Activity,
  AlertCircle,
  Bell,
  ChevronLeft,
  FileText,
  Hash,
  House,
  LogOut,
  MessageSquare,
  Moon,
  Sun,
  type LucideIcon,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

type AdminMenu = {
  icon: LucideIcon
  label: string
  to: string
  end?: boolean
}

const ADMIN_MENUS: AdminMenu[] = [
  { icon: House, label: '홈(대시보드)', to: '/', end: true },
  { icon: Hash, label: '채널 관리', to: '/channels' },
  { icon: Users, label: '회원 관리', to: '/members' },
  { icon: FileText, label: '게시물 관리', to: '/posts' },
  { icon: MessageSquare, label: '댓글 관리', to: '/comments' },
  { icon: AlertCircle, label: '신고 관리', to: '/reports' },
  { icon: Bell, label: '공지 관리', to: '/notices' },
  { icon: Activity, label: '감사 로그', to: '/audit-logs' },
]

const SIDEBAR_COLLAPSED_KEY = 'beta-admin-web-sidebar-collapsed'
const THEME_STORAGE_KEY = 'beta-admin-web-theme'
type Theme = 'light' | 'dark'

export function AdminLayout() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme === 'light' ? 'light' : 'dark'
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true',
  )

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login', { replace: true })
  }

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((current) => {
      const next = !current
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

  const handleToggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  const isDarkMode = theme === 'dark'

  return (
    <div className={`admin-layout ${isSidebarCollapsed ? 'admin-layout-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <header className="admin-sidebar-header">
          <div className="admin-sidebar-header-row">
            <div className="admin-brand-block">
              <p className="admin-brand-title">BasEball Together Always</p>
              <p className="admin-brand-subtitle">관리자 페이지</p>
            </div>
            <button
              aria-label={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
              className={`admin-collapse-button ${isSidebarCollapsed ? 'is-collapsed' : ''}`}
              onClick={handleToggleSidebar}
              type="button"
            >
              <ChevronLeft aria-hidden className="admin-collapse-icon" strokeWidth={2} />
            </button>
          </div>
        </header>

        <nav className="admin-nav" aria-label="관리자 메뉴">
          {ADMIN_MENUS.map((menu) => (
            <NavLink
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'admin-nav-link-active' : ''}`
              }
              end={menu.end}
              key={menu.to}
              title={menu.label}
              to={menu.to}
            >
              <span className="admin-nav-main">
                <span aria-hidden className="admin-nav-icon">
                  <menu.icon strokeWidth={2} />
                </span>
                <span className="admin-nav-label">{menu.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-actions">
          <button
            aria-label={isDarkMode ? '라이트 모드로 변경' : '다크 모드로 변경'}
            className="btn-base btn-neutral admin-theme-toggle"
            onClick={handleToggleTheme}
            type="button"
          >
            <span aria-hidden className="admin-theme-icon">
              {isDarkMode ? <Sun strokeWidth={2} /> : <Moon strokeWidth={2} />}
            </span>
            <span className="admin-theme-label">{isDarkMode ? '라이트 모드' : '다크 모드'}</span>
          </button>

          <button className="btn-base btn-neutral admin-logout" onClick={handleLogout} type="button">
            <span aria-hidden className="admin-logout-icon">
              <LogOut strokeWidth={2} />
            </span>
            <span className="admin-logout-label">로그아웃</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
