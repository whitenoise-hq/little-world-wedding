'use client'

import { useEffect, useState } from 'react'

// 어디서든 toast('...')로 띄운다. 1.6초 뒤 사라짐.
const EVENT = 'lww-toast'

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }))
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail)
      clearTimeout(timer)
      timer = setTimeout(() => setMsg(null), 1600)
    }
    window.addEventListener(EVENT, on)
    return () => {
      window.removeEventListener(EVENT, on)
      clearTimeout(timer)
    }
  }, [])
  return msg ? (
    <div className="toast" role="status">
      {msg}
    </div>
  ) : null
}

export async function copyText(value: string, done = '복사했어요') {
  try {
    await navigator.clipboard.writeText(value)
    toast(done)
  } catch {
    // 카톡 등 앱 안 브라우저는 clipboard API를 막는 경우가 있어 예전 방식으로 한 번 더 시도한다
    toast(copyWithTextarea(value) ? done : '복사하지 못했어요')
  }
}

function copyWithTextarea(value: string): boolean {
  const el = document.createElement('textarea')
  el.value = value
  el.setAttribute('readonly', '')
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    el.remove()
  }
}
