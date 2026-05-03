import { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useSettings } from '@/contexts/settings';
import { createPosition } from '@/services/positions';
import { updateCurrentPrice } from '@/services/prices';

export default function AddPositionScreen() {
    const colorScheme = useActiveTheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { currencySymbol } = useSettings();

    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [shares, setShares] = useState('');
    const [avgCost, setAvgCost] = useState('');
    const [notes, setNotes] = useState('');

    const handleSave = async () => {
        if (!symbol.trim() || !shares.trim() || !avgCost.trim()) return;
        const pos = await createPosition({
            symbol: symbol.trim(),
            name: name.trim() || null,
            shares: parseFloat(shares),
            avg_cost: parseFloat(avgCost),
            notes: notes.trim() || null,
        });
        await updateCurrentPrice(pos.id, parseFloat(avgCost));
        router.back();
    };

    const canSave =
        symbol.trim().length > 0 &&
        shares.trim().length > 0 &&
        parseFloat(shares) > 0 &&
        avgCost.trim().length > 0 &&
        parseFloat(avgCost) > 0;

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']} style={styles.safeTop}>
                <View style={[styles.header, { borderBottomColor: colors.surfaceContainerHighest }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
                        <Text style={[styles.headerActionText, { color: colors.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Add Position</Text>
                    <View style={styles.headerAction} />
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Symbol</Text>
                    <TextInput
                        style={[
                            styles.input,
                            styles.symbolInput,
                            { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface },
                        ]}
                        placeholder="e.g. QQQ, VOO, AAPL"
                        placeholderTextColor={colors.outline}
                        value={symbol}
                        onChangeText={(t) => setSymbol(t.toUpperCase())}
                        autoCapitalize="characters"
                    />

                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                        Name{' '}
                        <Text style={{ color: colors.outline, fontSize: Typography.bodySm.fontSize }}>(optional)</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
                        placeholder="e.g. Invesco QQQ Trust"
                        placeholderTextColor={colors.outline}
                        value={name}
                        onChangeText={setName}
                    />

                    <View style={styles.splitRow}>
                        <View style={styles.splitField}>
                            <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Shares</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface },
                                ]}
                                placeholder="0"
                                placeholderTextColor={colors.outline}
                                keyboardType="decimal-pad"
                                value={shares}
                                onChangeText={setShares}
                            />
                        </View>
                        <View style={styles.splitField}>
                            <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                                Avg. Cost / Share
                            </Text>
                            <View style={[styles.amountRow, { backgroundColor: colors.surfaceContainerLow }]}>
                                <Text style={[styles.currencySign, { color: colors.onSurface }]}>{currencySymbol}</Text>
                                <TextInput
                                    style={[styles.amountInput, { color: colors.onSurface }]}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.outline}
                                    keyboardType="decimal-pad"
                                    value={avgCost}
                                    onChangeText={setAvgCost}
                                />
                            </View>
                        </View>
                    </View>

                    {shares && avgCost && parseFloat(shares) > 0 && parseFloat(avgCost) > 0 && (
                        <View style={[styles.totalPreview, { backgroundColor: colors.surfaceContainerLow }]}>
                            <Text style={[styles.totalPreviewLabel, { color: colors.onSurfaceVariant }]}>
                                Total Invested
                            </Text>
                            <Text style={[styles.totalPreviewValue, { color: colors.onSurface }]}>
                                {currencySymbol}
                                {(parseFloat(shares) * parseFloat(avgCost)).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </Text>
                        </View>
                    )}

                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                        Notes{' '}
                        <Text style={{ color: colors.outline, fontSize: Typography.bodySm.fontSize }}>(optional)</Text>
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            styles.notesInput,
                            { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface },
                        ]}
                        placeholder="Add a note..."
                        placeholderTextColor={colors.outline}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        textAlignVertical="top"
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        { backgroundColor: canSave ? colors.primary : colors.surfaceContainerHighest },
                    ]}
                    disabled={!canSave}
                    onPress={handleSave}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.saveText, { color: canSave ? colors.onPrimary : colors.outline }]}>
                        Add Position
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    safeTop: {
        backgroundColor: 'transparent',
    },
    safeBottom: {
        backgroundColor: 'transparent',
        paddingHorizontal: Spacing.margin,
        paddingBottom: Spacing.md,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.margin,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    headerAction: {
        width: 60,
    },
    headerActionText: {
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
    },
    scrollContent: {
        padding: Spacing.margin,
        paddingBottom: Spacing.xxl,
    },
    fieldLabel: {
        fontSize: Typography.labelMd.fontSize,
        fontWeight: Typography.labelMd.fontWeight,
        lineHeight: Typography.labelMd.lineHeight,
        letterSpacing: Typography.labelMd.letterSpacing,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
    },
    input: {
        fontSize: Typography.bodyMd.fontSize,
        lineHeight: Typography.bodyMd.lineHeight,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        borderRadius: Radius.lg,
    },
    symbolInput: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '600',
        letterSpacing: 1,
    },
    splitRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    splitField: {
        flex: 1,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
    },
    currencySign: {
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '500',
        marginRight: Spacing.xs,
    },
    amountInput: {
        flex: 1,
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '500',
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    },
    totalPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        borderRadius: Radius.lg,
        marginTop: Spacing.md,
    },
    totalPreviewLabel: {
        fontSize: Typography.bodySm.fontSize,
        fontWeight: '500',
    },
    totalPreviewValue: {
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '600',
    },
    notesInput: {
        minHeight: 80,
    },
    saveButton: {
        borderRadius: Radius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveText: {
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '600',
    },
});
