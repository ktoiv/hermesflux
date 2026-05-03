import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDatabase } from '@/services/database';
import { seedDefaultCategories } from '@/services/categories';
import { seedDefaultAccounts } from '@/services/accounts';
import { SettingsProvider, useSettings } from '@/contexts/settings';

export const unstable_settings = {
    anchor: '(tabs)',
};

function RootLayoutInner() {
    const systemScheme = useColorScheme();
    const { theme, loaded } = useSettings();

    const resolvedTheme = (() => {
        if (!loaded) return systemScheme;
        if (theme === 'system') return systemScheme;
        return theme;
    })();

    useEffect(() => {
        (async () => {
            try {
                await getDatabase();
                await seedDefaultCategories();
                await seedDefaultAccounts();
            } catch (e) {
                console.warn('Database init failed (expected on some web browsers):', e);
            }
        })();
    }, []);

    return (
        <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="add-expense" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="add-position" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="add-income" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="add-loan" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="add-annual-expense" options={{ presentation: 'modal', headerShown: false }} />
            </Stack>
            <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <SettingsProvider>
            <RootLayoutInner />
        </SettingsProvider>
    );
}
