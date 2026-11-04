import { api } from './http'

export interface HotelImage {
  id: string
  url: string
  altText: string | null
}

export interface HotelSearchParams {
  city: string
  startDate: string
  endDate: string
}

export interface HotelSummary {
  id: string
  name: string
  description: string
  city: string
  availableRooms: number
  fromPrice: number
  images: HotelImage[]
}

export interface RoomTypeOption {
  id: string
  name: string
  pricePerNight: number
  // Rooms of this type still free for the requested dates.
  quantity: number
  // A free room that can be booked, or null when the type is sold out.
  bookableRoomId: string | null
  images: HotelImage[]
}

export interface HotelRoomTypes {
  hotel: { id: string; name: string; city: string; description: string }
  roomTypes: RoomTypeOption[]
}

export async function fetchHotelCities(): Promise<string[]> {
  const { data } = await api.get<string[]>('/hotels/cities')
  return data
}

export async function fetchMyManagedHotels(): Promise<{ id: string; name: string; city: string }[]> {
  const { data } = await api.get('/my-hotels')
  return data
}

// Hotels in the city that still have a room free for the whole stay.
export async function searchHotels(params: HotelSearchParams): Promise<HotelSummary[]> {
  const { data } = await api.get<HotelSummary[]>('/hotels/search', { params })
  return data
}

export async function fetchHotelRoomTypes(
  hotelId: string,
  stay: Pick<HotelSearchParams, 'startDate' | 'endDate'>,
): Promise<HotelRoomTypes> {
  const { data } = await api.get<HotelRoomTypes>(`/hotels/${hotelId}/room-types`, { params: stay })
  return data
}
