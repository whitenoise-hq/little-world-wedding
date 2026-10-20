'use client'

import type { Account } from '@lww/shared'
import { useState } from 'react'
import { CopyChip } from './copy-chip'
import { ChevronDown } from './icons'

export function Accounts({ groom, bride }: { groom: Account[]; bride: Account[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const sides = [
    ['신랑 측', groom.filter((a) => a.visible)],
    ['신부 측', bride.filter((a) => a.visible)],
  ] as const
  if (sides.every(([, list]) => list.length === 0)) return null

  return (
    <section className="sec">
      <h2>✦ 마음 전하실 곳</h2>
      {sides.map(([title, list], i) =>
        list.length === 0 ? null : (
          <div key={title} className="acc cut">
            <button type="button" className="acc-head" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {title} 계좌번호 <ChevronDown size={16} style={{ transform: open === i ? 'rotate(180deg)' : undefined }} />
            </button>
            {open === i && (
              <div className="acc-body">
                {list.map((a, j) => (
                  <div key={j} className="acc-row">
                    <div>
                      <div className="sub-2" style={{ fontSize: 11 }}>
                        {a.relation} {a.holder}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        {a.bank} {a.number}
                      </div>
                    </div>
                    <div className="row">
                      {a.kakaoPayUrl && (
                        <a className="chip cut" href={a.kakaoPayUrl} target="_blank" rel="noreferrer">
                          카카오페이
                        </a>
                      )}
                      <CopyChip value={`${a.bank} ${a.number}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
      )}
    </section>
  )
}
