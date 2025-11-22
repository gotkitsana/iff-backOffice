<script setup lang="ts">
import { computed } from 'vue'
import { Image as PrimeImage } from 'primevue'
import { getProductImageUrl } from '@/utils/imageUrl'
import formatCurrency from '@/utils/formatCurrency'
import type { IProduct } from '@/stores/product/product'

// Props
const props = defineProps<{
  products: Array<{
    id: string
    name?: string
    quantity: number
    unit?: string
    price?: number | null
  }>
  customProducts?: Array<{
    name: string
    quantity: number
    description?: string
  }>
  productsData?: IProduct[]
}>()

// Function to get product image URL
const getProductImage = (productId: string): string | undefined => {
  if (!productId || !props.productsData) return undefined
  const product = props.productsData.find((p) => p._id === productId)
  if (!product || !product.images || product.images.length === 0) return undefined
  return getProductImageUrl(product.images[0].filename)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Products -->
    <div
      v-if="products && products.length > 0"
      class="bg-white border border-gray-200 rounded-lg p-4"
    >
      <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
        <i class="pi pi-box text-blue-600 text-xs"></i>
        สินค้าที่เพิ่มแล้ว
      </h4>
      <div class="space-y-3">
        <div
          v-for="(product, index) in products"
          :key="index"
          class="p-3 bg-gray-50 rounded-lg flex gap-3"
        >
          <div v-if="getProductImage(product.id)" class="flex-shrink-0">
            <PrimeImage
              :src="getProductImage(product.id)"
              :alt="product.name || `สินค้า ${index + 1}`"
              :preview="true"
              class="max-w-[120px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            />
          </div>
          <div
            v-else
            class="flex-shrink-0 w-[120px] h-[120px] bg-gray-100 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-image text-gray-400 text-2xl"></i>
          </div>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">
              {{ product.name || `สินค้า ${index + 1}` }}
            </div>
            <div class="text-xs text-gray-600 mt-1">
              จำนวน: {{ product.quantity }} {{ product.unit || 'ชิ้น' }} | ราคา:
              {{ formatCurrency(product.price || 0) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Products -->
    <div
      v-if="customProducts && customProducts.length > 0"
      class="bg-white border border-gray-200 rounded-lg p-4"
    >
      <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
        <i class="pi pi-shopping-cart text-orange-600 text-xs"></i>
        สินค้านอกเหนือรายการ
      </h4>
      <div class="space-y-3">
        <div
          v-for="(product, index) in customProducts"
          :key="index"
          class="p-3 bg-gray-50 rounded-lg"
        >
          <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
          <div class="text-xs text-gray-600 mt-1">จำนวน: {{ product.quantity }} ชิ้น</div>
          <div v-if="product.description" class="text-xs text-gray-500 mt-1">
            {{ product.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

