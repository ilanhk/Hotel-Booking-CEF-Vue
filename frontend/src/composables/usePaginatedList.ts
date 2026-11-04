import { ref, type Ref } from 'vue'
import axios from 'axios'
import type { Pagination } from '@/api/bookings'

interface Page<T> {
  data: T[]
  pagination: Pagination
}

// [Steps 1 and 2] Shared state and loading logic for any paginated table (manager dashboard, "My bookings").
//
// Race condition it prevents: the user changes a filter twice quickly, request A (old filter) is slow and request B
// (new filter) is fast. Without protection A would finish last and overwrite B's rows with stale data.
// Fix: every load() aborts the previous in-flight request via an AbortController, and only the latest one may
// update the state.
export function usePaginatedList<T>(
  fetchPage: (page: number, signal: AbortSignal) => Promise<Page<T>>,
  pageSize: number,
  errorFallback: string,
) {
  const rows = ref([]) as Ref<T[]>
  const pagination = ref<Pagination>({ page: 1, limit: pageSize, total: 0, totalPages: 1 })
  const loading = ref(false)
  const error = ref('')
  let controller: AbortController | null = null

  async function load(page = pagination.value.page) {
    controller?.abort() // cancel the previous request, if it is still running
    const current = new AbortController()
    controller = current
    loading.value = true
    error.value = ''
    try {
      const result = await fetchPage(page, current.signal)
      rows.value = result.data
      pagination.value = result.pagination
    } catch (e) {
      if (axios.isCancel(e)) return // superseded by a newer load, which owns the state now
      rows.value = []
      error.value = (axios.isAxiosError(e) && e.response?.data?.error) || errorFallback
    } finally {
      // Only the latest load may turn the spinner off; a cancelled one must leave `loading` to its replacement.
      if (controller === current) {
        loading.value = false
        controller = null
      }
    }
  }

  return { rows, pagination, loading, error, load }
}
