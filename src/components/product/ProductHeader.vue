<script setup lang="ts">
import { Button } from 'primevue'

// Props
defineProps<{
  title: string
  description: string
}>()

// Emits
defineEmits<{
  'open-add-modal': []
}>()
</script>

<template>
  <div class="flex items-center justify-between flex-wrap gap-2">
    <div>
      <h1 class="text-xl font-semibold! text-gray-900">{{ title }}</h1>
      <p class="text-gray-600">{{ description }}</p>
    </div>

  </div>
</template>
