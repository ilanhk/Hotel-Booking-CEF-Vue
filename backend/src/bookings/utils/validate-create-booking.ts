import { isRecord } from "../../shared/utils/request.js";

export type CreateBookingInput = {
  roomId: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

export type CreateBookingValidation =
  | { valid: true; value: CreateBookingInput }
  | { valid: false; message: string };

const MAX_REASON_LENGTH = 2000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCreateBookingInput(input: unknown): CreateBookingValidation {
  if (!isRecord(input)) {
    return { valid: false, message: "A booking object is required" };
  }

  if (
    typeof input.roomId !== "string" ||
    typeof input.startDate !== "string" ||
    typeof input.endDate !== "string"
  ) {
    return { valid: false, message: "Room ID, start date, and end date are required" };
  }
  if (input.reason !== undefined && input.reason !== null && typeof input.reason !== "string") {
    return { valid: false, message: "Reason must be a string" };
  }

  const roomId = input.roomId.trim();
  if (!UUID_PATTERN.test(roomId)) {
    return { valid: false, message: "Room ID must be a valid UUID" };
  }

  const startDate = input.startDate.trim();
  const endDate = input.endDate.trim();
  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
    return { valid: false, message: "Start and end dates must use YYYY-MM-DD format" };
  }
  if (endDate <= startDate) {
    return { valid: false, message: "End date must be after the start date" };
  }
  if (startDate < new Date().toISOString().slice(0, 10)) {
    return { valid: false, message: "Bookings cannot start in the past" };
  }

  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (reason.length > MAX_REASON_LENGTH) {
    return {
      valid: false,
      message: `Reason cannot exceed ${MAX_REASON_LENGTH} characters`,
    };
  }

  return {
    valid: true,
    value: { roomId, startDate, endDate, ...(reason ? { reason } : {}) },
  };
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
