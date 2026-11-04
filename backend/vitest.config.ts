import { defineConfig } from "vitest/config";

// Integration tests run against a real Postgres (see docker-compose.test.yml). The values are set here, before any
// module is imported, so data-source.ts never falls back to the development database in .env.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
    // All test files share one database, so they must not run in parallel.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? "postgres://test:test@localhost:5433/vacations_test",
      JWT_SECRET_ACCESS: "test-only-jwt-secret",
      ACCESS_TOKEN_NAME: "access_token",
    },
  },
});
