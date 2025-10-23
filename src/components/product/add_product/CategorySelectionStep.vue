<script setup lang="ts">
import type { ICategory } from '@/stores/product/category';
import type { ICategoryOption } from '@/stores/product/product';
import { Card } from 'primevue'

defineProps<{
  categoryOptions: ICategoryOption[]
  selectedCategory: ICategory | null
}>()

defineEmits<{
  'select-category': [value: ICategory]
}>()
</script>

<template>
  <div>
    <div class="mb-3">
      <h2 class="text-xl font-semibold! text-gray-800 mb-1">1. เลือกหมวดหมู่</h2>
      <p class="text-gray-600">เลือกหมวดหมู่สินค้าที่ต้องการเพิ่ม</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <Card
        v-for="category in categoryOptions"
        :key="category._id"
        :pt="{ body: 'p-2.5' }"
        :class="`cursor-pointer transition-all duration-200 border ${
          selectedCategory?._id === category._id
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 hover:border-blue-200'
        }`"
        @click="$emit('select-category', category)"
      >
        <template #content>
          <div class="text-center">
            <div
              :class="`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                selectedCategory?._id === category._id ? 'bg-blue-100' : 'bg-gray-100'
              }`"
            >
              <i
                :class="`${category.icon} text-xl ${
                  selectedCategory?._id === category._id ? 'text-blue-700' : 'text-gray-500'
                }`"
              ></i>
            </div>
            <h3
              :class="`font-[500]! text-base ${
                selectedCategory?._id === category._id ? 'text-blue-700' : 'text-gray-700'
              }`"
            >
              {{ category.name }}
            </h3>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

