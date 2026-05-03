import { getDatabase } from './database';
import { CreateRecurringSchema, UpdateRecurringSchema, type CreateRecurring, type UpdateRecurring } from '@/schemas';

export interface Recurring {
    id: number;
    name: string;
    amount: number;
    type: 'expense' | 'income';
    category_id: number | null;
    frequency: 'monthly' | 'weekly' | 'yearly';
    start_date: string;
    active: number;
    notes: string | null;
    created_at: string;
}

export async function getAllRecurring(activeOnly?: boolean): Promise<Recurring[]> {
    const db = await getDatabase();
    if (activeOnly) {
        return db.getAllAsync<Recurring>('SELECT * FROM recurring WHERE active = 1 ORDER BY created_at ASC', []);
    }
    return db.getAllAsync<Recurring>('SELECT * FROM recurring ORDER BY created_at ASC', []);
}

export async function getRecurringById(id: number): Promise<Recurring | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Recurring>('SELECT * FROM recurring WHERE id = ?', [id]);
}

export async function createRecurring(data: CreateRecurring): Promise<Recurring> {
    const parsed = CreateRecurringSchema.parse(data);
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO recurring (name, amount, type, category_id, frequency, start_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            parsed.name,
            parsed.amount,
            parsed.type,
            parsed.category_id ?? null,
            parsed.frequency,
            parsed.start_date,
            parsed.notes ?? null,
        ],
    );
    return (await getRecurringById(result.lastInsertRowId))!;
}

export async function updateRecurring(id: number, data: UpdateRecurring): Promise<Recurring | null> {
    const current = await getRecurringById(id);
    if (!current) return null;
    const changes = UpdateRecurringSchema.parse(data);
    const merged = { ...current, ...changes };
    const db = await getDatabase();
    await db.runAsync(
        `UPDATE recurring SET name = ?, amount = ?, type = ?, category_id = ?, frequency = ?, start_date = ?, active = ?, notes = ? WHERE id = ?`,
        [
            merged.name,
            merged.amount,
            merged.type,
            merged.category_id ?? null,
            merged.frequency,
            merged.start_date,
            merged.active,
            merged.notes ?? null,
            id,
        ],
    );
    return getRecurringById(id);
}

export async function deleteRecurring(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM recurring WHERE id = ?', [id]);
}

export async function generateTransactionsFromRecurring(month: string): Promise<number> {
    const db = await getDatabase();
    const items = await db.getAllAsync<Recurring>(`SELECT * FROM recurring WHERE active = 1 AND start_date <= ?`, [
        `${month}-31`,
    ]);

    let count = 0;
    for (const item of items) {
        const exists = await db.getFirstAsync<{ id: number }>(
            `SELECT id FROM transactions WHERE recurring_id = ? AND strftime('%Y-%m', date) = ?`,
            [item.id, month],
        );
        if (exists) continue;

        const day = item.start_date.slice(8, 10);
        const dateStr = `${month}-${day}`;

        await db.runAsync(
            `INSERT INTO transactions (name, amount, type, category_id, date, recurring_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [item.name, item.amount, item.type, item.category_id, dateStr, item.id],
        );
        count++;
    }

    return count;
}
