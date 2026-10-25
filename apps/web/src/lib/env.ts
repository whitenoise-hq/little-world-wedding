import 'server-only'

// 하객용 앱 서버 환경변수. 브라우저로 나가지 않는다 (NEXT_PUBLIC_ 접두어 없음).
export const serverEnv = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? '',
  ipHashSalt: process.env.IP_HASH_SALT ?? '',
  cronSecret: process.env.CRON_SECRET ?? '',
  revalidateToken: process.env.REVALIDATE_TOKEN ?? '',
}
