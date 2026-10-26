// 배경음악 기본 곡. docs/PLANNING.md 9장 "배경음악".
// 파일은 apps/web/public/bgm/ 에 있고(96kbps, 음량 -18 LUFS로 맞춤), 하객은 그 청첩장에 고른 곡 하나만 받는다.
// 청첩장 내용에는 곡 파일 경로(file)를 그대로 저장한다. 예전에 넣은 외부 주소(https://...)도 그대로 재생된다.
export const BGM_TRACKS = [
  { file: '/bgm/piano.mp3', label: '잔잔한 피아노' },
  { file: '/bgm/wedding.mp3', label: '웨딩' },
  { file: '/bgm/wedding-piano.mp3', label: '웨딩 피아노' },
  { file: '/bgm/romantic.mp3', label: '로맨틱' },
] as const

export const BGM_FILES = BGM_TRACKS.map((t) => t.file) as [(typeof BGM_TRACKS)[number]['file'], ...(typeof BGM_TRACKS)[number]['file'][]]

export const bgmLabel = (file: string) => BGM_TRACKS.find((t) => t.file === file)?.label ?? null
