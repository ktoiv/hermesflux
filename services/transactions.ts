import { getDatabase } from './database';
import {
    CreateTransactionSchema,
    UpdateTransactionSchema,
    MonthString,
    type CreateTransaction,
    type UpdateTransaction,
} from '@/schemas';

export interface Transaction {
    id: number;
    name: string;
    amount: number;
    type: 'expense' | 'income';
    category_id: number | null;
    account_id: number | null;
    date: string;
    recurring_id: number | null;
    notes: string | null;
    created_at: string;
}

export interface TransactionWithJoins extends Transaction {
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    account_name?: string;
}

export async function getAllTransactions(month?: string): Promise<TransactionWithJoins[]> {
    month && MonthString.parse(month);
    const db = await getDatabase();

    let query = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
  `;
    const params: any[] = [];

    if (month) {
        query += ` WHERE strftime('%Y-%m', t.date) = ?`;
        params.push(month);
    }

    query += ' ORDER BY t.date DESC, t.id DESC';
    return db.getAllAsync<TransactionWithJoins>(query, params);
}

export async function getTransactionById(id: number): Promise<TransactionWithJoins | null> {
    const db = await getDatabase();
    return db.getFirstAsync<TransactionWithJoins>(
        `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE t.id = ?
  `,
        [id],
    );
}

export async function createTransaction(data: CreateTransaction): Promise<Transaction> {
    const parsed = CreateTransactionSchema.parse(data);
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO transactions (name, amount, type, category_id, account_id, date, recurring_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            parsed.name,
            parsed.amount,
            parsed.type,
            parsed.category_id ?? null,
            parsed.account_id ?? null,
            parsed.date,
            parsed.recurring_id ?? null,
            parsed.notes ?? null,
        ],
    );
    return (await getTransactionById(result.lastInsertRowId))!;
}

export async function updateTransaction(id: number, data: UpdateTransaction): Promise<Transaction | null> {
    const current = await getTransactionById(id);
    if (!current) return null;
    const changes = UpdateTransactionSchema.parse(data);
    const merged = { ...current, ...changes };
    const db = await getDatabase();
    await db.runAsync(
        `UPDATE transactions SET name = ?, amount = ?, type = ?, category_id = ?, account_id = ?, date = ?, notes = ? WHERE id = ?`,
        [
            merged.name,
            merged.amount,
            merged.type,
            merged.category_id ?? null,
            merged.account_id ?? null,
            merged.date,
            merged.notes ?? null,
            id,
        ],
    );
    return getTransactionById(id);
}

export async function deleteTransaction(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getMonthlySummary(month: string): Promise<{
    income: number;
    expenses: number;
    net: number;
}> {
    MonthString.parse(month);
    const db = await getDatabase();

    const row = await db.getFirstAsync<{ income: number; expenses: number }>(
        `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
    FROM transactions
    WHERE strftime('%Y-%m', date) = ?
  `,
        [month],
    );

    return {
        income: row?.income ?? 0,
        expenses: row?.expenses ?? 0,
        net: (row?.income ?? 0) - (row?.expenses ?? 0),
    };
}

export async function getCategoryBreakdown(month: string): Promise<
    Array<{
        category_id: number | null;
        category_name: string;
        total: number;
        percent: number;
        color: string | null;
    }>
> {
    MonthString.parse(month);
    const db = await getDatabase();

    const totalRow = await db.getFirstAsync<{ total: number }>(
        `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
  `,
        [month],
    );

    const rows = await db.getAllAsync<{
        category_id: number | null;
        category_name: string;
        total: number;
        color: string | null;
    }>(
        `
    SELECT t.category_id, COALESCE(c.name, 'Uncategorized') as category_name,
           SUM(t.amount) as total, c.color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense' AND strftime('%Y-%m', t.date) = ?
    GROUP BY t.category_id
    ORDER BY total DESC
  `,
        [month],
    );

    const grandTotal = totalRow?.total ?? 0;
    return rows.map((r) => ({
        category_id: r.category_id,
        category_name: r.category_name,
        total: r.total,
        percent: grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0,
        color: r.color,
    }));
}
