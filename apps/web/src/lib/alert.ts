import 'server-only'
import { serverEnv } from './env'

// 하객 화면 오류를 운영자에게 메일로 알린다 (Resend). docs/PLANNING.md 9장 "에러 알림".
// - 키나 받는 주소가 없으면 조용히 건너뛴다. 메일 보내기가 실패해도 하객 화면에는 영향이 없다.
// - 같은 오류는 10분에 한 번만 보낸다(서버 인스턴스마다 따로 센다).
// - 개인정보(방명록 내용, IP)는 넣지 않는다.

export interface AlertInput {
  where: string // 어디서 났는지: 서버, 청첩장 화면, 게임, 사진 목록 등
  message: string
  url?: string | undefined
  userAgent?: string | undefined
  digest?: string | undefined // Next.js 오류 번호 (서버 로그와 맞춰 볼 때)
  detail?: string | undefined
}

const DEDUPE_MS = 10 * 60_000
const sentAt = new Map<string, number>()

const timeFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'medium' })
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s)

// 사람이 읽기 쉬운 기기·브라우저 이름. 원문 user-agent도 같이 보낸다.
export function describeDevice(ua: string): string {
  const os = /iPhone|iPad/.test(ua) ? '아이폰' : /Android/.test(ua) ? '안드로이드' : /Mac OS X/.test(ua) ? '맥' : /Windows/.test(ua) ? '윈도우' : '알 수 없는 기기'
  const app = /KAKAOTALK/i.test(ua)
    ? '카카오톡 인앱'
    : /NAVER\(inapp/i.test(ua)
      ? '네이버 인앱'
      : /Instagram/i.test(ua)
        ? '인스타그램 인앱'
        : /SamsungBrowser/.test(ua)
          ? '삼성 인터넷'
          : /CriOS|Chrome/.test(ua)
            ? '크롬'
            : /Safari/.test(ua)
              ? '사파리'
              : '브라우저'
  return `${os} · ${app}`
}

function shouldSend(key: string, now: number): boolean {
  const last = sentAt.get(key)
  if (last !== undefined && now - last < DEDUPE_MS) return false
  if (sentAt.size > 200) for (const [k, t] of sentAt) if (now - t >= DEDUPE_MS) sentAt.delete(k)
  sentAt.set(key, now)
  return true
}

export async function sendAlert(input: AlertInput): Promise<void> {
  const { resendApiKey, alertEmailTo } = serverEnv
  if (!resendApiKey || !alertEmailTo) return
  const message = clip(input.message || '(메시지 없음)', 500)
  if (!shouldSend(`${input.where}|${input.digest ?? message}`, Date.now())) return

  const ua = input.userAgent ?? ''
  const lines = [
    `어디서: ${input.where}`,
    `주소: ${input.url ?? '-'}`,
    `시각: ${timeFmt.format(new Date())}`,
    `기기: ${ua ? describeDevice(ua) : '-'}`,
    '',
    `오류: ${message}`,
    ...(input.digest ? [`오류 번호(digest): ${input.digest}`] : []),
    ...(input.detail ? [`자세히: ${clip(input.detail, 500)}`] : []),
    '',
    `user-agent: ${ua ? clip(ua, 300) : '-'}`,
    '',
    '같은 오류는 10분 동안 다시 보내지 않습니다. Vercel 로그에서 자세한 내용을 볼 수 있습니다.',
  ]
  await sendMail(`${input.where} 오류 · ${input.url ?? ''}`, lines.join('\n'))
}

// 오류가 아닌 운영 알림(예: 이용기간이 지나 비공개로 바꾼 청첩장). 중복 거르기 없이 보낸다.
export async function sendNotice(subject: string, text: string): Promise<void> {
  await sendMail(subject, text)
}

async function sendMail(subject: string, text: string): Promise<void> {
  const { resendApiKey, alertEmailTo, alertEmailFrom } = serverEnv
  if (!resendApiKey || !alertEmailTo) return
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${resendApiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: alertEmailFrom, to: [alertEmailTo], subject: clip(`[리틀 월드 웨딩] ${subject}`, 120), text }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.error('알림 메일을 보내지 못했습니다', res.status, await res.text())
  } catch (e) {
    console.error('알림 메일을 보내지 못했습니다', e)
  }
}
