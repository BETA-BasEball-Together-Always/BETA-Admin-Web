export function DashboardPage() {
  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h1 className="page-title">대시보드</h1>
        <p className="page-subtitle">좌측 메뉴를 누르면 오른쪽 콘텐츠 영역만 교체됩니다.</p>
      </header>

      <section className="admin-metric-grid">
        <article className="surface admin-metric-card">
          <p className="admin-metric-label">총 회원 수</p>
          <p className="admin-metric-value">12,456</p>
          <p className="admin-metric-delta text-green-500">+234</p>
        </article>
        <article className="surface admin-metric-card">
          <p className="admin-metric-label">오늘 게시물</p>
          <p className="admin-metric-value">89</p>
          <p className="admin-metric-delta text-green-500">+23</p>
        </article>
        <article className="surface admin-metric-card">
          <p className="admin-metric-label">처리 대기 신고</p>
          <p className="admin-metric-value">5</p>
          <p className="admin-metric-delta text-red-400">-2</p>
        </article>
        <article className="surface admin-metric-card">
          <p className="admin-metric-label">활성 채널</p>
          <p className="admin-metric-value">8</p>
          <p className="admin-metric-delta text-green-500">+1</p>
        </article>
      </section>

      <article className="surface admin-feed-panel">
        <h2 className="admin-feed-title">실시간 피드 모니터링</h2>
        <p className="page-subtitle">
          TODO : 실제 API 연결 후 목록/필터/페이징을 이 영역에 붙이기
        </p>
        <div className="surface-muted admin-feed-placeholder">
          <p className="text-muted">피드 리스트 자리</p>
        </div>
      </article>
    </section>
  )
}
