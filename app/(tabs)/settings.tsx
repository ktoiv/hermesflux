import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useSettings } from '@/contexts/settings';
import { CURRENCY_OPTIONS } from '@/services/settings';
import type { ThemeMode, CurrencyCode } from '@/services/settings';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'system', label: 'System', icon: 'brightness-auto' },
    { value: 'light', label: 'Light', icon: 'light-mode' },
    { value: 'dark', label: 'Dark', icon: 'dark-mode' },
];

export default function SettingsScreen() {
    const colorScheme = useActiveTheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { theme, currency, currencySymbol, setTheme, setCurrency, loaded } = useSettings();
    const [showCurrencies, setShowCurrencies] = useState(false);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']} style={styles.safeTop}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Settings</Text>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>Appearance</Text>

                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest },
                    ]}
                >
                    {THEME_OPTIONS.map((opt, i) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.optionRow,
                                i < THEME_OPTIONS.length - 1 && {
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.surfaceContainerHighest,
                                },
                            ]}
                            onPress={() => setTheme(opt.value)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.optionLeft}>
                                <MaterialIcons
                                    name={opt.icon as any}
                                    size={22}
                                    color={theme === opt.value ? colors.primary : colors.outline}
                                />
                                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>{opt.label}</Text>
                            </View>
                            {theme === opt.value && (
                                <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant, marginTop: Spacing.xl }]}>
                    Currency
                </Text>

                <TouchableOpacity
                    style={[
                        styles.card,
                        { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest },
                    ]}
                    onPress={() => setShowCurrencies(!showCurrencies)}
                    activeOpacity={0.7}
                >
                    <View style={styles.optionRow}>
                        <View style={styles.optionLeft}>
                            <MaterialIcons name="attach-money" size={22} color={colors.outline} />
                            <Text style={[styles.optionLabel, { color: colors.onSurface }]}>
                                {currency} ({currencySymbol})
                            </Text>
                        </View>
                        <MaterialIcons
                            name={showCurrencies ? 'expand-less' : 'expand-more'}
                            size={22}
                            color={colors.outline}
                        />
                    </View>
                </TouchableOpacity>

                {showCurrencies && (
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.surfaceContainerHighest,
                                marginTop: Spacing.sm,
                            },
                        ]}
                    >
                        {CURRENCY_OPTIONS.map((opt, i) => (
                            <TouchableOpacity
                                key={opt.code}
                                style={[
                                    styles.optionRow,
                                    i < CURRENCY_OPTIONS.length - 1 && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.surfaceContainerHighest,
                                    },
                                ]}
                                onPress={() => {
                                    setCurrency(opt.code);
                                    setShowCurrencies(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionLeft}>
                                    <Text style={[styles.optionLabel, { color: colors.onSurface }]}>{opt.label}</Text>
                                </View>
                                {currency === opt.code && (
                                    <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.surfaceContainerHighest,
                            marginTop: Spacing.xl,
                        },
                    ]}
                >
                    <View style={styles.optionRow}>
                        <View style={styles.optionLeft}>
                            <MaterialIcons name="info-outline" size={22} color={colors.outline} />
                            <View>
                                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Hermes Flux</Text>
                                <Text style={[styles.optionSub, { color: colors.outline }]}>Version 1.0.0</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    safeTop: { paddingHorizontal: Spacing.margin, paddingTop: Spacing.sm },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
    },
    headerTitle: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        lineHeight: Typography.h1.lineHeight,
        letterSpacing: Typography.h1.letterSpacing,
    },
    flex: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.margin, paddingBottom: 120 },
    sectionLabel: {
        fontSize: Typography.labelMd.fontSize,
        fontWeight: Typography.labelMd.fontWeight,
        lineHeight: Typography.labelMd.lineHeight,
        letterSpacing: Typography.labelMd.letterSpacing,
        textTransform: 'uppercase',
        marginBottom: Spacing.sm,
    },
    card: {
        borderRadius: Radius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 20,
        elevation: 1,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
    },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
    optionLabel: { fontSize: Typography.bodyMd.fontSize, fontWeight: '500' },
    optionSub: { fontSize: Typography.bodySm.fontSize, fontWeight: Typography.bodySm.fontWeight, marginTop: 1 },
});
