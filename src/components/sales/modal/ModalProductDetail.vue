<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Card, Divider } from 'primevue'
import formatCurrency from '@/utils/formatCurrency'
import type { ISales } from '@/types/sales'
import CardProductList from '../CardProductList.vue'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { getProductImageUrl } from '@/utils/imageUrl'

// Props
const props = defineProps<{
  visible: boolean
  saleData: ISales | null
}>()

// Emits
const emit = defineEmits<{
  'close-product-detail-modal': []
}>()

// Computed
const products = computed(() => props.saleData?.products || [])
const customProducts = computed(() => props.saleData?.customProducts || [])

const totalAmount = computed(() => {
  if (!props.saleData) return 0
  const productTotal = products.value.reduce((sum, product) => {
    return sum + (product.price || 0) * product.quantity
  }, 0)
  return productTotal - props.saleData.discount - props.saleData.deliveryNo
})

const productTotal = computed(() => {
  return products.value.reduce((sum, product) => {
    return sum + (product.price || 0) * product.quantity
  }, 0)
})

// Handlers
const handleClose = () => {
  emit('close-product-detail-modal')
}

const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})
const handleFindCategory = (id: string): ICategory | undefined => {
  if (!id) return undefined
  return categories.value?.find((category) => category._id === id)
}

const productStore = useProductStore()
const { data: productsData } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const getProductImage = (productId: string) => {
  const image = productsData.value?.find((p) => p._id === productId)?.images[0]?.filename
  return image ? getProductImageUrl(image) : undefined
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      content: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-box text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-800">รายละเอียดสินค้า</h3>
          <p class="text-sm text-gray-600 uppercase">รายการ: {{ saleData?.item }}</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card :pt="{ body: 'p-3' }" class="bg-blue-50 border-blue-200">
          <template #content>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ products.length }}</div>
              <div class="text-sm text-blue-700">รายการสินค้า</div>
            </div>
          </template>
        </Card>

        <Card :pt="{ body: 'p-3' }" class="bg-green-50 border-green-200">
          <template #content>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {{ products.reduce((sum, p) => sum + p.quantity, 0) }}
              </div>
              <div class="text-sm text-green-700">จำนวนชิ้นรวม</div>
            </div>
          </template>
        </Card>

        <Card :pt="{ body: 'p-3' }" class="bg-purple-50 border-purple-200">
          <template #content>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">
                {{ formatCurrency(productTotal) }}
              </div>
              <div class="text-sm text-purple-700">มูลค่ารวม</div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Custom Products (for order) -->
      <div
        v-if="customProducts.length > 0 && saleData?.sellingStatus === 1"
        class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      >
        <h4 class="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <i class="pi pi-shopping-cart text-orange-600"></i>
          สินค้านอกเหนือรายการ
        </h4>
        <div class="space-y-3">
          <div
            v-for="(product, index) in customProducts"
            :key="index"
            class="p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
              <div>
                <span class="text-sm font-medium text-gray-600">ชื่อสินค้า:</span>
                <span class="text-sm font-semibold text-gray-900 ml-2">{{
                  product.name || '-'
                }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-600">จำนวน:</span>
                <span class="text-sm font-semibold text-gray-900 ml-2">{{
                  product.quantity || 0
                }}</span>
              </div>
            </div>
            <div v-if="product.description">
              <span class="text-sm font-medium text-gray-600">รายละเอียด:</span>
              <p class="text-sm text-gray-700 mt-1">{{ product.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Products List -->
      <div class="space-y-3">
        <h4 class="text-md font-semibold text-gray-800 flex items-center gap-2">
          <i class="pi pi-list text-blue-600"></i>
          รายการสินค้าทั้งหมด
        </h4>

        <div class="space-y-2">
          <template v-for="(product, index) in products" :key="index">
            <CardProductList
              :name="product.name || ''"
              :quantity="product.quantity || 0"
              :price="product.price || 0"
              :detail="''"
              :category="handleFindCategory(product.category || '')"
              :isMissing="!product.category"
              :image="getProductImage(product.id)"
              :sku="productsData?.find((p) => p._id === product.id)?.sku || ''"
            />
          </template>
        </div>
      </div>

      <!-- Summary -->
      <Divider />

      <Card :pt="{ body: 'p-3' }" class="bg-gray-50 border-gray-200">
        <template #content>
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">มูลค่าสินค้ารวม:</span>
              <span class="text-sm font-semibold text-gray-900">{{
                formatCurrency(productTotal)
              }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">ค่าจัดส่ง:</span>
              <span class="text-sm font-semibold text-green-600">{{
                formatCurrency(saleData?.deliveryNo || 0)
              }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">ส่วนลด:</span>
              <span class="text-sm font-semibold text-red-600">{{
                formatCurrency(saleData?.discount || 0)
              }}</span>
            </div>

            <div
              v-if="saleData?.deposit && saleData.deposit > 0"
              class="flex justify-between items-center"
            >
              <span class="text-sm text-gray-600">มัดจำ:</span>
              <span class="text-sm font-semibold text-blue-600">{{
                formatCurrency(saleData.deposit)
              }}</span>
            </div>

            <Divider class="my-2" />

            <div class="flex justify-between items-center">
              <span class="text-base font-semibold text-gray-800">ยอดสุทธิ:</span>
              <span class="text-lg font-bold text-green-600">{{
                formatCurrency(totalAmount)
              }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
