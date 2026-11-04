<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppLayout from '@/components/AppLayout.vue'
import ImageGallery from '@/components/ImageGallery.vue'
import { createBooking } from '@/api/bookings'
import { fetchHotelRoomTypes, type HotelRoomTypes, type RoomTypeOption } from '@/api/hotels'

const route = useRoute()
const router = useRouter()

const hotelId = String(route.params.id)
const startDate = String(route.query.startDate ?? '')
const endDate = String(route.query.endDate ?? '')
const city = String(route.query.city ?? '')

const data = ref<HotelRoomTypes | null>(null)
const error = ref('')
const loading = ref(true)
const bookingTypeId = ref<string | null>(null)

const hasDates = Boolean(startDate && endDate)

const nights = computed(() => {
  if (!hasDates) return 0
  return Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) + 1
})

const backLink = computed(() => ({ name: 'guest', query: { city, startDate, endDate } }))

async function load() {
  loading.value = true
  try {
    data.value = await fetchHotelRoomTypes(hotelId, { startDate, endDate })
  } catch (e) {
    error.value = (isAxiosError(e) && e.response?.data?.error) || 'Could not load the rooms.'
  } finally {
    loading.value = false
  }
}

async function book(roomType: RoomTypeOption) {
  if (!roomType.bookableRoomId) return
  error.value = ''
  bookingTypeId.value = roomType.id
  try {
    await createBooking({ roomId: roomType.bookableRoomId, startDate, endDate })
    await router.push({ name: 'my-bookings' })
  } catch (e) {
    error.value = (isAxiosError(e) && e.response?.data?.error) || 'Could not book this room.'
    await load()
  } finally {
    bookingTypeId.value = null
  }
}

onMounted(() => {
  if (hasDates) load()
  else {
    loading.value = false
    error.value = 'Pick your dates on the guest page first.'
  }
})
</script>

<template>
  <AppLayout :title="data?.hotel.name ?? 'Hotel'">
    <RouterLink :to="backLink" class="text-sm text-blue-700 hover:underline">
      &larr; Back to search
    </RouterLink>

    <p v-if="data" class="mt-2 text-sm text-slate-600">
      {{ data.hotel.city }} · {{ startDate }} → {{ endDate }} ({{ nights }}
      {{ nights === 1 ? 'night' : 'nights' }})
    </p>
    <p v-if="data" class="mt-1 text-sm text-slate-700">{{ data.hotel.description }}</p>
    <p v-if="error" class="mt-3 text-sm text-red-600" role="alert">{{ error }}</p>
    <p v-if="loading" class="mt-3 text-sm text-slate-500">Loading…</p>

    <ul v-if="data" class="mt-4 space-y-4">
      <li
        v-for="roomType in data.roomTypes"
        :key="roomType.id"
        class="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:flex-row"
      >
        <ImageGallery
          :images="roomType.images"
          :alt="roomType.name"
          thumb-class="h-44 w-full sm:h-auto sm:w-64 shrink-0"
        />
        <div class="flex flex-1 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ roomType.name }}</h3>
            <p class="text-sm text-slate-600">
              ${{ roomType.pricePerNight }} / night · ${{ roomType.pricePerNight * nights }} total
            </p>
            <p class="text-sm" :class="roomType.quantity > 0 ? 'text-slate-600' : 'text-red-600'">
              {{ roomType.quantity > 0 ? `${roomType.quantity} available` : 'Sold out' }}
            </p>
          </div>
          <button
            type="button"
            class="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="roomType.quantity === 0 || bookingTypeId !== null"
            @click="book(roomType)"
          >
            {{ bookingTypeId === roomType.id ? 'Booking…' : 'Book' }}
          </button>
        </div>
      </li>
    </ul>

    <div
      v-if="bookingTypeId !== null"
      class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-white/80"
      role="status"
      aria-live="polite"
    >
      <span class="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p class="text-sm font-medium text-slate-700">Booking your room…</p>
    </div>
  </AppLayout>
</template>
