'use client'

import type { GuestbookEntry } from '@lww/shared'
import { Trash2Icon } from 'lucide-react'
import { useState, useTransition, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import { deleteGuestbookEntries } from '../../actions'

// 방명록 목록: 글마다 삭제, 체크해서 여러 개 한 번에 삭제. docs/PLANNING.md 4장 "방명록".
export function GuestbookTable({ invitationId, entries }: { invitationId: string; entries: GuestbookEntry[] }) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [pending, start] = useTransition()
  // 지운 글이 목록에서 사라지면 선택에서도 뺀다
  const picked = entries.filter((e) => selected.has(e.id)).map((e) => e.id)
  const allPicked = entries.length > 0 && picked.length === entries.length

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () => setSelected(allPicked ? new Set() : new Set(entries.map((e) => e.id)))

  const remove = (ids: string[]) =>
    start(async () => {
      try {
        await deleteGuestbookEntries(invitationId, ids)
        setSelected((s) => new Set([...s].filter((id) => !ids.includes(id))))
        toast.success(`${ids.length}개를 삭제했어요`)
      } catch {
        toast.error('삭제하지 못했어요. 다시 시도해 주세요')
      }
    })

  return (
    <div className="space-y-3">
      <div className="flex h-9 items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{picked.length > 0 ? `${picked.length}개 선택됨` : '지울 글을 체크하세요'}</span>
        {picked.length > 0 && (
          <ConfirmDelete
            title={`선택한 글 ${picked.length}개를 삭제할까요?`}
            onConfirm={() => remove(picked)}
            trigger={
              <Button variant="destructive" size="sm" disabled={pending}>
                <Trash2Icon />
                선택 삭제
              </Button>
            }
          />
        )}
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={allPicked}
                  onChange={toggleAll}
                  disabled={entries.length === 0}
                  aria-label="전체 선택"
                />
              </TableHead>
              <TableHead className="w-32">이름</TableHead>
              <TableHead>메시지</TableHead>
              <TableHead className="w-40">작성</TableHead>
              <TableHead className="w-16 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  아직 글이 없어요
                </TableCell>
              </TableRow>
            )}
            {entries.map((e) => (
              <TableRow key={e.id} data-state={selected.has(e.id) ? 'selected' : undefined}>
                <TableCell className="pl-4">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={selected.has(e.id)}
                    onChange={() => toggle(e.id)}
                    aria-label={`${e.name}님의 글 선택`}
                  />
                </TableCell>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="whitespace-normal">{e.message}</TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">{formatDateTime(e.createdAt)}</TableCell>
                <TableCell className="pr-4 text-right">
                  <ConfirmDelete
                    title={`${e.name}님의 글을 삭제할까요?`}
                    onConfirm={() => remove([e.id])}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`${e.name}님의 글 삭제`} disabled={pending}>
                        <Trash2Icon />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function ConfirmDelete({ title, trigger, onConfirm }: { title: string; trigger: ReactNode; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>삭제하면 되돌릴 수 없어요.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
