<script setup lang="ts">
import { Card } from 'primevue'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useQuery } from '@tanstack/vue-query'
import type { ICategory } from '@/stores/product/category'
import { computed } from 'vue'

const props = defineProps<{
  selectedCategory: ICategory | null
}>()

const productStore = useProductStore()
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const getProductsByCategory = computed<{ price: number; count: number }>(() => {
  if (!products.value) return { price: 0, count: 0 }
  if (props.selectedCategory == null) {
    // คำนวณรวมทั้งหมด แยก logic ตาม category
    const totalPrice = products.value.reduce((sum, p) => {
      if (p.category?.name === 'ปลา') {
        return sum + p.price || 0
      } else {
        return sum + (p.food?.costPrice || 0) * (p.balance || 0)
      }
    }, 0)

    return {
      price: totalPrice,
      count: products.value.reduce((sum, p) => sum + (p.balance || 0), 0),
    }
  }

  const filteredProducts = products.value.filter(
    (p) => p.category?._id === props.selectedCategory?._id
  )
  const balance =
    props.selectedCategory?.value === 'fish'
      ? filteredProducts.length
      : filteredProducts.reduce((sum, p) => sum + (p.balance || 0), 0)
  const price =
    props.selectedCategory?.value === 'fish'
      ? filteredProducts.reduce((sum, p) => sum + (p.price || 0), 0)
      : filteredProducts.reduce((sum, p) => sum + (p.food?.costPrice || 0) * (p.balance || 0), 0)

  return {
    price,
    count: balance,
  }
})

// Computed
const getSaleProductsCount = (products: IProduct[]) =>
  products.filter((p) => p.auctionOnly === 0).length

const getAuctionProductsCount = (products: IProduct[]) =>
  products.filter((p) => p.auctionOnly === 1).length

const getAvailableProductsCount = (products: IProduct[]) => products.filter((p) => !p.sold).length

const getSoldProductsCount = (products: IProduct[]) => products.filter((p) => p.sold).length

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}

const totalLabel = computed(() => {
  if (props.selectedCategory == null) {
    return 'มูลค่าคลังทั้งหมด'
  }
  return `มูลค่า${props.selectedCategory?.name}ทั้งหมด`
})

const countLabel = computed(() => {
  if (props.selectedCategory == null) {
    return 'จำนวนสินค้าทั้งหมด'
  }
  return `จำนวน${props.selectedCategory?.name}ทั้งหมด`
})

const getCategoryStats = (category: ICategory) => {
  const filteredProducts = products.value?.filter(
    (p) => p.category?._id === props.selectedCategory?._id
  )

  let ageStats: Record<string, number> = {}
  const seedSizeStats: Record<string, number> = {}

  if (category.value === 'fish' && filteredProducts) {
    // Age statistics
    ageStats = {
      'Tosai (6เดือน-1ปี)': filteredProducts.filter((p) => p.age?.includes('tosai')).length || 0,
      'Nisai (1-2ปี)': filteredProducts.filter((p) => p.age?.includes('nisai')).length || 0,
      'Sansai (2-3ปี)': filteredProducts.filter((p) => p.age?.includes('sansai')).length || 0,
      'Yonsai (3-4ปี)': filteredProducts.filter((p) => p.age?.includes('yonsai')).length || 0,
      'Rokusai (4-5ปี)': filteredProducts.filter((p) => p.age?.includes('rokusai')).length || 0,
    }
  }
  if (category.value === 'food') {
    // Food type statistics
  }

  return {
    ageStats,
    seedSizeStats,
  }
}
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
    <Card
      :pt="{ body: 'p-3 md:p-4' }"
      class="hover:shadow-lg transition-shadow duration-200 justify-center"
    >
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">{{ totalLabel }}</p>
            <p class="text-lg md:text-xl text-green-600">
              {{ formatCurrency(getProductsByCategory?.price || 0) }}
            </p>
            <!-- <p class="text-xs text-gray-500">บาท</p> -->
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
      :pt="{ body: 'p-3 md:p-4' }"
      class="hover:shadow-lg transition-shadow duration-200 justify-center"
    >
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">{{ countLabel }}</p>
            <p class="text-lg md:text-xl text-blue-600">
              {{ getProductsByCategory?.count || 0 }}
            </p>
            <!-- <p class="text-xs text-gray-500">บาท</p> -->
          </div>
          <div
            class="hidden md:flex w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-box text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card
      v-if="props.selectedCategory?.value === 'fish'"
      :pt="{ body: 'p-3 md:p-4' }"
      class="hover:shadow-lg transition-shadow duration-200 justify-center col-span-2"
    >
      <template #content>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="(count, age) in getCategoryStats(props.selectedCategory).ageStats"
            :key="age"
            class="text-sm text-gray-600"
          >
            {{ age }} : {{ count }} ตัว
          </div>
        </div>
      </template>
    </Card>

    <!-- <Card :pt="{ body: 'p-3 md:p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">พร้อมขาย</p>
            <p class="text-xl md:text-2xl text-green-600">0</p>
            <p class="text-xs text-gray-500">รายการ</p>
          </div>
          <div
            class="hidden md:flex w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-check-circle text-white text-2xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-3 md:p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">สินค้าสำหรับประมูล</p>
            <p class="text-xl md:text-2xl text-purple-600">0</p>
            <p class="text-xs text-gray-500">รายการ</p>
          </div>
          <div
            class="hidden md:flex w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-gavel text-white text-2xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-3 md:p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">ขายแล้ว</p>
            <p class="text-xl md:text-2xl text-orange-600">0</p>
            <p class="text-xs text-gray-500">รายการ</p>
          </div>
          <div
            class="hidden md:flex w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-tag text-white text-2xl"></i>
          </div>
        </div>
      </template>
    </Card> -->
  </div>
</template>
