<script setup lang="ts">
import { Card } from 'primevue'

interface Props {
  totalIncome: number
  totalExpense: number
  netProfit: number
  receivables: number
  loans: number
}

defineProps<Props>()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
    <!-- รายรับ -->
    <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">รายรับ</p>
            <p class="text-lg md:text-xl font-medium! text-green-600">
              {{ formatCurrency(totalIncome) }}
            </p>
            <p class="text-xs text-gray-500 mt-1">บาท</p>
          </div>
          <div
            class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <i class="pi pi-arrow-up text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <!-- รายจ่าย -->
    <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">รายจ่าย</p>
            <p class="text-lg md:text-xl font-medium! text-red-600">
              {{ formatCurrency(totalExpense) }}
            </p>
            <p class="text-xs text-gray-500 mt-1">บาท</p>
          </div>
          <div
            class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <i class="pi pi-arrow-down text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <!-- กำไร/ขาดทุน -->
    <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">กำไร/ขาดทุน</p>
            <p
              class="text-lg md:text-xl font-medium!"
              :class="netProfit >= 0 ? 'text-blue-600' : 'text-red-600'"
            >
              {{ formatCurrency(netProfit) }}
            </p>
            <p class="text-xs text-gray-500 mt-1">บาท</p>
          </div>
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            :class="
              netProfit >= 0
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : 'bg-gradient-to-br from-red-500 to-pink-600'
            "
          >
            <i class="pi pi-calculator text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <!-- ลูกหนี้ -->
    <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">ลูกหนี้</p>
            <p class="text-lg md:text-xl font-medium! text-purple-600">
              {{ formatCurrency(receivables) }}
            </p>
            <p class="text-xs text-gray-500 mt-1">บาท</p>
          </div>
          <div
            class="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <i class="pi pi-users text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <!-- กู้ยืม -->
    <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">กู้ยืม</p>
            <p class="text-lg md:text-xl font-medium! text-orange-600">
              {{ formatCurrency(loans) }}
            </p>
            <p class="text-xs text-gray-500 mt-1">บาท</p>
          </div>
          <div
            class="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <i class="pi pi-money-bill text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

