<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Card, Tag, Divider } from 'primevue'
import { useSalesStore } from '@/stores/sales/sales'
import formatCurrency from '@/utils/formatCurrency'
import type { ISales } from '@/types/sales'
import CardProductList from './CardProductList.vue'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/auction/category'

// Props
const props = defineProps<{
  visible: boolean
  saleData: ISales | null
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()


// Stores
const salesStore = useSalesStore()

// Computed
const products = computed(() => props.saleData?.products || [])

const totalAmount = computed(() => {
  if (!props.saleData) return 0
  const productTotal = products.value.reduce((sum, product) => {
    return sum + (product.price || 0) * product.quantity
  }, 0)
  return productTotal - props.saleData.discount
})

const productTotal = computed(() => {
  return products.value.reduce((sum, product) => {
    return sum + (product.price || 0) * product.quantity
  }, 0)
})

// Handlers
const handleClose = () => {
  emit('update:visible', false)
}

const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(),
})
const handleFindCategory = (id: string | null | undefined) => {
  if (!id) return ''
  return categories.value?.find((category) => category._id === id)?.name
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
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

      <!-- Products List -->
      <div class="space-y-3">
        <h4 class="text-md font-semibold text-gray-800 flex items-center gap-2">
          <i class="pi pi-list text-blue-600"></i>
          รายการสินค้าทั้งหมด
        </h4>

        <div class="space-y-2">
          <CardProductList
            v-for="(product, index) in products"
            :key="index"
            :name="product.name || ''"
            :quantity="product.quantity || 0"
            :price="product.price || 0"
            :detail="''"
            :category="handleFindCategory(product.category) || ''"
          />
        </div>
      </div>

      <!-- Summary -->
      <Divider />

      <Card :pt="{ body: 'p-3' }" class="bg-gray-50 border-gray-200">
        <template #content>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">มูลค่าสินค้ารวม:</span>
              <span class="text-sm font-semibold text-gray-900">{{
                formatCurrency(productTotal)
              }}</span>
            </div>

            <div
              v-if="saleData?.discount && saleData.discount > 0"
              class="flex justify-between items-center"
            >
              <span class="text-sm text-gray-600">ส่วนลด:</span>
              <span class="text-sm font-semibold text-red-600"
                >{{ formatCurrency(saleData.discount) }}</span
              >
            </div>

            <div
              v-if="saleData?.deposit && saleData.deposit > 0"
              class="flex justify-between items-center"
            >
              <span class="text-sm text-gray-600">มัดจำ:</span>
              <span class="text-sm font-semibold text-blue-600"
                >{{ formatCurrency(saleData.deposit) }}</span
              >
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
