import { Response } from "commoneventframework";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export type PaginationParams = { page: number; limit: number };

function parsePositiveInteger(value: string | undefined, fallback: number): number | null {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// Returns the validated page/limit, or a 400 Response when the query values are invalid.
export function parsePagination(
  query: Record<string, string | undefined>,
): PaginationParams | Response {
  const page = parsePositiveInteger(query.page, DEFAULT_PAGE);
  const limit = parsePositiveInteger(query.limit, DEFAULT_LIMIT);
  if (page === null || limit === null || limit > MAX_LIMIT) {
    return new Response(400, {
      error: `page must be a positive integer and limit must be between 1 and ${MAX_LIMIT}`,
    });
  }
  return { page, limit };
}

export function toSkipTake({ page, limit }: PaginationParams): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams,
): Response {
  return new Response(200, {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
