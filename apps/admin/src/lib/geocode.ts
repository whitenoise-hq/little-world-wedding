import 'server-only'

// 예식장 주소 → 좌표 (카카오 로컬 API, REST 키). docs/PLANNING.md 4장 "예식 장소".
// 주소로 못 찾으면 예식장 이름(키워드)으로 한 번 더 찾는다. 키가 없거나 못 찾으면 null을 돌려주고 저장은 막지 않는다.
const API = 'https://dapi.kakao.com/v2/local/search'

interface KakaoDoc {
  x: string // 경도
  y: string // 위도
}

async function search(kind: 'address' | 'keyword', query: string, key: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`${API}/${kind}.json?query=${encodeURIComponent(query)}&size=1`, {
    headers: { authorization: `KakaoAK ${key}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`카카오 ${kind} 검색 실패 ${res.status}`)
  const body = (await res.json()) as { documents?: KakaoDoc[] }
  const doc = body.documents?.[0]
  if (!doc) return null
  const lat = Number(doc.y)
  const lng = Number(doc.x)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

export interface VenueResult {
  name: string
  address: string // 도로명 주소, 없으면 지번 주소
  lat: number
  lng: number
}

// 예식장 이름으로 장소를 찾는다 (어드민 "예식장 검색"). 키가 없으면 오류를 던져 화면에 알린다.
export async function searchVenues(query: string): Promise<VenueResult[]> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) throw new Error('KAKAO_REST_API_KEY가 없어 검색할 수 없어요')
  const res = await fetch(`${API}/keyword.json?query=${encodeURIComponent(query)}&size=10`, {
    headers: { authorization: `KakaoAK ${key}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`장소 검색에 실패했어요 (${res.status})`)
  const body = (await res.json()) as { documents?: (KakaoDoc & { place_name: string; road_address_name: string; address_name: string })[] }
  return (body.documents ?? [])
    .map((d) => ({ name: d.place_name, address: d.road_address_name || d.address_name, lat: Number(d.y), lng: Number(d.x) }))
    .filter((v) => v.address && Number.isFinite(v.lat) && Number.isFinite(v.lng))
}

export async function geocodeVenue(address: string, venueName: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key || !address.trim()) return null
  try {
    return (await search('address', address, key)) ?? (venueName.trim() ? await search('keyword', venueName, key) : null)
  } catch (e) {
    console.error('예식장 좌표를 찾지 못했습니다', e)
    return null
  }
}
