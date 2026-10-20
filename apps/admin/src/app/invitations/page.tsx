import { formatCeremonyShort, THEME_LABELS } from '@lww/shared'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import { invitations } from '@/lib/repositories'
import { createInvitation } from './actions'

export default async function InvitationsPage() {
  const list = await invitations.list()

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">청첩장</h1>
          <p className="mt-1 text-sm text-muted-foreground">총 {list.length}개</p>
        </div>
        <form action={createInvitation}>
          <Button type="submit">
            <PlusIcon />새 청첩장
          </Button>
        </form>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">신랑 · 신부</TableHead>
              <TableHead>예식</TableHead>
              <TableHead>테마</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">방명록</TableHead>
              <TableHead className="pr-4 text-right">수정</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  아직 청첩장이 없어요
                </TableCell>
              </TableRow>
            )}
            {list.map((inv) => (
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
                <TableCell className="pr-4 text-right text-sm text-muted-foreground tabular-nums">{formatDateTime(inv.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
