import { isRecord } from "../../../shared/utils/request.js";

export type CreateRoomTypeInput = {
  name: string;
  hotelId: string;
  price: number;
};

export type CreateRoomTypeValidation =
  | { valid: true; value: CreateRoomTypeInput }
  | { valid: false; message: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCreateRoomTypeInput(
  input: unknown,
): CreateRoomTypeValidation {
  if (!isRecord(input)) {
    return { valid: false, message: "A room type object is required" };
  }

  if (typeof input.name !== "string" || typeof input.hotelId !== "string") {
    return {
      valid: false,
      message: "Room type name and hotel ID are required",
    };
  }

  const name = input.name.trim();
  const hotelId = input.hotelId.trim();

  if (name.length < 1 || name.length > 255) {
    return {
      valid: false,
      message: "Room type name must be between 1 and 255 characters",
    };
  }
  if (!UUID_PATTERN.test(hotelId)) {
    return { valid: false, message: "Hotel ID must be a valid UUID" };
  }

  const price = input.price;
  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 99_999_999.99 ||
    Number(price.toFixed(2)) !== price
  ) {
    return {
      valid: false,
      message: "Price must be a non-negative amount with at most two decimals",
    };
  }

  return { valid: true, value: { name, hotelId, price } };
}