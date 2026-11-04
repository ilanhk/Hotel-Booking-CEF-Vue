import type {
  APIGatewayProxyStructuredResultV2,
  Response,
} from "commoneventframework";
import type { CommonEvent } from "commoneventframework/dist/types/commonEvent.js";

export type HandlerResult = APIGatewayProxyStructuredResultV2 | object;
export type HandlerFn = (
  input: unknown,
  event: CommonEvent,
) => Promise<HandlerResult>;
export type InputParserFn = (event: CommonEvent) => unknown | Response;
