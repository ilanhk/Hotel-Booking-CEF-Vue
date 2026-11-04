import { Response } from "commoneventframework";
import type { HandlerFn } from "../types.js";

export const health: HandlerFn = async () => new Response(200, { ok: true });
//checks the general health of the service by returning a 200 OK response with { ok: true }
