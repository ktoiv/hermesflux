import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useSettings } from '@/contexts/settings';
import { getAllAnnualExpenses, deleteAnnualExpense } from '@/services/annual-expenses';
import type { AnnualExpense } from '@/services/annual-expenses';

const COLORS: (keyof typeof Colors.light)[] = ['primaryContainer', 'secondaryContainer', 'tertiaryContainer', 'primaryContainer'];

function formatCurrency(value: number, symbol: string): string {
  return symbol + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AnnualScreen() {
  const colorScheme = useActiveTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { currencySymbol } = useSettings();
  const [expenses, setExpenses] = useState<AnnualExpense[]>([]);

  useFocusEffect(useCallback(() => {
    (async () => setExpenses(await getAllAnnualExpenses()))();
  }, []));

  const totalAnnual = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMonthly = totalAnnual / 12;

  const handleDelete = (id: number) => {
    (async () => {
      await deleteAnnualExpense(id);
      setExpenses(await getAllAnnualExpenses());
    })();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Annual Expenses</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.outline }]}>Per Year</Text>
              <Text style={[styles.summaryValue, { color: colors.onSurface }]}>{formatCurrency(totalAnnual, currencySymbol)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.outline }]}>Per Month</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatCurrency(totalMonthly, currencySymbol)}</Text>
            </View>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.surfaceContainerHighest }]} />
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.summaryHint, { color: colors.outline }]}>
              Monthly amount is included in your dashboard spending breakdown
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Annual Bills</Text>
        </View>

        {expenses.length > 0 ? (
          expenses.map((exp, i) => (
            <View key={exp.id} style={[styles.expenseCard, { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest }]}>
              <View style={styles.expenseTop}>
                <View style={[styles.expenseIcon, { backgroundColor: colors[COLORS[i % COLORS.length]] + '80' }]}>
                  <MaterialIcons name="event" size={22} color={colors.onSurface} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseName, { color: colors.onSurface }]}>{exp.name}</Text>
                  <Text style={[styles.expenseDetail, { color: colors.outline }]}>
                    {formatCurrency(exp.amount / 12, currencySymbol)}/mo
                  </Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={[styles.expenseAnnual, { color: colors.onSurface }]}>{formatCurrency(exp.amount, currencySymbol)}</Text>
                  <TouchableOpacity onPress={() => handleDelete(exp.id)} style={styles.deleteBtn}>
                    <MaterialIcons name="delete-outline" size={18} color={colors.outline} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={[{ color: colors.outline, textAlign: 'center', paddingVertical: Spacing.xl, fontSize: Typography.bodyMd.fontSize }]}>
            No annual expenses yet.
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primaryContainer }]}
        activeOpacity={0.8}
        onPress={() => router.push('/add-annual-expense')}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimaryContainer} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeTop: { paddingHorizontal: Spacing.margin, paddingTop: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  headerTitle: { fontSize: Typography.h1.fontSize, fontWeight: Typography.h1.fontWeight, lineHeight: Typography.h1.lineHeight, letterSpacing: Typography.h1.letterSpacing },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.margin, paddingBottom: 120 },
  summaryCard: { borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, marginBottom: Spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 2 },
  summaryRow: { flexDirection: 'row', gap: Spacing.lg },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: Typography.labelSm.fontSize, fontWeight: Typography.labelSm.fontWeight, lineHeight: Typography.labelSm.lineHeight, letterSpacing: Typography.labelSm.letterSpacing, marginBottom: 2 },
  summaryValue: { fontSize: Typography.h2.fontSize, fontWeight: '600' },
  summaryDivider: { height: 1, marginVertical: Spacing.md },
  summaryHint: { fontSize: Typography.bodySm.fontSize, fontWeight: Typography.bodySm.fontWeight, lineHeight: Typography.bodySm.lineHeight, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight, lineHeight: Typography.h2.lineHeight, letterSpacing: Typography.h2.letterSpacing },
  expenseCard: { borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, marginBottom: Spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 20, elevation: 1 },
  expenseTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  expenseIcon: { width: 44, height: 44, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
  expenseDetail: { fontSize: Typography.bodySm.fontSize, fontWeight: Typography.bodySm.fontWeight, marginTop: 1 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAnnual: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
  deleteBtn: { padding: 4, marginTop: 2 },
  fab: { position: 'absolute', bottom: 88, right: Spacing.margin, width: 56, height: 56, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
});
