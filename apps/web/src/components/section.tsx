import type { ReactNode } from 'react'

// 영문 라벨 + 한국어 제목. docs/ART_GUIDE.md 6장 "섹션 제목".
export function Section({ label, title, center, children }: { label: string; title: string; center?: boolean; children: ReactNode }) {
  return (
    <section className={`section${center ? ' center' : ''}`}>
      <div className="section-label">{label}</div>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  )
}
