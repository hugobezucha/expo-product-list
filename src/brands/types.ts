import type { ProductsApiConfig } from '../api/products/types';

export const BRAND_IDS = ['alpha', 'beta'] as const;
export type BrandId = (typeof BRAND_IDS)[number];

export interface BrandTheme {
  colors: {
    primary: string;
    onPrimary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    danger: string;
  };
  radius: number;
}

export interface BrandFormatting {
  locale: string;
  currency: string;
}

export interface BrandConfig {
  id: BrandId;
  name: string;
  theme: BrandTheme;
  api: ProductsApiConfig;
  formatting: BrandFormatting;
}
