// 브라우저에서 난 오류를 서버(/api/report-error)로 보낸다. 서버가 운영자에게 메일로 알린다.
// 보내기가 실패해도 하객 화면에는 아무 영향이 없게 모든 오류를 삼킨다.
export type ReportWhere = '청첩장 화면' | '전체 화면' | '게임'

export function reportError(where: ReportWhere, error: unknown) {
  try {
    const e = error as { message?: unknown; digest?: unknown } | null
    const body = JSON.stringify({
      where,
      message: String(e?.message ?? error).slice(0, 500),
      url: window.location.href.slice(0, 500),
      ...(typeof e?.digest === 'string' ? { digest: e.digest.slice(0, 100) } : {}),
    })
    void fetch('/api/report-error', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {})
  } catch {
    // 알림을 못 보내도 화면은 그대로 둔다
  }
}
