import { BRANDS, DEFAULT_BRAND_ID, getBrand } from '../registry';
import { BRAND_IDS } from '../types';

const HEX_COLOR = /^#[0-9A-F]{6}$/i;

describe('brand registry', () => {
  it('has a config for every declared id, and each config knows its own id', () => {
    for (const id of BRAND_IDS) {
      expect(BRANDS[id].id).toBe(id);
    }
    expect(Object.keys(BRANDS).sort()).toEqual([...BRAND_IDS].sort());
    expect(BRAND_IDS).toContain(DEFAULT_BRAND_ID);
  });

  it('gives every brand usable colours and API parameters', () => {
    for (const id of BRAND_IDS) {
      const { theme, api } = getBrand(id);
      for (const color of Object.values(theme.colors)) {
        expect(color).toMatch(HEX_COLOR);
      }
      expect(api.pageSize).toBeGreaterThan(0);
      expect(api.timeoutMs).toBeGreaterThan(0);
      expect(api.baseUrl).toMatch(/^https:\/\//);
    }
  });

  it('keeps the two brands visibly different', () => {
    expect(BRANDS.alpha.theme.colors.primary).not.toBe(BRANDS.beta.theme.colors.primary);
    expect(BRANDS.alpha.api.pageSize).not.toBe(BRANDS.beta.api.pageSize);
  });
});
