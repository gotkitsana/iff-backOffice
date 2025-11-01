<script setup lang="ts">
import { Button } from 'primevue'

defineProps<{
  isSubmitting: boolean
}>()

defineEmits<{
  close: []
  submit: []
}>()
</script>

<template>
  <div class="flex justify-between gap-3">
    <Button
      label="ยกเลิก"
      icon="pi pi-times"
      severity="secondary"
      @click="$emit('close')"
      size="small"
    />
    <Button
      label="เพิ่มสินค้า"
      icon="pi pi-check"
      @click="$emit('submit')"
      severity="success"
      size="small"
      :loading="isSubmitting"
    />
  </div>
</template>


