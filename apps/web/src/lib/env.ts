import 'server-only'

// 하객용 앱 서버 환경변수. 브라우저로 나가지 않는다 (NEXT_PUBLIC_ 접두어 없음).
export const serverEnv = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? '',
  ipHashSalt: process.env.IP_HASH_SALT ?? '',
  cronSecret: process.env.CRON_SECRET ?? '',
  revalidateToken: process.env.REVALIDATE_TOKEN ?? '',
}

// Supabase 키가 없으면 목업 데이터로 돈다. 단, 배포 환경(Vercel)에서는 목업으로 넘어가지 않는다:
// 가짜 청첩장이 보이는 것보다 "환경변수가 없다"는 오류가 나는 편이 안전하다.
export const useMockData = !(serverEnv.supabaseUrl && serverEnv.supabaseSecretKey) && !process.env.VERCEL
export const hasSupabase = !useMockData
