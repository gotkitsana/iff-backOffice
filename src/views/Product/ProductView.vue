<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory, type ICategoryValue } from '@/stores/product/category'
import { useProductModals } from '@/composables/useProductModals'
import { useCategoryFields } from '@/composables/useCategoryFields'

import ProductHeader from '@/components/product/ProductHeader.vue'
import ProductStatsCards from '@/components/product/ProductStatsCards.vue'
import CategorySelectionStep from '@/components/product/add_product/CategorySelectionStep.vue'
import FishProductContent from '@/components/product/category/FishProduct.vue'
import FoodProductContent from '@/components/product/category/FoodProduct.vue'
import MicroorganismProductContent from '@/components/product/category/MicroorganismProduct.vue'

import ModalAddProduct from '@/components/product/modal/ModalAddProduct.vue'
import ModalExportProduct from '@/components/product/modal/ModalExportProduct.vue'
import ModalEditProduct from '@/components/product/modal/ModalEditProduct.vue'
import ModalProductDetail from '@/components/product/modal/ModalProductDetail.vue'
import ModalDeleteProduct from '@/components/product/modal/ModalDeleteProduct.vue'
import { useRoute, useRouter } from 'vue-router'

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

const selectedCategory = ref<ICategory | null>(null)
const showCategorySelector = ref(true)

const handleInitialCategorySelect = (category: ICategory) => {
  selectedCategory.value = category
  showCategorySelector.value = false
}

const updateCategorySelector = () => {
  showCategorySelector.value = true
  selectedCategory.value = null
  router.push({ query: { type: undefined } })
}

const router = useRouter()
const route = useRoute()
const selectedType = computed<ICategoryValue | null>(
  () => route.query.type as ICategoryValue | null
)

watch(
  [selectedType, categories],
  ([newType, newCategories]) => {
    if (newType && newCategories) {
      const foundCategory = newCategories.find((category) => category.value === newType)
      if (foundCategory) {
        selectedCategory.value = foundCategory
        showCategorySelector.value = false
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <ProductHeader title="ภาพรวมคลังสินค้า" description="" />
    <ProductStatsCards :selected-category="selectedCategory" />

    <div v-if="showCategorySelector">
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <h2 class="font-semibold! text-gray-900 mb-2">เลือกหมวดหมู่สินค้า</h2>

        <CategorySelectionStep
          :category-options="categoryOptionsUI"
          :selected-category="selectedCategory"
          @select-category="handleInitialCategorySelect"
          show-count
        />
      </div>
    </div>

    <template v-else>
      <FishProductContent
        v-if="(selectedCategory?.value === 'fish' || selectedType === 'fish') && selectedCategory"
        :selected-category="selectedCategory"
        @open-edit-modal="openEditModal"
        @open-detail-modal="openDetailModal"
        @open-delete-modal="openDeleteModal"
        @open-add-modal="openAddModal"
        @open-export-modal="openExportModal"
        @update-category-selector="updateCategorySelector"
      />

      <FoodProductContent
        v-if="(selectedCategory?.value === 'food' || selectedType === 'food') && selectedCategory"
        :selected-category="selectedCategory"
        @open-edit-modal="openEditModal"
        @open-detail-modal="openDetailModal"
        @open-delete-modal="openDeleteModal"
        @open-add-modal="openAddModal"
        @open-export-modal="openExportModal"
        @update-category-selector="updateCategorySelector"
      />

      <MicroorganismProductContent
        v-if="(selectedCategory?.value === 'microorganism' || selectedType === 'microorganism') && selectedCategory"
        :selected-category="selectedCategory"
        @open-edit-modal="openEditModal"
        @open-detail-modal="openDetailModal"
        @open-delete-modal="openDeleteModal"
        @open-add-modal="openAddModal"
        @open-export-modal="openExportModal"
        @update-category-selector="updateCategorySelector"
      />
    </template>
  </div>

  <!-- Modal Components -->
  <ModalAddProduct
    v-if="!showCategorySelector"
    v-model:visible="showAddModal"
    :categoryOptionsUI="categoryOptionsUI"
    :selectedCategory="selectedCategory"
  />

  <!-- Export Modal -->
  <ModalExportProduct v-if="!showCategorySelector" v-model:visible="showExportModal" />

  <ModalEditProduct
    v-if="!showCategorySelector"
    v-model:visible="showEditModal"
    :product-data="selectedProduct"
    :categoryOptionsUI="categoryOptionsUI"
    :selected-category="selectedCategory"
    @close-edit-modal="closeEditModal"
  />

  <ModalProductDetail
    v-model:visible="showDetailModal"
    :product-data="selectedProduct"
    :selected-category="selectedCategory"
    :categoryOptionsUI="categoryOptionsUI"
    @close-detail-modal="closeDetailModal"
  />

  <ModalDeleteProduct
    v-if="selectedProduct"
    v-model:visible="showDeleteModal"
    :product-data="selectedProduct"
    @close-delete-modal="closeDeleteModal"
  />
</template>
