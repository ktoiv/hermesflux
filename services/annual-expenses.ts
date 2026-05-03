import { getDatabase } from './database';

export interface AnnualExpense {
    id: number;
    name: string;
    amount: number;
    category_id: number | null;
    notes: string | null;
    created_at: string;
}

export async function getAllAnnualExpenses(): Promise<AnnualExpense[]> {
    const db = await getDatabase();
    return db.getAllAsync<AnnualExpense>('SELECT * FROM annual_expenses ORDER BY created_at ASC', []);
}

export async function createAnnualExpense(data: {
    name: string;
    amount: number;
    category_id?: number | null;
    notes?: string | null;
}): Promise<AnnualExpense> {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO annual_expenses (name, amount, category_id, notes) VALUES (?, ?, ?, ?)',
        [data.name, data.amount, data.category_id ?? null, data.notes ?? null],
    );
    const row = await db.getFirstAsync<AnnualExpense>('SELECT * FROM annual_expenses WHERE id = ?', [
        result.lastInsertRowId,
    ]);
    return row!;
}

export async function deleteAnnualExpense(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM annual_expenses WHERE id = ?', [id]);
}

export async function getMonthlyAnnualTotal(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(amount / 12.0), 0) as total FROM annual_expenses',
        [],
    );
    return row?.total ?? 0;
}

export async function getAnnualBreakdown(): Promise<
    Array<{
        category_id: number | null;
        category_name: string;
        monthly: number;
        annual: number;
        color: string | null;
    }>
> {
    const db = await getDatabase();
    return db.getAllAsync(
        `
    SELECT a.category_id, COALESCE(c.name, 'Annual') as category_name,
           SUM(a.amount / 12.0) as monthly, SUM(a.amount) as annual, c.color
    FROM annual_expenses a
    LEFT JOIN categories c ON a.category_id = c.id
    GROUP BY a.category_id
    ORDER BY monthly DESC
  `,
        [],
    );
}
