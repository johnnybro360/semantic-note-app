import * as SQLite from "expo-sqlite";

import type { SQLiteDatabase } from "expo-sqlite";

export async function loadSQLiteVecExtension(
  database: SQLiteDatabase,
): Promise<void> {
  const extension = SQLite.bundledExtensions["sqlite-vec"];

  if (!extension) {
    throw new Error(
      "sqlite-vec is not bundled. Check withSQLiteVecExtension in app.json.",
    );
  }

  await database.loadExtensionAsync(extension.libPath, extension.entryPoint);
}
