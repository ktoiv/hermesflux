import { getDatabase } from './database';

export async function updateCurrentPrice(positionId: number, price: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE positions SET current_price = ?, price_updated_at = datetime('now') WHERE id = ?", [
        price,
        positionId,
    ]);
}
