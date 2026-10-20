'use client'

import type { Person } from '@lww/shared'
import { useState } from 'react'
import { ChevronDown, MessageIcon, PhoneIcon } from './icons'

function Contact({ role, name, phone }: { role: string; name: string; phone: string }) {
  const tel = phone.replace(/[^0-9]/g, '')
  return (
    <div className="contact">
      <div className="contact-name">
        <span className="contact-role">{role}</span>
        {name}
      </div>
      {tel && (
        <div>
          <a className="icon-btn" href={`tel:${tel}`} aria-label={`${name}에게 전화하기`}>
            <PhoneIcon />
          </a>
          <a className="icon-btn" href={`sms:${tel}`} aria-label={`${name}에게 문자 보내기`}>
            <MessageIcon />
          </a>
        </div>
      )}
    </div>
  )
}

export function Contacts({ groom, bride }: { groom: Person; bride: Person }) {
  const [open, setOpen] = useState(false)
  const parents = (p: Person) =>
    [
      p.father.showPhone && p.father.phone ? { role: '아버지', name: p.father.name, phone: p.father.phone } : null,
      p.mother.showPhone && p.mother.phone ? { role: '어머니', name: p.mother.name, phone: p.mother.phone } : null,
    ].filter((x) => x !== null)
  const gp = parents(groom)
  const bp = parents(bride)

  return (
    <section className="sec">
      <h2>✦ 연락하기</h2>
      <div className="contacts">
        <Contact role="신랑" name={groom.fullName} phone={groom.showPhone ? groom.phone : ''} />
        <Contact role="신부" name={bride.fullName} phone={bride.showPhone ? bride.phone : ''} />
      </div>
      {(gp.length > 0 || bp.length > 0) && (
        <>
          <button type="button" className="toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            혼주에게 연락하기 <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
          </button>
          {open && (
            <div className="contacts" style={{ marginTop: 10 }}>
              {[
                ['신랑 측 혼주', gp],
                ['신부 측 혼주', bp],
              ].map(([title, list]) => (
                <div key={title as string}>
                  <div className="center sub-2" style={{ fontSize: 11, marginBottom: 10 }}>
                    {title as string}
                  </div>
                  {(list as { role: string; name: string; phone: string }[]).map((c) => (
                    <Contact key={c.role} {...c} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
