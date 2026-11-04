import { afterAll, beforeAll, beforeEach } from "vitest";
import { AppDataSource } from "../data-source.js";

// The schema is dropped and rebuilt below, so refuse to run against anything that isn't clearly a local test database.
function assertSafeTestDatabase(): void {
  const { hostname, pathname } = new URL(process.env.DATABASE_URL ?? "");
  const isLocalHost = ["localhost", "127.0.0.1", "postgres-test", "postgres"].includes(hostname);
  const isTestDatabase = pathname.toLowerCase().includes("test");
  if (!isLocalHost || !isTestDatabase) {
    throw new Error(
      `Refusing to run tests against ${hostname}${pathname}: use a local database whose name contains "test".`,
    );
  }
}

beforeAll(async () => {
  assertSafeTestDatabase();
  await AppDataSource.initialize();
  await AppDataSource.synchronize(true); // start every test file from a clean schema
});

beforeEach(async () => {
  const tables = AppDataSource.entityMetadatas.map((entity) => `"${entity.tableName}"`).join(", ");
  await AppDataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await AppDataSource.destroy();
});
