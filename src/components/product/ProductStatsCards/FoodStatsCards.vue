<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import StatsCardItem from './StatsCardItem.vue'

import type { ICategory } from '@/stores/product/category'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useFoodSaleStore, type IFoodSale } from '@/stores/product/food_sale'
import { useProductQuery } from '@/composables/useProductQuery'

const props = defineProps<{
  selectedCategory: ICategory | null
}>()

const productStore = useProductStore()
const foodSaleStore = useFoodSaleStore()
const { saleTypeFromQuery } = useProductQuery()

const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: foodSales } = useQuery<IFoodSale[]>({
  queryKey: ['get_food_sales'],
  queryFn: () => foodSaleStore.onGetFoodSales(),
  enabled: computed(() => saleTypeFromQuery.value === 'retail'),
})

const foodProducts = computed(() => {
  if (!products.value) return []
  const categoryId = props.selectedCategory?._id
  if (!categoryId) return []
  return products.value.filter((product) => product.category?._id === categoryId)
})

const inventoryStats = computed(() => {
  if (!foodProducts.value.length) {
    return { price: 0, count: 0 }
  }

  const price = foodProducts.value.reduce(
    (sum, product) => sum + (product.food?.costPrice || 0) * (product.balance || 0),
    0
  )
  const count = foodProducts.value.reduce((sum, product) => sum + (product.balance || 0), 0)

  return { price, count }
})

const retailStats = computed(() => {
  if (!foodSales.value) {
    return { price: 0, count: 0 }
  }

  const price = foodSales.value.reduce(
    (sum, sale) => sum + (sale.costPriceKilo || 0) * (sale.kilo || 0),
    0
  )
  const count = foodSales.value.reduce((sum, sale) => sum + (sale.kilo || 0), 0)
  return { price, count }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(value)
}

const summaryCards = computed(() => {
  const isRetail = saleTypeFromQuery.value === 'retail'
  return [
    {
      id: 'value',
      label: isRetail
        ? 'มูลค่าที่ขาย (Retail)'
        : `มูลค่า${props.selectedCategory?.name || 'สินค้า'}ทั้งหมด`,
      value: formatCurrency(isRetail ? retailStats.value.price : inventoryStats.value.price),
      iconClass: 'pi pi-wallet text-white',
      iconBgClass: 'bg-gradient-to-br from-green-500 to-green-600',
      valueClass: 'text-green-600',
    },
    {
      id: 'count',
      label: isRetail ? 'จำนวนที่ขาย' : `จำนวน${props.selectedCategory?.name || 'สินค้า'}ทั้งหมด`,
      value: isRetail ? retailStats.value.count : inventoryStats.value.count,
      iconClass: 'pi pi-box text-white',
      iconBgClass: 'bg-gradient-to-br from-blue-500 to-blue-600',
      valueClass: 'text-blue-600',
    },
  ]
})
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
    <StatsCardItem v-for="card in summaryCards" :key="card.id" v-bind="card" />
  </div>
</template>

