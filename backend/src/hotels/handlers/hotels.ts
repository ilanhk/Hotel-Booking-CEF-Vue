import { Response } from "commoneventframework";
import { AppDataSource } from "../../data-source.js";
import { authenticate, roleError } from "../../shared/utils/authentication.js";
import {
  paginatedResponse,
  parsePagination,
  toSkipTake,
} from "../../shared/utils/pagination.js";
import type { HandlerFn } from "../../shared/types.js";
import { Hotel } from "../hotel.entity.js";
import { validateCreateHotelInput } from "../utils/validate-create-hotel.js";

export const createHotelHandler: HandlerFn = async (input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }
  if (authentication.user.role !== "Property Manager") {
    return roleError("Property Manager");
  }

  const validation = validateCreateHotelInput(input);
  if (!validation.valid) {
    return new Response(400, { error: validation.message });
  }

  const repository = AppDataSource.getRepository(Hotel);
  try {
    const hotel = await repository.save(
      repository.create({
        ...validation.value,
        propertyManagerId: authentication.user.id,
      }),
    );
    return new Response(201, hotel);
  } catch (error: unknown) {
    console.error("Failed to create hotel", error);
    return new Response(500, { error: "Failed to create hotel" });
  }
};


// Hotels managed by the logged-in property manager, shown as the dashboard heading.
export const getMyManagedHotelsHandler: HandlerFn = async (_input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }
  if (authentication.user.role !== "Property Manager") {
    return roleError("Property Manager");
  }
  try {
    const hotels = await AppDataSource.getRepository(Hotel).find({
      where: { propertyManagerId: authentication.user.id },
      select: { id: true, name: true, city: true },
      order: { name: "ASC" },
    });
    return new Response(200, hotels);
  } catch (error: unknown) {
    console.error("Failed to fetch managed hotels", error);
    return new Response(500, { error: "Failed to fetch managed hotels" });
  }
};

export const getHotelsHandler: HandlerFn = async (_input, event) => { 
  const pagination = parsePagination(event.queryStringParameters ?? {});
  if (pagination instanceof Response) {
    return pagination;
  }

  const repository = AppDataSource.getRepository(Hotel);
  try {
    const [hotels, total] = await repository.findAndCount({
      order: { createdAt: "DESC", id: "DESC" },
      ...toSkipTake(pagination),
    });
    return paginatedResponse(hotels, total, pagination);
  } catch (error: unknown) {
    console.error("Failed to fetch hotels", error);
    return new Response(500, { error: "Failed to fetch hotels" });
  }
};


export const getHotelByIdHandler: HandlerFn = async (_input, event) => {  
  const id = event.pathParameters?.id;
  if (!id) {
    return new Response(400, { error: "Hotel ID is required" });
  }

  const repository = AppDataSource.getRepository(Hotel);
  try {
    const hotel = await repository.findOne({ where: { id } });
    if (!hotel) {
      return new Response(404, { error: "Hotel not found" });
    }
    return new Response(200, hotel);
  } catch (error: unknown) {
    console.error("Failed to fetch hotel", error);
    return new Response(500, { error: "Failed to fetch hotel" });
  }
};