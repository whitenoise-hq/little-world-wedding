// ESLint 설정 (레포 전체 하나). pnpm lint
// Next.js 권장 규칙(core-web-vitals + TypeScript) 위에, CLAUDE.md "공통 규칙" 중 기계로 잡을 수 있는 것을 건다.
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

// 테마는 테마마다 따로 청크로 나눠 loadTheme(동적 import)으로만 불러온다. 정적으로 import하면 청크 분리가 깨진다.
// (타입만 가져오는 import type은 번들에 남지 않으므로 허용)
const THEME_IMPORT = {
  regex: '(^|/)themes/(?!index$)[^/]+$',
  allowTypeImports: true,
  message: '테마 코드는 정적으로 import하지 않습니다. packages/engine/src/themes/index.ts의 loadTheme을 쓰세요 (CLAUDE.md 성능 규칙).',
}
// 테마 파일끼리도 서로 import하지 않는다 (공통 그림 도구는 ../painter 등 엔진 쪽에 둔다)
const THEME_TO_THEME = {
  regex: '^\\./',
  allowTypeImports: true,
  message: '테마끼리 import하지 않습니다. 공통 코드는 엔진(packages/engine/src)에 두세요.',
}
// 앱끼리 서로 import하지 않고, 패키지는 앱을 모른다
const app = (name) => {
  const message = `apps/${name}을 import하지 않습니다. 공유할 코드는 packages/에 두세요 (CLAUDE.md 공통 규칙).`
  return [
    { group: [`@lww/${name}`, `@lww/${name}/*`], message },
    // 상대 경로로 넘어가는 경우 (../../admin/src/..., ../../../apps/web/src/...)
    { regex: `(^|/)(apps/)?${name}/src(/|$)`, message },
  ]
}
// 하객용 앱에는 어드민 전용 의존성을 넣지 않는다
const ADMIN_ONLY = ['@supabase/ssr', 'radix-ui', 'lucide-react', 'sonner', 'next-themes', 'class-variance-authority', 'shadcn'].map((name) => ({
  name,
  message: '어드민 전용 의존성입니다. 하객용 앱(apps/web)에는 넣지 않습니다 (CLAUDE.md 공통 규칙).',
}))

const restrict = ({ paths = [], patterns = [] }) => ({
  'no-restricted-imports': 'off',
  '@typescript-eslint/no-restricted-imports': ['error', { paths, patterns }],
})

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['**/.next/**', '**/node_modules/**', '**/out/**', '**/next-env.d.ts', 'packages/shared/src/database.types.ts', 'docs/**']),
  {
    settings: { next: { rootDir: ['apps/web/', 'apps/admin/'] } },
  },

  // 앱별·패키지별 import 경계 (no-restricted-imports는 마지막 설정이 덮어쓰므로 파일 묶음이 겹치지 않게 나눈다)
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: restrict({ paths: ADMIN_ONLY, patterns: [THEME_IMPORT, ...app('admin')] }),
  },
  {
    files: ['apps/admin/**/*.{ts,tsx}'],
    rules: restrict({ patterns: [THEME_IMPORT, ...app('web')] }),
  },
  {
    files: ['packages/**/*.{ts,tsx}'],
    ignores: ['packages/engine/src/themes/**'],
    rules: restrict({ patterns: [THEME_IMPORT, ...app('web'), ...app('admin')] }),
  },
  {
    files: ['packages/engine/src/themes/**/*.ts'],
    rules: restrict({ patterns: [THEME_TO_THEME, ...app('web'), ...app('admin')] }),
  },

  // 결정적 값: 방명록 오브젝트·slug 등은 렌더할 때마다 바뀌면 안 되므로 Math.random 금지 (slug는 crypto.getRandomValues)
  {
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: '엔진·공유 코드에서는 Math.random을 쓰지 않습니다. 글 id 해시나 crypto.getRandomValues를 쓰세요 (CLAUDE.md 공통 규칙).' },
      ],
    },
  },

  // 공통 정리 규칙
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
])
