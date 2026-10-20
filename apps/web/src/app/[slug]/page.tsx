import { formatCeremonyKo, formatCeremonyShort, isValidSlug, THEME_UI } from '@lww/shared'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { GameLoader } from '@/components/game/game-loader'
import { Gallery } from '@/components/gallery'
import { Guestbook } from '@/components/guestbook'
import { HomeContent } from '@/components/home-content'
import { Intro } from '@/components/intro'
import { getGuestbook, getInvitationBySlug, getPhotos } from '@/lib/cached'

// 인트로 → 게임 화면. 장소에 들어가면 모달로 청첩장 내용을 보여준다.

// 청첩장·사진은 캐시에서 읽는다 (lib/cached.ts). cache(): 메타데이터와 페이지가 같은 요청에서 두 번 읽지 않게 한다.
const load = cache(async (slug: string) => (isValidSlug(slug) ? getInvitationBySlug(slug) : null))
const loadPhotos = cache((invitationId: string) => getPhotos(invitationId))

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const inv = await load((await params).slug)
  if (!inv) return { title: '청첩장을 찾을 수 없습니다 · 리틀 월드 웨딩' }
  const { groom, bride, ceremony } = inv.content
  const title = `${groom.firstName} ♥ ${bride.firstName} 결혼합니다`
  const description = `${formatCeremonyKo(ceremony.date, ceremony.time)} · ${ceremony.venueName}`
  // 대표 사진을 지정하지 않았으면 첫 번째 사진을 쓴다
  const list = await loadPhotos(inv.id)
  const cover = list.find((p) => p.id === inv.coverPhotoId) ?? list[0]
  // 카톡 미리보기는 절대 주소 이미지만 읽는다. 목업 사진(data URL)은 건너뛴다.
  const image = cover?.fullUrl.startsWith('http') ? cover.fullUrl : undefined
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', ...(image ? { images: [image] } : {}) },
  }
}

export default async function InvitationPage({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params
  const inv = await load(slug)
  if (!inv) notFound()

  const [photoList, entries] = await Promise.all([loadPhotos(inv.id), getGuestbook(inv.id)])
  const { groom, bride, ceremony } = inv.content
  const ui = THEME_UI[inv.theme]
  const names: [string, string] = [groom.firstName, bride.firstName]
  const date = formatCeremonyShort(ceremony.date, ceremony.time)

  return (
    <>
      <GameLoader
        theme={inv.theme}
        names={names}
        date={date}
        tagline={ui.tagline}
        taglineColor={ui.taglineColor}
        accent={ui.accent}
        bgmUrl={inv.content.decor.bgmUrl}
        entries={entries}
        contents={{
          home: <HomeContent content={inv.content} />,
          photo: <Gallery photos={photoList} />,
          guestbook: <Guestbook slug={slug} theme={inv.theme} initial={entries} />,
        }}
      />
      <Intro slug={slug} tagline={ui.tagline} names={names} date={date} bg={ui.introBg} />
    </>
  )
}
