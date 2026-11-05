import { AppDataSource } from "../data-source.js";

try {
  await AppDataSource.initialize();
  const migrations = await AppDataSource.runMigrations();
  console.log(
    migrations.length === 0
      ? "Database schema is already up to date."
      : `Applied ${migrations.length} migration(s): ${migrations.map(({ name }) => name).join(", ")}`,
  );
} catch (error: unknown) {
  console.error("Failed to run database migrations", error);
  process.exitCode = 1;
} finally {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
