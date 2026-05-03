import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    getSettings,
    updateSetting,
    getCurrencySymbol,
    type AppSettings,
    type ThemeMode,
    type CurrencyCode,
} from '@/services/settings';

interface SettingsContextValue {
    settings: AppSettings;
    theme: ThemeMode;
    currency: CurrencyCode;
    currencySymbol: string;
    setTheme: (mode: ThemeMode) => Promise<void>;
    setCurrency: (code: CurrencyCode) => Promise<void>;
    loaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
    settings: { theme: 'system', currency: 'USD', currency_symbol: '$' },
    theme: 'system',
    currency: 'USD',
    currencySymbol: '$',
    setTheme: async () => {},
    setCurrency: async () => {},
    loaded: false,
});

export function useSettings(): SettingsContextValue {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>({ theme: 'system', currency: 'USD', currency_symbol: '$' });
    const [loaded, setLoaded] = useState(false);

    const reload = useCallback(async () => {
        const s = await getSettings();
        setSettings(s);
        setLoaded(true);
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    const setTheme = async (mode: ThemeMode) => {
        await updateSetting('theme', mode);
        await reload();
    };

    const setCurrency = async (code: CurrencyCode) => {
        const symbol = getCurrencySymbol(code);
        await updateSetting('currency', code);
        await updateSetting('currency_symbol', symbol);
        await reload();
    };

    return (
        <SettingsContext.Provider
            value={{
                settings,
                theme: settings.theme,
                currency: settings.currency,
                currencySymbol: settings.currency_symbol,
                setTheme,
                setCurrency,
                loaded,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}
