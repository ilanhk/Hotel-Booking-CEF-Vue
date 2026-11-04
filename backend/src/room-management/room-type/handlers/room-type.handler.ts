import { Response } from "commoneventframework";
import { AppDataSource } from "../../../data-source.js";
import { authenticate, roleError } from "../../../shared/utils/authentication.js";
import type { HandlerFn } from "../../../shared/types.js";
import { RoomType } from "../room-type.entity.js";
import { validateCreateRoomTypeInput } from "../utils/validate-create-room-type.js";


export const createRoomTypeHandler: HandlerFn = async (
  input,
  event,
) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }
  if (authentication.user.role !== "Property Manager") {
    return roleError("Property Manager");
  }

  const validation = validateCreateRoomTypeInput(input);
  if (!validation.valid) {
    return new Response(400, { error: validation.message });
  }

  const repository = AppDataSource.getRepository(RoomType);
  try {
    const roomType = await repository.save(repository.create(validation.value));
    return new Response(201, roomType);
  } catch (error: unknown) {
    console.error("Failed to create room type", error);
    return new Response(500, { error: "Failed to create room type" });
  }
};