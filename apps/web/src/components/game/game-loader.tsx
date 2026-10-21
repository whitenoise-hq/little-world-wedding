'use client'

import { preloadTheme } from '@lww/engine'
import dynamic from 'next/dynamic'
import { useEffect, type ComponentProps } from 'react'

// 게임 코드는 별도 청크로 나눠, 인트로가 떠 있는 동안 불러온다.
const GameScreen = dynamic(() => import('./game-screen'), { ssr: false })

// 게임 코드와 테마 청크를 동시에 요청한다. 게임 코드를 다 받은 뒤에 테마를 요청하면 순서대로 받느라 늦어진다.
export function GameLoader(props: ComponentProps<typeof GameScreen>) {
  useEffect(() => {
    // 실패는 game-screen의 loadTheme이 다시 시도하고 알린다
    preloadTheme(props.theme).catch(() => {})
  }, [props.theme])
  return <GameScreen {...props} />
}
