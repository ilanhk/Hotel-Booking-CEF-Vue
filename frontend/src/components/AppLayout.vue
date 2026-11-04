<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps<{ title: string }>()

const router = useRouter()
const authStore = useAuthStore()

async function onLogout() {
  await authStore.signOut()
  await router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="flex items-center justify-between bg-white px-6 py-3 shadow">
      <h1 class="text-lg font-semibold text-slate-800">{{ title }}</h1>
      <div class="flex items-center gap-4 text-sm text-slate-600">
        <span>{{ authStore.user?.name }}</span>
        <button class="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50" @click="onLogout">
          Log out
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-5xl p-6">
      <slot />
    </main>
  </div>
</template>
