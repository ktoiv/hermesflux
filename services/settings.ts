import { getDatabase } from './database';

export type ThemeMode = 'light' | 'dark' | 'system';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'SEK' | 'NOK' | 'DKK';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'Fr',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
};

export interface AppSettings {
    theme: ThemeMode;
    currency: CurrencyCode;
    currency_symbol: string;
}

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string }[] = [
    { code: 'USD', label: 'US Dollar ($)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'GBP', label: 'British Pound (£)' },
    { code: 'JPY', label: 'Japanese Yen (¥)' },
    { code: 'CAD', label: 'Canadian Dollar (CA$)' },
    { code: 'AUD', label: 'Australian Dollar (A$)' },
    { code: 'CHF', label: 'Swiss Franc (Fr)' },
    { code: 'SEK', label: 'Swedish Krona (kr)' },
    { code: 'NOK', label: 'Norwegian Krone (kr)' },
    { code: 'DKK', label: 'Danish Krone (kr)' },
];

export async function getSettings(): Promise<AppSettings> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings', []);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
        theme: (map.theme as ThemeMode) ?? 'system',
        currency: (map.currency as CurrencyCode) ?? 'USD',
        currency_symbol: map.currency_symbol ?? '$',
    };
}

export async function updateSetting(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export function getCurrencySymbol(code: CurrencyCode): string {
    return CURRENCY_SYMBOLS[code] ?? '$';
}
