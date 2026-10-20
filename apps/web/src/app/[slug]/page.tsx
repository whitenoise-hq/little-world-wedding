import { isValidSlug } from '@lww/shared'
import { notFound } from 'next/navigation'

// 1단계에서 청첩장 데이터를 불러와 인트로와 일반 청첩장 화면을 만든다.
export default async function InvitationPage({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params
  if (!isValidSlug(slug)) notFound()

  return (
    <main style={{ padding: 24 }}>
      <p>청첩장 /{slug}</p>
    </main>
  )
}
