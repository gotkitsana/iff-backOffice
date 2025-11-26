<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { useProductQuery } from '@/composables/useProductQuery'

import { useProductModals } from '@/composables/useProductModals'
import { useCategoryFields } from '@/composables/useCategoryFields'

import FoodProductContent from '@/components/product/category/food/FoodProduct.vue'
import MicroorganismProductContent from '@/components/product/category/microorganism/MicroorganismProduct.vue'

import FishStatsCards from '@/components/product/category/fish/FishStatsCards.vue'
import FoodStatsCards from '@/components/product/category/food/FoodStatsCards.vue'
import MicroorganismStatsCards from '@/components/product/category/microorganism/MicroorganismStatsCards.vue'

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

const { categoryFromQuery, saleTypeFromQuery, clearAllQuery } = useProductQuery()

const selectedCategory = ref<ICategory | null>(null)
const showCategorySelector = ref(true)

// Sync category จาก query string กับ local state
watch(
  [categoryFromQuery, categories],
  ([categoryValue, categoriesList]) => {
    if (categoryValue && categoriesList) {
      const found = categoriesList.find((c) => c.value === categoryValue)
      if (found) {
        selectedCategory.value = found
        showCategorySelector.value = false
      }
    } else {
      selectedCategory.value = null
      showCategorySelector.value = true
    }
  },
  { immediate: true }
)

// ฟังก์ชันเลือก category
// const handleCategorySelect = (category: ICategory, type: SaleFoodType) => {
//   selectedCategory.value = category
//   showCategorySelector.value = false
//   updateQuery({ category: category.value, saleType: type })
// }

// ฟังก์ชันกลับไปหน้าเลือก category
const updateCategorySelector = () => {
  showCategorySelector.value = true
  selectedCategory.value = null
  clearAllQuery() // ลบ query ทั้งหมด
}

const statsComponent = computed(() => {
  if (!selectedCategory.value) return null

  switch (selectedCategory.value.value) {
    case 'fish':
      return FishStatsCards
    case 'food':
      return FoodStatsCards
    case 'microorganism':
      return MicroorganismStatsCards
    default:
      return null
  }
})
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ภาพรวมคลังสินค้า</h1>
      </div>
    </div>
    <component :is="statsComponent" :selected-category="selectedCategory" />

    <FoodProductContent v-if="selectedCategory?.value === 'food'" :selected-category="selectedCategory"
      :sale-type="saleTypeFromQuery || 'wholesale'" @open-edit-modal="openEditModal"
      @open-detail-modal="openDetailModal" @open-delete-modal="openDeleteModal" @open-add-modal="openAddModal"
      @open-export-modal="openExportModal" @update-category-selector="updateCategorySelector" />

    <MicroorganismProductContent v-if="selectedCategory?.value === 'microorganism'"
      :selected-category="selectedCategory" @open-edit-modal="openEditModal" @open-detail-modal="openDetailModal"
      @open-delete-modal="openDeleteModal" @open-add-modal="openAddModal" @open-export-modal="openExportModal"
      @update-category-selector="updateCategorySelector" />
  </div>

  <!-- Modal Components -->
  <ModalAddProduct v-if="!showCategorySelector" v-model:visible="showAddModal" :categoryOptionsUI="categoryOptionsUI"
    :selectedCategory="selectedCategory" />

  <!-- Export Modal -->
  <ModalExportProduct v-if="!showCategorySelector" v-model:visible="showExportModal" />

  <ModalEditProduct v-if="!showCategorySelector" v-model:visible="showEditModal" :product-data="selectedProduct"
    :categoryOptionsUI="categoryOptionsUI" :selected-category="selectedCategory" @close-edit-modal="closeEditModal" />

  <ModalProductDetail v-if="selectedProduct" v-model:visible="showDetailModal" :product-data="selectedProduct"
    :selected-category="selectedCategory" :categoryOptionsUI="categoryOptionsUI"
    @close-detail-modal="closeDetailModal" />

  <ModalDeleteProduct v-if="selectedProduct" v-model:visible="showDeleteModal" :product-data="selectedProduct"
    @close-delete-modal="closeDeleteModal" />
</template>
