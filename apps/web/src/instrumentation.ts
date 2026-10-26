// 서버에서 처리하지 못한 오류(페이지 그리기, API)를 운영자에게 메일로 알린다. docs/PLANNING.md 9장 "에러 알림".
// 오류를 삼키고 빈 목록을 돌려주는 곳(사진·방명록 목록, 방명록 쓰기)은 각자 따로 알린다.
type Headers = NodeJS.Dict<string | string[]>
const header = (headers: Headers, name: string) => {
  const v = headers[name]
  return Array.isArray(v) ? v[0] : v
}

export async function onRequestError(
  error: unknown,
  request: Readonly<{ path: string; method: string; headers: Headers }>,
  context: Readonly<{ routeType: string; routePath: string }>,
) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { sendAlert } = await import('./lib/alert')
  const e = error as Error & { digest?: string }
  const host = header(request.headers, 'host')
  await sendAlert({
    where: '서버',
    message: e?.message ?? String(error),
    url: host ? `https://${host}${request.path}` : request.path,
    userAgent: header(request.headers, 'user-agent'),
    digest: e?.digest,
    detail: `${request.method} ${context.routeType} ${context.routePath}`,
  })
}
