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



const processedProducts = computed(() => {
  if (!products.value) return []
  return products.value.map((product: any) => {
    if (product.growth_history && Array.isArray(product.growth_history) && product.growth_history.length > 0) {
      // Sort by date descending to get the latest record
      const sortedHistory = [...product.growth_history].sort((a: any, b: any) => b.date - a.date)
      const latest = sortedHistory[0]
      return {
        ...product,
        size: latest.size ?? product.size,
        weight: latest.weight ?? product.weight,
        gender: latest.gender ?? product.gender,
        price: latest.price ?? product.price
      }
    }
    return product
  })
})

const filteredProducts = computed(() => {
  return applyFishFilters(processedProducts.value)
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
