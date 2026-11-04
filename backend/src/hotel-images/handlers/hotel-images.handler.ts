import { Response } from "commoneventframework";
import { AppDataSource } from "../../data-source.js";
import { authenticate, roleError } from "../../shared/utils/authentication.js";
import type { HandlerFn } from "../../shared/types.js";
import { HotelImage } from "../hotel-images.entity.js";
import { validateCreateHotelImageInput } from "../utils/validate-create-hotel-image.js";

export const createHotelImageHandler: HandlerFn = async (
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

  const validation = validateCreateHotelImageInput(input);
  if (!validation.valid) {
    return new Response(400, { error: validation.message });
  }

  const repository = AppDataSource.getRepository(HotelImage);
  try {
    const hotelImage = await repository.save(repository.create(validation.value));
    return new Response(201, hotelImage);
  } catch (error: unknown) {
    console.error("Failed to create hotel image", error);
    return new Response(500, { error: "Failed to create hotel image" });
  }
};

export const getHotelImagesHandler: HandlerFn = async (_input, event) => {
  const repository = AppDataSource.getRepository(HotelImage);
  try {
    const hotelImages = await repository.find();
    return new Response(200, hotelImages);
    
  } catch (error: unknown) {
    console.error("Failed to fetch hotel images", error);
    return new Response(500, { error: "Failed to fetch hotel images" });
  }
};

export const getHotelImageByIdHandler: HandlerFn = async (_input, event) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return new Response(400, { error: "Hotel image ID is required" });
  }

  const repository = AppDataSource.getRepository(HotelImage);
  try {
    const hotelImage = await repository.findOne({ where: { id } });
    if (!hotelImage) {
      return new Response(404, { error: "Hotel image not found" });
    }
    return new Response(200, hotelImage);
  } catch (error: unknown) {
    console.error("Failed to fetch hotel image", error);
    return new Response(500, { error: "Failed to fetch hotel image" });
  }
};