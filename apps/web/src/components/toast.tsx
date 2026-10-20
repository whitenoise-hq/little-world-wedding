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
    <div className="toast cut" role="status">
      {msg}
    </div>
  ) : null
}

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast('복사했어요')
  } catch {
    toast('복사하지 못했어요')
  }
}
