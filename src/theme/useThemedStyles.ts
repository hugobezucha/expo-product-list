import { useMemo } from 'react';

import { useTheme } from '../brands/BrandProvider';
import type { BrandTheme } from '../brands/types';

export function useThemedStyles<T>(factory: (theme: BrandTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
