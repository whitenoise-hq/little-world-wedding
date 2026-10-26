import { formatCeremonyKo, formatCeremonyShort, isValidSlug, THEME_IDS, THEME_UI, type ThemeId } from '@lww/shared'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { GameLoader } from '@/components/game/game-loader'
import { Gallery } from '@/components/gallery'
import { Guestbook } from '@/components/guestbook'
import { HomeContent } from '@/components/home-content'
import { Intro } from '@/components/intro'
import { Section } from '@/components/section'
import { getGuestbook, getInvitationBySlug, getPhotosSafe } from '@/lib/cached'

// 인트로 → 게임 화면. 장소에 들어가면 모달로 청첩장 내용을 보여준다.
// 인트로의 "청첩장 바로 보기"는 같은 내용을 한 화면(전체화면 모달)에 이어서 보여준다.

// 청첩장·사진은 캐시에서 읽는다 (lib/cached.ts). cache(): 메타데이터와 페이지가 같은 요청에서 두 번 읽지 않게 한다.
const load = cache(async (slug: string) => (isValidSlug(slug) ? getInvitationBySlug(slug) : null))
const loadPhotos = cache((invitationId: string) => getPhotosSafe(invitationId))

// 개발 환경에서만: ?theme={id}로 다른 테마를 입혀 본다 (docs/ART_GUIDE.md 7장 "새 테마 추가 순서").
// 배포에서는 searchParams를 읽지 않아 페이지 동작이 그대로다.
async function previewTheme(searchParams: Promise<Record<string, string | string[] | undefined>>, theme: ThemeId): Promise<ThemeId> {
  if (process.env.NODE_ENV !== 'development') return theme
  const want = (await searchParams).theme
  return THEME_IDS.find((id) => id === want) ?? theme
}

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const inv = await load((await params).slug)
  if (!inv) return { title: '청첩장을 찾을 수 없습니다 · 리틀 월드 웨딩' }
  const { groom, bride, ceremony } = inv.content
  const title = `${groom.firstName} ♥ ${bride.firstName} 결혼합니다`
  const description = `${formatCeremonyKo(ceremony.date, ceremony.time)} · ${ceremony.venueName}`
  // 대표 사진을 지정하지 않았으면 첫 번째 사진을 쓴다
  const list = await loadPhotos(inv.id)
  const cover = list.find((p) => p.id === inv.coverPhotoId) ?? list[0]
  // 카톡 미리보기는 절대 주소 이미지만 읽는다.
  const image = cover?.fullUrl.startsWith('http') ? cover.fullUrl : undefined
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', ...(image ? { images: [image] } : {}) },
  }
}

export default async function InvitationPage({ params, searchParams }: PageProps<'/[slug]'>) {
  const { slug } = await params
  const inv = await load(slug)
  if (!inv) notFound()

  const [photoList, entries] = await Promise.all([loadPhotos(inv.id), getGuestbook(inv.id)])
  const { groom, bride, ceremony } = inv.content
  const theme = await previewTheme(searchParams, inv.theme)
  const ui = THEME_UI[theme]
  const names: [string, string] = [groom.firstName, bride.firstName]
  const date = formatCeremonyShort(ceremony.date, ceremony.time)
  const home = <HomeContent content={inv.content} />
  const gallery = <Gallery photos={photoList} />
  const guestbook = <Guestbook slug={slug} theme={theme} initial={entries} />

  return (
    <>
      <GameLoader
        theme={theme}
        names={names}
        date={date}
        tagline={ui.tagline}
        taglineColor={ui.taglineColor}
        accent={ui.accent}
        bgmUrl={inv.content.decor.bgmUrl}
        entries={entries}
        contents={{ home, photo: gallery, guestbook }}
      />
      <Intro
        slug={slug}
        tagline={ui.tagline}
        names={names}
        date={date}
        bg={ui.introBg}
        accent={ui.accent}
        card={
          <>
            {home}
            {photoList.length > 0 && (
              <Section label="GALLERY" title="사진">
                {gallery}
              </Section>
            )}
            <Section label="GUESTBOOK" title="방명록">
              {guestbook}
            </Section>
          </>
        }
      />
    </>
  )
}
