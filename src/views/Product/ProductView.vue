<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore, type IFoodFilters, type IProduct } from '../../stores/product/product'
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
const showSearchModal = ref(false)
const showExportModal = ref(false)

const foodFilters = ref<IFoodFilters>({
  sku: '',
  brandName: '',
  foodType: '',
  seedType: '',
  seedSize: null,
})

const { data: productsByCategory, isLoading: isLoadingProductsByCategory } = useQuery<IProduct[]>({
  queryKey: ['get_products_by_category', selectedCategory],
  queryFn: () => productStore.onGetProductsByCategory(selectedCategory.value?._id as string),
  enabled: computed(() => !!selectedCategory.value?._id),
})

const filteredProducts = computed(() => {
  if (!productsByCategory.value) return []

  let filtered = [...productsByCategory.value]

  // Apply food filters if category is food
  if (selectedCategory.value?.value === 'food') {
    if (foodFilters.value.sku) {
      filtered = filtered.filter(product =>
        product.sku?.toLowerCase().includes(foodFilters.value.sku.toLowerCase())
      )
    }

    if (foodFilters.value.brandName) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(foodFilters.value.brandName.toLowerCase())
      )
    }

    if (foodFilters.value.foodType) {
      filtered = filtered.filter(product =>
        product.foodType?.toLowerCase().includes(foodFilters.value.foodType.toLowerCase())
      )
    }

    if (foodFilters.value.seedType) {
      filtered = filtered.filter(product =>
        product.seedType === foodFilters.value.seedType
      )
    }

    if (foodFilters.value.seedSize !== null) {
      filtered = filtered.filter(product =>
        product.seedSize === foodFilters.value.seedSize
      )
    }
  }

  // Apply quality grade filter for fish
  if (selectedCategory.value?.value === 'fish') {

  }

  return filtered
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
  foodFilters.value = {
    sku: '',
    brandName: '',
    foodType: '',
    seedType: '',
    seedSize: null,
  }
}

const updateFoodFilters = (filters: IFoodFilters) => {
  foodFilters.value = { ...filters }
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
      :products-category="filteredProducts"
      :food-filters="foodFilters"
      @select-category="selectCategory"
      @open-add-modal="openAddModal"
      @on-pond-settings="onPondSettings"
      @open-search-modal="openSearchModal"
      @open-export-modal="openExportModal"
      @update-food-filters="updateFoodFilters"
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
