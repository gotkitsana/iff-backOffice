<script setup lang="ts">
import type { ICategory } from '@/stores/product/category'
import FoodRetailFilter from './FoodRetailFilter.vue'
import { ref } from 'vue'
import ModalRetailAddProduct from '@/components/product/modal/retail/ModalRetailAddProduct.vue'
import type { IFieldsRetailUI } from '@/stores/product/food_sale'

const props = defineProps<{
  selectedCategory: ICategory
}>()

const emit = defineEmits<{
  'update-category-selector': []
}>()

const showFoodModal = ref(false)
const showExportModal = ref(false)

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
</script>

<template>
  <div class="space-y-4">
    <FoodRetailFilter
      :selected-category="selectedCategory"
      @open-add-modal="showFoodModal = true"
      @open-export-modal="showExportModal = true"
      @update-category-selector="updateCategorySelector"
    />

    อาหารแบ่งขาย
  </div>

  <ModalRetailAddProduct
    v-if="showFoodModal"
    v-model:visible="showFoodModal"
    :fieldsRetailUI="foodRetailUI"
    :selected-category="selectedCategory"
  />

  <!-- <ModalExportProduct v-if="!showCategorySelector" v-model:visible="showExportModal" />

  <ModalEditProduct
    v-if="!showCategorySelector"
    v-model:visible="showEditModal"
    :product-data="selectedProduct"
    :categoryOptionsUI="categoryOptionsUI"
    :selected-category="selectedCategory"
    @close-edit-modal="closeEditModal"
  />

  <ModalProductDetail
    v-if="selectedProduct"
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
  /> -->
</template>
