# 리틀 월드 웨딩

게임처럼 캐릭터를 움직이며 둘러보는 픽셀아트 모바일 청첩장.
커플마다 `/{slug}` 고유 주소를 받고, 무대는 테마 중 하나를 고른다.

| 테마 | 무대 | 방명록 |
|---|---|---|
| 우주 | 마션풍 붉은 행성과 우주 | 망원경 → 글마다 별이 하나씩 뜸 |
| 마을 | 숲속 마을과 바닷가 | 낚시터 → 글마다 물고기가 한 마리씩 늘어남 |

## 문서

- [docs/PLANNING.md](docs/PLANNING.md): 기획 전체 (서비스 구조, 테마, 인트로, 장소와 모달, 방명록, 조작, 어드민, 데이터·백엔드, 진행 순서)
- [docs/ART_GUIDE.md](docs/ART_GUIDE.md): 픽셀아트 기준 (해상도, 그리기 순서, 스프라이트 표기법, 팔레트, UI 색)
- [docs/STORE_GUIDE.md](docs/STORE_GUIDE.md): 스마트스토어 상품·상세 이미지 기준과 기준 이미지
- [CLAUDE.md](CLAUDE.md): 작업 규칙 요약 (구조, 진행 순서, 공통·성능 규칙)
- 목업 (브라우저로 열기, 왼쪽 위 버튼으로 테마 전환)
  - [docs/mockup/index.html](docs/mockup/index.html): 우주 테마
  - [docs/mockup/village.html](docs/mockup/village.html): 마을 테마

## 구조

Turborepo + pnpm 모노레포

```
apps/web        하객용 청첩장  {도메인}/{slug}
apps/admin      어드민         admin.{도메인}
packages/engine 캔버스 게임 엔진 + 테마
packages/shared 타입, 스키마, slug, 공통 상수
```

Next.js · Supabase · Vercel · 2D 캔버스 픽셀아트

```bash
pnpm install
pnpm dev        # web http://localhost:3000, admin http://localhost:3001
```
