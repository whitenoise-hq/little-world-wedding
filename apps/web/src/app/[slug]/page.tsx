import { daysUntil, formatCeremonyKo, formatCeremonyShort, isValidSlug, THEME_UI, type Person } from '@lww/shared'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { Accounts } from '@/components/accounts'
import { Calendar } from '@/components/calendar'
import { Contacts } from '@/components/contacts'
import { CopyChip } from '@/components/copy-chip'
import { Gallery } from '@/components/gallery'
import { Guestbook } from '@/components/guestbook'
import { PinIcon } from '@/components/icons'
import { Intro } from '@/components/intro'
import { guestbook, invitations, photos } from '@/lib/repositories'

// 1단계: 게임 없이 세로로 읽는 일반 청첩장. 2단계에서 게임 화면을 이 위에 붙인다.

const load = cache(async (slug: string) => (isValidSlug(slug) ? invitations.getPublishedBySlug(slug) : null))

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const inv = await load((await params).slug)
  if (!inv) return {}
  const { groom, bride, ceremony } = inv.content
  const title = `${groom.firstName} ♥ ${bride.firstName} 결혼합니다`
  const description = `${formatCeremonyKo(ceremony.date, ceremony.time)} · ${ceremony.venueName}`
  const cover = inv.coverPhotoId ? (await photos.list(inv.id)).find((p) => p.id === inv.coverPhotoId) : undefined
  // 카톡 미리보기는 절대 주소 이미지만 읽는다. 목업 사진(data URL)은 건너뛴다.
  const image = cover?.fullUrl.startsWith('http') ? cover.fullUrl : undefined
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', ...(image ? { images: [image] } : {}) },
  }
}

function parentsLine(p: Person, child: '아들' | '딸') {
  const names = [p.father.name, p.mother.name].filter(Boolean).join(' · ')
  return (
    <>
      {names && `${names}의 ${child} `}
      <span style={{ color: 'var(--ink)' }}>{p.firstName}</span>
    </>
  )
}

export default async function InvitationPage({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params
  const inv = await load(slug)
  if (!inv) notFound()

  const [photoList, entries] = await Promise.all([photos.list(inv.id), guestbook.list(inv.id)])
  const { groom, bride, intro, greeting, ceremony, directions, accounts } = inv.content
  const ui = THEME_UI[inv.theme]
  const dday = daysUntil(ceremony.date)
  const q = encodeURIComponent(ceremony.address)
  const kakao =
    ceremony.lat !== null && ceremony.lng !== null
      ? `https://map.kakao.com/link/to/${encodeURIComponent(ceremony.venueName)},${ceremony.lat},${ceremony.lng}`
      : `https://map.kakao.com/link/search/${q}`

  return (
    <>
      <Intro
        slug={slug}
        tagline={ui.tagline}
        names={[groom.firstName, bride.firstName]}
        date={formatCeremonyShort(ceremony.date, ceremony.time)}
        message={intro.message}
        bg={ui.introBg}
        accent={ui.introAccent}
      />

      <main className="inv" style={{ '--header': ui.header } as React.CSSProperties}>
        <header className="cover">
          <div className="cover-tag">{ui.tagline}</div>
          <div className="cover-names">
            {groom.firstName} <span className="heart">♥</span> {bride.firstName}
          </div>
          <div className="cover-date">{formatCeremonyShort(ceremony.date, ceremony.time)}</div>
        </header>

        <section className="sec center">
          <h2>✦ 초대합니다 ✦</h2>
          {greeting.text && <p className="body">{greeting.text}</p>}
          <p className="small sub" style={{ margin: '16px 0 0' }}>
            {parentsLine(groom, '아들')}
            <br />
            {parentsLine(bride, '딸')}
          </p>
        </section>

        <section className="sec">
          <h2>✦ 예식 일시</h2>
          <div style={{ fontSize: 13 }}>{formatCeremonyKo(ceremony.date, ceremony.time)}</div>
          <div className="accent" style={{ fontSize: 11, marginTop: 6 }}>
            {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : '예식을 마쳤어요'}
          </div>
          <Calendar date={ceremony.date} />
        </section>

        <section className="sec">
          <h2>✦ 예식 장소</h2>
          <div style={{ fontSize: 13 }}>
            {ceremony.venueName} {ceremony.hall}
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className="small sub">{ceremony.address}</span>
            <CopyChip value={ceremony.address} small />
          </div>
          <div className="map cut">
            <PinIcon size={24} style={{ color: 'var(--accent)' }} />
            지도는 연결 후 표시돼요
          </div>
          <div className="grid3">
            <a className="chip cut" href={kakao} target="_blank" rel="noreferrer">
              카카오맵
            </a>
            <a className="chip cut" href={`https://map.naver.com/p/search/${q}`} target="_blank" rel="noreferrer">
              네이버지도
            </a>
            <a className="chip cut" href={`tmap://search?name=${encodeURIComponent(ceremony.venueName)}`}>
              티맵
            </a>
          </div>
        </section>

        {directions.length > 0 && (
          <section className="sec">
            <h2>✦ 오시는 길</h2>
            <div className="small">
              {directions.map((d, i) => (
                <div key={i}>
                  <span className="accent">{d.label}</span> {d.text}
                </div>
              ))}
            </div>
          </section>
        )}

        <Contacts groom={groom} bride={bride} />
        <Accounts groom={accounts.groom} bride={accounts.bride} />
        <Gallery photos={photoList} />
        <Guestbook slug={slug} initial={entries} />

        <footer className="foot">
          {groom.firstName} <span className="heart">♥</span> {bride.firstName}
        </footer>
      </main>
    </>
  )
}
