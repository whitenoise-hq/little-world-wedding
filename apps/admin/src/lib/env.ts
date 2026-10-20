// 하객용 청첩장 주소. 어드민에서 "하객 화면 열기"와 주소 복사에 쓴다.
export const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export const invitationUrl = (slug: string) => `${WEB_URL}/${slug}`
