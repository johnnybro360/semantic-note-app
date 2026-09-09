import type { SQLiteDatabase } from "expo-sqlite";

import { createNotesMigration } from "./001-create-notes";

type Migration = {
  version: number;
  up: (database: SQLiteDatabase) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    up: createNotesMigration,
  },
];

export async function migrateDatabase(database: SQLiteDatabase): Promise<void> {
  const result = await database.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version");

  let currentVersion = result?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await database.withTransactionAsync(async () => {
      await migration.up(database);

      await database.execAsync(`PRAGMA user_version = ${migration.version}`);
    });

    currentVersion = migration.version;
  }
}
