<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getErrorMessage } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const submitting = ref(false)

async function onSubmit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  submitting.value = true
  try {
    const user = await authStore.signUp(name.value, email.value, password.value)
    await router.push(authStore.homeRouteFor(user.role))
  } catch (e) {
    // Backend messages: invalid email, weak password, "User already exists"...
    error.value = getErrorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-100 px-4">
    <form
      class="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      @submit.prevent="onSubmit"
    >
      <h1 class="text-2xl font-semibold text-slate-800">Sign up</h1>
      <p class="text-sm text-slate-500">Create your account</p>

      <p v-if="error" class="rounded bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
        {{ error }}
      </p>

      <label class="block text-sm font-medium text-slate-700">
        Name
        <input
          v-model="name"
          type="text"
          required
          maxlength="120"
          autocomplete="name"
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </label>

      <label class="block text-sm font-medium text-slate-700">
        Email
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </label>

      <label class="block text-sm font-medium text-slate-700">
        Password
        <input
          v-model="password"
          type="password"
          required
          minlength="8"
          autocomplete="new-password"
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        <span class="mt-1 block text-xs font-normal text-slate-500">
          At least 8 characters with an uppercase letter, lowercase letter, number and symbol.
        </span>
      </label>

      <label class="block text-sm font-medium text-slate-700">
        Confirm password
        <input
          v-model="confirmPassword"
          type="password"
          required
          autocomplete="new-password"
          class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        :disabled="submitting"
        class="flex w-full items-center justify-center gap-2 rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <span
          v-if="submitting"
          class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          aria-hidden="true"
        ></span>
        {{ submitting ? 'Creating account...' : 'Register' }}
      </button>

      <p class="text-center text-xs text-slate-500">
        Already have an account?
        <RouterLink to="/login" class="text-blue-600 hover:underline">sign in</RouterLink>
      </p>
    </form>
  </main>
</template>
