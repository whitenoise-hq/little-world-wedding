'use client'

import { useEffect, useRef, useState } from 'react'

// 예식장 위치 지도 (카카오맵 JavaScript SDK). docs/PLANNING.md 4장 "예식 장소".
// - 이 컴포넌트가 화면에 나올 때(청첩장 모달을 열 때)만 SDK를 불러온다.
// - 모달 스크롤과 겹치지 않게 끌기·확대를 끄고, 누르면 카카오맵 길찾기로 이어진다.
// - 키가 없거나 불러오지 못하면 아무것도 그리지 않는다(길찾기 버튼은 그대로 있다).

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? ''

interface KakaoMaps {
  load(cb: () => void): void
  LatLng: new (lat: number, lng: number) => unknown
  Map: new (el: HTMLElement, opts: { center: unknown; level: number; draggable: boolean; scrollwheel: boolean; disableDoubleClickZoom: boolean }) => unknown
  Marker: new (opts: { position: unknown; map: unknown }) => unknown
}
type KakaoWindow = Window & { kakao?: { maps: KakaoMaps } }

let sdk: Promise<KakaoMaps> | null = null

function loadSdk(): Promise<KakaoMaps> {
  sdk ??= new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      const maps = (window as KakaoWindow).kakao?.maps
      if (!maps) return reject(new Error('카카오맵을 불러오지 못했습니다'))
      maps.load(() => resolve(maps))
    }
    script.onerror = () => reject(new Error('카카오맵을 불러오지 못했습니다'))
    document.head.appendChild(script)
  }).catch((e: unknown) => {
    sdk = null // 다음에 다시 시도할 수 있게
    throw e
  })
  return sdk
}

export function KakaoMap({ lat, lng, href, label }: { lat: number; lng: number; href: string; label: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(APP_KEY ? 'loading' : 'failed')

  useEffect(() => {
    if (!APP_KEY) return
    let alive = true
    loadSdk()
      .then((maps) => {
        if (!alive || !box.current) return
        const center = new maps.LatLng(lat, lng)
        const map = new maps.Map(box.current, { center, level: 3, draggable: false, scrollwheel: false, disableDoubleClickZoom: true })
        new maps.Marker({ position: center, map })
        setState('ready')
      })
      .catch(() => alive && setState('failed'))
    return () => {
      alive = false
    }
  }, [lat, lng])

  if (state === 'failed') return null
  return (
    <a className="map map-live" href={href} target="_blank" rel="noreferrer" aria-label={`${label} 위치를 카카오맵에서 보기`}>
      <div ref={box} className="map-canvas" />
      {/* 지도가 누르기를 가로채지 않게 위에 투명한 막을 둔다 */}
      <span className="map-tap" aria-hidden="true" />
      {state === 'loading' && <span className="map-loading">지도를 불러오는 중</span>}
    </a>
  )
}
