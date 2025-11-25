<script setup lang="ts">
import { computed, inject } from 'vue'
import { TreeSelect, InputNumber, Button, Tag } from 'primevue'
import CardProductList from '../shared/CardProductList.vue'
import type { IProduct } from '@/stores/product/product'
import type { ICategory } from '@/stores/product/category'

const props = defineProps<{
  product: { id: string; quantity: number; category: string; price: number; name?: string }
  index: number
  isSubmitting: boolean
  productsData?: IProduct[]
  canRemove?: boolean
  isReadOnly?: boolean
}>()

const emit = defineEmits<{
  'update:product': [index: number, value: string | Record<string, any>]
  'update:quantity': [index: number, value: number]
  remove: [index: number]
}>()

// Inject composable functions from parent
const productSelection = inject<{
  getImageUrl: (filename: string) => string
  handleFindCategory: (id: string | null | undefined) => ICategory | undefined
  getSelectedProduct: (id: string) => IProduct | undefined
  getProductOptionsForIndex: (index: number) => Array<{
    key: string
    label: string
    selectable: boolean
    children: Array<{
      key: string
      label: string
      value: string
      data: any
      selectable: boolean
      disabled: boolean
      sku?: string
      image?: string
      sold?: boolean
      balance?: number
      isFish?: boolean
      waitQC?: boolean
    }>
  }>
  selectedProductDetails: {
    value: Array<{
      name?: string
      price?: number
      quantity?: number
      isMissing?: boolean
      category?: ICategory
      image?: string
      sku?: string
      balance?: number
    } | null>
  }
}>(Symbol.for('productSelection'))

if (!productSelection) {
  throw new Error('ProductItemForm must be used within a component that provides productSelection')
}

const handleProductChange = (value: string | Record<string, any>) => {
  emit('update:product', props.index, value)
}

const handleQuantityChange = (value: number | null) => {
  emit('update:quantity', props.index, value || 1)
}

const handleRemove = () => {
  emit('remove', props.index)
}

const getProduct = (id: string) => {
  return productSelection.getSelectedProduct(id)
}

const isFishCategory = computed(() => {
  const product = getProduct(props.product.id)
  const category = productSelection.handleFindCategory(product?.category?._id)
  return category?.value === 'fish'
})

const productOptions = computed(() => {
  return productSelection.getProductOptionsForIndex(props.index)
})

const selectedProductDetail = computed(() => {
  return productSelection.selectedProductDetails.value[props.index]
})
</script>

<template>
  <div v-if="!isReadOnly" class="p-3 bg-gray-50 border border-gray-200 rounded-xl">
    <div class="flex items-center justify-between mb-2">
      <h5 class="text-sm font-semibold text-gray-700">สินค้า {{ index + 1 }}</h5>
      <Button
        v-if="canRemove"
        icon="pi pi-trash"
        severity="danger"
        size="small"
        text
        rounded
        @click="handleRemove"
        v-tooltip.top="'ลบสินค้านี้'"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <TreeSelect
          :modelValue="product.id"
          @update:modelValue="handleProductChange"
          :options="productOptions"
          placeholder="เลือกสินค้าที่ต้องการขาย"
          fluid
          size="small"
          filter
          filterBy="label,sku"
          :filterPlaceholder="`ค้นหาจากชื่อหรือรหัสสินค้า`"
          :invalid="!product.id && isSubmitting"
          selectionMode="single"
          :pt="{
            label: 'flex items-center gap-2',
          }"
        >
          <template #value="slotProps">
            <div v-if="!!product.id" class="flex items-center gap-2">
              <img
                v-if="getProduct(product.id)?.images?.[0]"
                :src="
                  productSelection.getImageUrl(getProduct(product.id)?.images?.[0]?.filename || '')
                "
                alt="product"
                class="w-6 h-6 object-cover rounded"
                loading="lazy"
                fetchpriority="low"
                crossorigin="anonymous"
              />
              <span>
                {{ product.name || selectedProductDetail?.name || product.id }}
                <span v-if="getProduct(product.id)?.sku" class="text-xs text-gray-500 pl-1">
                  รหัส ({{ getProduct(product.id)?.sku }})
                </span>
              </span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>

          <template #option="{ node }">
            <div class="flex items-center justify-between gap-2 w-full">
              <div class="flex items-center gap-2">
                <img
                  v-if="node.image"
                  :src="node.image"
                  alt="product"
                  class="w-6 h-6 object-cover rounded"
                  loading="lazy"
                  fetchpriority="low"
                  crossorigin="anonymous"
                />
                <span :class="{ 'opacity-50': node.disabled }">
                  {{ node.label }}
                  <span v-if="node.sku" class="text-xs text-gray-500 pl-1">
                    รหัส ({{ node.sku }})
                  </span>
                </span>
              </div>

              <!-- Badge สถานะ -->
              <div v-if="node.value" class="flex-shrink-0">
                <!-- ปลา -->
                <Tag
                  v-if="node.isFish && node.waitQC"
                  value="รอ QC"
                  severity="danger"
                  size="small"
                  class="text-xs"
                />
                <Tag
                  v-else-if="node.isFish && node.sold"
                  value="ขายแล้ว"
                  severity="danger"
                  size="small"
                  class="text-xs"
                />
                <Tag
                  v-else-if="node.isFish && !node.sold"
                  value="พร้อมขาย"
                  severity="success"
                  size="small"
                  class="text-xs"
                />

                <!-- สินค้าทั่วไป (อาหารกระสอบ) -->
                <Tag
                  v-else-if="!node.isFish && !node.isFoodSale && (node.sold || node.balance === 0)"
                  :value="`คงเหลือ: ${node.balance || 0}`"
                  severity="danger"
                  size="small"
                  class="text-xs"
                />
                <Tag
                  v-else-if="!node.isFish && !node.isFoodSale"
                  :value="`คงเหลือ: ${node.balance || 0}`"
                  severity="success"
                  size="small"
                  class="text-xs"
                />

                <!-- อาหารแบ่งขาย -->
                <Tag
                  v-else-if="node.isFoodSale && (node.sold || node.balance === 0)"
                  :value="`คงเหลือ: ${node.balance || 0} กก.`"
                  severity="danger"
                  size="small"
                  class="text-xs"
                />
                <Tag
                  v-else-if="node.isFoodSale"
                  :value="`คงเหลือ: ${node.balance || 0} กก.`"
                  severity="success"
                  size="small"
                  class="text-xs"
                />
              </div>
            </div>
          </template>
        </TreeSelect>

        <small v-if="!product.id && isSubmitting" class="text-red-500">กรุณาเลือกสินค้า</small>
      </div>

      <div>
        <InputNumber
          :modelValue="product.quantity"
          @update:modelValue="handleQuantityChange"
          :min="1"
          :max="productsData?.find((p) => p._id === product.id)?.balance || 100"
          fluid
          size="small"
          placeholder="ระบุจำนวนสินค้า"
          :invalid="!product.quantity && isSubmitting"
          :disabled="isFishCategory || isReadOnly"
        />
        <small v-if="!product.quantity && isSubmitting" class="text-red-500"
          >กรุณากรอกจำนวนสินค้า
        </small>
      </div>
    </div>

    <CardProductList
      v-if="selectedProductDetail"
      :name="selectedProductDetail?.name"
      :quantity="selectedProductDetail?.quantity || product.quantity"
      :price="selectedProductDetail?.price"
      :detail="''"
      :category="selectedProductDetail?.category"
      :is-missing="!selectedProductDetail"
      :image="selectedProductDetail?.image"
      :sku="selectedProductDetail?.sku"
      :balance="selectedProductDetail?.balance"
    />
  </div>

  <template v-else>
    <CardProductList
      v-if="selectedProductDetail"
      :name="selectedProductDetail?.name"
      :quantity="selectedProductDetail?.quantity || product.quantity"
      :price="selectedProductDetail?.price"
      :detail="''"
      :category="selectedProductDetail?.category"
      :is-missing="!selectedProductDetail"
      :image="selectedProductDetail?.image"
      :sku="selectedProductDetail?.sku"
      :balance="selectedProductDetail?.balance"
    />
  </template>
</template>

