import { api } from './http'

// Date-only ("YYYY-MM-DD") strings, matching the backend.
export type BookingStatus = 'Pending' | 'Approved' | 'Rejected'

export interface Booking {
  id: string
  startDate: string
  endDate: string
  totalCost: number | null
  reason: string | null
  status: BookingStatus
  comments: string | null
  createdAt: string
}

// A guest's own booking, with the hotel and room it is for.
export interface GuestBooking extends Booking {
  hotelId: string
  hotelName: string
  city: string
  roomType: string
  roomNumber: string | null
}

// Property manager view of a booking made by a guest.
export interface ManagerBooking extends Booking {
  userId: string
  guestName: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CreateBookingPayload {
  roomId: string
  startDate: string
  endDate: string
  reason?: string
}

// If the server hasn't answered within this time, the UI shows the "try again later" page.
export const CREATE_BOOKING_TIMEOUT_MS = 20_000

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<{ id: string; totalCost: number | null }> {
  const { data } = await api.post<{ id: string; totalCost: number | null }>('/bookings', payload, {
    timeout: CREATE_BOOKING_TIMEOUT_MS,
  })
  return data
}

// The logged-in guest's own bookings, one page at a time.
export async function fetchMyBookings(
  page: number,
  limit: number,
  signal?: AbortSignal,
): Promise<{ data: GuestBooking[]; pagination: Pagination }> {
  const { data } = await api.get('/my-bookings', { params: { page, limit }, signal })
  return data
}

// All pending/approved bookings of the logged-in guest, unpaginated: the calendar marks these days as taken.
export async function fetchMyBookedDays(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>('/my-bookings/booked')
  return data
}

// Property manager view: bookings at the hotels they manage, one page at a time.
export interface BookingFilters {
  status?: BookingStatus
  userId?: string
}

export async function fetchAllBookings(
  page: number,
  limit: number,
  filters: BookingFilters = {},
  signal?: AbortSignal,
): Promise<{ data: ManagerBooking[]; pagination: Pagination }> {
  const { data } = await api.get('/bookings', {
    params: { page, limit, ...filters },
    signal,
  })
  return data
}

export async function fetchGuests(): Promise<{ id: string; name: string }[]> {
  const { data } = await api.get('/users')
  return data
}

export async function approveBooking(id: string): Promise<void> {
  await api.post(`/bookings/${id}/approve`)
}

export async function rejectBooking(id: string, comment: string): Promise<void> {
  await api.post(`/bookings/${id}/reject`, { comment })
}
