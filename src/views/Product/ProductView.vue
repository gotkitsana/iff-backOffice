<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useProductStore,
  type ICategoryOption,
  type IFields,
  type IFishFilters,
  type IFoodFilters,
  type IProduct,
} from '../../stores/product/product'
import { useQuery } from '@tanstack/vue-query'
import ModalAddProduct from '../../components/product/modal/ModalAddProduct.vue'
import ModalEditProduct from '../../components/product/modal/ModalEditProduct.vue'
import ModalProductDetail from '../../components/product/modal/ModalProductDetail.vue'
import ProductHeader from '../../components/product/ProductHeader.vue'
import ProductStatsCards from '../../components/product/ProductStatsCards.vue'
import CategoryFilter from '../../components/product/CategoryFilter.vue'
import ProductTable from '../../components/product/ProductTable.vue'
import { useCategoryStore, type ICategory } from '../../stores/product/category'
import ModalSearchProduct from '../../components/product/modal/ModalSearchProduct.vue'
import ModalExportProduct from '../../components/product/modal/ModalExportProduct.vue'
import ModalDeleteProduct from '../../components/product/modal/ModalDeleteProduct.vue'

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
const showDeleteModal = ref(false)

const foodFilters = ref<IFoodFilters>({
  sku: '',
  brandName: '',
  foodType: '',
  seedType: '',
  seedSize: null,
})

const fishFilters = ref<IFishFilters>({
  sku: '',
  species: '',
  age: '',
  farm: '',
  gender: '',
  size: null,
  price: null,
})

const selectedCategoryId = computed(() => selectedCategory.value?._id)
const { data: productsByCategory, isLoading: isLoadingProductsByCategory } = useQuery<IProduct[]>({
  queryKey: ['get_products_by_category', selectedCategoryId],
  queryFn: () => productStore.onGetProductsByCategory(selectedCategoryId.value as string),
  enabled: computed(() => !!selectedCategoryId.value),
})

const filteredProducts = computed(() => {
  if (!productsByCategory.value) return []

  let filtered = [...productsByCategory.value]

  // Apply food filters if category is food
  if (selectedCategory.value?.value === 'food') {
    if (foodFilters.value.sku) {
      filtered = filtered.filter((product) =>
        product.sku?.toLowerCase().includes(foodFilters.value.sku.toLowerCase())
      )
    }

    if (foodFilters.value.brandName) {
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(foodFilters.value.brandName.toLowerCase())
      )
    }

    if (foodFilters.value.foodType) {
      filtered = filtered.filter((product) =>
        product.foodType?.toLowerCase().includes(foodFilters.value.foodType.toLowerCase())
      )
    }

    if (foodFilters.value.seedType) {
      filtered = filtered.filter((product) => product.seedType === foodFilters.value.seedType)
    }

    if (foodFilters.value.seedSize !== null) {
      filtered = filtered.filter((product) => product.seedSize === foodFilters.value.seedSize)
    }
  }

  // Apply quality grade filter for fish
  if (selectedCategory.value?.value === 'fish') {
    if (fishFilters.value.sku) {
      filtered = filtered.filter((product) =>
        product.sku?.toLowerCase().includes(fishFilters.value.sku.toLowerCase())
      )
    }
    if (fishFilters.value.species) {
      filtered = filtered.filter((product) => product.species?._id === fishFilters.value.species)
    }
    if (fishFilters.value.age) {
      filtered = filtered.filter((product) => product.age?.includes(fishFilters.value.age))
    }
    if (fishFilters.value.farm) {
      filtered = filtered.filter((product) =>
        product.farm?._id === fishFilters.value.farm
      )
    }
    if (fishFilters.value.gender) {
      filtered = filtered.filter((product) => product.gender === fishFilters.value.gender)
    }

    if (fishFilters.value.size !== null) {
      filtered = filtered.filter((product) => product.size === fishFilters.value.size)
    }

    if (fishFilters.value.price !== null) {
      filtered = filtered.filter((product) => product.price >= fishFilters.value.price!)
    }
  }

  return filtered
})

const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})
const categoryOptionsUI = computed(() => {
  if (!categories.value) return []
  const fieldsData: { value: string; fields: IFields[] }[] = [
    {
      value: 'fish',
      fields: [
        { key: 'lotNumber', label: 'เลขล็อต', type: 'text', required: true },
        { key: 'greenhouse', label: 'กรีนเฮ้า', type: 'select', required: true },
        { key: 'fishpond', label: 'บ่อ', type: 'select', required: true },
        { key: 'sku', label: 'รหัสปลา', type: 'text', required: true },
        { key: 'species', label: 'สายพันธุ์', type: 'select', required: true },
        { key: 'breeders', label: 'แม่พันธุ์', type: 'text', required: true },
        { key: 'birth', label: 'วันเกิด', type: 'date', required: true },
        { key: 'age', label: 'อายุ (6 เดือนขึ้นไป)', type: 'select', required: true },
        { key: 'quality', label: 'คุณภาพปลา', type: 'number', required: true },
        { key: 'farm', label: 'ฟาร์ม', type: 'select', required: true },
        { key: 'size', label: 'ไซต์', type: 'number', required: true },
        { key: 'weight', label: 'น้ำหนัก', type: 'number', required: true },
        { key: 'gender', label: 'เพศ', type: 'select', required: true },
        { key: 'price', label: 'ราคา', type: 'number', required: true },
      ],
    },
    {
      value: 'food',
      fields: [
        { key: 'sku', label: 'รหัสอาหาร', type: 'text', required: true },
        { key: 'lotNumber', label: 'เลขล็อต', type: 'text', required: true },
        { key: 'name', label: 'ชื่อแบร์น', type: 'text', required: true },
        { key: 'foodType', label: 'ประเภทอาหาร', type: 'text', required: true },
        { key: 'seedType', label: 'ชนิดเม็ด', type: 'select', required: true },
        { key: 'seedSize', label: 'ขนาดเม็ด', type: 'select', required: true },
        { key: 'weight', label: 'น้ำหนัก ต่อกระสอบ (กก.)', type: 'number', required: true },
        { key: 'produceDate', label: 'วันที่ผลิต', type: 'date', required: true },
        { key: 'expireDate', label: 'วันหมดอายุ', type: 'date', required: true },

        { key: 'marketPrice', label: 'ราคาท้องตลาด', type: 'number', required: true },
        { key: 'costPrice', label: 'ราคาทุน', type: 'number', required: true },
        { key: 'customerPrice', label: 'ราคาลูกค้า', type: 'number', required: true },
        { key: 'dealerPrice', label: 'ราคาพ่อค้า', type: 'number', required: true },

        { key: 'balance', label: 'สินค้าคงเหลือ', type: 'number', required: true },
      ],
    },
  ]

  const categoryFields = categories.value?.map((category) => ({
    ...category,
    fields: fieldsData.find((field) => field.value === category.value)?.fields || [],
  }))

  return categoryFields as ICategoryOption[]
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

const openDeleteModal = (product: IProduct) => {
  selectedProduct.value = product
  showDeleteModal.value = true
}

const selectCategory = (category: ICategory) => {
  selectedCategory.value = category
  if (category.value === 'food') {
    foodFilters.value = {
      sku: '',
      brandName: '',
      foodType: '',
      seedType: '',
      seedSize: null,
    }
  } else if (category.value === 'fish') {
    fishFilters.value = {
      sku: '',
      species: '',
      age: '',
      farm: '',
      gender: '',
      size: null,
      price: null,
    }
  }
}

const updateFoodFilters = (filters: IFoodFilters) => {
  foodFilters.value = { ...filters }
}

const updateFishFilter = (filters: IFishFilters) => {
  fishFilters.value = { ...filters }
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
      :fish-filters="fishFilters"
      @select-category="selectCategory"
      @open-add-modal="openAddModal"

      @open-search-modal="openSearchModal"
      @open-export-modal="openExportModal"
      @update-food-filters="updateFoodFilters"
      @update-fish-filters="updateFishFilter"
    />

    <!-- Product Table -->
    <ProductTable
      v-if="selectedCategory"
      :filtered-products="filteredProducts || []"
      :is-loading-products="isLoadingProductsByCategory"
      :selected-category="selectedCategory"
      @open-detail-modal="openDetailModal"
      @open-edit-modal="openEditModal"
      @open-delete-modal="openDeleteModal"
    />
  </div>

  <!-- Modal Components -->
  <ModalAddProduct v-model:visible="showAddModal" :categoryOptionsUI="categoryOptionsUI" />

  <!-- Export Modal -->
  <ModalExportProduct v-model:visible="showExportModal" />

  <ModalEditProduct
    v-model:visible="showEditModal"
    :product-data="selectedProduct"
    :categoryOptionsUI="categoryOptionsUI"
    :selected-category="selectedCategory"
  />

  <ModalProductDetail
    v-model:visible="showDetailModal"
    :product-data="selectedProduct"
    :selected-category="selectedCategory"
    :categoryOptionsUI="categoryOptionsUI"
  />

  <ModalDeleteProduct
    v-if="selectedProduct"
    v-model:visible="showDeleteModal"
    :product-data="selectedProduct"
  />

  <!-- Search Modal -->
  <ModalSearchProduct
    v-model:visible="showSearchModal"
    :selected-category="selectedCategory"
    @select-category="selectCategory"
  />
</template>
