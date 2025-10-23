<script setup lang="ts">
import { Card } from 'primevue'
defineProps<{
  categoryOptions: any[]
  selectedCategory: string | null
}>()

defineEmits<{
  'select-category': [value: string]
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
        :key="category.value"
        :pt="{ body: 'p-2.5' }"
        :class="`cursor-pointer transition-all duration-200 border ${
          selectedCategory === category.value
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 hover:border-blue-200'
        }`"
        @click="$emit('select-category', category.value)"
      >
        <template #content>
          <div class="text-center">
            <div
              :class="`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                selectedCategory === category.value ? 'bg-blue-100' : 'bg-gray-100'
              }`"
            >
              <i
                :class="`${category.icon} text-xl ${
                  selectedCategory === category.value ? 'text-blue-700' : 'text-gray-500'
                }`"
              ></i>
            </div>
            <h3
              :class="`font-[500]! text-base ${
                selectedCategory === category.value ? 'text-blue-700' : 'text-gray-700'
              }`"
            >
              {{ category.label }}
            </h3>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

