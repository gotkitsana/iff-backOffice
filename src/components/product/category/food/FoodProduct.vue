<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useProductFilters } from '@/composables/useProductFilters'
import FoodFilter from '@/components/product/category/food/FoodFilter.vue'
import ProductTable from '@/components/product/UI/ProductTable.vue'
import type { ICategory } from '@/stores/product/category'
import type { SaleFoodType } from '@/types/query'
import FoodRetail from '../food-retail/FoodRetail.vue'

const props = defineProps<{
  selectedCategory: ICategory
  saleType: SaleFoodType
}>()

const emit = defineEmits<{
  'open-add-modal': []
  'open-export-modal': []
  'update-category-selector': []
  'open-edit-modal': [product: IProduct]
  'open-detail-modal': [product: IProduct]
  'open-delete-modal': [product: IProduct]
}>()

const productStore = useProductStore()
const { foodFilters, applyFoodFilters } = useProductFilters()

const { data: products, isLoading } = useQuery({
  queryKey: ['get_products_by_category', props.selectedCategory?._id],
  queryFn: () => productStore.onGetProductsByCategory(props.selectedCategory?._id),
  enabled: computed(() => !!props.selectedCategory?._id),
})

const filteredProducts = computed(() => {
  if (!products.value) return []
  return applyFoodFilters(products.value)
})
</script>

<template>
  <div v-if="saleType === 'wholesale'" class="space-y-4">
    <FoodFilter :category="selectedCategory" :filters="foodFilters" @open-add-modal="emit('open-add-modal')"
      @open-export-modal="emit('open-export-modal')" @update-filters="(filters) => (foodFilters = filters)" />

    <ProductTable :filtered-products="filteredProducts" :is-loading-products="isLoading"
      :selected-category="selectedCategory" @open-edit-modal="emit('open-edit-modal', $event)"
      @open-detail-modal="emit('open-detail-modal', $event)" @open-delete-modal="emit('open-delete-modal', $event)" />
  </div>

  <FoodRetail v-else-if="saleType === 'retail'" :selected-category="selectedCategory"
    @update-category-selector="emit('update-category-selector')" />
</template>
