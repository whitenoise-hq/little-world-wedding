import { z } from 'zod'

// 방명록은 이름·메시지만 받는다. 비밀번호 없음, 작성자 수정·삭제 없음.
export const GUESTBOOK_LIMITS = {
  name: 12,
  message: 120,
} as const

export const guestbookInputSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요').max(GUESTBOOK_LIMITS.name),
  message: z.string().trim().min(1, '메시지를 입력해 주세요').max(GUESTBOOK_LIMITS.message),
})

export type GuestbookInput = z.infer<typeof guestbookInputSchema>
