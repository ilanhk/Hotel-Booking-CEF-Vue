<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { HotelImage } from '@/api/hotels'

const props = defineProps<{ images: HotelImage[]; alt: string; thumbClass?: string }>()

const open = ref(false)
const index = ref(0)

const current = computed(() => props.images[index.value])

function show(delta: number) {
  const count = props.images.length
  index.value = (index.value + delta + count) % count
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
  else if (event.key === 'ArrowLeft') show(-1)
  else if (event.key === 'ArrowRight') show(1)
}

watch(open, (isOpen) => {
  if (isOpen) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function openGallery() {
  index.value = 0
  open.value = true
}
</script>

<template>
  <div
    v-if="images.length === 0"
    class="flex items-center justify-center bg-slate-200 text-sm text-slate-500"
    :class="thumbClass ?? 'h-40 w-full'"
  >
    No image
  </div>
  <button
    v-else
    type="button"
    class="relative block overflow-hidden"
    :class="thumbClass ?? 'h-40 w-full'"
    :title="`View ${images.length} photos`"
    @click="openGallery"
  >
    <img :src="images[0]!.url" :alt="images[0]!.altText ?? alt" class="h-full w-full object-cover" />
    <span class="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
      {{ images.length }} photos
    </span>
  </button>

  <Teleport to="body">
    <div
      v-if="open && current"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="open = false"
    >
      <button
        type="button"
        class="absolute right-4 top-4 rounded bg-white/20 px-3 py-1 text-white hover:bg-white/30"
        aria-label="Close gallery"
        @click="open = false"
      >
        &times;
      </button>
      <button
        v-if="images.length > 1"
        type="button"
        class="absolute left-4 rounded-full bg-white/20 px-4 py-2 text-2xl text-white hover:bg-white/30"
        aria-label="Previous image"
        @click="show(-1)"
      >
        &lsaquo;
      </button>
      <figure class="max-h-full max-w-4xl">
        <img
          :src="current.url"
          :alt="current.altText ?? alt"
          class="max-h-[80vh] rounded object-contain"
        />
        <figcaption class="mt-2 text-center text-sm text-white">
          {{ alt }} · {{ index + 1 }} / {{ images.length }}
        </figcaption>
      </figure>
      <button
        v-if="images.length > 1"
        type="button"
        class="absolute right-4 rounded-full bg-white/20 px-4 py-2 text-2xl text-white hover:bg-white/30"
        aria-label="Next image"
        @click="show(1)"
      >
        &rsaquo;
      </button>
    </div>
  </Teleport>
</template>
