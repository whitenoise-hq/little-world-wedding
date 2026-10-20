import type { GuestbookEntry, Invitation, Photo } from './invitation'

// 1단계 화면 작업용 목업 데이터. Supabase를 연결하면 쓰지 않는다.

const PHOTO_COLORS = ['#9fc8a0', '#e8c4a8', '#b8c8e6', '#e6d4a2', '#cdb6e0', '#a8d8d0', '#ecbcbc', '#d6cfae', '#c4dca0', '#f0c8d8', '#b0d0e8', '#e0c0a0']
const PHOTO_CAPTIONS = ['처음 만난 날', '첫 여행', '바닷가 산책', '함께한 생일', '눈 오던 날', '벚꽃 구경', '캠핑', '프러포즈', '웨딩 촬영', '웨딩 촬영 비하인드', '부모님과 함께', '앞으로도 함께']

function placeholder(color: string, label: string, w: number, h: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="${Math.round(w / 12)}" fill="rgba(42,26,46,.6)" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const FIXTURE_INVITATIONS: Invitation[] = [
  {
    id: 'inv-1',
    slug: 'ejdushfe',
    theme: 'village',
    isPublished: true,
    coverPhotoId: 'inv-1-photo-9',
    createdAt: '2026-10-01T10:00:00+09:00',
    updatedAt: '2026-10-18T21:30:00+09:00',
    content: {
      groom: {
        fullName: '김원재',
        firstName: '원재',
        phone: '010-1234-5678',
        showPhone: true,
        father: { name: '김철수', phone: '010-1111-2222', showPhone: true },
        mother: { name: '이영희', phone: '010-3333-4444', showPhone: true },
      },
      bride: {
        fullName: '박은빈',
        firstName: '은빈',
        phone: '010-8765-4321',
        showPhone: true,
        father: { name: '박정호', phone: '010-5555-6666', showPhone: true },
        mother: { name: '최미정', phone: '010-7777-8888', showPhone: false },
      },
      greeting: {
        text: '바다가 보이는 작은 마을에\n두 사람이 함께 집을 지었습니다.\n저희의 첫걸음을 함께 축복해 주세요.',
      },
      ceremony: {
        date: '2027-05-22',
        time: '12:30',
        venueName: 'OO웨딩홀',
        hall: '3층 그랜드홀',
        address: '서울시 강남구 테헤란로 123',
        lat: 37.5006,
        lng: 127.0364,
      },
      directions: [
        { label: '지하철', text: '2호선 역삼역 3번 출구 도보 5분' },
        { label: '버스', text: '146, 341, 360 역삼역 하차' },
        { label: '주차', text: '건물 지하 2~4층, 2시간 무료' },
      ],
      accounts: {
        groom: [
          { relation: '신랑', holder: '김원재', bank: '국민', number: '123456-01-234567', kakaoPayUrl: '', visible: true },
          { relation: '아버지', holder: '김철수', bank: '신한', number: '110-234-567890', kakaoPayUrl: '', visible: true },
          { relation: '어머니', holder: '이영희', bank: '우리', number: '1002-345-678901', kakaoPayUrl: '', visible: true },
        ],
        bride: [
          { relation: '신부', holder: '박은빈', bank: '카카오뱅크', number: '3333-01-2345678', kakaoPayUrl: '', visible: true },
          { relation: '아버지', holder: '박정호', bank: '농협', number: '302-1234-5678-91', kakaoPayUrl: '', visible: true },
          { relation: '어머니', holder: '최미정', bank: '하나', number: '123-456789-01234', kakaoPayUrl: '', visible: false },
        ],
      },
      decor: { bgmUrl: '' },
    },
  },
  {
    id: 'inv-2',
    slug: 'qmwvhzta',
    theme: 'space',
    isPublished: true,
    coverPhotoId: null,
    createdAt: '2026-10-15T14:00:00+09:00',
    updatedAt: '2026-10-15T14:20:00+09:00',
    content: {
      groom: {
        fullName: '이도윤',
        firstName: '도윤',
        phone: '010-2222-3333',
        showPhone: true,
        father: { name: '이상민', phone: '', showPhone: false },
        mother: { name: '정수진', phone: '', showPhone: false },
      },
      bride: {
        fullName: '한지우',
        firstName: '지우',
        phone: '010-4444-5555',
        showPhone: true,
        father: { name: '한경호', phone: '', showPhone: false },
        mother: { name: '오미숙', phone: '', showPhone: false },
      },
      greeting: { text: '서로 다른 별에서 온 두 사람이\n같은 행성에 집을 짓기로 했습니다.' },
      ceremony: {
        date: '2027-09-11',
        time: '14:00',
        venueName: '별빛컨벤션',
        hall: '2층 오로라홀',
        address: '경기도 성남시 분당구 판교로 45',
        lat: null,
        lng: null,
      },
      directions: [{ label: '주차', text: '건물 지하 주차장 3시간 무료' }],
      accounts: { groom: [], bride: [] },
      decor: { bgmUrl: '' },
    },
  },
]

export const FIXTURE_PHOTOS: Photo[] = PHOTO_COLORS.map((color, i) => ({
  id: `inv-1-photo-${i}`,
  invitationId: 'inv-1',
  thumbUrl: placeholder(color, `PHOTO ${String(i + 1).padStart(2, '0')}`, 300, 300),
  fullUrl: placeholder(color, `PHOTO ${String(i + 1).padStart(2, '0')}`, 900, 1200),
  caption: PHOTO_CAPTIONS[i] ?? '',
  sortOrder: i,
}))

const GUESTBOOK_SEED: [string, string][] = [
  ['엄마', '우리 딸 은빈아, 행복하게 잘 살아라'],
  ['지훈', '원재야 드디어 가는구나 축하한다'],
  ['수빈', '두 사람 너무 잘 어울려요'],
  ['김부장', '결혼 진심으로 축하하네'],
  ['하은', '은빈아 웨딩드레스 기대할게'],
  ['도윤', '형 축의금 두둑이 보낼게요'],
  ['예린', '오래오래 행복하세요'],
  ['준호', '마을 최고 커플 축하해'],
  ['소영', '행복한 마을 만들어요'],
]

export const FIXTURE_GUESTBOOK: GuestbookEntry[] = GUESTBOOK_SEED.map(([name, message], i) => ({
  id: `inv-1-gb-${i}`,
  invitationId: 'inv-1',
  name,
  message,
  createdAt: new Date(Date.UTC(2026, 9, 10 + i, 3, 0)).toISOString(),
}))
