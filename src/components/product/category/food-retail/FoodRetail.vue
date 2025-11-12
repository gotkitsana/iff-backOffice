<script setup lang="ts">
import type { ICategory } from '@/stores/product/category'
import FoodRetailFilter from './FoodRetailFilter.vue'
import { computed, ref } from 'vue'
import ModalRetailAddProduct from '@/components/product/modal/retail/ModalRetailAddProduct.vue'
import ModalRetailDeleteProduct from '@/components/product/modal/retail/ModalRetailDeleteProduct.vue'
import ModalRetailDetailProduct from '@/components/product/modal/retail/ModalRetailDetailProduct.vue'
import ModalRetailEditProduct from '@/components/product/modal/retail/ModalRetailEditProduct.vue'
import RetailTable from './RetailTable.vue'
import { useFoodSaleStore, type IFieldsRetailUI, type IFoodSale } from '@/stores/product/food_sale'
import { useQuery } from '@tanstack/vue-query'
import { useProductFilters } from '@/composables/useProductFilters'

const props = defineProps<{
  selectedCategory: ICategory
}>()

const emit = defineEmits<{
  'update-category-selector': []
}>()

const showAddModal = ref(false)
const showExportModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const showEditModal = ref(false)

const selectedFoodSale = ref<IFoodSale | null>(null)

const openShowDetailModal = (foodSale: IFoodSale) => {
  selectedFoodSale.value = foodSale
  showDetailModal.value = true
}

const openShowDeleteModal = (foodSale: IFoodSale) => {
  selectedFoodSale.value = foodSale
  showDeleteModal.value = true
}

const openShowEditModal = (foodSale: IFoodSale) => {
  selectedFoodSale.value = foodSale
  showEditModal.value = true
}

const closeShowDetailModal = () => {
  showDetailModal.value = false
  selectedFoodSale.value = null
}

const closeShowEditModal = () => {
  showEditModal.value = false
  selectedFoodSale.value = null
}

const closeShowDeleteModal = () => {
  showDeleteModal.value = false
  selectedFoodSale.value = null
}


const updateCategorySelector = () => {
  emit('update-category-selector')
}

const foodRetailUI:IFieldsRetailUI = {
  ...props.selectedCategory,
  fields: [
    { key: 'product', label: 'เลือกอาหาร', type: 'select', required: true },
    { key: 'priceKilo', label: 'ราคาท้องตลาดต่อกิโล', type: 'number', required: true },
    { key: 'costPriceKilo', label: 'ราคาทุนต่อกิโล', type: 'number', required: true },
    { key: 'customerPriceKilo', label: 'ราคาลูกค้าต่อกิโล', type: 'number', required: true },
    { key: 'dealerPriceKilo', label: 'ราคาพ่อค้าต่อกิโล', type: 'number', required: true },
  ],
}

const foodSaleStore = useFoodSaleStore()
const { data: foodSales, isLoading } = useQuery<IFoodSale[]>({
  queryKey: ['get_food_sales'],
  queryFn: () => foodSaleStore.onGetFoodSales(),
})

const { applyFoodRetailFilters, foodRetailFilters } = useProductFilters()
const filteredProducts = computed(() => {
  if (!foodSales.value) return []
  return applyFoodRetailFilters(foodSales.value)
})

</script>

<template>
  <div class="space-y-4">
    <FoodRetailFilter
      :selected-category="selectedCategory"
      :food-retail-filters="foodRetailFilters"
      @update-food-retail-filters="(filters) => (foodRetailFilters = filters)"
      @open-add-modal="showAddModal = true"
      @open-export-modal="showExportModal = true"
      @update-category-selector="updateCategorySelector"
    />

    <RetailTable
      :filtered-products="filteredProducts"
      :is-loading-products="isLoading"
      :selected-category="selectedCategory"
      @open-edit-modal="openShowEditModal"
      @open-detail-modal="openShowDetailModal"
      @open-delete-modal="openShowDeleteModal"
    />
  </div>

  <ModalRetailAddProduct
    v-if="showAddModal"
    v-model:visible="showAddModal"
    :fieldsRetailUI="foodRetailUI"
    :selected-category="selectedCategory"
  />

  <!-- <ModalRetailExportProduct v-if="showExportModal" v-model:visible="showExportModal" /> -->

  <ModalRetailEditProduct
    v-if="selectedFoodSale"
    v-model:visible="showEditModal"
    :product-data="selectedFoodSale"
    :selected-category="selectedCategory"
    :fieldsRetailUI="foodRetailUI"
    @close-edit-modal="closeShowEditModal"
  />

  <ModalRetailDetailProduct
    v-if="selectedFoodSale"
    v-model:visible="showDetailModal"
    :product-data="selectedFoodSale"
    :fieldsRetailUI="foodRetailUI"
    @close-detail-modal="closeShowDetailModal"
  />

  <ModalRetailDeleteProduct
    v-if="selectedFoodSale"
    v-model:visible="showDeleteModal"
    :product-data="selectedFoodSale"
    @close-delete-modal="closeShowDeleteModal"
  />
</template>
