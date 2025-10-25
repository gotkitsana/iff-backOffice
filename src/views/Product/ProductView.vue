<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore, type IProduct } from '../../stores/product/product'
import { useQuery } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import ModalAddProduct from '../../components/product/modal/ModalAddProduct.vue'
import ModalEditProduct from '../../components/product/modal/ModalEditProduct.vue'
import ModalProductDetail from '../../components/product/modal/ModalProductDetail.vue'
import ProductHeader from '../../components/product/ProductHeader.vue'
import ProductStatsCards from '../../components/product/ProductStatsCards.vue'
import CategoryFilter from '../../components/product/CategoryFilter.vue'
import ProductTable from '../../components/product/ProductTable.vue'
import type { ICategory } from '../../stores/product/category'
import ModalSearchProduct from '../../components/product/modal/ModalSearchProduct.vue'
import ModalExportProduct from '../../components/product/modal/ModalExportProduct.vue'

// Router & Stores
const router = useRouter()
const productStore = useProductStore()

// Data
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const selectedProduct = ref<IProduct | null>(null)
const selectedCategory = ref<ICategory | null>(null)
const selectedQualityGrade = ref<string | null>(null)
const showSearchModal = ref(false)
const showExportModal = ref(false)

const { data: productsByCategory, isLoading: isLoadingProductsByCategory } = useQuery<IProduct[]>({
  queryKey: ['get_products_by_category', selectedCategory],
  queryFn: () => productStore.onGetProductsByCategory(selectedCategory.value?._id as string),
  enabled: computed(() => !!selectedCategory.value?._id),
})

// Handlers
const openAddModal = () => {
  showAddModal.value = true
}

const openSearchModal = () => {
  showSearchModal.value = true
}

const openExportModal = () => {
  showExportModal.value = true
}

const openEditModal = (product: IProduct) => {
  selectedProduct.value = product
  showEditModal.value = true
}

const openDetailModal = (product: IProduct) => {
  selectedProduct.value = product
  showDetailModal.value = true
}

const handleProductUpdated = () => {
  showEditModal.value = false
  toast.success('อัปเดตสินค้าสำเร็จ')
}

const handleProductDeleted = () => {
  toast.success('ลบสินค้าสำเร็จ')
}

const selectCategory = (category: ICategory) => {
  selectedCategory.value = category
}

const selectQualityGrade = (grade: string) => {
  selectedQualityGrade.value = grade
}

const onPondSettings = () => {
  router.push('/product/pond-settings')
}
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <ProductHeader title="จัดการสินค้า" description="จัดการสินค้าสำหรับขายและประมูล" />

    <!-- Product Stats -->
    <ProductStatsCards />

    <!-- Category Filter -->
    <CategoryFilter
      :selected-category="selectedCategory"
      :selected-quality-grade="selectedQualityGrade"
      :products-category="productsByCategory || []"
      @select-category="selectCategory"
      @select-quality-grade="selectQualityGrade"
      @open-add-modal="openAddModal"
      @on-pond-settings="onPondSettings"
      @open-search-modal="openSearchModal"
      @open-export-modal="openExportModal"
    />

    <!-- Product Table -->
    <ProductTable
      v-if="selectedCategory"
      :filtered-products="productsByCategory || []"
      :is-loading-products="isLoadingProductsByCategory"
      :selected-category="selectedCategory"
      @open-detail-modal="openDetailModal"
      @open-edit-modal="openEditModal"
    />
  </div>

  <!-- Modal Components -->
  <ModalAddProduct v-model:visible="showAddModal" />

   <!-- Export Modal -->
  <ModalExportProduct v-model:visible="showExportModal" />

  <ModalEditProduct
    v-model:visible="showEditModal"
    :product-data="selectedProduct"
    @product-updated="handleProductUpdated"
  />

  <ModalProductDetail
    v-model:visible="showDetailModal"
    :product-data="selectedProduct"
    @edit-product="openEditModal"
    @product-deleted="handleProductDeleted"
  />

  <!-- Search Modal -->
  <ModalSearchProduct
    v-model:visible="showSearchModal"
    :selected-category="selectedCategory"
    @select-category="selectCategory"
  />
</template>
