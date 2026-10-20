'use client'

import dynamic from 'next/dynamic'

// 게임 코드는 별도 청크로 나눠, 인트로가 떠 있는 동안 불러온다.
export const GameLoader = dynamic(() => import('./game-screen'), { ssr: false })
