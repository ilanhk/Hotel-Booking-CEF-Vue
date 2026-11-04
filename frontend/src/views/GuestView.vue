<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppLayout from '@/components/AppLayout.vue'
import BookingCalendar, { type BookedRange } from '@/components/BookingCalendar.vue'
import HotelList from '@/components/HotelList.vue'
import { fetchMyBookedDays } from '@/api/bookings'
import { fetchHotelCities, searchHotels, type HotelSearchParams, type HotelSummary } from '@/api/hotels'

const route = useRoute()
const router = useRouter()

const city = ref(String(route.query.city ?? ''))
const startDate = ref(String(route.query.startDate ?? ''))
const endDate = ref(String(route.query.endDate ?? ''))
const booked = ref<BookedRange[]>([])
const cities = ref<string[]>([])

const hotels = ref<HotelSummary[] | null>(null)
const searched = ref<HotelSearchParams | null>(null)
const searching = ref(false)
const formError = ref('')

const canSubmit = computed(() => city.value.trim() && startDate.value && endDate.value)

async function onSubmit() {
  if (!canSubmit.value) {
    formError.value = 'Enter a city and pick check-in and check-out dates.'
    return
  }
  const params: HotelSearchParams = {
    city: city.value.trim(),
    startDate: startDate.value,
    endDate: endDate.value,
  }
  formError.value = ''
  searching.value = true
  try {
    hotels.value = await searchHotels(params)
    searched.value = params
    // Keep the search in the URL so coming back from a hotel restores the results.
    await router.replace({ query: { ...params } })
  } catch (error) {
    formError.value =
      (isAxiosError(error) && error.response?.data?.error) || 'Could not search hotels.'
  } finally {
    searching.value = false
  }
}

async function onClear() {
  city.value = ''
  startDate.value = ''
  endDate.value = ''
  hotels.value = null
  searched.value = null
  formError.value = ''
  await router.replace({ query: {} })
}

onMounted(async () => {
  try {
    cities.value = await fetchHotelCities()
  } catch {
    formError.value = 'Could not load the list of cities.'
  }
  try {
    booked.value = await fetchMyBookedDays()
  } catch {
    booked.value = []
  }
  if (canSubmit.value) await onSubmit()
})
</script>

<template>
  <AppLayout title="Guest">
    <RouterLink
      :to="{ name: 'my-bookings' }"
      class="inline-block rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
    >
      My bookings
    </RouterLink>

    <section class="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 class="mb-3 text-lg font-semibold text-slate-900">Find a hotel</h2>
      <form class="flex flex-col gap-4 sm:flex-row" @submit.prevent="onSubmit">
        <BookingCalendar v-model:start="startDate" v-model:end="endDate" :booked="booked" />
        <div class="flex-1 space-y-3">
          <label class="block text-sm font-medium text-slate-700">
            City
            <select
              v-model="city"
              class="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2"
            >
              <option value="" disabled>Select a city</option>
              <option v-for="name in cities" :key="name" :value="name">{{ name }}</option>
            </select>
          </label>
          <p class="text-sm text-slate-600">
            {{ startDate || 'Check-in' }} → {{ endDate || 'Check-out' }}
          </p>
          <p v-if="formError" class="text-sm text-red-600" role="alert">{{ formError }}</p>
          <div class="flex gap-2">
            <button
              type="submit"
              class="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              :disabled="searching"
            >
              {{ searching ? 'Searching…' : 'Search hotels' }}
            </button>
            <button
              type="button"
              class="rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
              @click="onClear"
            >
              Clear search
            </button>
          </div>
        </div>
      </form>
    </section>

    <section v-if="hotels && searched" class="mt-6">
      <h2 class="mb-3 text-lg font-semibold text-slate-900">
        Hotels in {{ searched.city }} ({{ hotels.length }})
      </h2>
      <HotelList :hotels="hotels" :search="searched" />
    </section>
  </AppLayout>
</template>
