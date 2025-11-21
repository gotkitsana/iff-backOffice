<script setup lang="ts">
import { Button } from 'primevue'
import ProductItemForm from './ProductItemForm.vue'
import type { IProduct } from '@/stores/product/product'

// Props
const props = defineProps<{
  products: Array<{
    id: string
    quantity: number
    category: string
    price: number
  }>
  productsData?: IProduct[]
  canEdit: boolean
  isSubmitting: boolean
}>()

// Emits
const emit = defineEmits<{
  'add-product': []
  'remove-product': [index: number]
  'update-product': [index: number, value: string | Record<string, unknown>]
  'update-quantity': [index: number, quantity: number]
}>()

const handleAddProduct = () => {
  if (props.products.length < 10) {
    emit('add-product')
  }
}

const handleRemoveProduct = (index: number) => {
  emit('remove-product', index)
}

const handleUpdateProduct = (index: number, value: string | Record<string, unknown>) => {
  emit('update-product', index, value)
}

const handleUpdateQuantity = (index: number, quantity: number) => {
  emit('update-quantity', index, quantity)
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-lg font-medium text-gray-800 flex items-center gap-2">
        <i class="pi pi-box text-blue-600"></i>
        รายการสินค้า
      </h4>
      <Button
        v-if="canEdit"
        label="เพิ่มสินค้า"
        icon="pi pi-plus"
        severity="success"
        size="small"
        @click="handleAddProduct"
        :disabled="products.length >= 10"
      />
    </div>

    <div class="space-y-4">
      <ProductItemForm
        v-for="(product, index) in products"
        :key="index"
        :product="product"
        :index="index"
        :is-submitting="isSubmitting"
        :products-data="productsData"
        :can-remove="products.length > 1 && canEdit"
        :is-read-only="!canEdit"
        @update:product="handleUpdateProduct"
        @update:quantity="handleUpdateQuantity"
        @remove="handleRemoveProduct"
      />
    </div>
  </div>
</template>

