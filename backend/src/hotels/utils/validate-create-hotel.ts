import { isRecord } from "../../shared/utils/request.js";

export type CreateHotelInput = {
  name: string;
  description: string;
  city: string;
};

export type CreateHotelValidation =
  | { valid: true; value: CreateHotelInput }
  | { valid: false; message: string };

export function validateCreateHotelInput(input: unknown): CreateHotelValidation {
  if (!isRecord(input)) {
    return { valid: false, message: "A hotel object is required" };
  }

  if (
    typeof input.name !== "string" ||
    typeof input.description !== "string" ||
    typeof input.city !== "string"
  ) {
    return { valid: false, message: "Name, description, and city are required" };
  }

  const name = input.name.trim();
  const description = input.description.trim();
  const city = input.city.trim();

  if (name.length < 1 || name.length > 120) {
    return { valid: false, message: "Name must be between 1 and 120 characters" };
  }
  if (description.length < 1 || description.length > 500) {
    return {
      valid: false,
      message: "Description must be between 1 and 500 characters",
    };
  }
  if (city.length < 1 || city.length > 255) {
    return { valid: false, message: "City must be between 1 and 255 characters" };
  }

  return { valid: true, value: { name, description, city } };
}
