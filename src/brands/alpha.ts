import type { BrandConfig } from './types';

export const alpha = {
  id: 'alpha',
  name: 'Alpha Store',
  theme: {
    colors: {
      primary: '#2F54EB',
      onPrimary: '#FFFFFF',
      background: '#F4F6FB',
      surface: '#FFFFFF',
      text: '#111827',
      textMuted: '#6B7280',
      border: '#E3E7EF',
      danger: '#DC2626',
    },
    radius: 14,
  },
  api: {
    baseUrl: 'https://fakestoreapi.com',
    pageSize: 6,
    timeoutMs: 10000,
  },
  formatting: {
    locale: 'en-US',
    currency: 'USD',
  },
} as const satisfies BrandConfig;
