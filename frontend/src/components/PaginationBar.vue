<script setup lang="ts">
import type { Pagination } from '@/api/bookings'

defineProps<{ pagination: Pagination; disabled?: boolean }>()
const emit = defineEmits<{ change: [page: number] }>()
</script>

<template>
  <div class="mt-3 flex items-center justify-between text-sm text-slate-600">
    <span>
      Page {{ pagination.page }} of {{ pagination.totalPages || 1 }} · {{ pagination.total }}
      bookings
    </span>
    <div class="flex gap-2">
      <button
        type="button"
        class="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50"
        :disabled="disabled || pagination.page <= 1"
        @click="emit('change', pagination.page - 1)"
      >
        Previous
      </button>
      <button
        type="button"
        class="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50"
        :disabled="disabled || pagination.page >= pagination.totalPages"
        @click="emit('change', pagination.page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
