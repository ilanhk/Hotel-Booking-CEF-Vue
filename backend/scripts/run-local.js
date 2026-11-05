// Adapt the CEF Lambda handler to HTTP. CEF's bundled dev server binds only to localhost,
// so production uses this server to bind to Render's externally reachable interface.
import "dotenv/config";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  mapIncomingMessageToAPIGatewayEvent,
  mapIncomingMessageToContext,
} from "commoneventframework/dist/dev/mapIncomingMessageToEvent.js";

const entry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js");
const port = Number(process.env.PORT ?? "3600");
const host =
  process.env.NODE_ENV === "production"
    ? "0.0.0.0"
    : (process.env.HOST ?? "127.0.0.1");
const maxBodyBytes = 1024 * 1024;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

if (process.env.NODE_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production");
  }
  if (!process.env.ACCESS_TOKEN_NAME) {
    throw new Error("ACCESS_TOKEN_NAME is required in production");
  }
  if (!process.env.JWT_SECRET_ACCESS || process.env.JWT_SECRET_ACCESS.length < 32) {
    throw new Error("JWT_SECRET_ACCESS must be at least 32 characters in production");
  }
}

// CEF resolves root.yaml and route handler references relative to argv[1].
// The build copies root.yaml beside the bundled entry in dist/.
process.argv[1] = entry;
const { handler } = await import(pathToFileURL(entry).href);

const server = createServer(async (request, response) => {
  try {
    const chunks = [];
    let bodyBytes = 0;
    for await (const chunk of request) {
      bodyBytes += chunk.length;
      if (bodyBytes > maxBodyBytes) {
        response.writeHead(413, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Request body too large" }));
        return;
      }
      chunks.push(chunk);
    }

    const event = mapIncomingMessageToAPIGatewayEvent(
      request,
      Buffer.concat(chunks).toString("utf8"),
    );
    const result = await handler(event, mapIncomingMessageToContext(request));

    for (const [name, value] of Object.entries(result.headers ?? {})) {
      if (value !== undefined) {
        response.setHeader(name, String(value));
      }
    }
    response.writeHead(result.statusCode || 200);
    response.end(
      result.isBase64Encoded
        ? Buffer.from(result.body ?? "", "base64")
        : (result.body ?? ""),
    );
  } catch (error) {
    console.error("HTTP request failed", error);
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "application/json" });
    }
    response.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(port, host, () => {
  console.log(`API server listening on http://${host}:${port}`);
});
