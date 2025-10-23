<script setup lang="ts">
import { ref, computed } from 'vue'
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
import type { ISalesProduct } from '../../types/sales'

// Stores
const productStore = useProductStore()

// Data
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const selectedProduct = ref<IProduct | null>(null)

// Queries
const {
  data: products,
  isLoading: isLoadingProducts,
  refetch: refetchProducts,
} = useQuery<IProduct[]>({
  queryKey: ['products'],
  queryFn: () => productStore.onGetProducts(),
})

// Computed - removed unused computed properties

// Utility functions - moved to components

// Handlers
const openAddModal = () => {
  showAddModal.value = true
}

const openEditModal = (product: IProduct) => {
  selectedProduct.value = product
  showEditModal.value = true
}

const openDetailModal = (product: IProduct) => {
  selectedProduct.value = product
  showDetailModal.value = true
}

const handleProductAdded = () => {
  refetchProducts()
  showAddModal.value = false
  toast.success('เพิ่มสินค้าสำเร็จ')
}

const handleProductUpdated = () => {
  refetchProducts()
  showEditModal.value = false
  toast.success('อัปเดตสินค้าสำเร็จ')
}

const handleProductDeleted = () => {
  refetchProducts()
  toast.success('ลบสินค้าสำเร็จ')
}

const selectedCategory = ref<string | null>(null)

// Category options with icons and colors
const categoryOptions = computed<
  {
    value: ISalesProduct
    label: string
    icon: string
    color: string
    bgColor: string
    iconColor: string
  }[]
>(() => [
  {
    value: 'fish',
    label: 'ปลา',
    icon: 'pi pi-star',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    value: 'food',
    label: 'อาหาร',
    icon: 'pi pi-heart',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    value: 'microorganism',
    label: 'สารปรับสภาพน้ำ',
    icon: 'pi pi-sparkles',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    value: 'equipment',
    label: 'อุปกรณ์',
    icon: 'pi pi-wrench',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    value: 'medicine',
    label: 'เวชภัณฑ์',
    icon: 'pi pi-plus-circle',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    value: 'construction',
    label: 'คอนสทรัคชั่น',
    icon: 'pi pi-building',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
  {
    value: 'service',
    label: 'บริการ',
    icon: 'pi pi-cog',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
])

// Filter products based on selected category
const filteredProducts = computed(() => {
  if (!products.value) return []

  return products.value.filter((product) => {
    return product.category === selectedCategory.value
  })
})

// Helper functions
const selectCategory = (category: string) => {
  selectedCategory.value = category
}

const getCategoryCount = (category: string) => {
  if (!products.value) return 0
  if (category === 'all') return products.value.length
  return products.value.filter((product) => product.category === category).length
}

const getSelectedCategoryLabel = () => {
  if (selectedCategory.value === 'all') return 'สินค้าทั้งหมด'
  const category = categoryOptions.value.find((c) => c.value === selectedCategory.value)
  return category?.label || 'สินค้า'
}

const getSelectedCategoryInfo = () => {
  if (selectedCategory.value === 'all') return null
  return categoryOptions.value.find((c) => c.value === selectedCategory.value) || null
}

// Category type checks - moved to ProductTable component

// Product counts - moved to ProductStatsCards component
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <ProductHeader
      title="จัดการสินค้า"
      description="จัดการสินค้าสำหรับขายและประมูล"
    />

    <!-- Product Stats -->
    <ProductStatsCards :filtered-products="filteredProducts" />

    <!-- Category Filter -->
    <CategoryFilter
      :selected-category="selectedCategory"
      :category-options="categoryOptions"
      :get-category-count="getCategoryCount"
      @select-category="selectCategory"
      @open-add-modal="openAddModal"
    />

    <!-- Product Table -->
    <ProductTable
      v-if="selectedCategory"
      :filtered-products="filteredProducts"
      :is-loading-products="isLoadingProducts"
      :selected-category="selectedCategory"
      :get-selected-category-label="getSelectedCategoryLabel"
      :get-selected-category-info="getSelectedCategoryInfo"
      @open-detail-modal="openDetailModal"
      @open-edit-modal="openEditModal"
    />
  </div>

  <!-- Modal Components -->
  <ModalAddProduct v-model:visible="showAddModal" @product-added="handleProductAdded" />

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
</template>
