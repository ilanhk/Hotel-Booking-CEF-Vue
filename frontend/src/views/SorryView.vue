<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4 text-center">
    <h1 class="text-3xl font-semibold text-slate-800">Sorry, please try again later :(</h1>
    <p class="text-slate-500">The server took too long to respond.</p>
    <RouterLink
      to="/"
      class="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
    >
      Back to home
    </RouterLink>
  </main>
</template>
