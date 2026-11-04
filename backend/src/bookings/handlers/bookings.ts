import { Response } from "commoneventframework";
import { AppDataSource } from "../../data-source.js";
import type { FindOptionsWhere } from "typeorm";
import {
  authenticate,
  roleError,
} from "../../shared/utils/authentication.js";
import { commandError, runPropertyManagerCommand } from "../../shared/utils/command.js";
import { isRecord } from "../../shared/utils/request.js";
import {
  paginatedResponse,
  parsePagination,
  toSkipTake,
} from "../../shared/utils/pagination.js";
import type { HandlerFn } from "../../shared/types.js";
import { approveBookingCommand } from "../commands/approve-booking.command.js";
import { createBookingCommand } from "../commands/create-booking.command.js";
import { rejectBookingCommand } from "../commands/reject-booking.command.js";
import { validateCreateBookingInput } from "../utils/validate-create-booking.js";
import { toBookingDetailDto, toDateOnly, toGuestBookingDto, toMyBookingDto } from "../utils/booking-dto.js";
import {
  Booking,
  type BookingStatus,
} from "../booking.entity.js";

const REQUEST_STATUSES: readonly BookingStatus[] = [
  "Pending",
  "Approved",
  "Rejected",
];


export const createBookingHandler: HandlerFn = async (input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }
  //only a logged in user with either roles can access this endpoint

  const validation = validateCreateBookingInput(input);
  if (!validation.valid) {
    return new Response(400, { error: validation.message });
  }

  try {
    //the command checks the room exists and that neither the user nor the room is double-booked, inside a transaction
    const result = await createBookingCommand({
      userId: authentication.user.id,
      ...validation.value,
    });
    return new Response(201, result);
  } catch (error: unknown) {
    return commandError(error, "Failed to create booking");
  }
};

export const getBookingsHandler: HandlerFn = async (_input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }

  const isPropertyManager = authentication.user.role === "Property Manager";
  if (!isPropertyManager) {
    return roleError("Property Manager");
  }
  //the user must be logged in and have the Property Manager role can access this endpoint

  // 1. Read and validate page and limit
  const query = event.queryStringParameters ?? {};
  const pagination = parsePagination(query);
  if (pagination instanceof Response) {
    return pagination;
  }

  try {
    // 2. Fetch one page plus the total number of rows
    // Property Managers only see bookings for rooms in hotels they manage.
    const where: FindOptionsWhere<Booking> = {
      room: { hotel: { propertyManagerId: authentication.user.id } },
    };
    if (query.status !== undefined) {
      if (!REQUEST_STATUSES.includes(query.status as BookingStatus)) {
        return new Response(400, { error: "Invalid status filter" });
      }
      where.status = query.status as BookingStatus;
    }
    if (query.userId !== undefined) {
      where.guestId = query.userId;
    }

    const [rows, total] = await AppDataSource.getRepository(Booking).findAndCount({
      where,
      relations: { guest: true },
      order: { createdAt: "DESC", id: "DESC" },
      ...toSkipTake(pagination),
    });

    // 3. Return the rows (with the Guest's name, never the password) and the paging info
    const data = rows.map((request) => ({
      id: request.id,
      userId: request.guestId,
      guestName: request.guest.name,
      startDate: toDateOnly(request.startDate),
      endDate: toDateOnly(request.endDate),
      totalCost: request.totalCost,
      reason: request.reason,
      status: request.status,
      comments: request.comments,
      createdAt: request.createdAt,
    }));
    return paginatedResponse(data, total, pagination);
  } catch (error: unknown) {
    console.error("Failed to fetch bookings", error);
    return new Response(500, { error: "Failed to fetch bookings" });
  }
  
};

// Any logged-in user (Guest or Property Manager) can list their own requests: the query below is scoped to their id.
// Paginated, for the "My requests" table.
export const getMyBookingsHandler: HandlerFn = async (_input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }
  //any logged-in user (Guest or Property Manager) can access this endpoint; the query is scoped to their own id

  const query = event.queryStringParameters ?? {};
  const pagination = parsePagination(query);
  if (pagination instanceof Response) {
    return pagination;
  }

  try {
    const [requests, total] = await AppDataSource.getRepository(Booking).findAndCount({
      where: { guestId: authentication.user.id },
      relations: { room: { hotel: true, roomType: true } },
      order: { startDate: "ASC", id: "ASC" },
      ...toSkipTake(pagination),
    });
    return paginatedResponse(requests.map(toGuestBookingDto), total, pagination);
  } catch (error: unknown) {
    console.error("Failed to fetch my bookings", error);
    return new Response(500, { error: "Failed to fetch bookings" });
  }
};

// Every non-rejected request of the logged-in user, unpaginated: the booking calendar needs all booked days at once.
export const getMyBookedDaysHandler: HandlerFn = async (_input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }

  try {
    const requests = await AppDataSource.getRepository(Booking).find({
      where: [
        { guestId: authentication.user.id, status: "Pending" },
        { guestId: authentication.user.id, status: "Approved" },
      ],
      order: { startDate: "ASC" },
    });
    return new Response(200, requests.map(toMyBookingDto));
  } catch (error: unknown) {
    console.error("Failed to fetch booked days", error);
    return new Response(500, { error: "Failed to fetch booked days" });
  }
};

export const getBookingByIdHandler: HandlerFn = async (_input, event) => {
  const authentication = await authenticate(event);
  if ("response" in authentication) {
    return authentication.response;
  }

  try {
    const id = event.pathParameters?.id;
    const booking = id
      ? await AppDataSource.getRepository(Booking).findOne({
          where: { id },
          relations: { room: { hotel: true } },
        })
      : null;
    // Guests can only see their own bookings; Property Managers only bookings at hotels they manage.
    const canView =
      booking !== null &&
      (authentication.user.role === "Property Manager"
        ? booking.room.hotel.propertyManagerId === authentication.user.id
        : booking.guestId === authentication.user.id);
    if (!booking || !canView) {
      return new Response(404, { error: "Booking not found" });
    }
    return new Response(200, toBookingDetailDto(booking));
  } catch (error: unknown) {
    return new Response(500, { error: "Failed to fetch booking" });
  }
};


export const approveBookingHandler: HandlerFn = async (
  _input,
  event,
) => {
  return runPropertyManagerCommand(
    event,
    async (id, managerId) => {
      await approveBookingCommand(id, managerId);
    },
    "Failed to approve booking",
  );
};

export const rejectBookingHandler: HandlerFn = async (
  input,
  event,
) => {
  const comment =
    isRecord(input) && typeof input.comment === "string" ? input.comment : "";
  return runPropertyManagerCommand(
    event,
    async (id, managerId) => rejectBookingCommand(id, managerId, comment),
    "Failed to reject booking",
  );
};
