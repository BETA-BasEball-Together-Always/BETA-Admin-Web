type AdminSectionPageProps = {
  title: string
  description: string
}

export function AdminSectionPage({ title, description }: AdminSectionPageProps) {
  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </header>

      <article className="surface admin-placeholder-panel">
        <p className="admin-placeholder-title">{title} 페이지</p>
        <p className="text-muted">TODO : 여기에 {title} 화면 콘텐츠를 채우기</p>
      </article>
    </section>
  )
}
