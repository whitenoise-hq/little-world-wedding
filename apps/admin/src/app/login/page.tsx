import { LoginForm } from './login-form'

export const metadata = { title: '로그인 · 리틀 월드 웨딩 어드민' }

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <LoginForm />
    </main>
  )
}
