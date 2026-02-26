import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './RequireAuth'
import { AdminLayout } from '@features/admin/layouts/AdminLayout'
import { AdminSectionPage } from '@features/admin/pages/AdminSectionPage'
import { DashboardPage } from '@features/admin/pages/DashboardPage'
import { LoginPage } from '@features/auth/pages/LoginPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
          element={<AdminSectionPage title="채널 관리" description="채널 목록 및 상태를 관리하는 영역입니다." />}
        />
        <Route
          path="members"
          element={<AdminSectionPage title="회원 관리" description="회원 계정 및 권한을 관리하는 영역입니다." />}
        />
        <Route
          path="posts"
          element={<AdminSectionPage title="게시물 관리" description="게시물 검수/숨김/삭제를 처리하는 영역입니다." />}
        />
        <Route
          path="comments"
          element={<AdminSectionPage title="댓글 관리" description="댓글 모니터링과 제재 처리를 진행하는 영역입니다." />}
        />
        <Route
          path="reports"
          element={<AdminSectionPage title="신고 관리" description="신고 접수 건을 확인하고 조치하는 영역입니다." />}
        />
        <Route
          path="notices"
          element={<AdminSectionPage title="공지 관리" description="공지 작성 및 노출 설정을 관리하는 영역입니다." />}
        />
        <Route
          path="audit-logs"
          element={<AdminSectionPage title="감사 로그" description="관리자 액션 로그를 확인하는 영역입니다." />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
