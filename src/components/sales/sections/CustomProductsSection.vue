<script setup lang="ts">
import { InputText, InputNumber, Textarea, Image } from 'primevue'
import { getProductImageUrl } from '@/utils/imageUrl'

// Props
const props = defineProps<{
  customProducts?: Array<{
    name: string
    quantity: number
    description?: string
    image?: string
  }>
  showCustomProducts: boolean
}>()
</script>

<template>
  <div v-if="showCustomProducts && customProducts && customProducts.length > 0"
    class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <h4 class="text-base font-medium text-gray-800 mb-3 flex items-center gap-2">
      <i class="pi pi-shopping-cart text-orange-600"></i>
      สินค้านอกเหนือรายการ
    </h4>
    <div class="space-y-3">
      <div v-for="(product, index) in customProducts" :key="index" class="p-3 bg-gray-50 rounded-lg space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อสินค้า</label>
            <InputText :model-value="product.name" fluid size="small" disabled class="opacity-60" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">จำนวน</label>
            <InputNumber :model-value="product.quantity" :min="1" fluid size="small" disabled class="opacity-60" />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">รายละเอียด</label>
          <Textarea :model-value="product.description" rows="3" fluid size="small" disabled class="opacity-60" />
        </div>
        <div v-if="product.image">
          <label class="text-sm font-medium text-gray-700 mb-1 block">รูปภาพสินค้า</label>
          <Image :src="getProductImageUrl(product.image)" :alt="product.name || 'Product image'" width="150px" preview
            class="border border-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
</template>
