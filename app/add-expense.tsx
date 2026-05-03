import { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
    KeyboardAvoidingView,
    Keyboard,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useActiveTheme } from '@/hooks/use-active-theme';
import { useSettings } from '@/contexts/settings';
import { createTransaction } from '@/services/transactions';
import { getCategoryIdByFormId } from '@/services/categories';

type CategoryId = 'housing' | 'food' | 'transport' | 'shopping' | 'bills' | 'health' | 'entertainment' | 'other';
type Frequency = 'monthly' | 'weekly' | 'yearly';

interface Category {
    id: CategoryId;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    color: keyof typeof Colors.light;
}

const CATEGORIES: Category[] = [
    { id: 'housing', label: 'Housing', icon: 'home', color: 'tertiaryContainer' },
    { id: 'food', label: 'Food & Drink', icon: 'restaurant', color: 'secondaryContainer' },
    { id: 'transport', label: 'Transport', icon: 'directions-car', color: 'surfaceVariant' },
    { id: 'shopping', label: 'Shopping', icon: 'shopping-bag', color: 'tertiaryContainer' },
    { id: 'bills', label: 'Bills & Util.', icon: 'receipt', color: 'primaryContainer' },
    { id: 'health', label: 'Health', icon: 'favorite', color: 'secondaryContainer' },
    { id: 'entertainment', label: 'Entertainment', icon: 'movie', color: 'secondaryContainer' },
    { id: 'other', label: 'Other', icon: 'more-horiz', color: 'surfaceContainerHigh' },
];

const FREQUENCIES: { id: Frequency; label: string }[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'yearly', label: 'Yearly' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(d: Date): string {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function CategoryGrid({
    selected,
    onSelect,
    colors,
}: {
    selected: CategoryId;
    onSelect: (id: CategoryId) => void;
    colors: typeof Colors.light;
}) {
    return (
        <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
                const isSelected = selected === cat.id;
                const bgColor = colors[cat.color];
                return (
                    <TouchableOpacity
                        key={cat.id}
                        style={[
                            styles.categoryItem,
                            { backgroundColor: isSelected ? colors.primary : bgColor + '80' },
                            isSelected && { borderColor: colors.primary },
                        ]}
                        onPress={() => onSelect(cat.id)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons
                            name={cat.icon}
                            size={22}
                            color={isSelected ? colors.onPrimary : colors.onSurface}
                        />
                        <Text
                            style={[
                                styles.categoryLabel,
                                { color: isSelected ? colors.onPrimary : colors.onSurfaceVariant },
                            ]}
                            numberOfLines={1}
                        >
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function AddExpenseScreen() {
    const colorScheme = useActiveTheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { month } = useLocalSearchParams<{ month: string }>();
    const { currencySymbol } = useSettings();
    const defaultDay = new Date().getDate().toString();

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<CategoryId>('other');
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState<Frequency>('monthly');
    const [notes, setNotes] = useState('');
    const [day, setDay] = useState(defaultDay);

    const headerMonth = month
        ? `${MONTHS[parseInt(month.split('-')[1], 10) - 1]} ${month.split('-')[0]}`
        : formatDate(new Date());

    const handleSave = async () => {
        if (!name.trim() || !amount.trim() || parseFloat(amount) <= 0) return;
        const m = month ?? new Date().toISOString().split('T')[0].slice(0, 7);
        const d = day.padStart(2, '0');
        const catId = await getCategoryIdByFormId(category, 'expense');
        await createTransaction({
            name: name.trim(),
            amount: parseFloat(amount),
            type: 'expense',
            category_id: catId,
            date: `${m}-${d}`,
            notes: notes.trim() || null,
        });
        router.back();
    };

    const canSave = name.trim().length > 0 && amount.trim().length > 0 && parseFloat(amount) > 0;

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']} style={styles.safeTop}>
                <View style={[styles.header, { borderBottomColor: colors.surfaceContainerHighest }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
                        <Text style={[styles.headerActionText, { color: colors.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.onSurface }]}>New Expense</Text>
                    <View style={styles.headerAction} />
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled" onScrollBeginDrag={Keyboard.dismiss}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Expense Name</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
                        placeholder="e.g. Car Lease, Mortgage"
                        placeholderTextColor={colors.outline}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Amount</Text>
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

                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Category</Text>
                    <CategoryGrid selected={category} onSelect={setCategory} colors={colors} />

                    <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Date</Text>
                    <View style={[styles.dateRow]}>
                        <View style={[styles.dateMonthBox, { backgroundColor: colors.surfaceContainerLow }]}>
                            <MaterialIcons name="calendar-today" size={16} color={colors.outline} />
                            <Text style={[styles.dateText, { color: colors.onSurface }]}>{headerMonth}</Text>
                        </View>
                        <TextInput
                            style={[
                                styles.dateDayInput,
                                { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface },
                            ]}
                            value={day}
                            onChangeText={(t) => setDay(t.replace(/[^0-9]/g, '').slice(0, 2))}
                            keyboardType="number-pad"
                            placeholder="DD"
                            placeholderTextColor={colors.outline}
                            maxLength={2}
                        />
                    </View>

                    <View
                        style={[
                            styles.recurringRow,
                            { backgroundColor: colors.surfaceContainerLow, borderRadius: Radius.lg },
                        ]}
                    >
                        <View style={styles.recurringLeft}>
                            <MaterialIcons name="loop" size={20} color={colors.outline} />
                            <Text style={[styles.recurringLabel, { color: colors.onSurface }]}>Recurring</Text>
                        </View>
                        <Switch
                            value={recurring}
                            onValueChange={setRecurring}
                            trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
                            thumbColor={recurring ? colors.primary : colors.outline}
                        />
                    </View>

                    {recurring && (
                        <>
                            <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Frequency</Text>
                            <View style={styles.frequencyRow}>
                                {FREQUENCIES.map((f) => {
                                    const isSelected = frequency === f.id;
                                    return (
                                        <TouchableOpacity
                                            key={f.id}
                                            style={[
                                                styles.frequencyPill,
                                                { backgroundColor: colors.surfaceContainerLow },
                                                isSelected && { backgroundColor: colors.primaryContainer },
                                            ]}
                                            onPress={() => setFrequency(f.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.frequencyText,
                                                    { color: colors.onSurfaceVariant },
                                                    isSelected && {
                                                        color: colors.onPrimaryContainer,
                                                        fontWeight: '600',
                                                    },
                                                ]}
                                            >
                                                {f.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
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
                        Save Expense
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
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
    },
    currencySign: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '500',
        marginRight: Spacing.xs,
    },
    amountInput: {
        flex: 1,
        fontSize: Typography.h2.fontSize,
        fontWeight: '500',
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    categoryItem: {
        width: '23%',
        aspectRatio: 1,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    categoryLabel: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    dateRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    dateMonthBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        borderRadius: Radius.lg,
    },
    dateDayInput: {
        width: 60,
        textAlign: 'center',
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '600',
        borderRadius: Radius.lg,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    },
    dateText: {
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '500',
    },
    recurringRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        marginTop: Spacing.lg,
    },
    recurringLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    recurringLabel: {
        fontSize: Typography.bodyMd.fontSize,
        fontWeight: '500',
    },
    frequencyRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    frequencyPill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: Radius.full,
        alignItems: 'center',
    },
    frequencyText: {
        fontSize: Typography.bodySm.fontSize,
        fontWeight: '500',
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
