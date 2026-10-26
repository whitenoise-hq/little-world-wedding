import type { GuestbookEntry, Invitation } from './invitation'
import { TEMPLATE_SLUGS } from './themes'

// 샘플(템플릿) 청첩장: 마을·우주·공항 1개씩. 홍보용으로 공개해 두는 청첩장이다.
// `pnpm db:templates`로 실제 DB에 적용한다 (scripts/templates.mts). 사진은 어드민에서 직접 올린다.
// 전화번호·계좌는 실제로 연결되지 않는 가짜 값만 쓴다.

const fakePhone = '010-0000-0000'

export const TEMPLATE_INVITATIONS: Invitation[] = [
  {
    id: 'inv-1',
    slug: TEMPLATE_SLUGS.village,
    theme: 'village',
    kind: 'template',
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
        lat: 37.566371,
        lng: 126.977918,
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
      decor: { bgmUrl: '/bgm/piano.mp3' },
    },
  },
  {
    id: 'inv-2',
    slug: TEMPLATE_SLUGS.space,
    theme: 'space',
    kind: 'template',
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
        lat: 35.159107,
        lng: 129.160284,
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
      decor: { bgmUrl: '/bgm/romantic.mp3' },
    },
  },
  {
    id: 'inv-3',
    slug: TEMPLATE_SLUGS.airport,
    theme: 'airport',
    kind: 'template',
    isPublished: true,
    coverPhotoId: null,
    createdAt: '2026-10-25T14:00:00+09:00',
    updatedAt: '2026-10-25T14:00:00+09:00',
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
        text: '각자의 길을 걷던 두 사람이\n이제 같은 비행기에 오르려 합니다.\n\n어디로 가든 서로의 옆자리를 지키며\n긴 여행을 함께하겠습니다.\n\n저희의 첫 출발을\n따뜻한 마음으로 배웅해 주세요.',
      },
      ceremony: {
        date: '2027-10-16',
        time: '13:00',
        venueName: '리틀월드 그랜드홀',
        hall: '5층 스카이홀',
        address: '인천광역시 영종구 공항로 272',
        lat: 37.458351,
        lng: 126.4277,
      },
      directions: [
        { label: '지하철', text: '공항철도 인천공항1터미널역에서 도보 5분' },
        { label: '버스', text: '인천공항1터미널 정류장 하차 (공항버스 6001, 6015)' },
        { label: '주차', text: '건물 지하 주차장 3시간 무료' },
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
      decor: { bgmUrl: '/bgm/wedding.mp3' },
    },
  },
]

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
  'inv-3': [
    ['지훈', '드디어 같은 비행기 타는구나. 결혼 진심으로 축하해.'],
    ['수빈', '두 사람의 긴 여행이 늘 맑은 날씨이길 바라요.'],
    ['김 팀장', '두 분의 새로운 출발을 진심으로 축하드립니다.'],
    ['하은', '신혼여행 사진 꼭 보여 줘. 예식 날 갈게!'],
    ['도현', '좋은 비행 되길. 행복하게 잘 살아라, 친구야.'],
    ['이모', '우리 조카, 예쁘게 잘 살아라.'],
  ],
}

export const TEMPLATE_GUESTBOOK: GuestbookEntry[] = Object.entries(GUESTBOOK_SEED).flatMap(([invitationId, list]) =>
  list.map(([name, message], i) => ({
    id: `${invitationId}-gb-${i}`,
    invitationId,
    name,
    message,
    createdAt: new Date(Date.UTC(2026, 9, 10 + i, 3, 0)).toISOString(),
  })),
)
