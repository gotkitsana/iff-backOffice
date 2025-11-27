<script setup lang="ts">
import { Button } from 'primevue'
import { useProductQuery } from '@/composables/useProductQuery'

const props = defineProps<{
  categoryName: string
}>()

const emit = defineEmits<{
  'open-add-modal': []
  'open-export-modal': []
}>()

const { navigateWithQuery } = useProductQuery()
</script>

<template>
  <div class="flex items-center flex-wrap justify-between gap-3 mb-3">
    <div class="flex items-center gap-2">
      <h3 class="text-lg font-[600]! text-gray-800">
        หมวดหมู่: {{ props.categoryName }}
      </h3>
    </div>

    <div class="flex items-center flex-wrap gap-2">
      <Button label="นำเข้า" icon="pi pi-file-import" severity="success" size="small"
        @click="$emit('open-add-modal')" />

      <Button label="เบิกออก" icon="pi pi-file-export" severity="success" size="small"
        @click="$emit('open-export-modal')" />

      <Button label="ตั้งค่า" icon="pi pi-cog" severity="info" size="small"
        @click="navigateWithQuery('/product/options-settings')" />

      <slot name="extra-actions"></slot>
    </div>
  </div>
</template>
