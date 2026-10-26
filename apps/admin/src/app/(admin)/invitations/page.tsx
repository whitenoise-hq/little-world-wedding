import { formatCeremonyShort, THEME_IDS, THEME_LABELS, type InvitationSummary } from '@lww/shared'
import { ExternalLinkIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { invitationUrl } from '@/lib/env'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { invitations } from '@/lib/repositories'
import { createInvitation } from './actions'

// 고객 청첩장과 템플릿(홍보용 샘플)을 탭으로 나눈다. docs/PLANNING.md 7장 "어드민 청첩장 목록".
type Tab = 'customers' | 'templates'

export default async function InvitationsPage({ searchParams }: PageProps<'/invitations'>) {
  const tab: Tab = (await searchParams).tab === 'templates' ? 'templates' : 'customers'
  const all = await invitations.list()
  const customers = all.filter((inv) => inv.kind === 'customer')
  const templates = all
    .filter((inv) => inv.kind === 'template')
    .sort((a, b) => THEME_IDS.indexOf(a.theme) - THEME_IDS.indexOf(b.theme))
  const rows = tab === 'templates' ? templates : customers

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">청첩장</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === 'templates' ? `테마별 샘플 청첩장 ${templates.length}개` : `고객 청첩장 ${customers.length}개`}
          </p>
        </div>
        {tab === 'customers' && (
          <form action={createInvitation}>
            <Button type="submit">
              <PlusIcon />새 청첩장
            </Button>
          </form>
        )}
      </div>

      <nav className="inline-flex h-9 items-center rounded-lg bg-muted p-[3px] text-sm" aria-label="청첩장 종류">
        <TabLink href="/invitations" active={tab === 'customers'} label="고객 청첩장" count={customers.length} />
        <TabLink href="/invitations?tab=templates" active={tab === 'templates'} label="템플릿" count={templates.length} />
      </nav>

      <InvitationTable rows={rows} template={tab === 'templates'} />
    </div>
  )
}

function TabLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-full items-center gap-1.5 rounded-md px-3 font-medium transition-colors',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </Link>
  )
}

function InvitationTable({ rows, template }: { rows: InvitationSummary[]; template: boolean }) {
  const columns = template ? 7 : 6
  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">신랑 · 신부</TableHead>
            <TableHead>예식</TableHead>
            <TableHead>테마</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">방명록</TableHead>
            {template && <TableHead className="text-right">하객 화면</TableHead>}
            <TableHead className="pr-4 text-right">수정</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns} className="py-12 text-center text-muted-foreground">
                {template ? '템플릿이 없어요. pnpm db:templates로 넣을 수 있어요' : '아직 고객 청첩장이 없어요'}
              </TableCell>
            </TableRow>
          )}
          {rows.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="pl-4">
                <Link href={`/invitations/${inv.id}`} className="font-medium hover:underline">
                  {inv.groomName || '(신랑)'} ♥ {inv.brideName || '(신부)'}
                </Link>
                <div className="text-xs text-muted-foreground">/{inv.slug}</div>
              </TableCell>
              <TableCell className="tabular-nums">{inv.date ? formatCeremonyShort(inv.date, '').trim() : '-'}</TableCell>
              <TableCell>{THEME_LABELS[inv.theme]}</TableCell>
              <TableCell>{inv.isPublished ? <Badge>공개</Badge> : <Badge variant="secondary">비공개</Badge>}</TableCell>
              <TableCell className="text-right tabular-nums">
                <Link href={`/invitations/${inv.id}/guestbook`} className="hover:underline">
                  {inv.guestbookCount}
                </Link>
              </TableCell>
              {template && (
                <TableCell className="text-right">
                  <a
                    href={invitationUrl(inv.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    열기
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </TableCell>
              )}
              <TableCell className="pr-4 text-right text-sm text-muted-foreground tabular-nums">{formatDateTime(inv.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
