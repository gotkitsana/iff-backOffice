<script setup lang="ts">
import { computed } from 'vue'
import { Card } from 'primevue'
import { useQuery } from '@tanstack/vue-query'

import type { ICategory } from '@/stores/product/category'
import { useProductStore, type IProduct } from '@/stores/product/product'

defineProps<{
  selectedCategory?: ICategory | null
}>()

const productStore = useProductStore()
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const inventoryStats = computed(() => {
  if (!products.value) {
    return { price: 0, count: 0 }
  }

  const price = products.value.reduce((sum, product) => {
    if (product.category?.name === 'ปลา') {
      return sum + (product.price || 0)
    }
    return sum + (product.food?.costPrice || 0) * (product.balance || 0)
  }, 0)

  const count = products.value.reduce((sum, product) => sum + (product.balance || 0), 0)

  return { price, count }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
    <Card
      :pt="{ body: 'p-3 md:p-4 h-full' }"
      class="hover:shadow-lg transition-shadow duration-200"
    >
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">มูลค่าคลังทั้งหมด</p>
            <p class="text-xl text-green-600">{{ formatCurrency(inventoryStats.price) }}</p>
          </div>
          <div
            class="hidden md:flex w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-shopping-cart text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card
      :pt="{ body: 'p-3 md:p-4 h-full' }"
      class="hover:shadow-lg transition-shadow duration-200"
    >
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">จำนวนสินค้าทั้งหมด</p>
            <p class="text-xl text-blue-600">{{ inventoryStats.count }}</p>
          </div>
          <div
            class="hidden md:flex w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-box text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

