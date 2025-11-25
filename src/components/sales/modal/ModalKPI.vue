<script setup lang="ts">
import { Dialog } from 'primevue'
import formatCurrency from '@/utils/formatCurrency'
import { useCategoryStore, type ICategory, type ICategoryValue } from '@/stores/product/category'
import type { ISales, SellingStatus, SellingStatusString } from '@/types/sales'
import { convertStatusNumberToString } from '@/types/sales'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

interface Props {
  visible: boolean
  salesData: ISales[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const closeModal = () => {
  emit('update:visible', false)
}

const getStatusStepOrder = (status: SellingStatus | number | string) => {
  const statusString = typeof status === 'number' ? convertStatusNumberToString(status) : status
  const statusOrder: Record<SellingStatusString, number> = {
    order: 1,
    wait_payment: 2,
    preparing: 3,
    shipping: 4,
    received: 5,
    damaged: 6,
    none: 0,
  }
  return statusOrder[statusString as SellingStatusString] || 0
}

const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

const calculateCategoryRevenue = (categoryName: ICategoryValue) => {
  return (
    props.salesData
      ?.filter((s) => getStatusStepOrder(s.sellingStatus) >= getStatusStepOrder('preparing'))
      .reduce((sum, sale) => {
        // รวมเฉพาะ products ที่ตรงกับ category ที่ต้องการ
        const categoryProductsTotal = sale.products
          ? sale.products
              .filter(
                (product) =>
                  categories.value?.find((c) => c._id === product.category)?.value === categoryName
              )
              .reduce((productSum, product) => {
                return productSum + (product.price || 0) * product.quantity
              }, 0)
          : 0
        return sum + categoryProductsTotal
      }, 0) || 0
  )
}

const serviceRevenue = computed(() => calculateCategoryRevenue('service'))
const fishRevenue = computed(() => calculateCategoryRevenue('fish'))
const equipmentRevenue = computed(() => calculateCategoryRevenue('equipment'))
const medicineRevenue = computed(() => calculateCategoryRevenue('medicine'))
const foodRevenue = computed(() => calculateCategoryRevenue('food'))
const microorganismRevenue = computed(() => calculateCategoryRevenue('microorganism'))
const constructionRevenue = computed(() => calculateCategoryRevenue('construction'))
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="closeModal"
    modal
    :closable="true"
    :draggable="false"
    :style="{ width: '90vw', maxWidth: '1000px' }"
    :pt="{
      root: { class: 'rounded-2xl' },
      header: { class: 'border-b border-gray-200 p-4' },
      content: { class: 'p-6' },
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md"
        >
          <i class="pi pi-chart-line text-white text-lg"></i>
        </div>
        <div>
          <h2 class="text-lg font-semibold! text-gray-900 m-0">รายงานยอดขายตามหมวดหมู่</h2>
          <p class="text-sm text-gray-500 m-0 ">สรุปยอดขายแยกตามประเภทสินค้าและบริการ</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Main KPI Cards -->
      <div>
        <h3 class="text-lg font-semibold! text-gray-800 mb-2 flex items-center gap-2">
          <i class="pi pi-th-large text-blue-500"></i>
          หมวดหมู่สินค้า
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Equipment Revenue -->
          <div
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
              >
                <i class="pi pi-box text-white text-2xl"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-[500]! text-gray-900 text-sm mb-1">ยอดอุปกรณ์</h4>
                <p class="text-xl font-semibold! text-green-600 mb-0.5">
                  {{ formatCurrency(equipmentRevenue) }}
                </p>
                <p class="text-xs text-gray-500">บาท</p>
              </div>
            </div>
          </div>

          <!-- Service Revenue -->
          <div
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
              >
                <i class="pi pi-wrench text-white text-2xl"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-[500]! text-gray-900 text-sm mb-1">ยอดบริการ</h4>
                <p class="text-xl font-semibold! text-purple-600 mb-0.5">
                  {{ formatCurrency(serviceRevenue) }}
                </p>
                <p class="text-xs text-gray-500">บาท</p>
              </div>
            </div>
          </div>

          <!-- Construction Revenue -->
          <div
            class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
              >
                <i class="pi pi-building text-white text-2xl"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-[500]! text-gray-900 text-sm mb-1">ยอดขายคอนสทรัคชั่น</h4>
                <p class="text-xl font-semibold! text-orange-600 mb-0.5">
                  {{ formatCurrency(constructionRevenue) }}
                </p>
                <p class="text-xs text-gray-500">บาท</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Categories -->
      <div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <!-- Fish Revenue -->
          <div
            class="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div class="text-center">
              <div
                class="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-3"
              >
                <i class="pi pi-cart-arrow-down text-white text-xl"></i>
              </div>
              <h5 class="text-sm font-medium! text-gray-700 mb-2">ยอดขายปลา</h5>
              <p class="font-semibold! text-gray-800 text-base">
                {{ formatCurrency(fishRevenue) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
          </div>

          <!-- Medicine Revenue -->
          <div
            class="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div class="text-center">
              <div
                class="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-3"
              >
                <i class="pi pi-plus-circle text-white text-xl"></i>
              </div>
              <h5 class="text-sm font-medium! text-gray-700 mb-2">ยอดขายยา</h5>
              <p class="font-semibold! text-red-600 text-base">
                {{ formatCurrency(medicineRevenue) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
          </div>

          <!-- Microorganism Revenue -->
          <div
            class="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div class="text-center">
              <div
                class="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-3"
              >
                <i class="pi pi-circle text-white text-xl"></i>
              </div>
              <h5 class="text-sm font-medium! text-gray-700 mb-2">ยอดขายจุลินทรีย์</h5>
              <p class="font-semibold! text-teal-600 text-base">
                {{ formatCurrency(microorganismRevenue) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
          </div>

          <!-- Food Revenue -->
          <div
            class="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div class="text-center">
              <div
                class="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-3"
              >
                <i class="pi pi-heart text-white text-xl"></i>
              </div>
              <h5 class="text-sm font-medium! text-gray-700 mb-2">ยอดขายอาหาร</h5>
              <p class="font-semibold! text-pink-600 text-base">
                {{ formatCurrency(foodRevenue) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

