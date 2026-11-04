import { isRecord } from "../../shared/utils/request.js";

export type CreateHotelImageInput = {
  storageKey: string;
  hotelId: string;
  originalFilename?: string | null;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type CreateHotelImageValidation =
  | { valid: true; value: CreateHotelImageInput }
  | { valid: false; message: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCreateHotelImageInput(
  input: unknown,
): CreateHotelImageValidation {
  if (!isRecord(input)) {
    return { valid: false, message: "A hotel image object is required" };
  }

  if (typeof input.storageKey !== "string" || typeof input.hotelId !== "string") {
    return {
      valid: false,
      message: "Storage key and hotel ID are required",
    };
  }

  const storageKey = input.storageKey.trim();
  const hotelId = input.hotelId.trim();
  if (storageKey.length < 1 || storageKey.length > 500) {
    return {
      valid: false,
      message: "Storage key must be between 1 and 500 characters",
    };
  }
  if (!UUID_PATTERN.test(hotelId)) {
    return { valid: false, message: "Hotel ID must be a valid UUID" };
  }

  const originalFilename =
    typeof input.originalFilename === "string"
      ? input.originalFilename.trim()
      : input.originalFilename;
  if (
    (originalFilename !== undefined &&
      originalFilename !== null &&
      typeof originalFilename !== "string") ||
    (typeof originalFilename === "string" &&
      originalFilename.length > 255)
  ) {
    return {
      valid: false,
      message: "Original filename must be at most 255 characters",
    };
  }

  const altText =
    typeof input.altText === "string" ? input.altText.trim() : input.altText;
  if (
    (altText !== undefined && altText !== null && typeof altText !== "string") ||
    (typeof altText === "string" && altText.length > 500)
  ) {
    return { valid: false, message: "Alt text must be at most 500 characters" };
  }

  if (
    input.sortOrder !== undefined &&
    (typeof input.sortOrder !== "number" ||
      !Number.isInteger(input.sortOrder) ||
      input.sortOrder < 0)
  ) {
    return { valid: false, message: "Sort order must be a non-negative integer" };
  }

  if (input.isPrimary !== undefined && typeof input.isPrimary !== "boolean") {
    return { valid: false, message: "Primary status must be a boolean" };
  }

  return {
    valid: true,
    value: {
      storageKey,
      hotelId,
      ...(originalFilename !== undefined ? { originalFilename } : {}),
      ...(altText !== undefined ? { altText } : {}),
      ...(typeof input.sortOrder === "number" ? { sortOrder: input.sortOrder } : {}),
      ...(typeof input.isPrimary === "boolean" ? { isPrimary: input.isPrimary } : {}),
    },
  };
}