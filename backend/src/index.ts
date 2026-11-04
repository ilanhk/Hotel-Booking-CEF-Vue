import "reflect-metadata";
import {
  buildCommonEvent,
  getRouteConfig,
  loadEnv,
  resolveHandlerRef,
  Response,
  setLambdaContext,
  startDevServer,
  type APIGatewayProxyStructuredResultV2,
  type Context,
  type LambdaEvent,
} from "commoneventframework";
import { initializeDataSource } from "./data-source.js";
import type {
  HandlerFn,
  InputParserFn,
} from "./shared/types.js";

const envReady = loadEnv();

// CEF's generated registry statically connects root.yaml routes to these handler modules.
// It replaces the old Express router as the HTTP entry point while reusing vacation commands.
import "./generated/HandlerRegistry.js";

export async function handler(
  event: LambdaEvent,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    await envReady;
    await setLambdaContext(context);
    await initializeDataSource();

    const commonEvent = buildCommonEvent(event);
    const route = getRouteConfig(commonEvent);
    if (!route?.handler) {
      return new Response(404, { error: "Route not found" });
    }

    const handlerFn = resolveHandlerRef(route.handler) as HandlerFn | undefined;
    if (!handlerFn) {
      console.error(`CEF handler "${route.handler}" was not registered`);
      return new Response(500, { error: "Route handler is unavailable" });
    }

    let input: unknown = {};
    if (route.inputParser) {
      const parser = resolveHandlerRef(route.inputParser) as
        | InputParserFn
        | undefined;
      if (!parser) {
        console.error(`CEF input parser "${route.inputParser}" was not registered`);
        return new Response(500, { error: "Request parser is unavailable" });
      }
      input = parser(commonEvent);
      if (input instanceof Response) {
        return input;
      }
    }

    const result = await handlerFn(input, commonEvent);
    if (isProxyResult(result)) {
      return result;
    }
    return new Response(200, { data: result });
  } catch (error: unknown) {
    console.error("CEF request failed", error);
    return new Response(500, { error: "Internal server error" });
  }
}

function isProxyResult(value: unknown): value is APIGatewayProxyStructuredResultV2 {
  return (
    typeof value === "object" &&
    value !== null &&
    "statusCode" in value &&
    typeof value.statusCode === "number" &&
    "body" in value &&
    typeof value.body === "string"
  );
}

async function startLocalServer(): Promise<void> {
  await envReady;
  await initializeDataSource();
  // The same Lambda handler now serves local HTTP through CEF's development server.
  startDevServer(handler);
}

if (process.argv.includes("--local")) {
  void startLocalServer().catch((error: unknown) => {
    console.error("Failed to start local API", error);
    process.exitCode = 1;
  });
}
