import { useState, useMemo, useCallback } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useSettings } from '@/contexts/settings';
import { getAllTransactions, getMonthlySummary, getCategoryBreakdown, deleteTransaction } from '@/services/transactions';
import { getMonthlyAnnualTotal, getAnnualBreakdown } from '@/services/annual-expenses';
import { getLoansSummary, applyMonthlyPayments } from '@/services/loans';
import { generateTransactionsFromRecurring } from '@/services/recurring';
import type { TransactionWithJoins } from '@/services/transactions';

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

function formatMonthLabel(date: Date): string {
    return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function isSameMonth(a: Date, b: Date): boolean {
    return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function monthStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const formatCurrency = (value: number, symbol: string = '$'): string =>
    symbol + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function TransactionRow({
    tx,
    colors,
    symbol = '$',
    onDelete,
}: {
    tx: TransactionWithJoins;
    colors: typeof Colors.light;
    symbol?: string;
    onDelete?: (id: number) => void;
}) {
    const isIncome = tx.type === 'income';
    const bgColor = tx.category_color
        ? (colors[tx.category_color as keyof typeof colors] as string) + '4D'
        : colors.surfaceContainerHigh;
    const iconColor = tx.category_color ? (colors[tx.category_color as keyof typeof colors] as string) : colors.outline;
    const amountColor = isIncome ? colors.primary : colors.onSurface;

    return (
        <View
            style={[
                styles.transactionRow,
                { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest },
            ]}
        >
            <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: bgColor }]}>
                    <MaterialIcons name={(tx.category_icon as any) ?? 'receipt'} size={22} color={iconColor} />
                </View>
                <View>
                    <Text style={[styles.transactionName, { color: colors.onSurface }]}>{tx.name}</Text>
                    <Text style={[styles.transactionDate, { color: colors.outline }]}>{formatDateLabel(tx.date)}</Text>
                </View>
            </View>
            <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { color: amountColor }]}>
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, symbol)}
                </Text>
                {onDelete && (
                    <TouchableOpacity onPress={() => onDelete(tx.id)} style={styles.transactionDeleteBtn}>
                        <MaterialIcons name="delete-outline" size={16} color={colors.outline} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

function DoughnutChart({
    breakdown,
    colors,
    symbol = '$',
}: {
    breakdown: Array<{ category_name: string; percent: number; total: number; color: string | null }>;
    colors: typeof Colors.light;
    symbol?: string;
}) {
    const cx = 18,
        cy = 18,
        r = 15.9;
    const circumference = 2 * Math.PI * r;

    let offset = 0;
    const segments = breakdown.map((seg) => {
        const dash = (seg.percent / 100) * circumference;
        const gap = circumference - dash;
        const segOffset = offset;
        offset -= dash;
        return { ...seg, dash, gap, offset: segOffset };
    });

    const totalSpent = breakdown.reduce((s, b) => s + b.total, 0);

    return (
        <View style={styles.chartContainer}>
            <View style={styles.chartSvgWrapper}>
                <Svg width={160} height={160} viewBox="0 0 36 36" style={{ transform: [{ rotate: '-90deg' }] }}>
                    {segments.map((seg, i) => (
                        <Circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={
                                seg.color
                                    ? (colors[seg.color as keyof typeof colors] as string)
                                    : colors.surfaceContainerHigh
                            }
                            strokeWidth={4}
                            strokeDasharray={`${seg.dash} ${seg.gap}`}
                            strokeDashoffset={seg.offset}
                            strokeLinecap="butt"
                        />
                    ))}
                </Svg>
                <View style={styles.chartCenter}>
                    <Text style={[styles.chartCenterLabel, { color: colors.outline }]}>Total Spent</Text>
                    <Text style={[styles.chartCenterAmount, { color: colors.onSurface }]}>
                        {formatCurrency(totalSpent, symbol)}
                    </Text>
                </View>
            </View>
            <View style={styles.legend}>
                {breakdown.map((seg, i) => (
                    <View key={i} style={styles.legendRow}>
                        <View style={styles.legendLeft}>
                            <View
                                style={[
                                    styles.legendDot,
                                    {
                                        backgroundColor: seg.color
                                            ? (colors[seg.color as keyof typeof colors] as string)
                                            : colors.surfaceContainerHigh,
                                    },
                                ]}
                            />
                            <Text style={[styles.legendLabel, { color: colors.onSurfaceVariant }]}>
                                {seg.category_name}
                            </Text>
                        </View>
                        <Text style={[styles.legendPercent, { color: colors.onSurface }]}>{seg.percent}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function MonthNav({
    current,
    onPrev,
    onNext,
    canGoNext,
    colors,
}: {
    current: Date;
    onPrev: () => void;
    onNext: () => void;
    canGoNext: boolean;
    colors: typeof Colors.light;
}) {
    return (
        <View style={[styles.monthNav, { borderBottomColor: colors.surfaceContainerHighest }]}>
            <TouchableOpacity onPress={onPrev} style={styles.monthArrow}>
                <MaterialIcons name="chevron-left" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.onSurface }]}>{formatMonthLabel(current)}</Text>
            <TouchableOpacity
                onPress={onNext}
                style={[styles.monthArrow, !canGoNext && { opacity: 0.3 }]}
                disabled={!canGoNext}
            >
                <MaterialIcons name="chevron-right" size={24} color={colors.onSurface} />
            </TouchableOpacity>
        </View>
    );
}

export default function DashboardScreen() {
    const colorScheme = useActiveTheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { currencySymbol } = useSettings();
    const today = useMemo(() => new Date(), []);

    const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [summary, setSummary] = useState({ income: 0, expenses: 0, net: 0 });
    const [transactions, setTransactions] = useState<TransactionWithJoins[]>([]);
    const [breakdown, setBreakdown] = useState<
        Array<{ category_name: string; percent: number; total: number; color: string | null }>
    >([]);

    const isCurrentMonth = isSameMonth(viewMonth, today);
    const canGoNext = !isCurrentMonth;
    const ms = monthStr(viewMonth);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                await Promise.all([generateTransactionsFromRecurring(ms), applyMonthlyPayments(ms)]);

                const [monthly, txs, catBreakdown, annualTotal, annualBreakdown, loansSummary] = await Promise.all([
                    getMonthlySummary(ms),
                    getAllTransactions(ms),
                    getCategoryBreakdown(ms),
                    getMonthlyAnnualTotal(),
                    getAnnualBreakdown(),
                    getLoansSummary(),
                ]);
                const totalExpenses = monthly.expenses + annualTotal + loansSummary.totalMonthlyPayment;
                setSummary({ ...monthly, expenses: totalExpenses, net: monthly.income - totalExpenses });
                setTransactions(txs);
                const loanMonthlyTotal = loansSummary.totalMonthlyPayment;
                const allSegments = [
                    ...catBreakdown,
                    ...annualBreakdown.map((a) => ({
                        category_id: a.category_id,
                        category_name: a.category_name,
                        total: a.monthly,
                        percent: 0,
                        color: a.color,
                    })),
                ];
                if (loanMonthlyTotal > 0) {
                    allSegments.push({
                        category_id: null,
                        category_name: 'Loan Payments',
                        total: loanMonthlyTotal,
                        percent: 0,
                        color: 'tertiaryContainer' as const,
                    });
                }
                const grandTotal = allSegments.reduce((s, seg) => s + seg.total, 0);
                allSegments.forEach((seg) => {
                    seg.percent = grandTotal > 0 ? Math.round((seg.total / grandTotal) * 100) : 0;
                });
                setBreakdown(allSegments);
            })();
        }, [ms]),
    );

    const handleDeleteTx = async (id: number) => {
        await deleteTransaction(id);
        const [newMonthly, newTxs, newBreakdown, annualTotal, annualBreakdown, loansSummary] = await Promise.all([
            getMonthlySummary(ms),
            getAllTransactions(ms),
            getCategoryBreakdown(ms),
            getMonthlyAnnualTotal(),
            getAnnualBreakdown(),
            getLoansSummary(),
        ]);
        setTransactions(newTxs);
        const totalExpenses = newMonthly.expenses + annualTotal + loansSummary.totalMonthlyPayment;
        setSummary({ ...newMonthly, expenses: totalExpenses, net: newMonthly.income - totalExpenses });
        setBreakdown(newBreakdown);
    };

    const goPrevMonth = () => {
        setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goNextMonth = () => {
        if (canGoNext) {
            setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        }
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

            <MonthNav
                current={viewMonth}
                onPrev={goPrevMonth}
                onNext={goNextMonth}
                canGoNext={canGoNext}
                colors={colors}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.monthSummary}>
                    <View style={styles.monthSummaryLeft}>
                        <Text style={[styles.monthSummaryLabel, { color: colors.outline }]}>
                            {isCurrentMonth ? "This Month's Net" : 'Monthly Net'}
                        </Text>
                        <Text
                            style={[
                                styles.monthSummaryAmount,
                                { color: summary.net >= 0 ? colors.primary : colors.tertiary },
                            ]}
                        >
                            {summary.net >= 0 ? '+' : ''}
                            {formatCurrency(Math.abs(summary.net), currencySymbol)}
                        </Text>
                    </View>
                    <View style={styles.monthSummaryRight}>
                        <View style={styles.monthSummaryRow}>
                            <Text style={[styles.monthSummaryRowLabel, { color: colors.outline }]}>Income</Text>
                            <Text style={[styles.monthSummaryRowValue, { color: colors.primary }]}>
                                +{formatCurrency(summary.income, currencySymbol)}
                            </Text>
                        </View>
                        <View style={styles.monthSummaryRow}>
                            <Text style={[styles.monthSummaryRowLabel, { color: colors.outline }]}>Expenses</Text>
                            <Text style={[styles.monthSummaryRowValue, { color: colors.onSurface }]}>
                                -{formatCurrency(summary.expenses, currencySymbol)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View
                    style={[
                        styles.spendingSection,
                        { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest },
                    ]}
                >
                    <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Spending Breakdown</Text>
                    {breakdown.length > 0 ? (
                        <DoughnutChart breakdown={breakdown} colors={colors} symbol={currencySymbol} />
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.outline }]}>No expenses this month</Text>
                    )}
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: colors.primaryContainer }]}
                        onPress={() => router.push(`/add-income?month=${ms}`)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="add" size={16} color={colors.onPrimaryContainer} />
                        <Text style={[styles.quickActionText, { color: colors.onPrimaryContainer }]}>Income</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickAction, { backgroundColor: colors.tertiaryContainer }]}
                        onPress={() => router.push(`/add-expense?month=${ms}`)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="remove" size={16} color={colors.onTertiaryContainer} />
                        <Text style={[styles.quickActionText, { color: colors.onTertiaryContainer }]}>Expense</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Transactions</Text>
                </View>
                <View style={styles.transactionsList}>
                    {transactions.length > 0 ? (
                        transactions.map((tx) => (
                            <TransactionRow key={tx.id} tx={tx} colors={colors} symbol={currencySymbol} onDelete={handleDeleteTx} />
                        ))
                    ) : (
                        <Text
                            style={[
                                styles.emptyText,
                                { color: colors.outline, textAlign: 'center', paddingVertical: Spacing.xl },
                            ]}
                        >
                            No transactions yet
                        </Text>
                    )}
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
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 4 },
    avatar: { width: 52, height: 52, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { width: 52, height: 52 },
    headerTitle: { fontSize: Typography.h3.fontSize, fontWeight: '700', letterSpacing: Typography.h3.letterSpacing },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.margin,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    monthArrow: { padding: Spacing.sm },
    monthLabel: {
        fontSize: Typography.h3.fontSize,
        fontWeight: Typography.h3.fontWeight,
        lineHeight: Typography.h3.lineHeight,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.margin, paddingBottom: 120 },
    monthSummary: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, marginBottom: Spacing.xl },
    monthSummaryLeft: { flex: 1 },
    monthSummaryLabel: {
        fontSize: Typography.bodySm.fontSize,
        fontWeight: Typography.bodySm.fontWeight,
        lineHeight: Typography.bodySm.lineHeight,
        marginBottom: 2,
    },
    monthSummaryAmount: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        lineHeight: Typography.h1.lineHeight,
        letterSpacing: Typography.h1.letterSpacing,
    },
    monthSummaryRight: { justifyContent: 'center', gap: Spacing.sm },
    monthSummaryRow: { alignItems: 'flex-end' },
    monthSummaryRowLabel: {
        fontSize: Typography.labelSm.fontSize,
        fontWeight: Typography.labelSm.fontWeight,
        lineHeight: Typography.labelSm.lineHeight,
        letterSpacing: Typography.labelSm.letterSpacing,
    },
    monthSummaryRowValue: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
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
    sectionAction: {
        fontSize: Typography.labelMd.fontSize,
        fontWeight: Typography.labelMd.fontWeight,
        lineHeight: Typography.labelMd.lineHeight,
        letterSpacing: Typography.labelMd.letterSpacing,
    },
    spendingSection: {
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 2,
    },
    cardTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: Typography.h3.fontWeight,
        lineHeight: Typography.h3.lineHeight,
        marginBottom: Spacing.xl,
    },
    emptyText: {
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: Typography.bodyMd.fontWeight,
        lineHeight: Typography.bodyMd.lineHeight,
    },
    chartContainer: { alignItems: 'center' },
    chartSvgWrapper: { width: 160, height: 160, marginBottom: Spacing.xl, position: 'relative' },
    chartCenter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartCenterLabel: {
        fontSize: Typography.labelSm.fontSize,
        fontWeight: Typography.labelSm.fontWeight,
        lineHeight: Typography.labelSm.lineHeight,
        letterSpacing: Typography.labelSm.letterSpacing,
    },
    chartCenterAmount: {
        fontSize: Typography.h3.fontSize,
        fontWeight: Typography.h3.fontWeight,
        lineHeight: Typography.h3.lineHeight,
    },
    legend: { width: '100%', gap: Spacing.md },
    legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    legendLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    legendDot: { width: 12, height: 12, borderRadius: Radius.full },
    legendLabel: {
        fontSize: Typography.bodySm.fontSize,
        fontWeight: Typography.bodySm.fontWeight,
        lineHeight: Typography.bodySm.lineHeight,
    },
    legendPercent: {
        fontSize: Typography.labelMd.fontSize,
        fontWeight: Typography.labelMd.fontWeight,
        lineHeight: Typography.labelMd.lineHeight,
        letterSpacing: Typography.labelMd.letterSpacing,
    },
    quickActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        borderRadius: Radius.full,
    },
    quickActionText: { fontSize: Typography.labelMd.fontSize, fontWeight: '600' },
    transactionsList: { gap: Spacing.sm, marginBottom: Spacing.xl },
    transactionRow: {
        borderRadius: Radius.xl,
        padding: Spacing.md,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 20,
        elevation: 1,
    },
    transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    transactionIcon: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
    transactionName: {
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '500',
        lineHeight: Typography.bodyMd.lineHeight,
    },
    transactionDate: {
        fontSize: Typography.bodySm.fontSize,
        fontWeight: Typography.bodySm.fontWeight,
        lineHeight: Typography.bodySm.lineHeight,
    },
    transactionAmount: {
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '600',
        lineHeight: Typography.bodyMd.lineHeight,
    },
    transactionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    transactionDeleteBtn: {
        padding: 4,
    },
});
