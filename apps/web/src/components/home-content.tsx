import { daysUntil, formatDateKo, formatTimeKo, type InvitationContent } from '@lww/shared'
import { Accounts } from './accounts'
import { Calendar } from './calendar'
import { Contacts } from './contacts'
import { CopyButton } from './copy-chip'
import { PinIcon } from './icons'
import { Section } from './section'

// "집" 모달 내용: 인사말, 예식 일시, 장소·오시는 길, 연락처, 계좌. 서버에서 그린다.

export function HomeContent({ content }: { content: InvitationContent }) {
  const { groom, bride, greeting, ceremony, directions, accounts } = content
  const dday = daysUntil(ceremony.date)
  const q = encodeURIComponent(ceremony.address)
  const kakao =
    ceremony.lat !== null && ceremony.lng !== null
      ? `https://map.kakao.com/link/to/${encodeURIComponent(ceremony.venueName)},${ceremony.lat},${ceremony.lng}`
      : `https://map.kakao.com/link/search/${q}`

  return (
    <>
      <Section label="INVITATION" title="초대합니다" center>
        {greeting.text && <p className="text">{greeting.text}</p>}
      </Section>

      <Section label="WEDDING DAY" title="예식 일시" center>
        <div className="big-date">
          {formatDateKo(ceremony.date)}
          <br />
          {formatTimeKo(ceremony.time)}
        </div>
        <div className="dday">{dday > 0 ? `예식까지 ${dday}일 남았습니다` : dday === 0 ? '오늘 예식이 있습니다' : '예식을 마쳤습니다'}</div>
        <Calendar date={ceremony.date} />
      </Section>

      <Section label="LOCATION" title="오시는 길">
        <div className="venue">
          {ceremony.venueName} {ceremony.hall}
        </div>
        <div className="row between" style={{ marginTop: 6 }}>
          <span className="small sub">{ceremony.address}</span>
          <CopyButton value={ceremony.address} label="주소 복사" />
        </div>
        <div className="map">
          <PinIcon size={22} style={{ color: 'var(--accent)' }} />
          지도는 준비 중입니다
        </div>
        <div className="grid2">
          <a className="btn" href={kakao} target="_blank" rel="noreferrer">
            카카오맵
          </a>
          <a className="btn" href={`https://map.naver.com/p/search/${q}`} target="_blank" rel="noreferrer">
            네이버지도
          </a>
        </div>
        {directions.length > 0 && (
          <div className="directions">
            {directions.map((d, i) => (
              <div key={i}>
                <div className="direction-label">{d.label}</div>
                <div className="small sub">{d.text}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Contacts groom={groom} bride={bride} />
      <Accounts groom={accounts.groom} bride={accounts.bride} />
    </>
  )
}
