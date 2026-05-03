import { getDatabase } from './database';
import { CreateLoanSchema, UpdateLoanSchema, type CreateLoan, type UpdateLoan } from '@/schemas';

export interface Loan {
    id: number;
    name: string;
    lender: string | null;
    original_amount: number | null;
    remaining: number;
    interest_rate: number;
    monthly_payment: number;
    portion: number;
    notes: string | null;
    last_payment_month: string | null;
    created_at: string;
    updated_at: string;
}

export interface LoanSummary {
    totalRemaining: number;
    totalMonthlyPayment: number;
    loanCount: number;
    avgInterestRate: number;
}

export async function getAllLoans(): Promise<Loan[]> {
    const db = await getDatabase();
    return db.getAllAsync<Loan>('SELECT * FROM loans ORDER BY created_at ASC', []);
}

export async function getLoanById(id: number): Promise<Loan | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Loan>('SELECT * FROM loans WHERE id = ?', [id]);
}

export async function createLoan(data: CreateLoan): Promise<Loan> {
    const parsed = CreateLoanSchema.parse(data);
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO loans (name, lender, original_amount, remaining, interest_rate, monthly_payment, portion, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            parsed.name,
            parsed.lender ?? null,
            parsed.original_amount ?? null,
            parsed.remaining,
            parsed.interest_rate,
            parsed.monthly_payment,
            parsed.portion ?? 100,
            parsed.notes ?? null,
        ],
    );
    return (await getLoanById(result.lastInsertRowId))!;
}

export async function updateLoan(id: number, data: UpdateLoan): Promise<Loan | null> {
    const current = await getLoanById(id);
    if (!current) return null;
    const changes = UpdateLoanSchema.parse(data);
    const merged = { ...current, ...changes };
    const db = await getDatabase();
    await db.runAsync(
        `UPDATE loans SET name = ?, lender = ?, original_amount = ?, remaining = ?, interest_rate = ?, monthly_payment = ?, portion = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
        [
            merged.name,
            merged.lender ?? null,
            merged.original_amount ?? null,
            merged.remaining,
            merged.interest_rate,
            merged.monthly_payment,
            merged.portion,
            merged.notes ?? null,
            id,
        ],
    );
    return getLoanById(id);
}

export async function deleteLoan(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM loans WHERE id = ?', [id]);
}

export async function applyMonthlyPayments(month: string): Promise<void> {
    const db = await getDatabase();
    const loans = await db.getAllAsync<Loan>(
        `SELECT * FROM loans WHERE remaining > 0 AND (last_payment_month IS NULL OR last_payment_month < ?)`,
        [month],
    );
    for (const loan of loans) {
        const monthlyRate = loan.interest_rate / 100 / 12;
        const myPortion = (loan.portion ?? 100) / 100;
        const myRemaining = loan.remaining * myPortion;
        const myPayment = loan.monthly_payment * myPortion;
        const interest = myRemaining * monthlyRate;
        const principal = Math.min(myPayment - interest, myRemaining);
        const newRemaining = Math.max(0, myRemaining - principal);
        const fullRemaining = newRemaining / myPortion;
        await db.runAsync(
            "UPDATE loans SET remaining = ?, last_payment_month = ?, updated_at = datetime('now') WHERE id = ?",
            [fullRemaining, month, loan.id],
        );
    }
}

export async function getLoansSummary(): Promise<LoanSummary> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
        remaining: number;
        monthly: number;
        count: number;
        avgRate: number;
    }>(
        `SELECT COALESCE(SUM(remaining * portion / 100.0), 0) as remaining,
            COALESCE(SUM(monthly_payment * portion / 100.0), 0) as monthly,
            COUNT(*) as count,
            COALESCE(AVG(interest_rate), 0) as avgRate
     FROM loans`,
        [],
    );
    return {
        totalRemaining: row?.remaining ?? 0,
        totalMonthlyPayment: row?.monthly ?? 0,
        loanCount: row?.count ?? 0,
        avgInterestRate: row ? Math.round(row.avgRate * 10) / 10 : 0,
    };
}
