<script setup lang="ts">
import type { BookingStatus, GuestBooking } from '@/api/bookings'

defineProps<{ bookings: GuestBooking[] }>()

const STATUS_CLASSES: Record<BookingStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-left text-sm">
      <thead class="bg-slate-100 text-slate-700">
        <tr>
          <th class="border border-slate-300 px-3 py-2 font-semibold">Hotel</th>
          <th class="border border-slate-300 px-3 py-2 font-semibold">Room type</th>
          <th class="border border-slate-300 px-3 py-2 font-semibold">Check-in</th>
          <th class="border border-slate-300 px-3 py-2 font-semibold">Check-out</th>
          <th class="border border-slate-300 px-3 py-2 font-semibold">Total</th>
          <th class="border border-slate-300 px-3 py-2 font-semibold">Status</th>
          <th class="border border-slate-300 px-3 py-2 font-semibold">Manager comment</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="bookings.length === 0">
          <td colspan="7" class="border border-slate-300 px-3 py-4 text-center text-slate-500">
            You have no bookings yet.
          </td>
        </tr>
        <tr
          v-for="booking in bookings"
          :key="booking.id"
          class="odd:bg-white even:bg-slate-50"
        >
          <td class="border border-slate-300 px-3 py-2">
            <span class="font-medium text-slate-800">{{ booking.hotelName }}</span>
            <span class="block text-xs text-slate-500">{{ booking.city }}</span>
          </td>
          <td class="border border-slate-300 px-3 py-2">{{ booking.roomType }}</td>
          <td class="whitespace-nowrap border border-slate-300 px-3 py-2">{{ booking.startDate }}</td>
          <td class="whitespace-nowrap border border-slate-300 px-3 py-2">{{ booking.endDate }}</td>
          <td class="border border-slate-300 px-3 py-2">
            {{ booking.totalCost === null ? '—' : `$${booking.totalCost}` }}
          </td>
          <td class="border border-slate-300 px-3 py-2">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="STATUS_CLASSES[booking.status]"
            >
              {{ booking.status }}
            </span>
          </td>
          <td class="border border-slate-300 px-3 py-2 text-slate-600">
            {{ booking.comments || '—' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
