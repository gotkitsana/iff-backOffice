<!-- ModalFooter.vue -->
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
      v-if="currentStep === 2"
      label="เพิ่มสินค้า"
      icon="pi pi-check"
      @click="$emit('submit')"
      severity="success"
      size="small"
      :loading="isSubmitting"
    />
  </div>
</template>

<script setup lang="ts">
import { Button } from 'primevue'

defineProps<{
  currentStep: number
  isSubmitting: boolean
}>()

defineEmits<{
  'go-back': []
  close: []
  submit: []
}>()
</script>
