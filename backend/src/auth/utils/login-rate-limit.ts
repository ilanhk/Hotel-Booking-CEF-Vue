import { createHash } from "node:crypto";
import type { CommonEvent } from "commoneventframework/dist/types/commonEvent.js";
import { AppDataSource } from "../../data-source.js";
import { LoginAttempt } from "../login-attempt.entity.js";

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS_PER_ADDRESS = 30;
const MAX_ATTEMPTS_PER_ADDRESS_AND_EMAIL = 5;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let lastCleanupAt = 0;

export async function getLoginRetryAfter(
  event: CommonEvent,
  email: string,
): Promise<number | null> {
  const address = getClientAddress(event);
  const keys = [
    { key: hashKey(`address:${address}`), limit: MAX_ATTEMPTS_PER_ADDRESS },
    {
      key: hashKey(`address-email:${address}:${email}`),
      limit: MAX_ATTEMPTS_PER_ADDRESS_AND_EMAIL,
    },
  ];

  const retryAfter = await AppDataSource.manager.transaction(async (manager) => {
    let longestWait = 0;
    for (const { key, limit } of keys) {
      const [bucket] = (await manager.query(
        `INSERT INTO "login_attempts" ("key", "window_started_at", "attempts")
         VALUES ($1, now(), 1)
         ON CONFLICT ("key") DO UPDATE SET
           "attempts" = CASE
             WHEN "login_attempts"."window_started_at" <= now() - ($2 * interval '1 second')
             THEN 1 ELSE "login_attempts"."attempts" + 1
           END,
           "window_started_at" = CASE
             WHEN "login_attempts"."window_started_at" <= now() - ($2 * interval '1 second')
             THEN now() ELSE "login_attempts"."window_started_at"
           END
         RETURNING "attempts",
           GREATEST(1, CEIL(EXTRACT(EPOCH FROM (
             "window_started_at" + ($2 * interval '1 second') - now()
           ))))::integer AS "retryAfter"`,
        [key, WINDOW_SECONDS],
      )) as Array<{ attempts: number; retryAfter: number }>;

      if (!bucket) {
        throw new Error("Login attempt counter was not returned by PostgreSQL");
      }

      if (bucket.attempts > limit) {
        longestWait = Math.max(longestWait, bucket.retryAfter);
      }
    }

    return longestWait;
  });

  if (Date.now() - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
    await AppDataSource.query(
      `DELETE FROM "login_attempts" WHERE "window_started_at" < now() - interval '1 day'`,
    );
    lastCleanupAt = Date.now();
  }

  return retryAfter === 0 ? null : retryAfter;
}

export async function clearLoginAttempts(
  event: CommonEvent,
  email: string,
): Promise<void> {
  const key = hashKey(`address-email:${getClientAddress(event)}:${email}`);
  await AppDataSource.getRepository(LoginAttempt).delete({ key });
}

function getClientAddress(event: CommonEvent): string {
  const headers = event.headers ?? {};
  const trustedAddressHeader = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === "x-real-ip",
  )?.[1];
  const forwardedFor = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === "x-forwarded-for",
  )?.[1];
  return (
    trustedAddressHeader?.trim() ||
    forwardedFor?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
