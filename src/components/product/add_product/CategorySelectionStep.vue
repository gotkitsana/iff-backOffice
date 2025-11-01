<script setup lang="ts">
import type { ICategory } from '@/stores/product/category';
import { useProductStore, type ICategoryOption, type IProduct } from '@/stores/product/product';
import { Card } from 'primevue'
import { orderBy } from 'lodash-es'
import { useQuery } from '@tanstack/vue-query';

defineProps<{
  categoryOptions: ICategoryOption[]
  selectedCategory: ICategory | null
  showCount?: boolean
}>()

defineEmits<{
  'select-category': [value: ICategory]
}>()

const productStore = useProductStore()
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['products'],
  queryFn: () => productStore.onGetProducts(),
})

const getCategoryCount = (categoryId: string) => {
  if (!products.value) return 0
  return products.value.filter((product) => product?.category?._id === categoryId).length
}
</script>

<template>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <Card
        v-for="category in orderBy(categoryOptions, 'cat')"
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
                :class="`${category.icon} text-lg ${
                  selectedCategory?._id === category._id ? 'text-blue-700' : 'text-gray-500'
                }`"
              ></i>
            </div>
            <h3
              :class="`font-[500]! text-sm ${
                selectedCategory?._id === category._id ? 'text-blue-700' : 'text-gray-700'
              }`"
            >
              {{ category.name }}
            </h3>
            <p v-if="showCount" class="text-xs text-gray-600">({{ getCategoryCount(category._id) }} รายการ)</p>
          </div>
        </template>
      </Card>
    </div>
</template>

