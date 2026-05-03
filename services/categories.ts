import { getDatabase } from './database';

export interface Category {
    id: number;
    name: string;
    type: 'expense' | 'income';
    icon: string | null;
    color: string | null;
}

export type CreateCategory = Pick<Category, 'name' | 'type'> & Partial<Pick<Category, 'icon' | 'color'>>;

const EXPENSE_MAP: Record<string, string> = {
    housing: 'Housing',
    food: 'Food & Drink',
    transport: 'Transport',
    shopping: 'Shopping',
    bills: 'Bills & Utilities',
    health: 'Health',
    entertainment: 'Entertainment',
    other: 'Other',
};

const INCOME_MAP: Record<string, string> = {
    salary: 'Salary',
    freelance: 'Freelance',
    investment: 'Investment',
    gift: 'Gift',
    refund: 'Refund',
    bonus: 'Bonus',
    rental: 'Rental',
    other: 'Other',
};

export async function getCategoryIdByFormId(formId: string, type: 'expense' | 'income'): Promise<number | null> {
    const map = type === 'expense' ? EXPENSE_MAP : INCOME_MAP;
    const name = map[formId];
    if (!name) return null;
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ id: number }>('SELECT id FROM categories WHERE name = ? AND type = ?', [
        name,
        type,
    ]);
    return row?.id ?? null;
}

export async function getAllCategories(type?: 'expense' | 'income'): Promise<Category[]> {
    const db = await getDatabase();
    if (type) {
        return db.getAllAsync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY name ASC', [type]);
    }
    return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY type, name ASC', []);
}

export async function getCategoryById(id: number): Promise<Category | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', [id]);
}

export async function createCategory(data: CreateCategory): Promise<Category> {
    const db = await getDatabase();
    const result = await db.runAsync('INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)', [
        data.name,
        data.type,
        data.icon ?? null,
        data.color ?? null,
    ]);
    return (await getCategoryById(result.lastInsertRowId))!;
}

export async function deleteCategory(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function seedDefaultCategories(): Promise<void> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories', []);
    if (existing && existing.count > 0) return;

    const expenseCats = [
        { name: 'Housing', icon: 'home', color: 'tertiaryContainer' },
        { name: 'Food & Drink', icon: 'restaurant', color: 'secondaryContainer' },
        { name: 'Transport', icon: 'directions-car', color: 'surfaceVariant' },
        { name: 'Shopping', icon: 'shopping-bag', color: 'tertiaryContainer' },
        { name: 'Bills & Utilities', icon: 'receipt', color: 'primaryContainer' },
        { name: 'Health', icon: 'favorite', color: 'secondaryContainer' },
        { name: 'Entertainment', icon: 'movie', color: 'secondaryContainer' },
        { name: 'Other', icon: 'more-horiz', color: 'surfaceContainerHigh' },
    ];

    const incomeCats = [
        { name: 'Salary', icon: 'badge', color: 'primaryContainer' },
        { name: 'Freelance', icon: 'laptop', color: 'secondaryContainer' },
        { name: 'Investment', icon: 'trending-up', color: 'primaryContainer' },
        { name: 'Gift', icon: 'card-giftcard', color: 'tertiaryContainer' },
        { name: 'Refund', icon: 'reply', color: 'secondaryContainer' },
        { name: 'Bonus', icon: 'workspace-premium', color: 'tertiaryContainer' },
        { name: 'Rental', icon: 'house', color: 'primaryContainer' },
        { name: 'Other', icon: 'more-horiz', color: 'surfaceContainerHigh' },
    ];

    for (const cat of expenseCats) {
        await db.runAsync('INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)', [
            cat.name,
            'expense',
            cat.icon,
            cat.color,
        ]);
    }
    for (const cat of incomeCats) {
        await db.runAsync('INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)', [
            cat.name,
            'income',
            cat.icon,
            cat.color,
        ]);
    }
}
