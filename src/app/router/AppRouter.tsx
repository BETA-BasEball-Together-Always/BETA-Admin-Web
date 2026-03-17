import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './RequireAuth'
import { AdminLayout } from '@features/admin/layouts/AdminLayout'
import { AdminLogPage } from '@features/admin/pages/AdminLogPage'
import { CommentManagementPage } from '@features/admin/pages/CommentManagementPage'
import { AdminSectionPage } from '@features/admin/pages/AdminSectionPage'
import { DashboardPage } from '@features/admin/pages/DashboardPage'
import { PostManagementPage } from '@features/admin/pages/PostManagementPage'
import { UserManagementPage } from '@features/admin/pages/UserManagementPage'
import { KakaoCallbackPage } from '@features/auth/pages/KakaoCallbackPage'
import { LoginPage } from '@features/auth/pages/LoginPage'

const ChannelOverviewPage = lazy(async () => {
  const module = await import('@features/admin/pages/ChannelOverviewPage')
  return { default: module.ChannelOverviewPage }
})

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route
          path="channels"
          element={(
            <Suspense fallback={null}>
              <ChannelOverviewPage />
            </Suspense>
          )}
        />
        <Route path="members" element={<UserManagementPage />} />
        <Route path="posts" element={<PostManagementPage />} />
        <Route path="comments" element={<CommentManagementPage />} />
        <Route
          path="reports"
          element={<AdminSectionPage title="신고 관리" description="신고 접수 건을 확인하고 조치하는 영역입니다." />}
        />
        <Route
          path="notices"
          element={<AdminSectionPage title="공지 관리" description="공지 작성 및 노출 설정을 관리하는 영역입니다." />}
        />
        <Route
          path="logs"
          element={<AdminLogPage />}
        />
        <Route path="audit-logs" element={<Navigate to="/logs" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
