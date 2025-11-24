<script lang="ts">
import { defineComponent } from 'vue'
import { Card } from 'primevue'

export default defineComponent({
  name: 'StatsCardItem',
  components: { Card },
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    iconClass: {
      type: String,
      default: 'pi pi-chart-line text-white text-xl',
    },
    iconBgClass: {
      type: String,
      default: 'bg-gradient-to-br from-gray-500 to-gray-600',
    },
    valueClass: {
      type: String,
      default: 'text-xl text-gray-900',
    },
    cardClass: {
      type: String,
      default: '',
    },
    bodyPadding: {
      type: String,
      default: 'p-3 md:p-4 h-full',
    },
  },
})
</script>

<template>
  <Card
    :pt="{ body: bodyPadding }"
    :class="['hover:shadow-lg transition-shadow duration-200', cardClass]"
  >
    <template #content>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-[600]! text-gray-600 mb-1">{{ label }}</p>
          <p :class="['text-xl', valueClass]">{{ value }}</p>
        </div>
        <div
          v-if="iconClass"
          class="hidden md:flex w-12 h-12 rounded-xl items-center justify-center shadow-lg"
          :class="iconBgClass"
        >
          <i :class="iconClass"></i>
        </div>
      </div>
    </template>
  </Card>
</template>
