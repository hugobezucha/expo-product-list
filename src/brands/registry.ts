import { alpha } from './alpha';
import { beta } from './beta';
import type { BrandConfig, BrandId } from './types';

export const BRANDS = { alpha, beta } as const satisfies Record<BrandId, BrandConfig>;

export const DEFAULT_BRAND_ID: BrandId = 'alpha';

export function getBrand(id: BrandId): BrandConfig {
  return BRANDS[id];
}
