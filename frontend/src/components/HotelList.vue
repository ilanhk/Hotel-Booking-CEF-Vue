<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { HotelSearchParams, HotelSummary } from '@/api/hotels'
import ImageGallery from '@/components/ImageGallery.vue'

defineProps<{ hotels: HotelSummary[]; search: HotelSearchParams }>()
</script>

<template>
  <p v-if="hotels.length === 0" class="text-sm text-slate-500">
    No hotels with free rooms were found for these dates.
  </p>
  <ul v-else class="space-y-4">
    <li
      v-for="hotel in hotels"
      :key="hotel.id"
      class="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:flex-row"
    >
      <ImageGallery
        :images="hotel.images"
        :alt="hotel.name"
        thumb-class="h-48 w-full sm:h-auto sm:w-64 shrink-0"
      />
      <div class="flex-1 p-4">
        <RouterLink
          :to="{ name: 'hotel-rooms', params: { id: hotel.id }, query: { ...search } }"
          class="text-lg font-semibold text-blue-700 hover:underline"
        >
          {{ hotel.name }}
        </RouterLink>
        <p class="text-sm text-slate-500">{{ hotel.city }}</p>
        <p class="mt-2 text-sm text-slate-700">{{ hotel.description }}</p>
        <p class="mt-3 text-sm text-slate-600">
          {{ hotel.availableRooms }} rooms available · from
          <span class="font-semibold text-slate-900">${{ hotel.fromPrice }}</span> / night
        </p>
      </div>
    </li>
  </ul>
</template>
