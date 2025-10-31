<script setup lang="ts">
import { computed, watch } from 'vue'
import { Button, Select, InputNumber } from 'primevue'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import CardProductList from './CardProductList.vue'
import formatCurrency from '@/utils/formatCurrency'

// Props
const props = defineProps<{
  products: Array<{ id: string; quantity: number }>
  isSubmitting: boolean
  readOnly?: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:products': [products: Array<{ id: string; quantity: number }>]
  'add-product': []
  'remove-product': [index: number]
  'update:total-amount': [amount: number]
}>()

// Stores
const productStore = useProductStore()
const categoryStore = useCategoryStore()

// Queries
const { data: getProducts } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

// Computed
const availableProducts = computed(() => {
  if (!getProducts.value) return []
  return getProducts.value.filter((p) => !p.sold && p.auctionOnly === 0)
})

const getProductOptionsForIndex = (currentIndex: number) => {
  if (!availableProducts.value) return []

  // ดึงรายการ ID ของสินค้าที่เลือกแล้ว (ยกเว้น index ปัจจุบัน)
  const selectedProductIds = props.products
    .map((p, index) => (index !== currentIndex ? p.id : ''))
    .filter((id) => id !== '')

  // กรองสินค้าที่ยังไม่ได้เลือก
  const unselectedProducts = availableProducts.value.filter(
    (product) => !selectedProductIds.includes(product._id)
  )

  // group by category._id
  const groupsMap = new Map<
    string,
    { label: string; items: Array<{ label: string; value: string; image?: string }> }
  >()

  unselectedProducts.forEach((product) => {
    const catId = product.category?._id || 'unknown'
    const cat = handleFindCategory(product.category?._id)
    const group = groupsMap.get(catId) || {
      label: cat?.name || 'ไม่ระบุหมวดหมู่',
      items: [],
    }

    // เพิ่มรูปภาพจาก images[0]
    const imageUrl =
      product.images && product.images.length > 0
        ? `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${
            product.images[0].filename
          }`
        : undefined

    group.items.push({
      label: `${product.name || product.species?.name} (รหัสสินค้า: ${product.sku})`,
      value: product._id,
      image: imageUrl,
    })

    groupsMap.set(catId, group)
  })

  return Array.from(groupsMap.values())
}

const selectedProductDetails = computed(() => {
  return props.products.map((product: { id: string; quantity: number }) => {
    if (!product.id || !availableProducts.value) return null

    const productDetail = availableProducts.value?.find((p) => p._id === product.id)
    if (!productDetail) {
      return {
        productId: product.id,
        quantity: product.quantity,
        isMissing: true,
        name: '',
        price: 0,
        category: undefined,
        detail: '',
      }
    }

    const category = handleFindCategory(productDetail?.category?._id)

    return {
      ...productDetail,
      quantity: product.quantity,
      productId: productDetail._id,
      isMissing: false,
      category: category,
    }
  })
})

const totalAmount = computed(() => {
  return props.products.reduce((sum, product) => {
    const productDetail = availableProducts.value?.find((p) => p._id === product.id)

    if (productDetail && productDetail.price) {
      return sum + (productDetail.price || 0) * product.quantity
    }

    return sum
  }, 0)
})

// Watch for total amount changes and emit to parent
watch(
  totalAmount,
  (newAmount) => {
    emit('update:total-amount', newAmount)
  },
  { immediate: true }
)

const handleFindCategory = (id: string | null | undefined): ICategory | undefined => {
  if (!id) return undefined
  return categories.value?.find((category) => category._id === id)
}

const updateProduct = (index: number, field: 'id' | 'quantity', value: string | number) => {
  const updatedProducts = [...props.products]
  updatedProducts[index] = { ...updatedProducts[index], [field]: value }
  emit('update:products', updatedProducts)
}

const addProduct = () => {
  if (props.products.length < 10) {
    emit('add-product')
  }
}

const removeProduct = (index: number) => {
  if (props.products.length > 1) {
    emit('remove-product', index)
  }
}

const isProductValid = (product: { id: string; quantity: number }) => {
  return product.id && product.quantity > 0
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <i class="pi pi-box text-blue-600"></i>
        รายการสินค้า
      </h4>
      <Button
        v-if="!props.readOnly"
        label="เพิ่มสินค้า"
        icon="pi pi-plus"
        severity="success"
        size="small"
        @click="addProduct"
        :disabled="products.length >= 10"
      />
    </div>

    <div class="space-y-4">
      <div v-for="(product, index) in products" :key="index" class="space-y-4">
        <div v-if="!props.readOnly" class="p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <h5 class="text-sm font-semibold text-gray-700">สินค้า {{ index + 1 }}</h5>
            <Button
              v-if="products.length > 1"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              text
              rounded
              @click="removeProduct(index)"
              v-tooltip.top="'ลบสินค้านี้'"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Select
                :modelValue="product.id"
                @update:modelValue="(value) => updateProduct(index, 'id', value)"
                :options="getProductOptionsForIndex(index)"
                optionLabel="label"
                optionValue="value"
                optionGroupLabel="label"
                optionGroupChildren="items"
                placeholder="เลือกสินค้าที่ต้องการขาย"
                fluid
                size="small"
                :invalid="!product.id && isSubmitting"
                filter
              >
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <img
                      v-if="option.image"
                      :src="option.image"
                      alt="product"
                      class="w-6 h-6 object-cover rounded"
                    />
                    <i v-else class="pi pi-image text-gray-400 text-sm"></i>
                    <span>{{ option.label }}</span>
                  </div>
                </template>
              </Select>

              <!-- <Select
                  v-model="product.id"
                  :options="getProductOptionsForIndex(index)"
                  optionLabel="label"
                  optionValue="value"
                  optionGroupLabel="label"
                  optionGroupChildren="items"
                  placeholder="เลือกสินค้าที่ต้องการขาย"
                  fluid
                  size="small"
                  filter
                  :invalid="!product.id && isSubmitting"
                >
                  <template #option="{ option }">
                    <div class="flex items-center gap-2">
                      <img
                        v-if="option.image"
                        :src="option.image"
                        alt="product"
                        class="w-6 h-6 object-cover rounded"
                      />
                      <i v-else class="pi pi-image text-gray-400 text-sm"></i>
                      <span>{{ option.label }}</span>
                    </div>
                  </template>
                </Select> -->

              <small v-if="!product.id && isSubmitting" class="text-red-500"
                >กรุณาเลือกสินค้า</small
              >
            </div>

            <div>
              <InputNumber
                :modelValue="product.quantity"
                @update:modelValue="(value) => updateProduct(index, 'quantity', value || 1)"
                :min="1"
                :max="100"
                fluid
                size="small"
                placeholder="ระบุจำนวนสินค้า"
                :invalid="!product.quantity && isSubmitting"
              />
              <small v-if="!product.quantity && isSubmitting" class="text-red-500"
                >กรุณากรอกจำนวนสินค้า</small
              >
            </div>
          </div>

          <CardProductList
            :name="selectedProductDetails[index]?.name"
            :quantity="selectedProductDetails[index]?.quantity || product.quantity"
            :price="selectedProductDetails[index]?.price"
            :detail="selectedProductDetails[index]?.detail"
            :category="selectedProductDetails[index]?.category"
            :productId="selectedProductDetails[index]?.productId || product.id"
            :isMissing="selectedProductDetails[index]?.isMissing"
          />
        </div>

        <div v-else>
          <CardProductList
            :name="selectedProductDetails[index]?.name"
            :quantity="selectedProductDetails[index]?.quantity || product.quantity"
            :price="selectedProductDetails[index]?.price"
            :detail="selectedProductDetails[index]?.detail"
            :category="selectedProductDetails[index]?.category"
            :productId="selectedProductDetails[index]?.productId || product.id"
            :isMissing="selectedProductDetails[index]?.isMissing"
          />
        </div>
      </div>
    </div>
  </div>
</template>
