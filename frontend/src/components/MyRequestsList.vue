<script setup lang="ts">
import type { Booking, BookingStatus } from '@/api/bookings'

withDefaults(
  defineProps<{
    requests: (Booking & { guestName?: string })[]
    title?: string
    showGuest?: boolean
    emptyText?: string
  }>(),
  {
    title: 'Bookings',
    showGuest: false,
    emptyText: 'No bookings yet.',
  },
)

const STATUS_CLASSES: Record<BookingStatus, string> = {
  Pending: 'bg-yellow-300 text-yellow-950',
  Approved: 'bg-green-300 text-green-950',
  Rejected: 'bg-red-400 text-red-950',
}
</script>

<template>
  <section>
    <h3 class="mb-2 text-base font-semibold text-slate-800">{{ title }}</h3>

    <!-- Spreadsheet look: bordered grid cells, grey header row, zebra rows. Scrolls sideways on small screens. -->
    <div class="max-h-96 overflow-auto rounded border border-slate-300">
      <table class="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead class="sticky top-0 bg-slate-200 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th v-if="showGuest" class="border border-slate-300 px-3 py-2 font-semibold">Guest name</th>
            <th class="border border-slate-300 px-3 py-2 font-semibold">Booking reason</th>
            <th class="border border-slate-300 px-3 py-2 font-semibold">Check-in</th>
            <th class="border border-slate-300 px-3 py-2 font-semibold">Check-out</th>
            <th class="border border-slate-300 px-3 py-2 font-semibold">Status</th>
            <th class="border border-slate-300 px-3 py-2 font-semibold">Manager comment</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="requests.length === 0">
            <td :colspan="showGuest ? 6 : 5" class="border border-slate-300 px-3 py-4 text-center text-slate-500">
              {{ emptyText }}
            </td>
          </tr>
          <tr
            v-for="request in requests"
            :key="request.id"
            class="odd:bg-white even:bg-slate-50 hover:bg-blue-50"
          >
            <td v-if="showGuest" class="whitespace-nowrap border border-slate-300 px-3 py-2 font-medium text-slate-800">
              {{ request.guestName }}
            </td>
            <td class="border border-slate-300 px-3 py-2 text-slate-700">
              {{ request.reason || '-' }}
            </td>
            <td class="whitespace-nowrap border border-slate-300 px-3 py-2 text-slate-700">
              {{ request.startDate }}
            </td>
            <td class="whitespace-nowrap border border-slate-300 px-3 py-2 text-slate-700">
              {{ request.endDate }}
            </td>
            <td
              class="border border-slate-300 px-3 py-2 font-medium"
              :class="STATUS_CLASSES[request.status]"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span>{{ request.status }}</span>
                <slot name="status-actions" :request="request" />
              </div>
            </td>
            <td class="border border-slate-300 px-3 py-2 text-slate-700">
              {{ request.comments || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
