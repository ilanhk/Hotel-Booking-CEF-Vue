<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  guestName: string
  submitting: boolean
  error: string
}>()

const emit = defineEmits<{
  submit: [comment: string]
  cancel: []
}>()

const comment = ref('')

// Start with an empty comment each time the dialog opens.
watch(
  () => props.open,
  (open) => {
    if (open) comment.value = ''
  },
)

function onSubmit() {
  if (comment.value.trim()) emit('submit', comment.value.trim())
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
    @keydown.esc="emit('cancel')"
  >
    <form
      class="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
      role="dialog"
      aria-modal="true"
      @submit.prevent="onSubmit"
    >
      <h3 class="text-lg font-semibold text-slate-900">Reject booking</h3>
      <p class="mt-1 text-sm text-slate-600">
        Why are you rejecting {{ guestName }}'s booking? The guest will see this reason.
      </p>

      <textarea
        v-model="comment"
        rows="4"
        required
        autofocus
        placeholder="Reason for rejection"
        class="mt-3 w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      <p v-if="error" class="mt-2 rounded bg-red-100 px-3 py-2 text-sm text-red-800" role="alert">
        {{ error }}
      </p>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          :disabled="submitting"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          :disabled="submitting || !comment.trim()"
        >
          {{ submitting ? 'Submitting…' : 'Submit' }}
        </button>
      </div>
    </form>
  </div>
</template>
