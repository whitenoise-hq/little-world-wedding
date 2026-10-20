'use client'

import type { Person } from '@lww/shared'
import { useState } from 'react'
import { ChevronDown, MailIcon, PhoneIcon } from './icons'
import { Section } from './section'

// 연락처: 위에 신랑(왼쪽)·신부(오른쪽), 그 아래 접었다 펴는 혼주 연락처.
// 펼치면 신랑 밑에 "신랑 측 혼주", 신부 밑에 "신부 측 혼주"(번호를 공개한 분만).

interface Item {
  role: string
  name: string
  phone: string
}

function Contact({ role, name, phone }: Item) {
  const tel = phone.replace(/[^0-9]/g, '')
  return (
    <div className="contact">
      <div className="contact-role">{role}</div>
      <div className="contact-name">{name}</div>
      {tel && (
        <div className="contact-actions">
          <a className="round-btn" href={`tel:${tel}`} aria-label={`${name}에게 전화`}>
            <PhoneIcon size={17} />
          </a>
          <a className="round-btn" href={`sms:${tel}`} aria-label={`${name}에게 문자`}>
            <MailIcon size={17} />
          </a>
        </div>
      )}
    </div>
  )
}

const parents = (p: Person): Item[] =>
  [
    p.father.showPhone && p.father.phone ? { role: '아버지', name: p.father.name, phone: p.father.phone } : null,
    p.mother.showPhone && p.mother.phone ? { role: '어머니', name: p.mother.name, phone: p.mother.phone } : null,
  ].filter((x) => x !== null)

export function Contacts({ groom, bride }: { groom: Person; bride: Person }) {
  const [open, setOpen] = useState(true) // 처음엔 펼친 상태
  const sides = [
    { title: '신랑 측 혼주', list: parents(groom) },
    { title: '신부 측 혼주', list: parents(bride) },
  ]
  const hasParents = sides.some((s) => s.list.length > 0)

  return (
    <Section label="CONTACT" title="연락처">
      <div className="contact-columns">
        <Contact role="신랑" name={groom.fullName} phone={groom.showPhone ? groom.phone : ''} />
        <Contact role="신부" name={bride.fullName} phone={bride.showPhone ? bride.phone : ''} />
      </div>
      {hasParents && (
        <>
          {/* 줄 전체가 펼치기 버튼: 신랑 측 혼주 ⌄ 신부 측 혼주 */}
          <button type="button" className="parents-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span>{sides[0]!.title}</span>
            <ChevronDown size={16} className="parents-arrow" />
            <span>{sides[1]!.title}</span>
          </button>
          <div className={`collapse${open ? ' open' : ''}`} inert={!open}>
            <div className="collapse-inner">
              <div className="contact-columns">
                {sides.map((s) => (
                  <div key={s.title} className="contact-column">
                    {s.list.map((c) => (
                      <Contact key={c.role} {...c} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Section>
  )
}
