import { z } from 'zod'

// 방명록은 이름·메시지만 받는다. 비밀번호 없음, 작성자 수정·삭제 없음.
export const GUESTBOOK_LIMITS = {
  name: 12,
  message: 120,
} as const

// 연속 작성 제한: 청첩장마다 같은 IP 기준. 모든 제한을 통과해야 쓸 수 있다. docs/PLANNING.md 4장 "방명록".
export const GUESTBOOK_RATE_LIMITS = [
  { windowMs: 60_000, max: 3, label: '1분에 3번' }, // 연달아 도배하는 것 막기
  { windowMs: 60 * 60_000, max: 10, label: '1시간에 10번' }, // 계속 올리는 스팸 막기
] as const

export const guestbookInputSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요').max(GUESTBOOK_LIMITS.name),
  message: z.string().trim().min(1, '메시지를 입력해 주세요').max(GUESTBOOK_LIMITS.message),
})

export type GuestbookInput = z.infer<typeof guestbookInputSchema>
