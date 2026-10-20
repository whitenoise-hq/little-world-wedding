'use client'

// 업로드 전에 브라우저에서 사진을 줄인다. 원본은 올리지 않는다 (docs/PLANNING.md "어드민 사진 관리").
// - 사진 방향(EXIF 회전)을 바로잡는다
// - WebP로 인코딩한다. 사파리처럼 WebP 인코딩을 못 하면 JPEG로 대신한다

export interface ResizedImage {
  blob: Blob
  ext: 'webp' | 'jpg'
}

async function encode(canvas: HTMLCanvasElement, quality: number): Promise<ResizedImage> {
  const toBlob = (type: string) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, quality))
  const webp = await toBlob('image/webp')
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' }
  const jpg = await toBlob('image/jpeg')
  if (!jpg) throw new Error('이미지를 변환하지 못했어요')
  return { blob: jpg, ext: 'jpg' }
}

// 긴 변이 maxEdge를 넘지 않게 줄인다 (작은 사진은 그대로 크기 유지)
export async function resizeImage(file: File, maxEdge: number, quality: number): Promise<ResizedImage> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error(`${file.name}: 이 브라우저에서 읽을 수 없는 형식이에요. JPG나 PNG로 바꿔 올려 주세요`)
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return encode(canvas, quality)
}

export const THUMB_EDGE = 600
export const FULL_EDGE = 1920
