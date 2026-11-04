import { Response } from "commoneventframework";
import type { CommonEvent } from "commoneventframework/dist/types/commonEvent.js";
import { HttpError } from "../http-error.js";
import { authenticate, roleError } from "./authentication.js";

// Maps a command's HttpError to its response; anything else becomes a logged 500.
export function commandError(error: unknown, fallback: string): Response {
  if (error instanceof HttpError) {
    return new Response(error.status, { error: error.message });
  }
  console.error(fallback, error);
  return new Response(500, { error: fallback });
}

// Runs a command on the :id path parameter, for endpoints restricted to the "Property Manager" role.
export async function runPropertyManagerCommand(
  event: CommonEvent,
  command: (id: string, managerId: string) => Promise<void>,
  fallback: string,
): Promise<Response> {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }
  if (authentication.user.role !== "Property Manager") {
    return roleError("Property Manager");
  }

  try {
    await command(event.pathParameters?.id ?? "", authentication.user.id);
    return new Response(200, { ok: true });
  } catch (error: unknown) {
    return commandError(error, fallback);
  }
}
