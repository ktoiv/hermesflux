import { getDatabase } from './database';
import { CreateAccountSchema, UpdateAccountSchema, type CreateAccount, type UpdateAccount } from '@/schemas';

export interface Account {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
  number: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAllAccounts(): Promise<Account[]> {
  const db = await getDatabase();
  return db.getAllAsync<Account>('SELECT * FROM accounts ORDER BY created_at ASC', []);
}

export async function getAccountById(id: number): Promise<Account | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Account>('SELECT * FROM accounts WHERE id = ?', [id]);
}

export async function createAccount(data: CreateAccount): Promise<Account> {
  const parsed = CreateAccountSchema.parse(data);
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO accounts (name, type, balance, number, icon) VALUES (?, ?, ?, ?, ?)',
    [parsed.name, parsed.type, parsed.balance, parsed.number ?? null, parsed.icon ?? null],
  );
  return (await getAccountById(result.lastInsertRowId))!;
}

export async function updateAccount(id: number, data: UpdateAccount): Promise<Account | null> {
  const current = await getAccountById(id);
  if (!current) return null;
  const changes = UpdateAccountSchema.parse(data);
  const merged = { ...current, ...changes };
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE accounts SET name = ?, type = ?, balance = ?, number = ?, icon = ?, updated_at = datetime(\'now\') WHERE id = ?',
    [merged.name, merged.type, merged.balance, merged.number ?? null, merged.icon ?? null, id],
  );
  return getAccountById(id);
}

export async function deleteAccount(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
}

export async function seedDefaultAccounts(): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM accounts', []);
  if (existing && existing.count > 0) return;

  await db.runAsync('INSERT INTO accounts (name, type, balance, number, icon) VALUES (?, ?, ?, ?, ?)',
    ['Checking', 'checking', 4200, '**** 4412', 'payments']);
  await db.runAsync('INSERT INTO accounts (name, type, balance, number, icon) VALUES (?, ?, ?, ?, ?)',
    ['Savings', 'savings', 45000, '**** 8829', 'savings']);
  await db.runAsync('INSERT INTO accounts (name, type, balance, number, icon) VALUES (?, ?, ?, ?, ?)',
    ['Investments', 'investment', 75300, 'Portfolio A', 'show-chart']);
}
