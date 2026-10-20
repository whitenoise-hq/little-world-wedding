// 어드민 Supabase 설정. URL과 publishable 키는 브라우저(로그인)에서도 쓰는 공개 값이다.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

// 키가 없으면(처음 클론한 로컬 등) 로그인 없이 목업 데이터로 돈다.
export const hasSupabase = Boolean(supabaseUrl && supabasePublishableKey)
