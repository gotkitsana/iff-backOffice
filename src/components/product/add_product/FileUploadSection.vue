<!-- FileUploadSection.vue -->
<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <!-- Product Images -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <i class="pi pi-image text-blue-600"></i>
        <h4 class="text-lg font-medium text-gray-800">รูปภาพสินค้า</h4>
      </div>

      <div v-if="productImages.length > 0" class="mb-4">
        <div class="grid grid-cols-2 gap-2">
          <div v-for="(image, index) in productImages" :key="index" class="relative">
            <img
              :src="image.preview"
              :alt="`Product image ${index + 1}`"
              class="w-full h-40 object-contain rounded-lg border border-gray-200"
            />
            <Button
              icon="pi pi-times"
              severity="danger"
              size="small"
              text
              rounded
              class="absolute top-1 right-1"
              @click="$emit('remove-product-image', index)"
            />
          </div>
        </div>
      </div>

      <FileUpload
        mode="basic"
        name="productImage"
        accept="image/*"
        :maxFileSize="2000000"
        @select="$emit('product-image-select', $event)"
        :chooseLabel="isUploadingImage ? 'กำลังอัปโหลด...' : 'เพิ่มรูปภาพ'"
        :disabled="isUploadingImage"
        size="small"
      />
    </div>

    <!-- Certificate (for fish only) -->
    <div
      v-if="showCertificate"
      class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
    >
      <div class="flex items-center gap-2 mb-3">
        <i class="pi pi-file text-purple-600"></i>
        <h4 class="text-lg font-medium text-gray-800">ใบรับรอง</h4>
      </div>

      <div v-if="certificateFile" class="mb-4">
        <div class="relative">
          <img
            :src="certificateFile.preview"
            alt="Certificate"
            class="w-full h-60 object-contain rounded-lg border border-gray-200"
          />
          <Button
            icon="pi pi-times"
            severity="danger"
            size="small"
            text
            rounded
            class="absolute top-1 right-1"
            @click="$emit('remove-certificate')"
          />
        </div>
      </div>

      <FileUpload
        v-else
        mode="basic"
        name="certificate"
        accept="image/*"
        :maxFileSize="2000000"
        @select="$emit('certificate-select', $event)"
        :chooseLabel="isUploadingCertificate ? 'กำลังอัปโหลด...' : 'เลือกใบรับรอง'"
        :disabled="isUploadingCertificate"
        size="small"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, FileUpload } from 'primevue'

defineProps<{
  productImages: { filename: string; type: string; preview: string }[]
  certificateFile: { filename: string; preview: string } | null
  showCertificate: boolean
  isUploadingImage: boolean
  isUploadingCertificate: boolean
}>()

defineEmits<{
  'product-image-select': [event: { files: File[] }]
  'certificate-select': [event: { files: File[] }]
  'remove-product-image': [index: number]
  'remove-certificate': []
}>()
</script>
