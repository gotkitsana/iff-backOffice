<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

import FoodFilter from '@/components/product/category/food/FoodFilter.vue'

import ModalAddProduct from '@/components/product/modal/ModalAddProduct.vue'
import ModalExportProduct from '@/components/product/modal/ModalExportProduct.vue'
import ModalEditProduct from '@/components/product/modal/ModalEditProduct.vue'
import ModalProductDetail from '@/components/product/modal/ModalProductDetail.vue'
import ModalDeleteProduct from '@/components/product/modal/ModalDeleteProduct.vue'

import { useProductStore, type IFoodFilters, type IProduct } from '@/stores/product/product'
import {
  useFishGrowthHistoryStore,
  type IFishGrowthHistory,
} from '@/stores/fish/fish_growth_history'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { useCategoryFields } from '@/composables/useCategoryFields'
import { useProductFilters } from '@/composables/useProductFilters'
import { useProductModals } from '@/composables/useProductModals'

const route = useRoute()
const router = useRouter()

const productStore = useProductStore()
const fishGrowthHistoryStore = useFishGrowthHistoryStore()
const categoryStore = useCategoryStore()

const { data: categories } = useQuery({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

const { categoryOptionsUI } = useCategoryFields(categories)
const { foodFilters, applyFoodFilters } = useProductFilters()
const {
  showAddModal,
  showEditModal,
  showDetailModal,
  showDeleteModal,
  showExportModal,
  selectedProduct,
  openAddModal,
  openEditModal,
  openDetailModal,
  openDeleteModal,
  openExportModal,
  closeEditModal,
  closeDetailModal,
  closeDeleteModal,
} = useProductModals()

const selectedCategory = ref<ICategory | null>(null)
const selectedRows = ref<IProduct[]>([])

const ensureFoodCategoryQuery = () => {
  if (route.query.category !== 'food') {
    router.replace({
      query: { ...route.query, category: 'food' },
    })
  }
}

ensureFoodCategoryQuery()

watch(
  categories,
  (categoryList) => {
    if (categoryList && categoryList.length > 0) {
      const fishCategory = categoryList.find((cat) => cat.value === 'fish') || null
      selectedCategory.value = fishCategory
    }
  },
  { immediate: true }
)

const selectedCategoryId = computed(() => selectedCategory.value?._id)

const { data: products, isLoading } = useQuery<IProduct[]>({
  queryKey: ['get_products_by_category', selectedCategoryId],
  queryFn: () => productStore.onGetProductsByCategory(selectedCategoryId.value!),
  enabled: computed(() => !!selectedCategoryId.value),
})

const { data: growthHistoryData } = useQuery<IFishGrowthHistory[]>({
  queryKey: ['get_all_fish_growth_history'],
  queryFn: () => fishGrowthHistoryStore.onGetAllFishGrowthHistory(),
})

const processedProducts = computed(() => {
  if (!products.value) return []
  return products.value.map((product: IProduct) => {
    if (
      growthHistoryData.value &&
      Array.isArray(growthHistoryData.value) &&
      growthHistoryData.value.length > 0
    ) {
      const productHistory = growthHistoryData.value.filter(
        (history) => history.product === product._id
      )
      if (productHistory.length > 0) {
        const sortedHistory = [...productHistory].sort((a, b) => b.date - a.date)
        const latest = sortedHistory[0]
        return {
          ...product,
          size: latest.size ?? product.size,
          weight: latest.weight ?? product.weight,
          gender: latest.gender ?? product.gender,
          price: latest.price ?? product.price,
        }
      }
    }
    return product
  })
})

const filteredProducts = computed(() => {
  if (!products.value) return []
  return applyFoodFilters(processedProducts.value)
})

const handleUpdateFoodFilters = (filters: IFoodFilters) => {
  foodFilters.value = filters
}



const handleSelectionUpdate = (rows: IProduct[]) => {
  selectedRows.value = rows
}

const syncFiltersFromRoute = () => {
  const nextFilters: IFoodFilters = { ...foodFilters.value }
  const stringKeys: Array<keyof IFoodFilters> = [
    'sku',
    'lotNumber',
    'brandName',
    'foodtype',
    'seedType',
    'seedSize',
  ]

  stringKeys.forEach((key) => {
    const rawValue = route.query[key as string]
    if (typeof rawValue === 'string') {
      nextFilters[key] = rawValue as never
    }
  })

  if (typeof route.query.priceMin === 'string') {
    nextFilters.priceMin = Number(route.query.priceMin) || 0
  }
  if (typeof route.query.priceMax === 'string') {
    nextFilters.priceMax = Number(route.query.priceMax) || nextFilters.priceMax
  }

  foodFilters.value = nextFilters
}

watch(
  () => route.query,
  () => {
    syncFiltersFromRoute()
    ensureFoodCategoryQuery()
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-4">
    <FoodStatsCards :selected-category="selectedCategory" />

    <FoodFilter v-if="selectedCategory" :category="selectedCategory" :filters="foodFilters"
      @open-add-modal="openAddModal" @open-export-modal="openExportModal" @update-filters="handleUpdateFoodFilters" />

    <FoodProductTable v-if="selectedCategory" :filtered-products="filteredProducts" :is-loading-products="isLoading"
      :selected-category="selectedCategory" selectable @open-edit-modal="openEditModal"
      @open-detail-modal="openDetailModal" @open-delete-modal="openDeleteModal"
      @update-selection="handleSelectionUpdate" />
  </div>

  <ModalAddProduct v-if="selectedCategory" v-model:visible="showAddModal" :categoryOptionsUI="categoryOptionsUI"
    :selectedCategory="selectedCategory" />

  <ModalExportProduct v-model:visible="showExportModal" />

  <ModalEditProduct v-if="selectedCategory" v-model:visible="showEditModal" :product-data="selectedProduct"
    :categoryOptionsUI="categoryOptionsUI" :selected-category="selectedCategory" @close-edit-modal="closeEditModal" />

  <ModalProductDetail v-if="selectedProduct && selectedCategory" v-model:visible="showDetailModal"
    :product-data="selectedProduct" :selected-category="selectedCategory" :categoryOptionsUI="categoryOptionsUI"
    @close-detail-modal="closeDetailModal" />

  <ModalDeleteProduct v-if="selectedProduct" v-model:visible="showDeleteModal" :product-data="selectedProduct"
    @close-delete-modal="closeDeleteModal" />
</template>
