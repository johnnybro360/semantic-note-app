import * as SQLite from "expo-sqlite";

import type { SQLiteDatabase } from "expo-sqlite";

type SQLiteExtensionConnection = Pick<SQLiteDatabase, "loadExtensionAsync">;

export async function loadSQLiteVecExtension(
  database: SQLiteExtensionConnection,
): Promise<void> {
  const extension = SQLite.bundledExtensions["sqlite-vec"];

  if (!extension) {
    throw new Error(
      "sqlite-vec is not bundled. Check withSQLiteVecExtension in app.json.",
    );
  }

  await database.loadExtensionAsync(extension.libPath, extension.entryPoint);
}
