<script setup lang="ts">
import { computed, ref } from 'vue'

// Anything that blocks days on the calendar: the user's Pending/Approved requests.
export interface BookedRange {
  startDate: string
  endDate: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

const props = defineProps<{ booked: BookedRange[] }>()

// Selected range as "YYYY-MM-DD" strings (empty = nothing picked yet).
const start = defineModel<string>('start', { default: '' })
const end = defineModel<string>('end', { default: '' })

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const now = new Date()
const today = toIso(now.getFullYear(), now.getMonth(), now.getDate())

// First day of the month currently shown.
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const conflictMessage = ref('')

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  }),
)

// Leading nulls pad the grid so day 1 lands under the right weekday.
const cells = computed<(string | null)[]>(() => {
  const firstWeekday = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const result: (string | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    result.push(toIso(viewYear.value, viewMonth.value, day))
  }
  return result
})

// Rejected requests don't block anything, so they are ignored here.
const activeBooked = computed(() => props.booked.filter((range) => range.status !== 'Rejected'))

function bookedStatus(iso: string): 'Pending' | 'Approved' | null {
  const matches = activeBooked.value.filter((r) => r.startDate <= iso && iso <= r.endDate)
  if (matches.some((r) => r.status === 'Approved')) return 'Approved'
  return matches.length > 0 ? 'Pending' : null
}

function isDisabled(iso: string): boolean {
  return iso < today || bookedStatus(iso) !== null
}

function rangeHitsBooked(from: string, to: string): boolean {
  return activeBooked.value.some((r) => r.startDate <= to && r.endDate >= from)
}

function dayClasses(iso: string): string[] {
  const status = bookedStatus(iso)
  const isEdge = iso === start.value || iso === end.value
  const inRange = start.value && end.value && iso > start.value && iso < end.value

  if (isEdge) return ['bg-blue-600 text-white font-semibold']
  if (inRange) return ['bg-blue-100 text-blue-900']
  if (status === 'Approved') return ['bg-green-200 text-green-900 cursor-not-allowed']
  if (status === 'Pending') return ['bg-amber-200 text-amber-900 cursor-not-allowed']
  if (iso < today) return ['bg-slate-50 text-slate-300 cursor-not-allowed']
  return ['text-slate-700 hover:bg-blue-50', iso === today ? 'ring-1 ring-blue-400' : '']
}

function dayTitle(iso: string): string {
  const status = bookedStatus(iso)
  if (status) return status === 'Approved' ? 'Already booked' : 'Already booked (pending approval)'
  return iso < today ? 'In the past' : iso
}

// First click picks the start, second click picks the end (must be after the start).
function pick(iso: string) {
  if (isDisabled(iso)) return
  conflictMessage.value = ''

  if (!start.value || end.value || iso <= start.value) {
    start.value = iso
    end.value = ''
    return
  }
  if (rangeHitsBooked(start.value, iso)) {
    conflictMessage.value = 'That range includes days that are already booked.'
    return
  }
  end.value = iso
}

function shiftMonth(delta: number) {
  const next = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}

// Don't allow browsing to months that are entirely in the past.
const canGoBack = computed(
  () => viewYear.value > now.getFullYear() || viewMonth.value > now.getMonth(),
)
</script>

<template>
  <div class="w-full max-w-xs">
    <div class="mb-2 flex items-center justify-between">
      <button
        type="button"
        class="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        :disabled="!canGoBack"
        aria-label="Previous month"
        @click="shiftMonth(-1)"
      >
        &lsaquo;
      </button>
      <span class="text-sm font-semibold text-slate-800">{{ monthLabel }}</span>
      <button
        type="button"
        class="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
        aria-label="Next month"
        @click="shiftMonth(1)"
      >
        &rsaquo;
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
      <span v-for="weekday in WEEKDAYS" :key="weekday">{{ weekday }}</span>
    </div>

    <div class="mt-1 grid grid-cols-7 gap-1">
      <template v-for="(iso, index) in cells" :key="index">
        <span v-if="iso === null" />
        <button
          v-else
          type="button"
          class="h-9 rounded text-sm"
          :class="dayClasses(iso)"
          :title="dayTitle(iso)"
          :disabled="isDisabled(iso)"
          @click="pick(iso)"
        >
          {{ Number(iso.slice(8)) }}
        </button>
      </template>
    </div>

    <p v-if="conflictMessage" class="mt-2 text-xs text-red-600" role="alert">
      {{ conflictMessage }}
    </p>

    <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      <li class="flex items-center gap-1">
        <span class="inline-block h-3 w-3 rounded bg-green-200" /> Booked
      </li>
      <li class="flex items-center gap-1">
        <span class="inline-block h-3 w-3 rounded bg-amber-200" /> Pending
      </li>
      <li class="flex items-center gap-1">
        <span class="inline-block h-3 w-3 rounded bg-blue-600" /> Selected
      </li>
    </ul>
  </div>
</template>
