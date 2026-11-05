import { describe, expect, it } from "vitest";
import type { CommonEvent } from "commoneventframework/dist/types/commonEvent.js";
import { getLoginRetryAfter } from "./login-rate-limit.js";

function loginEvent(address: string): CommonEvent {
  return {
    path: "/auth/login",
    method: "POST",
    body: null,
    pathParameters: undefined,
    queryStringParameters: undefined,
    headers: { "x-real-ip": address },
    version: "2.0",
  };
}

describe("login rate limit", () => {
  it("allows five attempts per address and email, then returns a retry delay", async () => {
    const event = loginEvent("192.0.2.10");

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(
        getLoginRetryAfter(event, "guest@example.com"),
      ).resolves.toBeNull();
    }

    const retryAfter = await getLoginRetryAfter(event, "guest@example.com");
    expect(retryAfter).not.toBeNull();
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(15 * 60);
  });
});
