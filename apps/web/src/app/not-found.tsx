import { BRIDE, CHARACTER_PALETTE, GROOM } from '@lww/engine'
import { TEMPLATE_SLUGS } from '@lww/shared'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PixelSprite } from '@/components/pixel-sprite'

// 없는 주소, 비공개 청첩장, 루트(/)로 들어왔을 때 보여주는 페이지.
// 하객에게는 주소를 다시 받아 달라고 안내하고, 구경하러 온 사람에게는 샘플 청첩장을 보여준다.

export const metadata: Metadata = {
  title: '청첩장을 찾을 수 없습니다 · 리틀 월드 웨딩',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="notfound">
      <div className="notfound-chars" aria-hidden="true">
        <PixelSprite rows={GROOM} palette={CHARACTER_PALETTE} scale={5} />
        <PixelSprite rows={BRIDE} palette={CHARACTER_PALETTE} scale={5} />
      </div>
      <h1 className="notfound-title">청첩장을 찾을 수 없습니다</h1>
      <p className="notfound-text">
        주소가 바뀌었거나 아직 공개되지 않은 청첩장일 수 있습니다.
        <br />
        청첩장을 보내 주신 분께 주소를 다시 확인해 주세요.
      </p>
      <div className="notfound-samples">
        <div className="notfound-label">LITTLE WORLD WEDDING</div>
        <p className="notfound-sub">게임처럼 둘러보는 픽셀아트 청첩장을 구경해 보세요.</p>
        <div className="notfound-links">
          <Link href={`/${TEMPLATE_SLUGS.village}`} className="notfound-link">
            마을 테마 보기
          </Link>
          <Link href={`/${TEMPLATE_SLUGS.space}`} className="notfound-link">
            우주 테마 보기
          </Link>
          <Link href={`/${TEMPLATE_SLUGS.airport}`} className="notfound-link">
            공항 테마 보기
          </Link>
        </div>
      </div>
      <Link href="/privacy" className="brand-foot notfound-privacy">
        개인정보처리방침
      </Link>
    </main>
  )
}
