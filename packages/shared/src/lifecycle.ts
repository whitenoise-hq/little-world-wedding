// 고객 청첩장 이용기간: 예식일 + 3개월 (docs/PLANNING.md 7장 "이용기간 만료").
// 날짜는 한국 날짜 문자열(YYYY-MM-DD)로 다룬다.
export const RETENTION_MONTHS = 3

const pad = (n: number) => String(n).padStart(2, '0')

// 예식일 + 3개월. 그달에 같은 날이 없으면 말일(11-30 → 02-28/29). 날짜가 잘못되면 null.
export function expiryDate(ceremonyDate: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ceremonyDate)
  if (!match) return null
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const total = y * 12 + (m - 1) + RETENTION_MONTHS
  const ey = Math.floor(total / 12)
  const em = (total % 12) + 1
  const lastDay = new Date(Date.UTC(ey, em, 0)).getUTCDate()
  return `${ey}-${pad(em)}-${pad(Math.min(d, lastDay))}`
}

// 만료일 다음 날부터 만료. 예식일이 없으면 만료로 보지 않는다.
export function isExpired(ceremonyDate: string, today: string): boolean {
  const end = expiryDate(ceremonyDate)
  return end !== null && today > end
}

// 오늘 날짜(한국 시간)
export function todayKst(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 3_600_000)
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}`
}
