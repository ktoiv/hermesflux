import { getDatabase } from './database';
import { CreatePositionSchema, UpdatePositionSchema, type CreatePosition, type UpdatePosition } from '@/schemas';

export interface Position {
    id: number;
    symbol: string;
    name: string | null;
    shares: number;
    avg_cost: number;
    current_price: number | null;
    price_updated_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PositionSummary {
    totalInvested: number;
    positionCount: number;
}

export async function getAllPositions(): Promise<Position[]> {
    const db = await getDatabase();
    return db.getAllAsync<Position>('SELECT * FROM positions ORDER BY created_at ASC', []);
}

export async function getPositionById(id: number): Promise<Position | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Position>('SELECT * FROM positions WHERE id = ?', [id]);
}

export async function createPosition(data: CreatePosition): Promise<Position> {
    const parsed = CreatePositionSchema.parse(data);
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO positions (symbol, name, shares, avg_cost, notes) VALUES (?, ?, ?, ?, ?)',
        [parsed.symbol, parsed.name ?? null, parsed.shares, parsed.avg_cost, parsed.notes ?? null],
    );
    return (await getPositionById(result.lastInsertRowId))!;
}

export async function updatePosition(id: number, data: UpdatePosition): Promise<Position | null> {
    const current = await getPositionById(id);
    if (!current) return null;
    const changes = UpdatePositionSchema.parse(data);
    const merged = { ...current, ...changes };
    const db = await getDatabase();
    await db.runAsync(
        "UPDATE positions SET symbol = ?, name = ?, shares = ?, avg_cost = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
        [merged.symbol, merged.name ?? null, merged.shares, merged.avg_cost, merged.notes ?? null, id],
    );
    return getPositionById(id);
}

export async function deletePosition(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM positions WHERE id = ?', [id]);
}

export async function getPositionsSummary(): Promise<PositionSummary> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ total: number; count: number }>(
        'SELECT COALESCE(SUM(shares * avg_cost), 0) as total, COUNT(*) as count FROM positions',
        [],
    );
    return {
        totalInvested: row?.total ?? 0,
        positionCount: row?.count ?? 0,
    };
}
