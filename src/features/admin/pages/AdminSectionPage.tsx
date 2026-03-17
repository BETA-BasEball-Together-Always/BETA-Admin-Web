import { AlertCircle } from 'lucide-react'

type AdminSectionPageProps = {
  title: string
  description: string
  variant?: 'comments' | 'members' | 'posts'
}

export function AdminSectionPage({ title, description }: AdminSectionPageProps) {
  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h1 className="page-title admin-page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </header>

      <article className="surface admin-placeholder-panel">
        <div className="admin-feed-placeholder">
          <div className="text-center">
            <div className="admin-panel-badge inline-flex items-center gap-2">
              <AlertCircle aria-hidden strokeWidth={2} className="h-4 w-4" />
              <span>준비 중</span>
            </div>
            <p className="admin-placeholder-title mt-4">{title} 페이지 준비 중</p>
            <p className="text-muted">1차 배포 범위에서 제외된 기능입니다.</p>
          </div>
        </div>
      </article>
    </section>
  )
}
