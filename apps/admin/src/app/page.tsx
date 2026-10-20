import { THEME_IDS, THEME_LABELS } from '@lww/shared'

// 1단계에서 청첩장 목록·입력 화면으로 바꾼다.
export default function AdminHome() {
  return (
    <main style={{ padding: 24 }}>
      <h1>리틀 월드 웨딩 어드민</h1>
      <p>테마: {THEME_IDS.map((id) => THEME_LABELS[id]).join(', ')}</p>
    </main>
  )
}
