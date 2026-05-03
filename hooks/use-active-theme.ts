import { useColorScheme } from 'react-native';
import { useSettings } from '@/contexts/settings';

export function useActiveTheme(): 'light' | 'dark' {
    const system = useColorScheme();
    const { theme, loaded } = useSettings();

    if (!loaded || theme === 'system') return system ?? 'light';
    return theme;
}
