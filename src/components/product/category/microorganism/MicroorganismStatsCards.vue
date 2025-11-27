<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import StatsCardItem from '@/components/product/UI/StatsCardItem.vue'

import type { ICategory } from '@/stores/product/category'
import { useProductStore, type IProduct } from '@/stores/product/product'

const props = defineProps<{
  selectedCategory: ICategory | null
}>()

const productStore = useProductStore()
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const microorganismProducts = computed(() => {
  if (!products.value) return []
  const categoryId = props.selectedCategory?._id
  if (!categoryId) return []
  return products.value.filter((product) => product.category?._id === categoryId)
})

const stats = computed(() => {
  if (!microorganismProducts.value.length) {
    return { price: 0, count: 0 }
  }

  const price = microorganismProducts.value.reduce(
    (sum, product) => sum + (product.food?.costPrice || 0) * (product.balance || 0),
    0
  )
  const count = microorganismProducts.value.reduce(
    (sum, product) => sum + (product.balance || 0),
    0
  )

  return { price, count }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(value)
}

const summaryCards = computed(() => [
  {
    id: 'inventoryValue',
    label: 'มูลค่าคงคลัง',
    value: formatCurrency(stats.value.price),
    iconClass: 'pi pi-wallet text-white',
    iconBgClass: 'bg-gradient-to-br from-green-500 to-green-600',
    valueClass: 'text-green-600',
  },
  {
    id: 'inventoryCount',
    label: 'จำนวนสินค้าทั้งหมด',
    value: stats.value.count,
    iconClass: 'pi pi-box text-white',
    iconBgClass: 'bg-gradient-to-br from-blue-500 to-blue-600',
    valueClass: 'text-blue-600',
  },
])
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
    <StatsCardItem v-for="card in summaryCards" :key="card.id" v-bind="card" />
  </div>
</template>

