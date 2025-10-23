<!-- ModalHeader.vue -->
<template>
  <div class="flex items-center gap-3">
    <div
      class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
    >
      <i class="pi pi-plus text-white text-lg"></i>
    </div>
    <div>
      <h3 class="text-lg font-semibold! text-gray-800">เพิ่มสินค้าใหม่</h3>
      <p class="text-sm text-gray-600">
        {{ currentStep === 1 ? 'เลือกหมวดหมู่สินค้า' : 'กรอกข้อมูลสินค้า' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentStep: number
}>()
</script>