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
import { createAnnualExpense } from '@/services/annual-expenses';

export default function AddAnnualExpenseScreen() {
  const colorScheme = useActiveTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { currencySymbol } = useSettings();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !amount.trim() || parseFloat(amount) <= 0) return;
    await createAnnualExpense({ name: name.trim(), amount: parseFloat(amount), notes: notes.trim() || null });
    router.back();
  };

  const canSave = name.trim().length > 0 && amount.trim().length > 0 && parseFloat(amount) > 0;
  const monthlyAmount = amount && parseFloat(amount) > 0 ? (parseFloat(amount) / 12) : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={[styles.header, { borderBottomColor: colors.surfaceContainerHighest }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
            <Text style={[styles.headerActionText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Add Annual Expense</Text>
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
          <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Expense Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
            placeholder="e.g. Car Insurance, Car Tax"
            placeholderTextColor={colors.outline}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Annual Amount</Text>
          <View style={[styles.amountRow, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[styles.currencySign, { color: colors.onSurface }]}>{currencySymbol}</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.onSurface }]}
              placeholder="0.00"
              placeholderTextColor={colors.outline}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {monthlyAmount > 0 && (
            <View style={[styles.preview, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[styles.previewLabel, { color: colors.onSurfaceVariant }]}>Per Month</Text>
              <Text style={[styles.previewValue, { color: colors.primary }]}>
                {currencySymbol}{monthlyAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
            Notes{' '}
            <Text style={{ color: colors.outline, fontSize: Typography.bodySm.fontSize }}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.notesInput, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
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
            Add Annual Expense
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeTop: { backgroundColor: 'transparent' },
  safeBottom: { backgroundColor: 'transparent', paddingHorizontal: Spacing.margin, paddingBottom: Spacing.md },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.margin, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  headerAction: { width: 60 },
  headerActionText: { fontSize: Typography.bodyMd.fontSize, fontWeight: '500' },
  headerTitle: { fontSize: Typography.h3.fontSize, fontWeight: '600' },
  scrollContent: { padding: Spacing.margin, paddingBottom: Spacing.xxl },
  fieldLabel: { fontSize: Typography.labelMd.fontSize, fontWeight: Typography.labelMd.fontWeight, lineHeight: Typography.labelMd.lineHeight, letterSpacing: Typography.labelMd.letterSpacing, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input: { fontSize: Typography.bodyMd.fontSize, lineHeight: Typography.bodyMd.lineHeight, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? 14 : 10, borderRadius: Radius.lg },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, paddingHorizontal: Spacing.md },
  currencySign: { fontSize: Typography.h2.fontSize, fontWeight: '500', marginRight: Spacing.xs },
  amountInput: { flex: 1, fontSize: Typography.h2.fontSize, fontWeight: '500', paddingVertical: Platform.OS === 'ios' ? 14 : 10 },
  preview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, marginTop: Spacing.md },
  previewLabel: { fontSize: Typography.bodySm.fontSize, fontWeight: '500' },
  previewValue: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
  notesInput: { minHeight: 80 },
  saveButton: { borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: Typography.bodyMd.fontSize, fontWeight: '600' },
});
