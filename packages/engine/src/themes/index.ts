import type { ThemeId } from '@lww/shared'
import type { Theme } from '../theme'
import { createSpaceTheme } from './space'
import { createVillageTheme } from './village'

export function createTheme(id: ThemeId): Theme {
  return id === 'space' ? createSpaceTheme() : createVillageTheme()
}
