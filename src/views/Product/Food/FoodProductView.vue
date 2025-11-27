<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { useProductQuery } from '@/composables/useProductQuery'

import { useProductModals } from '@/composables/useProductModals'
import { useCategoryFields } from '@/composables/useCategoryFields'

import FoodProductContent from '@/components/product/category/food/FoodProduct.vue'
import FoodStatsCards from '@/components/product/category/food/FoodStatsCards.vue'

import ModalAddProduct from '@/components/product/modal/ModalAddProduct.vue'
import ModalExportProduct from '@/components/product/modal/ModalExportProduct.vue'
import ModalEditProduct from '@/components/product/modal/ModalEditProduct.vue'
import ModalProductDetail from '@/components/product/modal/ModalProductDetail.vue'
import ModalDeleteProduct from '@/components/product/modal/ModalDeleteProduct.vue'

// Router & Stores
const categoryStore = useCategoryStore()
const { data: categories } = useQuery({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

const { categoryOptionsUI } = useCategoryFields(categories)
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

const { saleTypeFromQuery } = useProductQuery()

const selectedCategory = ref<ICategory | null>(null)

// Sync category 'food'
watch(
  categories,
  (categoriesList) => {
    if (categoriesList) {
      const found = categoriesList.find((c) => c.value === 'food')
      if (found) {
        selectedCategory.value = found
      }
    }
  },
  { immediate: true }
)

const updateCategorySelector = () => {
  // No-op or handle navigation if needed, but for specific view it might not be needed
}
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ภาพรวมคลังสินค้า (อาหาร)</h1>
      </div>
    </div>
    <FoodStatsCards v-if="selectedCategory" :selected-category="selectedCategory" />

    <FoodProductContent v-if="selectedCategory" :selected-category="selectedCategory"
      :sale-type="saleTypeFromQuery || 'wholesale'" @open-edit-modal="openEditModal"
      @open-detail-modal="openDetailModal" @open-delete-modal="openDeleteModal" @open-add-modal="openAddModal"
      @open-export-modal="openExportModal" @update-category-selector="updateCategorySelector" />
  </div>

  <!-- Modal Components -->
  <ModalAddProduct v-if="selectedCategory" v-model:visible="showAddModal" :categoryOptionsUI="categoryOptionsUI"
    :selectedCategory="selectedCategory" />

  <!-- Export Modal -->
  <ModalExportProduct v-model:visible="showExportModal" />

  <ModalEditProduct v-if="selectedCategory" v-model:visible="showEditModal" :product-data="selectedProduct"
    :categoryOptionsUI="categoryOptionsUI" :selected-category="selectedCategory" @close-edit-modal="closeEditModal" />

  <ModalProductDetail v-if="selectedProduct" v-model:visible="showDetailModal" :product-data="selectedProduct"
    :selected-category="selectedCategory" :categoryOptionsUI="categoryOptionsUI"
    @close-detail-modal="closeDetailModal" />

  <ModalDeleteProduct v-if="selectedProduct" v-model:visible="showDeleteModal" :product-data="selectedProduct"
    @close-delete-modal="closeDeleteModal" />
</template>
