<script setup lang="ts">
import type { ISalesProduct } from '../../types/sales'

// Props
defineProps<{
  selectedCategory: string | null
  categoryOptions: {
    value: ISalesProduct
    label: string
    icon: string
    color: string
    bgColor: string
    iconColor: string
  }[]
  getCategoryCount: (category: string) => number
}>()

// Emits
defineEmits<{
  'select-category': [category: string]
}>()
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div class="flex items-center gap-2 mb-3">
      <i class="pi pi-filter text-blue-600"></i>
      <h3 class="text-lg font-semibold text-gray-800">กรองสินค้าตามหมวดหมู่</h3>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
      <div
        v-for="category in categoryOptions"
        :key="category.value"
        :class="`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
          selectedCategory === category.value
            ? 'border-blue-300 bg-blue-50 shadow-md'
            : 'border-gray-200 hover:border-blue-200'
        }`"
        @click="$emit('select-category', category.value)"
      >
        <div class="text-center">
          <div
            :class="`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
              selectedCategory === category.value ? category.bgColor : 'bg-gray-100'
            }`"
          >
            <i
              :class="`${category.icon} ${
                selectedCategory === category.value ? category.iconColor : 'text-gray-500'
              }`"
            ></i>
          </div>
          <p
            :class="`text-sm font-medium ${
              selectedCategory === category.value ? 'text-blue-700' : 'text-gray-700'
            }`"
          >
            {{ category.label }}
          </p>
          <p class="text-xs text-gray-500 mt-1">{{ getCategoryCount(category.value) }} รายการ</p>
        </div>
      </div>
    </div>
  </div>
</template>
