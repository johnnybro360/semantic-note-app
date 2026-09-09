import type { SQLiteDatabase } from "expo-sqlite";
import { migrateDatabase } from "./migrations";

export const DATABASE_NAME = "noteapp.db";

export async function initializeDatabase(
  database: SQLiteDatabase,
): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  await migrateDatabase(database);
}
