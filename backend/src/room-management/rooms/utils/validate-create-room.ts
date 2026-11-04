import { isRecord } from "../../../shared/utils/request.js";

export type CreateRoomInput = {
  roomTypeId: string;
  roomNumber?: string;
};

export type CreateRoomValidation =
  | { valid: true; value: CreateRoomInput }
  | { valid: false; message: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCreateRoomInput(input: unknown): CreateRoomValidation {
  if (!isRecord(input)) {
    return { valid: false, message: "A room object is required" };
  }

  if (typeof input.roomTypeId !== "string") {
    return { valid: false, message: "Room type ID is required" };
  }

  const roomTypeId = input.roomTypeId.trim();
  if (!UUID_PATTERN.test(roomTypeId)) {
    return { valid: false, message: "Room type ID must be a valid UUID" };
  }

  let roomNumber: string | undefined;
  if (input.roomNumber !== undefined && input.roomNumber !== null) {
    if (typeof input.roomNumber !== "string") {
      return {
        valid: false,
        message: "Room number must be between 1 and 100 characters",
      };
    }

    roomNumber = input.roomNumber.trim();
    if (roomNumber.length < 1 || roomNumber.length > 100) {
      return {
        valid: false,
        message: "Room number must be between 1 and 100 characters",
      };
    }
  }

  return {
    valid: true,
    value: {
      roomTypeId,
      ...(roomNumber !== undefined ? { roomNumber } : {}),
    },
  };
}
