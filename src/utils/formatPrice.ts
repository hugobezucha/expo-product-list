import type { BrandFormatting } from '../brands/types';

export function createPriceFormatter(formatting: BrandFormatting): (amount: number) => string {
  const { locale, currency } = formatting;
  try {
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    return (amount) => formatter.format(amount);
  } catch {
    return (amount) => `${amount.toFixed(2)} ${currency}`;
  }
}
