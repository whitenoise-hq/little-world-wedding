// 날짜·시간 표시. 예식 시각은 한국 시간 기준 문자열(2027-05-22, 12:30)로 저장한다.

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
const WEEKDAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

function parts(date: string) {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return { y, m, d, weekday }
}

// 2027년 5월 22일 토요일 낮 12시 30분
export function formatCeremonyKo(date: string, time: string): string {
  const { y, m, d, weekday } = parts(date)
  const [hh = 0, mm = 0] = time.split(':').map(Number)
  const period = hh < 12 ? '오전' : hh < 17 ? '낮' : hh < 19 ? '오후' : '저녁'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${y}년 ${m}월 ${d}일 ${WEEKDAYS[weekday]}요일 ${period} ${h12}시${mm ? ` ${mm}분` : ''}`
}

// 2027.05.22 SAT 12:30
export function formatCeremonyShort(date: string, time: string): string {
  const { y, m, d, weekday } = parts(date)
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} ${WEEKDAYS_EN[weekday]} ${time}`
}

// 오늘(한국 시간) 기준 D-day. 지났으면 음수.
export function daysUntil(date: string, now: Date = new Date()): number {
  const { y, m, d } = parts(date)
  const kst = new Date(now.getTime() + 9 * 3600_000)
  const today = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate())
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000)
}

export function weekdayOf(date: string): number {
  return parts(date).weekday
}
