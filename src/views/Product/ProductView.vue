<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useProductStore,
  type ICategoryOption,
  type IFields,
  type IFishFilters,
  type IFoodFilters,
  type IMicroorganismFilters,
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
import ModalExportProduct from '../../components/product/modal/ModalExportProduct.vue'
import ModalDeleteProduct from '../../components/product/modal/ModalDeleteProduct.vue'
import CategorySelectionStep from '../../components/product/add_product/CategorySelectionStep.vue'

// Router & Stores
const productStore = useProductStore()

// Data
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const selectedProduct = ref<IProduct | null>(null)
const selectedCategory = ref<ICategory | null>(null)
const showExportModal = ref(false)
const showDeleteModal = ref(false)

const foodFilters = ref<IFoodFilters>({
  sku: '',
  brandName: '',
  foodtype: '',
  seedType: '',
  seedSize: '',
})

const microorganismFilters = ref<IMicroorganismFilters>({
  sku: '',
  brandName: '',
})

const fishFilters = ref<IFishFilters>({
  sku: '',
  species: '',
  age: '',
  farm: '',
  gender: '',
  size: null,
  price: null,
  priceMin: 0,
  priceMax: 500000,
  sizeMin: 0,
  sizeMax: 200,
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
        product.brand?._id === foodFilters.value.brandName
      )
    }

    if (foodFilters.value.foodtype) {
      filtered = filtered.filter((product) =>
        product.foodtype?._id === foodFilters.value.foodtype
      )
    }

    if (foodFilters.value.seedType) {
      filtered = filtered.filter((product) => product.seedType === foodFilters.value.seedType)
    }

    if (foodFilters.value.seedSize) {
      filtered = filtered.filter((product) => product.seedSize?._id === foodFilters.value.seedSize)
    }
  }

  // Apply microorganism filters if category is microorganism
  if (selectedCategory.value?.value === 'microorganism') {
    if (microorganismFilters.value.sku) {
      filtered = filtered.filter((product) =>
        product.sku?.toLowerCase().includes(microorganismFilters.value.sku.toLowerCase())
      )
    }

    if (microorganismFilters.value.brandName) {
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(microorganismFilters.value.brandName.toLowerCase())
      )
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
      filtered = filtered.filter((product) => product.farm?._id === fishFilters.value.farm)
    }
    if (fishFilters.value.gender) {
      filtered = filtered.filter((product) => product.gender === fishFilters.value.gender)
    }

    if (fishFilters.value.sizeMin && fishFilters.value.sizeMax) {
      filtered = filtered.filter((product) => product?.size && product.size >= fishFilters.value.sizeMin && product.size <= fishFilters.value.sizeMax)
    }

    if (fishFilters.value.priceMin && fishFilters.value.priceMax) {
      filtered = filtered.filter((product) => product.price >= fishFilters.value.priceMin && product.price <= fishFilters.value.priceMax)
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
        { key: 'lotNumber', label: 'เลขล็อต', type: 'select', required: true },
        { key: 'greenhouse', label: 'กรีนเฮ้า', type: 'select', required: true },
        { key: 'fishpond', label: 'บ่อ', type: 'select', required: true },
        { key: 'sku', label: 'รหัสปลา', type: 'text', required: true },
        { key: 'species', label: 'สายพันธุ์', type: 'select', required: true },
        { key: 'breeders', label: 'แม่พันธุ์', type: 'text', required: true },
        { key: 'birth', label: 'วันเกิด', type: 'date', required: true },
        { key: 'age', label: 'อายุ (6 เดือนขึ้นไป)', type: 'select', required: true },
        { key: 'quality', label: 'คุณภาพปลา', type: 'select', required: true },
        { key: 'farm', label: 'ฟาร์ม', type: 'select', required: true },
        { key: 'size', label: 'ไซต์', type: 'number', required: true },
        { key: 'weight', label: 'น้ำหนัก (กรัม)', type: 'number', required: true },
        { key: 'gender', label: 'เพศ', type: 'select', required: true },
        { key: 'price', label: 'ราคา', type: 'number', required: true },
      ],
    },
    {
      value: 'food',
      fields: [
        { key: 'sku', label: 'รหัสอาหาร', type: 'text', required: true },
        { key: 'lotNumber', label: 'เลขล็อต', type: 'select', required: true },
        { key: 'brand', label: 'ชื่อแบรนด์', type: 'select', required: true },
        { key: 'foodtype', label: 'ประเภทอาหาร', type: 'select', required: true },
        { key: 'seedType', label: 'ชนิดเม็ด', type: 'select', required: true },
        { key: 'seedSize', label: 'ขนาดเม็ด', type: 'select', required: true },
        { key: 'weight', label: 'น้ำหนัก ต่อกระสอบ (กรัม)', type: 'number', required: true },
        { key: 'produceDate', label: 'วันที่ผลิต', type: 'date', required: true },
        { key: 'expireDate', label: 'วันหมดอายุ', type: 'date', required: true },
        { key: 'marketPrice', label: 'ราคาท้องตลาด', type: 'number', required: true },
        { key: 'costPrice', label: 'ราคาทุน', type: 'number', required: true },
        { key: 'customerPrice', label: 'ราคาลูกค้า', type: 'number', required: true },
        { key: 'dealerPrice', label: 'ราคาพ่อค้า', type: 'number', required: true },
        { key: 'balance', label: 'สินค้าคงเหลือ', type: 'number', required: true },
      ],
    },
    {
      value: 'microorganism',
      fields: [
        { key: 'sku', label: 'รหัสสารปรับสภาพน้ำ', type: 'text', required: true },
        { key: 'lotNumber', label: 'เลขล็อต', type: 'select', required: true },
        { key: 'brand', label: 'ชื่อแบรนด์', type: 'select', required: true },
        { key: 'weight', label: 'น้ำหนัก (กรัม)', type: 'number', required: true },
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

const openExportModal = () => {
  showExportModal.value = true
}

const openEditModal = (product: IProduct) => {
  selectedProduct.value = product
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedProduct.value = null
}

const openDetailModal = (product: IProduct) => {
  selectedProduct.value = product
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedProduct.value = null
}

const openDeleteModal = (product: IProduct) => {
  selectedProduct.value = product
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedProduct.value = null
}

const updateFoodFilters = (filters: IFoodFilters) => {
  foodFilters.value = { ...filters }
}

const updateFishFilter = (filters: IFishFilters) => {
  fishFilters.value = { ...filters }
}

const updateMicroorganismFilter = (filters: IMicroorganismFilters) => {
  microorganismFilters.value = { ...filters }
}

const showCategorySelector = ref(true)

const handleInitialCategorySelect = (category: ICategory) => {
  selectedCategory.value = category
  showCategorySelector.value = false
}

const updateCategorySelector = () => {
  showCategorySelector.value = true
  selectedCategory.value = null
}
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <ProductHeader title="ภาพรวมคลังสินค้า" description="" />

    <!-- Product Stats -->
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

    <div v-else class="space-y-4">
      <CategoryFilter
        :selected-category="selectedCategory"
        :products-category="filteredProducts"
        :food-filters="foodFilters"
        :fish-filters="fishFilters"
        :microorganism-filters="microorganismFilters"
        @open-add-modal="openAddModal"
        @open-export-modal="openExportModal"
        @update-food-filters="updateFoodFilters"
        @update-fish-filters="updateFishFilter"
        @update-microorganism-filters="updateMicroorganismFilter"
        @update-category-selector="updateCategorySelector"
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
  </div>

  <!-- Modal Components -->
  <ModalAddProduct
    v-if="!showCategorySelector"
    v-model:visible="showAddModal"
    :categoryOptionsUI="categoryOptionsUI"
    :selectedCategory="selectedCategory"
  />

  <!-- Export Modal -->
  <ModalExportProduct
    v-if="!showCategorySelector"
    v-model:visible="showExportModal" />

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
