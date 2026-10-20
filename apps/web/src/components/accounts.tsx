'use client'

import type { Account } from '@lww/shared'
import { useState } from 'react'
import { CopyButton } from './copy-chip'
import { ChevronDown } from './icons'
import { Section } from './section'

export function Accounts({ groom, bride }: { groom: Account[]; bride: Account[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const sides = [
    ['신랑 측', groom.filter((a) => a.visible)],
    ['신부 측', bride.filter((a) => a.visible)],
  ] as const
  if (sides.every(([, list]) => list.length === 0)) return null

  return (
    <Section label="ACCOUNT" title="마음 전하실 곳">
      {sides.map(([title, list], i) =>
        list.length === 0 ? null : (
          <div key={title} className="acc">
            <button type="button" className="acc-head" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {title}
              <ChevronDown size={16} className="acc-arrow" />
            </button>
            {/* 펼치면 부드럽게 내려온다 (연락처 혼주와 같은 방식) */}
            <div className={`collapse${open === i ? ' open' : ''}`} inert={open !== i}>
              <div className="collapse-inner">
                {list.map((a, j) => (
                  <div key={j} className="acc-row">
                    <div>
                      <div className="acc-holder">
                        {a.relation} · {a.holder}
                      </div>
                      <div className="acc-number">
                        {a.bank} {a.number}
                      </div>
                    </div>
                    <div className="row">
                      {a.kakaoPayUrl && (
                        <a className="btn btn-sm" href={a.kakaoPayUrl} target="_blank" rel="noreferrer">
                          카카오페이
                        </a>
                      )}
                      <CopyButton value={`${a.bank} ${a.number}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      )}
    </Section>
  )
}
