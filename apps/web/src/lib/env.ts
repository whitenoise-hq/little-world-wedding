import 'server-only'

// 하객용 앱 서버 환경변수. 브라우저로 나가지 않는다 (NEXT_PUBLIC_ 접두어 없음).
export const serverEnv = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? '',
  ipHashSalt: process.env.IP_HASH_SALT ?? '',
  cronSecret: process.env.CRON_SECRET ?? '',
  revalidateToken: process.env.REVALIDATE_TOKEN ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  alertEmailTo: process.env.ALERT_EMAIL_TO ?? '',
  alertEmailFrom: process.env.ALERT_EMAIL_FROM || '리틀 월드 웨딩 알림 <onboarding@resend.dev>',
}
