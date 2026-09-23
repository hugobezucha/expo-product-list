import type { BrandConfig } from './types';

export const beta = {
  id: 'beta',
  name: 'Beta Market',
  theme: {
    colors: {
      primary: '#C2410C',
      onPrimary: '#FFFFFF',
      background: '#FBF6F1',
      surface: '#FFFFFF',
      text: '#1C1917',
      textMuted: '#78716C',
      border: '#EAE3DB',
      danger: '#B91C1C',
    },
    radius: 6,
  },
  api: {
    baseUrl: 'https://fakestoreapi.com',
    pageSize: 8,
    timeoutMs: 8000,
  },
  formatting: {
    locale: 'cs-CZ',
    currency: 'USD',
  },
} as const satisfies BrandConfig;
