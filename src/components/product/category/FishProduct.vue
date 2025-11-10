<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useProductFilters } from '@/composables/useProductFilters'
import CategoryFilter from '@/components/product/CategoryFilter.vue'
import ProductTable from '@/components/product/ProductTable.vue'
import type { ICategory } from '@/stores/product/category'

const props = defineProps<{
  selectedCategory: ICategory
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
const { fishFilters, applyFishFilters } = useProductFilters()

const { data: products, isLoading } = useQuery({
  queryKey: ['get_products_by_category', props.selectedCategory?._id],
  queryFn: () => productStore.onGetProductsByCategory(props.selectedCategory?._id),
  enabled: computed(() => !!props.selectedCategory?._id),
})

const filteredProducts = computed(() => {
  if (!products.value) return []
  return applyFishFilters(products.value)
})


</script>

<template>
  <div class="space-y-4">
    <CategoryFilter
      :selected-category="selectedCategory"
      :products-category="filteredProducts"
      :fish-filters="fishFilters"
      @open-add-modal="emit('open-add-modal')"
      @open-export-modal="emit('open-export-modal')"
      @update-fish-filters="(filters) => (fishFilters = filters)"
      @update-category-selector="emit('update-category-selector')"
    />

    <ProductTable
      :filtered-products="filteredProducts"
      :is-loading-products="isLoading"
      :selected-category="selectedCategory"
      @open-edit-modal="emit('open-edit-modal', $event)"
      @open-detail-modal="emit('open-detail-modal', $event)"
      @open-delete-modal="emit('open-delete-modal', $event)"
    />
  </div>
</template>
