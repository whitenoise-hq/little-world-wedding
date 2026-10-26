'use client'

import { useEffect } from 'react'

const MESSAGE = '저장하지 않은 변경이 있어요. 저장하지 않고 나가시겠어요?'

interface NavigateEventLike extends Event {
  navigationType: 'push' | 'replace' | 'reload' | 'traverse'
  cancelable: boolean
}
type WindowWithNavigation = Window & { navigation?: EventTarget }

// 저장하지 않은 변경이 있으면 나가기 전에 묻는다. docs/PLANNING.md 7장 "어드민 입력 폼".
// - 새로고침·창 닫기·주소 입력: beforeunload (브라우저 기본 확인 창)
// - 화면 안 링크(목록으로, 사이드바 등): 클릭을 먼저 잡아 확인 창을 띄운다
// - 뒤로·앞으로 가기: Navigation API의 traverse를 막는다(지원하는 브라우저만)
export function useLeaveGuard(active: boolean) {
  useEffect(() => {
    if (!active) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target instanceof Element ? e.target.closest('a') : null
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      if (!window.confirm(MESSAGE)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const onNavigate = (e: Event) => {
      const nav = e as NavigateEventLike
      if (nav.navigationType !== 'traverse' || !nav.cancelable) return
      if (!window.confirm(MESSAGE)) nav.preventDefault()
    }

    const navigation = (window as WindowWithNavigation).navigation
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    navigation?.addEventListener('navigate', onNavigate)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
      navigation?.removeEventListener('navigate', onNavigate)
    }
  }, [active])
}
