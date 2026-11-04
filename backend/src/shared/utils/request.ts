import { Response } from "commoneventframework";
import type { CommonEvent } from "commoneventframework/dist/types/commonEvent.js";
import type { InputParserFn } from "../types.js";

// CEF gives handlers a normalized event; this parser adapts JSON HTTP bodies to handler input.
export const parseJsonBody: InputParserFn = (event: CommonEvent) => {
  if (event.body === null) {
    return new Response(400, { error: "A JSON request body is required" });
  }

  try {
    return JSON.parse(event.body) as unknown;
  } catch {
    return new Response(400, { error: "Request body must contain valid JSON" });
  }
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
