import { weekdayOf } from '@lww/shared'

const HEAD = ['일', '월', '화', '수', '목', '금', '토']

// 예식이 있는 달의 달력. 서버에서 그린다.
export function Calendar({ date }: { date: string }) {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  const first = weekdayOf(`${y}-${String(m).padStart(2, '0')}-01`)
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return (
    <div className="cal" aria-label={`${y}년 ${m}월 달력`}>
      {HEAD.map((h, i) => (
        <div key={h} className={`cal-head${i === 0 ? ' sun' : ''}`}>
          {h}
        </div>
      ))}
      {Array.from({ length: first }, (_, i) => (
        <div key={`b${i}`} />
      ))}
      {Array.from({ length: days }, (_, i) => (
        <div key={i} className={`cal-day${i + 1 === d ? ' on' : ''}`}>
          {i + 1}
        </div>
      ))}
    </div>
  )
}
