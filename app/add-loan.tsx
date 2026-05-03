import { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useSettings } from '@/contexts/settings';
import { createLoan } from '@/services/loans';

export default function AddLoanScreen() {
  const colorScheme = useActiveTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { currencySymbol } = useSettings();

  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [remaining, setRemaining] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !remaining.trim() || !interestRate.trim() || !monthlyPayment.trim()) return;
    await createLoan({ name: name.trim(), lender: lender.trim() || null, original_amount: originalAmount ? parseFloat(originalAmount) : null, remaining: parseFloat(remaining), interest_rate: parseFloat(interestRate), monthly_payment: parseFloat(monthlyPayment), notes: notes.trim() || null });
    router.back();
  };

  const canSave = name.trim().length > 0 && remaining.trim().length > 0 && parseFloat(remaining) > 0 && interestRate.trim().length > 0 && monthlyPayment.trim().length > 0 && parseFloat(monthlyPayment) > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={[styles.header, { borderBottomColor: colors.surfaceContainerHighest }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
            <Text style={[styles.headerActionText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Add Loan</Text>
          <View style={styles.headerAction} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Loan Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
            placeholder="e.g. Mortgage, Student Loan"
            placeholderTextColor={colors.outline}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
            Lender{' '}
            <Text style={{ color: colors.outline, fontSize: Typography.bodySm.fontSize }}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
            placeholder="e.g. Wells Fargo, Navient"
            placeholderTextColor={colors.outline}
            value={lender}
            onChangeText={setLender}
          />

          <View style={styles.splitRow}>
            <View style={styles.splitField}>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Original Amount</Text>
              <View style={[styles.amountRow, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.currencySign, { color: colors.outline }]}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.onSurface }]}
                  placeholder="0"
                  placeholderTextColor={colors.outline}
                  keyboardType="decimal-pad"
                  value={originalAmount}
                  onChangeText={(t) => setOriginalAmount(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                />
              </View>
            </View>
            <View style={styles.splitField}>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Remaining</Text>
              <View style={[styles.amountRow, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.currencySign, { color: colors.onSurface }]}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.onSurface }]}
                  placeholder="0"
                  placeholderTextColor={colors.outline}
                  keyboardType="decimal-pad"
                  value={remaining}
                  onChangeText={(t) => setRemaining(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                />
              </View>
            </View>
          </View>

          <View style={styles.splitRow}>
            <View style={styles.splitField}>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Interest Rate</Text>
              <View style={[styles.amountRow, { backgroundColor: colors.surfaceContainerLow }]}>
                <TextInput
                  style={[styles.amountInput, { color: colors.onSurface }]}
                  placeholder="0.0"
                  placeholderTextColor={colors.outline}
                  keyboardType="decimal-pad"
                  value={interestRate}
                  onChangeText={(t) => setInterestRate(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                />
                <Text style={[styles.currencySign, { color: colors.outline }]}>%</Text>
              </View>
            </View>
            <View style={styles.splitField}>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Monthly Payment</Text>
              <View style={[styles.amountRow, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.currencySign, { color: colors.onSurface }]}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.onSurface }]}
                  placeholder="0"
                  placeholderTextColor={colors.outline}
                  keyboardType="decimal-pad"
                  value={monthlyPayment}
                  onChangeText={(t) => setMonthlyPayment(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                />
              </View>
            </View>
          </View>

          {originalAmount && remaining && parseFloat(originalAmount) > 0 && (
            <View style={[styles.paidPreview, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.paidPreviewTop}>
                <Text style={[styles.paidPreviewLabel, { color: colors.onSurfaceVariant }]}>Paid Off</Text>
                <Text style={[styles.paidPreviewValue, { color: colors.primary }]}>
                  {((1 - parseFloat(remaining || '0') / parseFloat(originalAmount)) * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={[styles.paidBar, { backgroundColor: colors.surfaceContainerHighest }]}>
                <View
                  style={[
                    styles.paidBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min((1 - parseFloat(remaining || '0') / parseFloat(originalAmount)) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
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
          style={[styles.saveButton, { backgroundColor: canSave ? colors.primary : colors.surfaceContainerHighest }]}
          disabled={!canSave}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveText, { color: canSave ? colors.onPrimary : colors.outline }]}>
            Add Loan
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
  splitRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  splitField: {
    flex: 1,
    minWidth: 0,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
  },
  currencySign: {
    fontSize: Typography.bodyMd.fontSize,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    fontSize: Typography.bodyMd.fontSize,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  paidPreview: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  paidPreviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paidPreviewLabel: {
    fontSize: Typography.bodySm.fontSize,
    fontWeight: '500',
  },
  paidPreviewValue: {
    fontSize: Typography.bodyMd.fontSize,
    fontWeight: '600',
  },
  paidBar: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  paidBarFill: {
    height: '100%',
    borderRadius: Radius.full,
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
