import { z } from 'zod'
import { SLUG_LENGTH } from './slug'
import { THEME_IDS } from './themes'

// 청첩장 데이터. DB 구조 설명은 docs/PLANNING.md 8장 "데이터 구조 (초안)".

const phone = z
  .string()
  .trim()
  .regex(/^[0-9-]*$/, '숫자와 - 만 입력해 주세요')
  .max(20)

export const parentSchema = z.object({
  name: z.string().trim().max(20),
  phone,
  showPhone: z.boolean(),
})

export const personSchema = z.object({
  fullName: z.string().trim().min(1, '이름을 입력해 주세요').max(20), // 성 포함 (예: 김원재)
  firstName: z.string().trim().min(1, '이름표에 쓸 이름을 입력해 주세요').max(10), // 이름표용 (예: 원재)
  phone,
  showPhone: z.boolean(),
  father: parentSchema,
  mother: parentSchema,
})

export const ceremonySchema = z.object({
  date: z.iso.date('날짜를 입력해 주세요'), // 2027-05-22
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시간을 입력해 주세요'), // 12:30 (한국 시간)
  venueName: z.string().trim().min(1, '예식장 이름을 입력해 주세요').max(40),
  hall: z.string().trim().max(40),
  address: z.string().trim().min(1, '주소를 입력해 주세요').max(100),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
})

export const directionSchema = z.object({
  label: z.string().trim().min(1, '항목 이름을 입력해 주세요').max(10), // 지하철, 버스, 주차 등
  text: z.string().trim().min(1, '내용을 입력해 주세요').max(200),
})

export const accountSchema = z.object({
  relation: z.string().trim().min(1).max(10), // 신랑, 아버지, 어머니 등
  holder: z.string().trim().min(1, '예금주를 입력해 주세요').max(20),
  bank: z.string().trim().min(1, '은행을 입력해 주세요').max(20),
  number: z.string().trim().min(1, '계좌번호를 입력해 주세요').max(30),
  kakaoPayUrl: z.union([z.url(), z.literal('')]),
  visible: z.boolean(),
})

export const invitationContentSchema = z.object({
  groom: personSchema,
  bride: personSchema,
  greeting: z.object({ text: z.string().trim().max(500) }),
  ceremony: ceremonySchema,
  directions: z.array(directionSchema).max(10),
  accounts: z.object({
    groom: z.array(accountSchema).max(5),
    bride: z.array(accountSchema).max(5),
  }),
  decor: z.object({ bgmUrl: z.union([z.url(), z.literal('')]) }),
})

export type Parent = z.infer<typeof parentSchema>
export type Person = z.infer<typeof personSchema>
export type Ceremony = z.infer<typeof ceremonySchema>
export type Direction = z.infer<typeof directionSchema>
export type Account = z.infer<typeof accountSchema>
export type InvitationContent = z.infer<typeof invitationContentSchema>

export const invitationSchema = z.object({
  id: z.string(),
  slug: z.string().length(SLUG_LENGTH),
  theme: z.enum(THEME_IDS),
  isPublished: z.boolean(),
  content: invitationContentSchema,
  coverPhotoId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Invitation = z.infer<typeof invitationSchema>

// 청첩장 하나에 올릴 수 있는 사진 수
export const MAX_PHOTOS = 30

export interface Photo {
  id: string
  invitationId: string
  thumbUrl: string
  fullUrl: string
  caption: string
  sortOrder: number
}

export interface GuestbookEntry {
  id: string
  invitationId: string
  name: string
  message: string
  createdAt: string
}

const emptyParent = (): Parent => ({ name: '', phone: '', showPhone: false })
const emptyPerson = (): Person => ({
  fullName: '',
  firstName: '',
  phone: '',
  showPhone: true,
  father: emptyParent(),
  mother: emptyParent(),
})

// 새 청첩장을 만들 때의 기본 내용
export function emptyInvitationContent(): InvitationContent {
  return {
    groom: emptyPerson(),
    bride: emptyPerson(),
    greeting: { text: '' },
    ceremony: { date: '', time: '12:00', venueName: '', hall: '', address: '', lat: null, lng: null },
    directions: [
      { label: '지하철', text: '' },
      { label: '버스', text: '' },
      { label: '주차', text: '' },
    ],
    accounts: { groom: [], bride: [] },
    decor: { bgmUrl: '' },
  }
}
