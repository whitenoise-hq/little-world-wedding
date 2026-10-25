import type { ThemeId } from '@lww/shared'
import type { Theme } from '../theme'

// 테마마다 따로 청크로 나눠, 그 청첩장의 테마 하나만 불러온다. 테마를 늘려도 하객이 받는 코드는 늘지 않는다.
// 새 테마는 여기에 등록한다. Record라서 ThemeId에 있는데 빠뜨리면 typecheck에서 막힌다.
const modules: Record<ThemeId, () => Promise<() => Theme>> = {
  space: () => import('./space').then((m) => m.createSpaceTheme),
  village: () => import('./village').then((m) => m.createVillageTheme),
  airport: () => import('./airport').then((m) => m.createAirportTheme),
}

export function loadTheme(id: ThemeId): Promise<Theme> {
  return modules[id]().then((create) => create())
}

// 테마 청크만 미리 받아 둔다 (테마는 만들지 않음). 같은 청크는 한 번만 받으므로 뒤의 loadTheme이 이 요청을 그대로 쓴다.
export function preloadTheme(id: ThemeId): Promise<void> {
  return modules[id]().then(() => undefined)
}
