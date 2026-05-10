import { useState, useCallback } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useSettings } from '@/contexts/settings';
import { getAllPositions, getPositionsSummary, updatePosition, deletePosition } from '@/services/positions';
import { updateCurrentPrice } from '@/services/prices';
import type { Position } from '@/services/positions';

const COLORS: (keyof typeof Colors.light)[] = [
    'primaryContainer',
    'secondaryContainer',
    'tertiaryContainer',
    'primaryContainer',
];

function formatCurrency(value: number, symbol: string = '$'): string {
    return symbol + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PositionRow({
    position,
    index,
    colors,
    onEditPrice,
    onDelete,
    symbol = '$',
}: {
    position: Position;
    index: number;
    colors: typeof Colors.light;
    onEditPrice: (p: Position) => void;
    onDelete: (id: number) => void;
    symbol?: string;
}) {
    const currentPrice = position.current_price ?? position.avg_cost;
    const totalValue = position.shares * currentPrice;
    const colorKey = COLORS[index % COLORS.length];

    return (
        <View
            style={[
                styles.positionCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest },
            ]}
        >
            <View style={styles.positionTop}>
                <View style={[styles.positionIcon, { backgroundColor: colors[colorKey] + '80' }]}>
                    <Text style={[styles.positionSymbol, { color: colors.onSurface }]}>{position.symbol}</Text>
                </View>
                <View style={styles.positionInfo}>
                    <Text style={[styles.positionName, { color: colors.onSurface }]}>
                        {position.name ?? position.symbol}
                    </Text>
                    <Text style={[styles.positionDetail, { color: colors.outline }]}>
                        {position.shares} shares @ {formatCurrency(position.avg_cost, symbol)} avg
                    </Text>
                </View>
                <View style={styles.positionValue}>
                    <View style={styles.positionValueTop}>
                        <TouchableOpacity onPress={() => onEditPrice(position)} style={styles.editPriceBtn}>
                            <MaterialIcons name="edit" size={22} color={colors.outline} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onDelete(position.id)} style={styles.editPriceBtn}>
                            <MaterialIcons name="delete-outline" size={22} color={colors.outline} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.positionAmount, { color: colors.onSurface }]}>
                        {formatCurrency(totalValue, symbol)}
                    </Text>
                </View>
            </View>
        </View>
    );
}

export default function PortfolioScreen() {
    const colorScheme = useActiveTheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const [positions, setPositions] = useState<Position[]>([]);
    const [summary, setSummary] = useState({ totalInvested: 0, positionCount: 0 });
    const { currencySymbol } = useSettings();
    const [editing, setEditing] = useState<Position | null>(null);
    const [priceInput, setPriceInput] = useState('');
    const [sharesInput, setSharesInput] = useState('');

    const load = useCallback(async () => {
        setPositions(await getAllPositions());
        setSummary(await getPositionsSummary());
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const totalValue = positions.reduce((s, p) => {
        const price = p.current_price ?? p.avg_cost;
        return s + p.shares * price;
    }, 0);
    const handleEditPrice = (position: Position) => {
        setEditing(position);
        setPriceInput((position.current_price ?? position.avg_cost).toFixed(2));
        setSharesInput(position.shares.toString());
    };

    const handleSavePrice = async () => {
        if (!editing || !priceInput.trim() || parseFloat(priceInput) <= 0) return;
        const shares = sharesInput.trim() ? parseFloat(sharesInput) : null;
        if (shares && shares > 0) {
            await updatePosition(editing.id, { shares });
        }
        await updateCurrentPrice(editing.id, parseFloat(priceInput));
        setEditing(null);
        setPriceInput('');
        setSharesInput('');
        await load();
    };

    const handleDelete = async (id: number) => {
        await deletePosition(id);
        await load();
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']} style={styles.safeTop}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.avatar, { backgroundColor: colors.background }]}>
                            <Image source={require('@/theme-light-mode.jpg')} style={styles.avatarImage} />
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={[
                        styles.summaryCard,
                        { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest },
                    ]}
                >
                    <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Total Value</Text>
                    <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
                        {formatCurrency(totalValue, currencySymbol)}
                    </Text>
                    <View style={[styles.summaryDivider, { backgroundColor: colors.surfaceContainerHighest }]} />
                    <View style={styles.summaryFooter}>
                        <View>
                            <Text style={[styles.summaryFooterLabel, { color: colors.outline }]}>Invested</Text>
                            <Text style={[styles.summaryFooterValue, { color: colors.onSurface }]}>
                                {formatCurrency(summary.totalInvested, currencySymbol)}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.summaryFooterLabel, { color: colors.outline }]}>Positions</Text>
                            <Text style={[styles.summaryFooterValue, { color: colors.onSurface }]}>
                                {summary.positionCount}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Holdings</Text>
                </View>

                <View style={styles.positionsList}>
                    {positions.length > 0 ? (
                        positions.map((position, i) => (
                            <PositionRow
                                key={position.id}
                                position={position}
                                index={i}
                                colors={colors}
                                onEditPrice={handleEditPrice}
                                onDelete={handleDelete}
                                symbol={currencySymbol}
                            />
                        ))
                    ) : (
                        <Text
                            style={[
                                {
                                    color: colors.outline,
                                    textAlign: 'center',
                                    paddingVertical: Spacing.xl,
                                    fontSize: Typography.bodyMd.fontSize,
                                },
                            ]}
                        >
                            No positions yet. Tap + to add one.
                        </Text>
                    )}
                </View>
            </ScrollView>

            <Modal visible={editing != null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditing(null)}>
                    <TouchableOpacity
                        style={[styles.modalCard, { backgroundColor: colors.background }]}
                        activeOpacity={1}
                        onPress={() => {}}
                    >
                        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>{editing?.symbol}</Text>

                        <Text style={[styles.modalFieldLabel, { color: colors.onSurfaceVariant }]}>Shares</Text>
                        <TextInput
                            style={[
                                styles.modalInputField,
                                { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface },
                            ]}
                            keyboardType="decimal-pad"
                            value={sharesInput}
                            onChangeText={setSharesInput}
                            selectTextOnFocus
                        />

                        <Text style={[styles.modalFieldLabel, { color: colors.onSurfaceVariant }]}>Current Price</Text>
                        <View style={[styles.modalInputRow, { backgroundColor: colors.surfaceContainerLow }]}>
                            <Text style={[styles.modalCurrency, { color: colors.onSurface }]}>{currencySymbol}</Text>
                            <TextInput
                                style={[styles.modalInput, { color: colors.onSurface }]}
                                keyboardType="decimal-pad"
                                value={priceInput}
                                onChangeText={setPriceInput}
                                selectTextOnFocus
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={() => setEditing(null)}
                                style={[styles.modalBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                            >
                                <Text style={[styles.modalBtnText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSavePrice}
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                            >
                                <Text style={[styles.modalBtnText, { color: colors.onPrimary }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primaryContainer }]}
                activeOpacity={0.8}
                onPress={() => router.push('/add-position')}
            >
                <MaterialIcons name="add" size={28} color={colors.onPrimaryContainer} />
            </TouchableOpacity>
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
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 4 },
    avatar: { width: 52, height: 52, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { width: 52, height: 52 },
    flex: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.margin, paddingBottom: 120 },
    summaryCard: {
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        marginBottom: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: Typography.labelMd.fontSize,
        fontWeight: Typography.labelMd.fontWeight,
        lineHeight: Typography.labelMd.lineHeight,
        letterSpacing: Typography.labelMd.letterSpacing,
        textTransform: 'uppercase',
        marginBottom: Spacing.xs,
    },
    summaryValue: {
        fontSize: Typography.display.fontSize,
        fontWeight: Typography.display.fontWeight,
        lineHeight: Typography.display.lineHeight,
        letterSpacing: Typography.display.letterSpacing,
        marginBottom: Spacing.sm,
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    summaryDivider: { height: 1, marginVertical: Spacing.md },
    summaryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryFooterLabel: {
        fontSize: Typography.bodySm.fontSize,
        fontWeight: Typography.bodySm.fontWeight,
        lineHeight: Typography.bodySm.lineHeight,
        marginBottom: 2,
    },
    summaryFooterValue: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.h2.fontSize,
        fontWeight: Typography.h2.fontWeight,
        lineHeight: Typography.h2.lineHeight,
        letterSpacing: Typography.h2.letterSpacing,
    },
    positionsList: { gap: Spacing.md },
    positionCard: {
        borderRadius: Radius.xl,
        padding: Spacing.md,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 20,
        elevation: 1,
    },
    positionTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    positionIcon: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
    positionSymbol: {
        fontSize: Typography.labelMd.fontSize,
        fontWeight: '700',
        letterSpacing: Typography.labelMd.letterSpacing,
    },
    positionInfo: { flex: 1 },
    positionName: { fontSize: Typography.bodyMd.fontSize, fontWeight: '500', lineHeight: Typography.bodyMd.lineHeight },
    positionDetail: {
        fontSize: Typography.bodySm.fontSize,
        fontWeight: Typography.bodySm.fontWeight,
        lineHeight: Typography.bodySm.lineHeight,
        marginTop: 1,
    },
    positionValue: { alignItems: 'flex-end' },
    positionValueTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    positionAmount: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
    editPriceBtn: { padding: 6 },
    fab: {
        position: 'absolute',
        bottom: 88,
        right: Spacing.margin,
        width: 56,
        height: 56,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalCard: { width: '100%', borderRadius: Radius.xl, padding: Spacing.xl, maxWidth: 340 },
    modalTitle: { fontSize: Typography.h3.fontSize, fontWeight: '600', marginBottom: Spacing.lg },
    modalFieldLabel: {
        fontSize: Typography.labelMd.fontSize,
        fontWeight: Typography.labelMd.fontWeight,
        lineHeight: Typography.labelMd.lineHeight,
        letterSpacing: Typography.labelMd.letterSpacing,
        marginBottom: Spacing.sm,
    },
    modalInputField: {
        fontSize: Typography.bodyMd.fontSize,
        lineHeight: Typography.bodyMd.lineHeight,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        borderRadius: Radius.lg,
        marginBottom: Spacing.lg,
    },
    modalInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
    },
    modalCurrency: { fontSize: Typography.h2.fontSize, fontWeight: '500', marginRight: Spacing.xs },
    modalInput: {
        flex: 1,
        fontSize: Typography.h2.fontSize,
        fontWeight: '500',
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    },
    modalActions: { flexDirection: 'row', gap: Spacing.sm },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center' },
    modalBtnText: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
});
