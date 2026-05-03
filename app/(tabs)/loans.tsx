import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useSettings } from '@/contexts/settings';
import { getAllLoans, getLoansSummary, deleteLoan, updateLoan } from '@/services/loans';
import type { Loan } from '@/services/loans';

const COLORS: (keyof typeof Colors.light)[] = ['primaryContainer', 'secondaryContainer', 'tertiaryContainer'];

function formatCurrency(value: number, symbol: string): string {
    return symbol + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function LoanCard({
    loan,
    colors,
    colorKey,
    symbol = '$',
    onEdit,
    onDelete,
}: {
    loan: Loan;
    colors: typeof Colors.light;
    colorKey: keyof typeof Colors.light;
    symbol?: string;
    onEdit: (l: Loan) => void;
    onDelete: (id: number) => void;
}) {
    const paidPercent =
        loan.original_amount && loan.original_amount > 0
            ? ((loan.original_amount - loan.remaining) / loan.original_amount) * 100
            : 0;
    const myPortion = (loan.portion ?? 100) / 100;
    const myShare = loan.remaining * myPortion;

    return (
        <View
            style={[styles.loanCard, { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest }]}
        >
            <View style={styles.loanHeader}>
                <View style={[styles.loanIcon, { backgroundColor: colors[colorKey] + '80' }]}>
                    <MaterialIcons name="account-balance" size={22} color={colors.onSurface} />
                </View>
                <View style={styles.loanInfo}>
                    <Text style={[styles.loanName, { color: colors.onSurface }]}>{loan.name}</Text>
                    {loan.lender && <Text style={[styles.loanLender, { color: colors.outline }]}>{loan.lender}</Text>}
                </View>
                <View style={styles.loanActions}>
                    <TouchableOpacity onPress={() => onEdit(loan)} style={styles.loanActionBtn}>
                        <MaterialIcons name="edit" size={18} color={colors.outline} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(loan.id)} style={styles.loanActionBtn}>
                        <MaterialIcons name="delete-outline" size={18} color={colors.outline} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.loanAmounts}>
                <View>
                    <Text style={[styles.loanAmountLabel, { color: colors.outline }]}>Remaining</Text>
                    <Text style={[styles.loanAmountValue, { color: colors.onSurface }]}>
                        {formatCurrency(loan.remaining, symbol)}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.loanAmountLabel, { color: colors.outline }]}>Rate</Text>
                    <Text style={[styles.loanAmountValue, { color: colors.onSurface }]}>{loan.interest_rate}%</Text>
                </View>
            </View>

            {myPortion < 1 && (
                <Text style={[styles.portionText, { color: colors.primary }]}>
                    Your share: {formatCurrency(myShare, symbol)} ({Math.round(myPortion * 100)}%)
                </Text>
            )}

            {loan.original_amount && loan.original_amount > 0 && (
                <>
                    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerLow }]}>
                        <View
                            style={[
                                styles.progressBar,
                                { backgroundColor: colors[colorKey], width: `${paidPercent}%` },
                            ]}
                        />
                    </View>
                    <View style={styles.progressLabels}>
                        <Text style={[styles.progressText, { color: colors.outline }]}>
                            {paidPercent.toFixed(0)}% paid
                        </Text>
                        <Text style={[styles.progressText, { color: colors.outline }]}>
                            {formatCurrency(loan.original_amount, symbol)}
                        </Text>
                    </View>
                </>
            )}

            <View style={[styles.loanDivider, { backgroundColor: colors.surfaceContainerHighest }]} />

            <View style={styles.loanFooter}>
                <View style={styles.loanFooterItem}>
                    <Text style={[styles.loanFooterLabel, { color: colors.outline }]}>Monthly</Text>
                    <Text style={[styles.loanFooterValue, { color: colors.onSurface }]}>
                        {formatCurrency(loan.monthly_payment, symbol)}
                    </Text>
                </View>
                {loan.original_amount && (
                    <View style={styles.loanFooterItem}>
                        <Text style={[styles.loanFooterLabel, { color: colors.outline }]}>Total</Text>
                        <Text style={[styles.loanFooterValue, { color: colors.onSurface }]}>
                            {formatCurrency(loan.original_amount, symbol)}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

export default function LoansScreen() {
    const colorScheme = useActiveTheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { currencySymbol } = useSettings();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [summary, setSummary] = useState({
        totalRemaining: 0,
        totalMonthlyPayment: 0,
        loanCount: 0,
        avgInterestRate: 0,
    });
    const [editing, setEditing] = useState<Loan | null>(null);
    const [editRate, setEditRate] = useState('');
    const [editPayment, setEditPayment] = useState('');
    const [editPortion, setEditPortion] = useState('');

    useFocusEffect(
        useCallback(() => {
            (async () => {
                setLoans(await getAllLoans());
                setSummary(await getLoansSummary());
            })();
        }, []),
    );

    const handleDelete = async (id: number) => {
        await deleteLoan(id);
        setLoans(await getAllLoans());
        setSummary(await getLoansSummary());
    };

    const handleEdit = (loan: Loan) => {
        setEditing(loan);
        setEditRate(loan.interest_rate.toString());
        setEditPayment(loan.monthly_payment.toString());
        setEditPortion((loan.portion ?? 100).toString());
    };

    const handleSaveEdit = async () => {
        if (!editing) return;
        const rate = parseFloat(editRate);
        const payment = parseFloat(editPayment);
        const portion = parseFloat(editPortion);
        if (isNaN(rate) || rate < 0 || isNaN(payment) || payment <= 0 || isNaN(portion) || portion < 0 || portion > 100)
            return;
        await updateLoan(editing.id, { interest_rate: rate, monthly_payment: payment, portion });
        setEditing(null);
        setLoans(await getAllLoans());
        setSummary(await getLoansSummary());
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']} style={styles.safeTop}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Loans</Text>
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
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryLabel, { color: colors.outline }]}>Total Remaining</Text>
                            <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
                                {formatCurrency(summary.totalRemaining, currencySymbol)}
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryLabel, { color: colors.outline }]}>Monthly Payments</Text>
                            <Text style={[styles.summaryValue, { color: colors.primary }]}>
                                {formatCurrency(summary.totalMonthlyPayment, currencySymbol)}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.summaryDivider, { backgroundColor: colors.surfaceContainerHighest }]} />
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryLabel, { color: colors.outline }]}>Loans</Text>
                            <Text style={[styles.summaryValue, { color: colors.onSurface }]}>{summary.loanCount}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryLabel, { color: colors.outline }]}>Avg. Interest</Text>
                            <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
                                {summary.avgInterestRate}%
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Active Loans</Text>
                </View>

                <View style={styles.loansList}>
                    {loans.length > 0 ? (
                        loans.map((loan, i) => (
                            <LoanCard
                                key={loan.id}
                                loan={loan}
                                colors={colors}
                                colorKey={COLORS[i % COLORS.length]}
                                symbol={currencySymbol}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
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
                            No loans yet. Tap + to add one.
                        </Text>
                    )}
                </View>
            </ScrollView>

            <Modal visible={editing != null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditing(null)}>
                    <TouchableOpacity
                        style={[styles.modalCard, { backgroundColor: colors.surface }]}
                        activeOpacity={1}
                        onPress={() => {}}
                    >
                        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>{editing?.name}</Text>

                        <Text style={[styles.modalFieldLabel, { color: colors.onSurfaceVariant }]}>
                            Interest Rate (%)
                        </Text>
                        <TextInput
                            style={[
                                styles.modalInput,
                                { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface },
                            ]}
                            keyboardType="decimal-pad"
                            value={editRate}
                            onChangeText={(t) => setEditRate(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                            selectTextOnFocus
                        />

                        <Text style={[styles.modalFieldLabel, { color: colors.onSurfaceVariant }]}>
                            Monthly Payment ({currencySymbol})
                        </Text>
                        <TextInput
                            style={[
                                styles.modalInput,
                                { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface },
                            ]}
                            keyboardType="decimal-pad"
                            value={editPayment}
                            onChangeText={(t) => setEditPayment(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                            selectTextOnFocus
                        />

                        <Text style={[styles.modalFieldLabel, { color: colors.onSurfaceVariant }]}>
                            Your Portion (%)
                        </Text>
                        <TextInput
                            style={[
                                styles.modalInput,
                                { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface },
                            ]}
                            keyboardType="number-pad"
                            value={editPortion}
                            onChangeText={(t) => setEditPortion(t.replace(/[^0-9]/g, '').slice(0, 3))}
                            selectTextOnFocus
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={() => setEditing(null)}
                                style={[styles.modalBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                            >
                                <Text style={[styles.modalBtnText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveEdit}
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
                onPress={() => router.push('/add-loan')}
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
    headerTitle: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        lineHeight: Typography.h1.lineHeight,
        letterSpacing: Typography.h1.letterSpacing,
    },
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
    summaryRow: { flexDirection: 'row', gap: Spacing.lg },
    summaryItem: { flex: 1 },
    summaryLabel: {
        fontSize: Typography.labelSm.fontSize,
        fontWeight: Typography.labelSm.fontWeight,
        lineHeight: Typography.labelSm.lineHeight,
        letterSpacing: Typography.labelSm.letterSpacing,
        marginBottom: 2,
    },
    summaryValue: { fontSize: Typography.h3.fontSize, fontWeight: '600' },
    summaryDivider: { height: 1, marginVertical: Spacing.md },
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
    loansList: { gap: Spacing.md },
    loanCard: {
        borderRadius: Radius.xl,
        padding: Spacing.md,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 20,
        elevation: 1,
    },
    loanHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
    loanIcon: { width: 44, height: 44, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
    loanInfo: { flex: 1 },
    loanName: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
    loanLender: { fontSize: Typography.bodySm.fontSize, fontWeight: Typography.bodySm.fontWeight, marginTop: 1 },
    loanActions: { flexDirection: 'row', gap: Spacing.sm },
    loanActionBtn: { padding: 4 },
    loanAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    loanAmountLabel: {
        fontSize: Typography.labelSm.fontSize,
        fontWeight: Typography.labelSm.fontWeight,
        lineHeight: Typography.labelSm.lineHeight,
        letterSpacing: Typography.labelSm.letterSpacing,
        marginBottom: 2,
    },
    loanAmountValue: { fontSize: Typography.h3.fontSize, fontWeight: '600' },
    portionText: { fontSize: Typography.bodySm.fontSize, fontWeight: '600', marginBottom: Spacing.sm },
    progressTrack: { height: 6, borderRadius: Radius.full, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: Radius.full },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
    progressText: { fontSize: 11, fontWeight: '500' },
    loanDivider: { height: 1, marginVertical: Spacing.md },
    loanFooter: { flexDirection: 'row', gap: Spacing.lg },
    loanFooterItem: { flex: 1 },
    loanFooterLabel: {
        fontSize: Typography.labelSm.fontSize,
        fontWeight: Typography.labelSm.fontWeight,
        lineHeight: Typography.labelSm.lineHeight,
        letterSpacing: Typography.labelSm.letterSpacing,
        marginBottom: 2,
    },
    loanFooterValue: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
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
        marginTop: Spacing.md,
    },
    modalInput: {
        fontSize: Typography.bodyMd.fontSize,
        lineHeight: Typography.bodyMd.lineHeight,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        borderRadius: Radius.lg,
    },
    modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center' },
    modalBtnText: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
});
