import { Response } from "commoneventframework";
import { AppDataSource } from "../../../data-source.js";
import { authenticate, roleError } from "../../../shared/utils/authentication.js";
import type { HandlerFn } from "../../../shared/types.js";
import { RoomTypeImage } from "../room-type-images.entity.js";
import { validateCreateRoomTypeImageInput } from "../utils/validate-create-room-type-image.js";

export const createRoomTypeImageHandler: HandlerFn = async (
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

  const validation = validateCreateRoomTypeImageInput(input);
  if (!validation.valid) {
    return new Response(400, { error: validation.message });
  }

  const repository = AppDataSource.getRepository(RoomTypeImage);
  try {
    const roomTypeImage = await repository.save(repository.create(validation.value));
    return new Response(201, roomTypeImage);
  } catch (error: unknown) {
    console.error("Failed to create room type image", error);
    return new Response(500, { error: "Failed to create room type image" });
  }
};

export const getRoomTypeImagesHandler: HandlerFn = async (_input, event) => {
  const repository = AppDataSource.getRepository(RoomTypeImage);
  try {
    const roomTypeImages = await repository.find();
    return new Response(200, roomTypeImages);
    
  } catch (error: unknown) {
    console.error("Failed to fetch room type images", error);
    return new Response(500, { error: "Failed to fetch room type images" });
  }
};

export const getRoomTypeImageByIdHandler: HandlerFn = async (_input, event) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return new Response(400, { error: "Room type image ID is required" });
  }

  const repository = AppDataSource.getRepository(RoomTypeImage);
  try {
    const roomTypeImage = await repository.findOne({ where: { id } });
    if (!roomTypeImage) {
      return new Response(404, { error: "Room type image not found" });
    }
    return new Response(200, roomTypeImage);
  } catch (error: unknown) {
    console.error("Failed to fetch room type image", error);
    return new Response(500, { error: "Failed to fetch room type image" });
  }
};