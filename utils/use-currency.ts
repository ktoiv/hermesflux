import { useSettings } from '@/contexts/settings';

export function useCurrency() {
  const { currencySymbol, currency } = useSettings();

  const fmt = (amount: number): string =>
    currencySymbol + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return { fmt, symbol: currencySymbol, code: currency };
}
