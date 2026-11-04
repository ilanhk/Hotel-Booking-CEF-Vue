<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppLayout from '@/components/AppLayout.vue'
import MyRequestsList from '@/components/MyRequestsList.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import RejectDialog from '@/components/RejectDialog.vue'
import { fetchMyManagedHotels } from '@/api/hotels'
import { usePaginatedList } from '@/composables/usePaginatedList'
import {
  approveBooking,
  fetchAllBookings,
  fetchGuests,
  rejectBooking,
  type BookingFilters,
  type ManagerBooking,
  type BookingStatus,
} from '@/api/bookings'

const PAGE_SIZE = 10
const STATUSES: BookingStatus[] = ['Pending', 'Approved', 'Rejected']

const route = useRoute()
const router = useRouter()

const requesters = ref<{ id: string; name: string }[]>([])
const hotelNames = ref('')
// [Step 3: filters in the URL] The initial filters and page are read from the URL (/Property Manager?status=Pending&page=2),
// so a refresh or the back button restores the same view. Unknown status values are ignored, and a bad page falls back to 1.
const queryStatus = String(route.query.status ?? '')
const statusFilter = ref<BookingStatus | ''>(
  STATUSES.includes(queryStatus as BookingStatus) ? (queryStatus as BookingStatus) : '',
)
const userFilter = ref(String(route.query.userId ?? ''))
const initialPage = Number(route.query.page) > 0 ? Math.floor(Number(route.query.page)) : 1

// [Steps 1 and 2: shared loading state] The composable owns rows, pagination, loading and error, and cancels
// the previous request when a new load starts. This view only describes how to fetch one page
// (the current filters plus the abort signal the composable passes in).
const {
  rows: requests,
  pagination,
  loading,
  error: listError,
  load: loadPage,
} = usePaginatedList<ManagerBooking>(
  (page, signal) => {
    const filters: BookingFilters = {}
    if (statusFilter.value) filters.status = statusFilter.value
    if (userFilter.value) filters.userId = userFilter.value
    return fetchAllBookings(page, PAGE_SIZE, filters, signal)
  },
  PAGE_SIZE,
  'Could not load the requests.',
)

const actionError = ref('')
const loadError = computed(() => actionError.value || listError.value)
const busyId = ref<string | null>(null)

const rejecting = ref<ManagerBooking | null>(null)
const rejectError = ref('')

function errorMessage(error: unknown, fallback: string): string {
  return (isAxiosError(error) && error.response?.data?.error) || fallback
}

// [Step 3] Every load (filter change, page change, approve/reject refresh) writes the current filters and page
// back into the URL with replace(), so the address always matches what is on screen without piling up history entries.
async function load(page = pagination.value.page) {
  const query: Record<string, string> = {}
  if (statusFilter.value) query.status = statusFilter.value
  if (userFilter.value) query.userId = userFilter.value
  if (page > 1) query.page = String(page)
  await router.replace({ query })
  await loadPage(page)
}

async function onApprove(request: ManagerBooking) {
  busyId.value = request.id
  actionError.value = ''
  try {
    await approveBooking(request.id)
    await load()
  } catch (error) {
    actionError.value = errorMessage(error, 'Could not approve the booking.')
  } finally {
    busyId.value = null
  }
}

function openReject(request: ManagerBooking) {
  rejectError.value = ''
  rejecting.value = request
}

async function onRejectSubmit(comment: string) {
  const request = rejecting.value
  if (!request) return
  busyId.value = request.id
  rejectError.value = ''
  try {
    await rejectBooking(request.id, comment)
    rejecting.value = null
    await load()
  } catch (error) {
    rejectError.value = errorMessage(error, 'Could not reject the request.')
  } finally {
    busyId.value = null
  }
}

onMounted(async () => {
  // Start the table immediately; the user list only fills the dropdown.
  const firstLoad = loadPage(initialPage)
  try {
    const hotels = await fetchMyManagedHotels()
    hotelNames.value = hotels.map((hotel) => `${hotel.name}, ${hotel.city}`).join(' · ')
  } catch {
    hotelNames.value = ''
  }
  try {
    requesters.value = await fetchGuests()
  } catch (error) {
    actionError.value = errorMessage(error, 'Could not load the user list.')
  }
  await firstLoad
})

function clearFilters() {
  statusFilter.value = ''
  userFilter.value = ''
  load(1)
}
</script>

<template>
  <AppLayout title="Manager Dashboard">
    <p v-if="loadError" class="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-800" role="alert">
      {{ loadError }}
    </p>

    <h2 v-if="hotelNames" class="mb-3 text-xl font-semibold text-slate-900">{{ hotelNames }}</h2>

    <div class="mb-3 flex flex-wrap items-end gap-3 text-sm">
      <label class="flex flex-col gap-1 text-slate-600">
        Status
        <select
          v-model="statusFilter"
          class="rounded border border-slate-300 bg-white px-2 py-1.5"
          @change="load(1)"
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-slate-600">
        User
        <select
          v-model="userFilter"
          class="rounded border border-slate-300 bg-white px-2 py-1.5"
          @change="load(1)"
        >
          <option value="">All users</option>
          <option v-for="user in requesters" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
      </label>
      <button
        v-if="statusFilter || userFilter"
        type="button"
        class="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
        @click="clearFilters"
      >
        Clear filters
      </button>
      <span
        v-if="loading"
        class="mb-1.5 inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
        role="status"
        aria-label="Loading"
      />
    </div>

    <MyRequestsList
      :requests="requests"
      title="All bookings"
      show-guest
      empty-text="No bookings yet."
    >
      <template #status-actions="{ request }">
        <template v-if="request.status === 'Pending'">
          <button
            type="button"
            class="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            :disabled="busyId === request.id"
            @click="onApprove(request as ManagerBooking)"
          >
            Approve
          </button>
          <button
            type="button"
            class="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            :disabled="busyId === request.id"
            @click="openReject(request as ManagerBooking)"
          >
            Reject
          </button>
        </template>
      </template>
    </MyRequestsList>

    <PaginationBar :pagination="pagination" :disabled="loading" @change="load" />

    <RejectDialog
      :open="rejecting !== null"
      :guest-name="rejecting?.guestName ?? ''"
      :submitting="busyId !== null && rejecting !== null"
      :error="rejectError"
      @submit="onRejectSubmit"
      @cancel="rejecting = null"
    />
  </AppLayout>
</template>
