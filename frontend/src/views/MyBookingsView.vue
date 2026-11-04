<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import MyBookingsList from '@/components/MyBookingsList.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { fetchMyBookings, type GuestBooking } from '@/api/bookings'

const PAGE_SIZE = 10

const {
  rows: bookings,
  pagination,
  loading,
  error,
  load,
} = usePaginatedList<GuestBooking>(
  (page, signal) => fetchMyBookings(page, PAGE_SIZE, signal),
  PAGE_SIZE,
  'Could not load your bookings.',
)

onMounted(() => load(1))
</script>

<template>
  <AppLayout title="My bookings">
    <RouterLink :to="{ name: 'guest' }" class="text-sm text-blue-700 hover:underline">
      &larr; Find a hotel
    </RouterLink>
    <section class="mt-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p v-if="error" class="mb-2 text-sm text-red-600" role="alert">{{ error }}</p>
      <p v-if="loading" class="mb-2 text-sm text-slate-500">Loading…</p>
      <MyBookingsList :bookings="bookings" />
      <PaginationBar :pagination="pagination" :disabled="loading" @change="load" />
    </section>
  </AppLayout>
</template>
