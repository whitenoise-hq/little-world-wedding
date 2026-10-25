'use client'

import { MAX_PHOTOS, PHOTO_BUCKET, type NewPhoto, type Photo } from '@lww/shared'
import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, StarIcon, Trash2Icon } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FULL_EDGE, resizeImage, THUMB_EDGE } from '@/lib/image'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { addPhotos, deletePhoto, movePhoto, setCoverPhoto, updatePhotoCaption } from '../actions'

interface Props {
  invitationId: string
  photos: Photo[]
  coverPhotoId: string | null
}

// 사진 올리기·순서·대표 사진·설명·삭제. docs/PLANNING.md "어드민 사진 관리".
export function PhotoManager({ invitationId, photos, coverPhotoId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [pending, start] = useTransition()
  const left = MAX_PHOTOS - photos.length
  // 대표 사진을 지정하지 않으면 첫 번째 사진이 카톡 미리보기에 쓰인다
  const effectiveCover = coverPhotoId ?? photos[0]?.id ?? null

  const upload = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (images.length === 0) return
    if (images.length > left) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지예요. ${left}장 더 올릴 수 있어요`)
      return
    }
    const storage = createSupabaseBrowser().storage.from(PHOTO_BUCKET)
    const added: NewPhoto[] = []
    setProgress({ done: 0, total: images.length })
    for (const [i, file] of images.entries()) {
      const id = crypto.randomUUID()
      const uploaded: string[] = []
      try {
        const [thumb, full] = await Promise.all([resizeImage(file, THUMB_EDGE, 0.8), resizeImage(file, FULL_EDGE, 0.85)])
        for (const [kind, img] of [
          ['thumb', thumb],
          ['full', full],
        ] as const) {
          const path = `${invitationId}/${id}-${kind}.${img.ext}`
          const { error } = await storage.upload(path, img.blob, {
            contentType: img.blob.type,
            cacheControl: '31536000', // 경로가 사진마다 달라 오래 캐시해도 된다
            upsert: false,
          })
          if (error) throw new Error(`${file.name}: ${error.message}`)
          uploaded.push(path)
        }
        added.push({ id, thumbPath: uploaded[0]!, fullPath: uploaded[1]!, caption: '' })
      } catch (e) {
        if (uploaded.length) await storage.remove(uploaded)
        toast.error(e instanceof Error ? e.message : `${file.name}: 올리지 못했어요`)
      }
      setProgress({ done: i + 1, total: images.length })
    }
    if (added.length) {
      try {
        await addPhotos(invitationId, added)
        toast.success(`사진 ${added.length}장을 올렸어요`)
      } catch (e) {
        await storage.remove(added.flatMap((p) => [p.thumbPath, p.fullPath]))
        toast.error(e instanceof Error ? e.message : '사진을 저장하지 못했어요')
      }
    }
    setProgress(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const run = (fn: () => Promise<unknown>, done?: string) =>
    start(async () => {
      try {
        await fn()
        if (done) toast.success(done)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '처리하지 못했어요')
      }
    })

  const busy = pending || progress !== null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          사진 {photos.length} / {MAX_PHOTOS}장
        </CardTitle>
        <CardDescription>
          브라우저에서 썸네일·큰 사진 두 벌로 줄여서 올려요(원본은 올리지 않아요). ★는 카톡 미리보기에 쓰는 대표 사진이에요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors',
            dragging && 'border-primary bg-primary/5',
            (busy || left === 0) && 'pointer-events-none opacity-60',
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void upload([...e.dataTransfer.files])
          }}
        >
          <ImagePlusIcon className="size-6" />
          {progress
            ? `올리는 중… ${progress.done} / ${progress.total}`
            : left === 0
              ? '사진을 더 올릴 수 없어요'
              : '사진을 끌어다 놓거나 눌러서 고르세요 (여러 장 가능)'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy || left === 0}
            onChange={(e) => void upload([...(e.target.files ?? [])])}
          />
        </label>

        {photos.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p, i) => (
              <li key={p.id} className="space-y-2 rounded-lg border bg-background p-2">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbUrl} alt={p.caption} className="aspect-square w-full rounded-md object-cover" />
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 text-xs text-white">{i + 1}</span>
                  {p.id === effectiveCover && <Badge className="absolute right-1.5 top-1.5">대표</Badge>}
                </div>
                <Input
                  key={`${p.id}-${p.caption}`}
                  defaultValue={p.caption}
                  placeholder="한 줄 설명 (선택)"
                  maxLength={60}
                  className="h-8 text-xs"
                  disabled={busy}
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v !== p.caption) run(() => updatePhotoCaption(invitationId, p.id, v), '설명을 저장했어요')
                  }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="앞으로"
                      disabled={busy || i === 0}
                      onClick={() => run(() => movePhoto(invitationId, p.id, -1))}
                    >
                      <ArrowLeftIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="뒤로"
                      disabled={busy || i === photos.length - 1}
                      onClick={() => run(() => movePhoto(invitationId, p.id, 1))}
                    >
                      <ArrowRightIcon />
                    </Button>
                  </div>
                  <div className="flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={p.id === coverPhotoId ? '대표 사진 해제' : '대표 사진으로'}
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => setCoverPhoto(invitationId, p.id === coverPhotoId ? null : p.id),
                          p.id === coverPhotoId ? '대표 사진을 해제했어요' : '대표 사진으로 정했어요',
                        )
                      }
                    >
                      <StarIcon className={cn(p.id === coverPhotoId && 'fill-current')} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" aria-label="삭제" disabled={busy}>
                          <Trash2Icon />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>이 사진을 삭제할까요?</AlertDialogTitle>
                          <AlertDialogDescription>저장된 파일까지 지워지고 되돌릴 수 없어요.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => run(() => deletePhoto(invitationId, p.id), '삭제했어요')}>
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
