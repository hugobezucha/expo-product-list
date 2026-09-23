import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { createPriceFormatter } from '../utils/formatPrice';
import { DEFAULT_BRAND_ID, getBrand } from './registry';
import type { BrandConfig, BrandId, BrandTheme } from './types';

export interface BrandContextValue {
  brand: BrandConfig;
  theme: BrandTheme;
  setBrandId: (id: BrandId) => void;
  formatPrice: (amount: number) => string;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brandId, setBrandId] = useState<BrandId>(DEFAULT_BRAND_ID);

  const value = useMemo<BrandContextValue>(() => {
    const brand = getBrand(brandId);
    return {
      brand,
      theme: brand.theme,
      setBrandId,
      formatPrice: createPriceFormatter(brand.formatting),
    };
  }, [brandId]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  const value = useContext(BrandContext);
  if (value === null) {
    throw new Error('useBrand() must be used inside <BrandProvider>');
  }
  return value;
}

export function useTheme(): BrandTheme {
  return useBrand().theme;
}
