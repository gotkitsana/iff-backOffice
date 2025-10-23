<script setup lang="ts">
import { Card } from 'primevue'
import type { IProduct } from '@/stores/product/product'

// Props
defineProps<{
  filteredProducts: IProduct[]
}>()

// Computed
const getSaleProductsCount = (products: IProduct[]) =>
  products.filter((p) => p.auctionOnly === 0).length

const getAuctionProductsCount = (products: IProduct[]) =>
  products.filter((p) => p.auctionOnly === 1).length

const getAvailableProductsCount = (products: IProduct[]) =>
  products.filter((p) => !p.sold).length

const getSoldProductsCount = (products: IProduct[]) =>
  products.filter((p) => p.sold).length
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
    <Card :pt="{ body: 'p-3 md:p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">สินค้าสำหรับขาย</p>
            <p class="text-xl md:text-2xl text-blue-600">
              {{ getSaleProductsCount(filteredProducts) }}
            </p>
            <p class="text-xs text-gray-500">รายการ</p>
          </div>
          <div
            class="hidden md:flex w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-shopping-cart text-white text-2xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-3 md:p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">พร้อมขาย</p>
            <p class="text-xl md:text-2xl text-green-600">
              {{ getAvailableProductsCount(filteredProducts) }}
            </p>
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
            <p class="text-xl md:text-2xl text-purple-600">
              {{ getAuctionProductsCount(filteredProducts) }}
            </p>
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
            <p class="text-xl md:text-2xl text-orange-600">
              {{ getSoldProductsCount(filteredProducts) }}
            </p>
            <p class="text-xs text-gray-500">รายการ</p>
          </div>
          <div
            class="hidden md:flex w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-tag text-white text-2xl"></i>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
