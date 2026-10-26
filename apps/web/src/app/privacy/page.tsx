import type { Metadata } from 'next'
import { PrivacyContent } from '@/components/privacy-content'

// 주소로 여는 개인정보 처리방침. 스토어 상세·톡톡 안내·없는 페이지에서 이 주소를 쓴다.
// 하객 화면 안에서는 같은 내용을 모달로 띄운다(components/privacy-link.tsx).
export const metadata: Metadata = {
  title: '개인정보 처리방침 · 리틀 월드 웨딩',
  robots: { index: false, follow: false },
}

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <PrivacyContent />
    </main>
  )
}
