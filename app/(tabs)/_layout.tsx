import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useActiveTheme } from '@/hooks/use-active-theme';

const TAB_ICONS: Record<string, { focused: string; default: string }> = {
    index: { focused: 'dashboard', default: 'dashboard' },
    portfolio: { focused: 'account-balance-wallet', default: 'account-balance-wallet' },
    annual: { focused: 'event', default: 'event' },
    loans: { focused: 'account-balance', default: 'account-balance' },
    settings: { focused: 'settings', default: 'settings' },
};

export default function TabLayout() {
    const colorScheme = useActiveTheme();
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom + 2,
                    paddingTop: 6,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.02,
                    shadowRadius: 20,
                    elevation: 4,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.tabIconDefault,
                tabBarShowLabel: true,
                    tabBarLabelStyle: {
                        fontSize: 11,

                        fontWeight: '600',

                        marginTop: 2,

                        marginBottom: 0,
                    },
                tabBarIconStyle: {
                    marginBottom: 0,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialIcons name={focused ? 'dashboard' : 'dashboard'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="portfolio"
                options={{
                    title: 'Portfolio',
                    tabBarIcon: ({ color }) => <MaterialIcons name="account-balance-wallet" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="annual"
                options={{
                    title: 'Annual',
                    tabBarIcon: ({ color }) => <MaterialIcons name="event" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="loans"
                options={{
                    title: 'Loans',
                    tabBarIcon: ({ color }) => <MaterialIcons name="account-balance" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
