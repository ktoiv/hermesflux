import { z } from 'zod';

// ── Utilities ──────────────────────────────────────────
export const MonthString = z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM');
export const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
export const Id = z.number().int().positive();

// ── Account ────────────────────────────────────────────
export const AccountType = z.enum(['checking', 'savings', 'investment']);

export const CreateAccountSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: AccountType,
    balance: z.number().min(0, 'Balance cannot be negative'),
    number: z.string().optional(),
    icon: z.string().optional(),
});
export type CreateAccount = z.infer<typeof CreateAccountSchema>;

export const UpdateAccountSchema = z.object({
    name: z.string().min(1).optional(),
    balance: z.number().min(0).optional(),
    number: z.string().optional(),
    icon: z.string().optional(),
});
export type UpdateAccount = z.infer<typeof UpdateAccountSchema>;

// ── Category ────────────────────────────────────────────
export const CategoryType = z.enum(['expense', 'income']);

export const CreateCategorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: CategoryType,
    icon: z.string().optional(),
    color: z.string().optional(),
});

// ── Transaction ─────────────────────────────────────────
export const TransactionType = z.enum(['expense', 'income']);

export const CreateTransactionSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    amount: z.number().positive('Amount must be positive'),
    type: TransactionType,
    category_id: Id.optional().nullable(),
    account_id: Id.optional().nullable(),
    date: DateString,
    recurring_id: Id.optional().nullable(),
    notes: z.string().optional().nullable(),
});
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = z.object({
    name: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    category_id: Id.optional().nullable(),
    account_id: Id.optional().nullable(),
    date: DateString.optional(),
    notes: z.string().optional().nullable(),
});
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;

// ── Position ────────────────────────────────────────────
export const CreatePositionSchema = z.object({
    symbol: z.string().min(1, 'Symbol is required').max(10),
    name: z.string().optional().nullable(),
    shares: z.number().positive('Shares must be positive'),
    avg_cost: z.number().positive('Cost must be positive'),
    notes: z.string().optional().nullable(),
});
export type CreatePosition = z.infer<typeof CreatePositionSchema>;

export const UpdatePositionSchema = z.object({
    symbol: z.string().min(1).max(10).optional(),
    name: z.string().optional().nullable(),
    shares: z.number().positive().optional(),
    avg_cost: z.number().positive().optional(),
    notes: z.string().optional().nullable(),
});
export type UpdatePosition = z.infer<typeof UpdatePositionSchema>;

// ── Loan ────────────────────────────────────────────────
export const CreateLoanSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    lender: z.string().optional().nullable(),
    original_amount: z.number().positive().optional().nullable(),
    remaining: z.number().min(0, 'Remaining cannot be negative'),
    interest_rate: z.number().min(0, 'Rate cannot be negative'),
    monthly_payment: z.number().positive('Payment must be positive'),
    portion: z.number().min(0).max(100).default(100),
    notes: z.string().optional().nullable(),
});
export type CreateLoan = z.infer<typeof CreateLoanSchema>;

export const UpdateLoanSchema = z.object({
    name: z.string().min(1).optional(),
    lender: z.string().optional().nullable(),
    original_amount: z.number().positive().optional().nullable(),
    remaining: z.number().min(0).optional(),
    interest_rate: z.number().min(0).optional(),
    monthly_payment: z.number().positive().optional(),
    portion: z.number().min(0).max(100).optional(),
    notes: z.string().optional().nullable(),
});
export type UpdateLoan = z.infer<typeof UpdateLoanSchema>;

// ── Recurring ───────────────────────────────────────────
export const Frequency = z.enum(['monthly', 'weekly', 'yearly']);

export const CreateRecurringSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    amount: z.number().positive('Amount must be positive'),
    type: TransactionType,
    category_id: Id.optional().nullable(),
    frequency: Frequency,
    start_date: DateString,
    notes: z.string().optional().nullable(),
});
export type CreateRecurring = z.infer<typeof CreateRecurringSchema>;

export const UpdateRecurringSchema = z.object({
    name: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    type: TransactionType.optional(),
    category_id: Id.optional().nullable(),
    frequency: Frequency.optional(),
    active: z.boolean().optional(),
    notes: z.string().optional().nullable(),
});
export type UpdateRecurring = z.infer<typeof UpdateRecurringSchema>;
