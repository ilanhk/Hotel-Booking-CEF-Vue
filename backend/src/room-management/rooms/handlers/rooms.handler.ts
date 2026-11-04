import { Response } from "commoneventframework";
import { AppDataSource } from "../../../data-source.js";
import { authenticate, roleError } from "../../../shared/utils/authentication.js";
import {
  paginatedResponse,
  parsePagination,
  toSkipTake,
} from "../../../shared/utils/pagination.js";
import type { HandlerFn } from "../../../shared/types.js";
import { Hotel } from "../../../hotels/hotel.entity.js";
import { RoomType } from "../../room-type/room-type.entity.js";
import { Room } from "../room.entity.js";
import { validateCreateRoomInput } from "../utils/validate-create-room.js";

export const createRoomHandler: HandlerFn = async (
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

  const validation = validateCreateRoomInput(input);
  if (!validation.valid) {
    return new Response(400, { error: validation.message });
  }

  try {
    const roomType = await AppDataSource.getRepository(RoomType).findOne({
      where: { id: validation.value.roomTypeId },
    });
    if (!roomType) {
      return new Response(404, { error: "Room type not found" });
    }

    const hotel = await AppDataSource.getRepository(Hotel).findOne({
      where: {
        id: roomType.hotelId,
        propertyManagerId: authentication.user.id,
      },
    });
    if (!hotel) {
      return new Response(404, { error: "Room type not found" });
    }

    const repository = AppDataSource.getRepository(Room);
    const room = await repository.save(
      repository.create({
        ...validation.value,
        hotelId: roomType.hotelId,
      }),
    );
    return new Response(201, room);
  } catch (error: unknown) {
    console.error("Failed to create room", error);
    return new Response(500, { error: "Failed to create room" });
  }
};

export const getRoomsHandler: HandlerFn = async (_input, event) => {
  const pagination = parsePagination(event.queryStringParameters ?? {});
  if (pagination instanceof Response) {
    return pagination;
  }

  const repository = AppDataSource.getRepository(Room);
  try {
    const [rooms, total] = await repository.findAndCount({
      // id as a tiebreaker keeps page boundaries stable
      order: { createdAt: "DESC", id: "DESC" },
      ...toSkipTake(pagination),
    });
    return paginatedResponse(rooms, total, pagination);
  } catch (error: unknown) {
    console.error("Failed to fetch rooms", error);
    return new Response(500, { error: "Failed to fetch rooms" });
  }
};

export const getRoomByIdHandler: HandlerFn = async (_input, event) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return new Response(400, { error: "Room ID is required" });
  }

  const repository = AppDataSource.getRepository(Room);
  try {
    const room = await repository.findOne({ where: { id } });
    if (!room) {
      return new Response(404, { error: "Room not found" });
    }
    return new Response(200, room);
  } catch (error: unknown) {
    console.error("Failed to fetch room", error);
    return new Response(500, { error: "Failed to fetch room" });
  }
};