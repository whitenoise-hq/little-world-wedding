import type { GuestbookEntry, Invitation, Photo } from './invitation'
import { TEMPLATE_SLUGS } from './themes'

// 샘플(템플릿) 청첩장: 마을 1개, 우주 1개. 홍보용으로 공개해 두는 청첩장이다.
// - 목업 모드(Supabase 키 없음)에서 화면에 쓰인다.
// - `pnpm db:templates`로 실제 DB에 적용한다 (scripts/templates.mts).
// 전화번호·계좌는 실제로 연결되지 않는 가짜 값만 쓴다.

const PHOTO_COLORS = ['#9fc8a0', '#e8c4a8', '#b8c8e6', '#e6d4a2', '#cdb6e0', '#a8d8d0', '#ecbcbc', '#d6cfae', '#c4dca0', '#f0c8d8', '#b0d0e8', '#e0c0a0']

function placeholder(color: string, label: string, w: number, h: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="${Math.round(w / 12)}" fill="rgba(42,26,46,.6)" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const fakePhone = '010-0000-0000'

export const FIXTURE_INVITATIONS: Invitation[] = [
  {
    id: 'inv-1',
    slug: TEMPLATE_SLUGS.village,
    theme: 'village',
    isPublished: true,
    coverPhotoId: null,
    createdAt: '2026-10-01T10:00:00+09:00',
    updatedAt: '2026-10-20T21:00:00+09:00',
    content: {
      groom: {
        fullName: '최신랑',
        firstName: '신랑',
        phone: fakePhone,
        showPhone: true,
        father: { name: '최정훈', phone: fakePhone, showPhone: true },
        mother: { name: '이미숙', phone: fakePhone, showPhone: true },
      },
      bride: {
        fullName: '박신부',
        firstName: '신부',
        phone: fakePhone,
        showPhone: true,
        father: { name: '박성호', phone: fakePhone, showPhone: true },
        mother: { name: '최윤정', phone: fakePhone, showPhone: true },
      },
      greeting: {
        text: '바다가 보이는 작은 마을에서\n서로의 이웃이 되기로 했습니다.\n\n천천히 걷고, 자주 웃으며\n오래도록 함께하겠습니다.\n\n귀한 걸음으로 축복해 주시면\n더없는 기쁨으로 간직하겠습니다.',
      },
      ceremony: {
        date: '2027-05-22',
        time: '12:30',
        venueName: '리틀월드 웨딩홀',
        hall: '2층 바다홀',
        address: '서울특별시 중구 세종대로 110',
        lat: 37.5663,
        lng: 126.9779,
      },
      directions: [
        { label: '지하철', text: '1·2호선 시청역 5번 출구에서 도보 3분' },
        { label: '버스', text: '시청 정류장 하차 (간선 402, 405)' },
        { label: '주차', text: '건물 지하 주차장 2시간 무료' },
      ],
      accounts: {
        groom: [
          { relation: '신랑', holder: '최신랑', bank: '국민은행', number: '000000-00-000000', kakaoPayUrl: '', visible: true },
          { relation: '아버지', holder: '최정훈', bank: '신한은행', number: '000-000-000000', kakaoPayUrl: '', visible: true },
          { relation: '어머니', holder: '이미숙', bank: '우리은행', number: '0000-000-000000', kakaoPayUrl: '', visible: true },
        ],
        bride: [
          { relation: '신부', holder: '박신부', bank: '카카오뱅크', number: '0000-00-0000000', kakaoPayUrl: '', visible: true },
          { relation: '아버지', holder: '박성호', bank: '농협은행', number: '000-0000-0000-00', kakaoPayUrl: '', visible: true },
          { relation: '어머니', holder: '최윤정', bank: '하나은행', number: '000-000000-00000', kakaoPayUrl: '', visible: true },
        ],
      },
      decor: { bgmUrl: '' },
    },
  },
  {
    id: 'inv-2',
    slug: TEMPLATE_SLUGS.space,
    theme: 'space',
    isPublished: true,
    coverPhotoId: null,
    createdAt: '2026-10-15T14:00:00+09:00',
    updatedAt: '2026-10-20T21:00:00+09:00',
    content: {
      groom: {
        fullName: '최신랑',
        firstName: '신랑',
        phone: fakePhone,
        showPhone: true,
        father: { name: '최상민', phone: fakePhone, showPhone: true },
        mother: { name: '정수진', phone: fakePhone, showPhone: true },
      },
      bride: {
        fullName: '박신부',
        firstName: '신부',
        phone: fakePhone,
        showPhone: true,
        father: { name: '박경호', phone: fakePhone, showPhone: true },
        mother: { name: '오미숙', phone: fakePhone, showPhone: true },
      },
      greeting: {
        text: '서로 다른 별에서 온 두 사람이\n같은 행성에 작은 집을 짓기로 했습니다.\n\n먼 길 오시는 걸음이 아깝지 않도록\n정성껏 준비하겠습니다.\n\n저희가 그려 갈 새로운 궤도를\n따뜻한 마음으로 지켜봐 주세요.',
      },
      ceremony: {
        date: '2027-09-11',
        time: '14:00',
        venueName: '리틀월드 컨벤션',
        hall: '3층 오로라홀',
        address: '부산광역시 해운대구 해운대해변로 264',
        lat: null,
        lng: null,
      },
      directions: [
        { label: '지하철', text: '2호선 해운대역 3번 출구에서 도보 10분' },
        { label: '버스', text: '해운대해수욕장 정류장 하차 (1001, 1003)' },
        { label: '주차', text: '건물 지하 주차장 3시간 무료' },
      ],
      accounts: {
        groom: [
          { relation: '신랑', holder: '최신랑', bank: '신한은행', number: '000-000-000000', kakaoPayUrl: '', visible: true },
          { relation: '아버지', holder: '최상민', bank: '국민은행', number: '000000-00-000000', kakaoPayUrl: '', visible: true },
          { relation: '어머니', holder: '정수진', bank: '우리은행', number: '0000-000-000000', kakaoPayUrl: '', visible: true },
        ],
        bride: [
          { relation: '신부', holder: '박신부', bank: '토스뱅크', number: '0000-0000-0000', kakaoPayUrl: '', visible: true },
          { relation: '아버지', holder: '박경호', bank: '기업은행', number: '000-000000-00-000', kakaoPayUrl: '', visible: true },
          { relation: '어머니', holder: '오미숙', bank: '하나은행', number: '000-000000-00000', kakaoPayUrl: '', visible: true },
        ],
      },
      decor: { bgmUrl: '' },
    },
  },
]

// 목업 모드에서만 쓰는 자리 표시 사진 (DB 템플릿에는 넣지 않는다. 사진은 어드민에서 직접 올린다)
export const FIXTURE_PHOTOS: Photo[] = PHOTO_COLORS.map((color, i) => ({
  id: `inv-1-photo-${i}`,
  invitationId: 'inv-1',
  thumbUrl: placeholder(color, `PHOTO ${String(i + 1).padStart(2, '0')}`, 300, 300),
  fullUrl: placeholder(color, `PHOTO ${String(i + 1).padStart(2, '0')}`, 900, 1200),
  caption: '',
  sortOrder: i,
}))

// 샘플 방명록. 방문자가 남긴 글과 섞여도 어색하지 않게 담백하게 쓴다.
const GUESTBOOK_SEED: Record<string, [string, string][]> = {
  'inv-1': [
    ['지훈', '결혼 진심으로 축하한다. 두 사람 늘 지금처럼 웃으며 살길 바라.'],
    ['수빈', '너무 축하해! 바닷가 마을처럼 평온한 날들만 가득하길.'],
    ['김 팀장', '두 분의 새로운 출발을 진심으로 축하드립니다.'],
    ['하은', '청첩장 너무 예뻐요. 결혼식 날 꼭 갈게요.'],
    ['도현', '드디어 가는구나. 행복하게 잘 살아라, 친구야.'],
    ['예린', '서로 아껴 주는 모습이 늘 보기 좋았어요. 오래오래 행복하세요.'],
    ['이모', '우리 조카 시집가는구나. 예쁘게 잘 살아라.'],
  ],
  'inv-2': [
    ['준호', '우주에서 제일 잘 어울리는 커플이다. 축하해!'],
    ['서연', '결혼 축하해. 두 사람의 궤도가 언제나 반짝이길.'],
    ['박 선배', '결혼 진심으로 축하합니다. 행복한 가정 이루세요.'],
    ['민재', '망원경으로 보니 별이 정말 많네요. 저도 하나 띄우고 갑니다.'],
    ['소율', '두 분 정말 잘 어울려요. 예식 날 뵐게요!'],
    ['고모', '우리 조카 장가가는 날, 기쁜 마음으로 축하한다.'],
  ],
}

export const FIXTURE_GUESTBOOK: GuestbookEntry[] = Object.entries(GUESTBOOK_SEED).flatMap(([invitationId, list]) =>
  list.map(([name, message], i) => ({
    id: `${invitationId}-gb-${i}`,
    invitationId,
    name,
    message,
    createdAt: new Date(Date.UTC(2026, 9, 10 + i, 3, 0)).toISOString(),
  })),
)
