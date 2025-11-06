<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, DataTable, Column, Tag, Button, Tabs, TabList, Tab } from 'primevue'
import { useQuery } from '@tanstack/vue-query'
import ModalAddSale from '@/components/sales/modal/ModalAddSale.vue'
import ModalEditSale from '@/components/sales/modal/ModalEditSale.vue'
import ModalSaleDetail from '@/components/sales/modal/ModalSaleDetail.vue'
import ModalProductDetail from '@/components/sales/modal/ModalProductDetail.vue'
import ModalDeleteSale from '@/components/sales/modal/ModalDeleteSale.vue'
import StatusManager from '@/components/sales/StatusManager.vue'
import formatCurrency from '@/utils/formatCurrency'
import BankData from '@/config/BankData'
import { useSalesStore } from '@/stores/sales/sales'
import { useMemberStore } from '@/stores/member/member'
import type { ISales, SellingStatus } from '@/types/sales'
import { useCategoryStore, type ICategory, type ICategoryValue } from '@/stores/product/category'
import { useAdminStore, type IAdmin } from '@/stores/admin/admin'

// Stores
const salesStore = useSalesStore()
const memberStore = useMemberStore()

// Data
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showStatusManager = ref(false)
const showProductDetailModal = ref(false)
const selectedSale = ref<ISales | null>(null)
const activeTab = ref('all')

const { data: salesData, isLoading: isLoadingSales } = useQuery<ISales[]>({
  queryKey: ['get_sales'],
  queryFn: () => salesStore.onGetSales(),
})

// Computed
const filteredSales = computed(() => {
  if (activeTab.value === 'all') {
    return salesData.value || []
  }
  return salesData.value?.filter((sale) => sale.status === activeTab.value) || []
})

// Tab counts
const allCount = computed(() => salesData.value?.length || 0)
const waitProductCount = computed(
  () => salesData.value?.filter((s) => s.status === 'wait_product').length || 0
)
const waitConfirmCount = computed(
  () => salesData.value?.filter((s) => s.status === 'wait_confirm').length || 0
)
const waitPaymentCount = computed(
  () => salesData.value?.filter((s) => s.status === 'wait_payment').length || 0
)
const paidCompleteCount = computed(
  () => salesData.value?.filter((s) => s.status === 'paid_complete').length || 0
)
const preparingCount = computed(
  () => salesData.value?.filter((s) => s.status === 'preparing').length || 0
)
const shippingCount = computed(
  () => salesData.value?.filter((s) => s.status === 'shipping').length || 0
)
const deliveredCount = computed(
  () => salesData.value?.filter((s) => s.status === 'received').length || 0
)
const damagedCount = computed(
  () => salesData.value?.filter((s) => s.status === 'damaged').length || 0
)

// Current filter display
const currentFilterDisplay = computed(() => {
  const statusMap: Record<SellingStatus | 'all', string> = {
    all: 'ทั้งหมด',
    wait_product: 'ระหว่างจัดหา',
    wait_confirm: 'รอตัดสินใจ',
    wait_payment: 'รอชำระเงิน',
    paid_complete: 'ชำระเงินเรียบร้อย',
    preparing: 'ระหว่างรอจัดส่ง',
    shipping: 'ระหว่างขนส่ง',
    received: 'ได้รับสินค้าแล้ว',
    damaged: 'สินค้าเสียหาย',
  }
  return statusMap[activeTab.value as SellingStatus | 'all'] || 'ทั้งหมด'
})
const getStatusStepOrder = (status: string) => {
  const statusOrder: Record<SellingStatus, number> = {
    wait_product: 1,
    wait_confirm: 2,
    wait_payment: 3,
    paid_complete: 4,
    preparing: 5,
    shipping: 6,
    received: 7,
    damaged: 8,
  }
  return statusOrder[status as SellingStatus] || 0
}

const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})
// Revenue calculations by category
const totalRevenue = computed(() => {
  return (
    salesData.value
      ?.filter((s) => getStatusStepOrder(s.status) >= getStatusStepOrder('paid_complete'))
      .reduce((sum, sale) => {
        const saleTotal = sale.products ? sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0) : 0
        return sum + (saleTotal - sale.discount)
      }, 0) || 0
  )
})

const totalDiscount = computed(() => {
  return (
    salesData.value
      ?.filter((s) => getStatusStepOrder(s.status) >= getStatusStepOrder('paid_complete'))
      .reduce((sum, sale) => {
        return sum + (sale.discount || 0)
      }, 0) || 0
  )
})

const totalDeposit = computed(() => {
  return (
    salesData.value
      ?.filter((s) => getStatusStepOrder(s.status) === getStatusStepOrder('wait_payment'))
      .reduce((sum, sale) => {
        const saleTotal = sale.products ? sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0) : 0
        return sum + (saleTotal - sale.discount)
      }, 0) || 0
  )
})

const totalDelivery = computed(() => {
  return (
    salesData.value
      ?.filter((s) => getStatusStepOrder(s.status) >= getStatusStepOrder('paid_complete'))
      .reduce((sum, sale) => {
        return sum + (sale.deliveryNo || 0)
      }, 0) || 0
  )
})

const calculateCategoryRevenue = (categoryName: ICategoryValue) => {
  return (
    salesData.value
      ?.filter((s) => getStatusStepOrder(s.status) >= getStatusStepOrder('paid_complete'))
      .reduce((sum, sale) => {
        // รวมเฉพาะ products ที่ตรงกับ category ที่ต้องการ
        const categoryProductsTotal = sale.products ? sale.products
          .filter(
            (product) =>
              categories.value?.find((c) => c._id === product.category)?.value === categoryName
          )
          .reduce((productSum, product) => {
            return productSum + (product.price || 0) * product.quantity
          }, 0) : 0
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

// Utility functions
const formatDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

// Helper functions for sales data
const getSaleTotalAmount = (sale: ISales) => {
  const productTotal = sale.products ? sale.products.reduce((sum, product) => {
    return sum + (product.price || 0) * product.quantity
  }, 0) : 0
  const netAmount = (productTotal + (sale.deliveryNo || 0)) - sale.discount
  return netAmount < 0 ? 0 : netAmount
}

// Modal functions
const openAddModal = () => {
  showAddModal.value = true
}

const openEditModal = (sale: ISales) => {
  selectedSale.value = sale
  showEditModal.value = true
}

const openDetailModal = (sale: ISales) => {
  selectedSale.value = sale
  showDetailModal.value = true
}

const openStatusManager = (sale: ISales) => {
  selectedSale.value = sale
  showStatusManager.value = true
}

const openProductDetailModal = (sale: ISales) => {
  selectedSale.value = sale
  showProductDetailModal.value = true
}

const showDeleteModal = ref(false)
const selectedSaleForDelete = ref<ISales | null>(null)

const openDeleteModal = (sale: ISales) => {
  selectedSaleForDelete.value = sale
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedSaleForDelete.value = null
}

const adminStore = useAdminStore()
const { data: admins } = useQuery<IAdmin[]>({
  queryKey: ['get_admins'],
  queryFn: () => adminStore.onGetAdmins(),
})
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ระบบขาย</h1>
        <p class="text-gray-600">จัดการการขายและติดตามยอดขาย</p>
      </div>
    </div>

    <!-- Sales KPI Dashboard -->
    <div class="space-y-4">
      <!-- Dashboard Header -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold! mb-1">สรุปยอดขาย</h2>
            <p class="text-xl font-semibold!">{{ formatCurrency(totalRevenue) }}</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-4 text-white">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold! mb-1">สรุปยอดส่วนลด</h2>
            <p class="text-xl font-semibold!">{{ formatCurrency(totalDiscount) }}</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold! mb-1">สรุปยอดรอชำระ</h2>
            <p class="text-xl font-semibold!">{{ formatCurrency(totalDeposit) }}</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-pink-700 to-pink-900 rounded-2xl p-4 text-white">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold! mb-1">ยอดค่าจัดส่ง</h2>
            <p class="text-xl font-semibold!">{{ formatCurrency(totalDelivery) }}</p>
          </div>
        </div>
      </div>

      <!-- Main KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Top 3 Categories -->
        <div
          class="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-md"
            >
              <i class="pi pi-box text-white text-2xl"></i>
            </div>
            <div class="flex-1">
              <h4 class="font-[500]! text-gray-900">ยอดอุปกรณ์</h4>
              <p class="text-lg font-semibold! text-green-600">
                {{ formatCurrency(equipmentRevenue) }}
              </p>
              <p class="text-sm text-gray-500">บาท</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md"
            >
              <i class="pi pi-wrench text-white text-2xl"></i>
            </div>
            <div class="flex-1">
              <h4 class="font-[500]! text-gray-900">ยอดบริการ</h4>
              <p class="text-lg font-semibold! text-purple-600">
                {{ formatCurrency(serviceRevenue) }}
              </p>
              <p class="text-sm text-gray-500">บาท</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md"
            >
              <i class="pi pi-building text-white text-2xl"></i>
            </div>
            <div class="flex-1">
              <h4 class="font-[500]! text-gray-900">ยอดขายคอนสทรัคชั่น</h4>
              <p class="text-lg font-semibold! text-orange-600">
                {{ formatCurrency(constructionRevenue) }}
              </p>
              <p class="text-sm text-gray-500">บาท</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Categories -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          class="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-300"
        >
          <div class="text-center">
            <div
              class="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-2"
            >
              <i class="pi pi-cart-arrow-down text-white text-lg"></i>
            </div>
            <h5 class="text-sm font-medium! text-gray-700">ยอดขายปลา</h5>
            <p class="font-semibold! text-gray-600">
              {{ formatCurrency(fishRevenue) }}
            </p>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-300"
        >
          <div class="text-center">
            <div
              class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-2"
            >
              <i class="pi pi-plus-circle text-white text-lg"></i>
            </div>
            <h5 class="text-sm font-medium! text-gray-700">ยอดขายยา</h5>
            <p class="font-semibold! text-red-600">
              {{ formatCurrency(medicineRevenue) }}
            </p>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-300"
        >
          <div class="text-center">
            <div
              class="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-2"
            >
              <i class="pi pi-circle text-white text-lg"></i>
            </div>
            <h5 class="text-sm font-medium! text-gray-700">ยอดขายจุลินทรีย์</h5>
            <p class="font-semibold! text-teal-600">
              {{ formatCurrency(microorganismRevenue) }}
            </p>
          </div>
        </div>

        <div
          class="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-300"
        >
          <div class="text-center">
            <div
              class="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-2"
            >
              <i class="pi pi-heart text-white text-lg"></i>
            </div>
            <h5 class="text-sm font-medium! text-gray-700">ยอดขายอาหาร</h5>
            <p class="font-semibold! text-pink-600">
              {{ formatCurrency(foodRevenue) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <Card :pt="{ body: 'p-1.5' }">
      <template #content>
        <Tabs v-model:value="activeTab" class="w-full">
          <TabList class="flex border-b border-gray-200 overflow-x-auto bg-gray-50/50">
            <Tab value="all" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-list text-blue-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ทั้งหมด</span>
                <Tag :value="allCount.toString()" severity="info" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="wait_product" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-box text-orange-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ระหว่างจัดหา</span>
                <Tag
                  :value="waitProductCount.toString()"
                  severity="warning"
                  size="small"
                  class="ml-1"
                />
              </div>
            </Tab>
            <Tab value="wait_confirm" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-clock text-yellow-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">รอตัดสินใจ</span>
                <Tag
                  :value="waitConfirmCount.toString()"
                  severity="warning"
                  size="small"
                  class="ml-1"
                />
              </div>
            </Tab>
            <Tab value="wait_payment" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-credit-card text-blue-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">รอชำระเงิน</span>
                <Tag
                  :value="waitPaymentCount.toString()"
                  severity="warning"
                  size="small"
                  class="ml-1"
                />
              </div>
            </Tab>
            <Tab value="paid_complete" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-check text-green-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ชำระเงินเรียบร้อย</span>
                <Tag
                  :value="paidCompleteCount.toString()"
                  severity="success"
                  size="small"
                  class="ml-1"
                />
              </div>
            </Tab>
            <Tab value="preparing" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-box text-purple-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ระหว่างรอจัดส่ง</span>
                <Tag :value="preparingCount.toString()" severity="info" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="shipping" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-truck text-indigo-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ระหว่างขนส่ง</span>
                <Tag :value="shippingCount.toString()" severity="info" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="received" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-home text-green-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ได้รับสินค้าแล้ว</span>
                <Tag
                  :value="deliveredCount.toString()"
                  severity="success"
                  size="small"
                  class="ml-1"
                />
              </div>
            </Tab>
            <Tab value="damaged" class="flex-shrink-0 pr-10">
              <div
                class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-exclamation-triangle text-red-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">สินค้าเสียหาย</span>
                <Tag :value="damagedCount.toString()" severity="danger" size="small" class="ml-1" />
              </div>
            </Tab>
          </TabList>
        </Tabs>
      </template>
    </Card>

    <!-- Sales Table -->
    <Card :pt="{ body: 'p-4' }">
      <template #header>
        <div class="flex items-center justify-between flex-wrap gap-2 px-4 pt-4">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <i class="pi pi-filter text-gray-600"></i>
              <span class="font-medium text-gray-700">แสดงข้อมูล:</span>
            </div>
            <div class="flex items-center gap-2">
              <Tag
                :value="currentFilterDisplay"
                :severity="
                  activeTab === 'all'
                    ? 'info'
                    : activeTab === 'paid_complete' || activeTab === 'delivered'
                    ? 'success'
                    : activeTab === 'damaged'
                    ? 'danger'
                    : 'warning'
                "
                size="small"
              />
              <span class="text-sm text-gray-600"> ({{ filteredSales.length }} รายการ) </span>
            </div>
          </div>
          <Button
            label="สร้างรายการขาย"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="openAddModal"
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="filteredSales"
          :loading="isLoadingSales"
          :paginator="true"
          :rows="10"
          scrollHeight="600px"
        >
          <Column field="uat" header="วันที่ขาย" :pt="{ columnHeaderContent: 'min-w-[4rem]' }">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{
                formatDate(new Date(slotProps.data.uat))
              }}</span>
            </template>
          </Column>

          <Column field="item" header="เลขรายการ" :pt="{ columnHeaderContent: 'min-w-[7rem]' }">
            <template #body="slotProps">
              <span
                class="font-medium! text-blue-600 cursor-pointer hover:underline text-sm uppercase"
                @click="openDetailModal(slotProps.data)"
              >
                {{ slotProps.data.item }}
              </span>
            </template>
          </Column>

          <Column
            field="status"
            header="สถานะรายการ"
            :pt="{ columnHeaderContent: 'min-w-[9rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <div class="flex flex-col items-center gap-2">
                <Tag
                  :value="salesStore.getStatusTag(slotProps.data.status).label"
                  :severity="salesStore.getStatusTag(slotProps.data.status).severity"
                  size="small"
                  class="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  @click="openStatusManager(slotProps.data)"
                  v-tooltip.top="'คลิกเพื่อเปลี่ยนสถานะ'"
                />
              </div>
            </template>
          </Column>

          <Column
            field="user.code"
            header="รหัสลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[4.5rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <p
                class="text-sm capitalize font-[500]!"
                :class="{
                  'text-gray-500': slotProps.data.user?.status == 'ci',
                  'text-green-500': slotProps.data.user?.status == 'cs',
                  'text-yellow-600': slotProps.data.user?.status == 'css',
                }"
              >
                {{ slotProps.data.user?.code }}
              </p>
            </template>
          </Column>

          <Column
            field="user.displayName"
            header="ชื่อเล่น"
            :pt="{ columnHeaderContent: 'min-w-[4.5rem]' }"
          />

          <Column
            field="user.status"
            header="สถานะลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[5.75rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <Tag
                :value="
                  memberStore.memberStatusOptions.find(
                    (s) => s.value === slotProps.data.user?.status
                  )?.label
                "
                :severity="memberStore.getStatusTag(slotProps.data.user?.status)"
                size="small"
              />
            </template>
          </Column>

          <Column
            field="products"
            header="สินค้า"
            :pt="{ columnHeaderContent: 'min-w-[9rem]', bodyCell: 'p-2' }"
          >
            <template #body="slotProps">
              <div
                class="cursor-pointer group"
                @click="openProductDetailModal(slotProps.data)"
                v-tooltip.top="'ดูรายละเอียดสินค้า'"
              >
                <div class="flex items-center justify-between gap-x-1.5">
                  <p class="text-sm text-gray-600 group-hover:text-blue-500">
                    รายการสินค้า {{ slotProps.data.products?.length }} รายการ
                  </p>
                  <div class="flex items-center !text-xs text-gray-600 group-hover:text-blue-500">
                    <i class="pi pi-eye"></i>
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="totalAmount"
            header="ราคารวม"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <div class="text-end">
                <div class="font-semibold text-green-600 text-sm">
                  {{ formatCurrency(
                    slotProps.data.products ? slotProps.data.products.reduce(
                      (sum: number, product: any) => sum + ((product.price || 0) * product.quantity), 0) : 0
                    )
                  }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ slotProps.data.products?.length || 0 }} รายการ
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="deposit-discount"
            header="มัดจำ/ส่วนลด"
            :pt="{ columnHeaderContent: 'min-w-[7rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <div class="text-end space-y-0.5">
                <div v-if="slotProps.data.deposit > 0" class="text-gray-900 text-sm">
                  มัดจำ: {{ formatCurrency(slotProps.data.deposit) }}
                </div>
                <div v-if="slotProps.data.discount > 0" class="text-red-600 text-sm">
                  ส่วนลด: {{ formatCurrency(slotProps.data.discount) }}
                </div>
                <div
                  v-if="slotProps.data.deposit === 0 && slotProps.data.discount === 0"
                  class="text-gray-400 text-xs"
                >
                  ไม่มี
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="deliveryNo"
            header="ค่าจัดส่ง"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <div class="text-end">
                <div class="font-medium! text-green-600 text-sm">
                  {{ formatCurrency(slotProps.data.deliveryNo || 0)}}
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="netAmount"
            header="ยอดสุทธิ"
            :pt="{ columnHeaderContent: 'min-w-[6rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <div class="text-end">
                <div class="font-semibold text-green-600 text-sm">
                  {{ formatCurrency(getSaleTotalAmount(slotProps.data)) }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ slotProps.data.products?.length || 0 }} รายการ
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="paymentMethod"
            header="ช่องทางการชำระเงิน"
            :pt="{ columnHeaderContent: 'min-w-[8.25rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <div class="flex flex-col items-center">
                <div v-if="slotProps.data.bankCode" class="flex items-center gap-1.5">
                  <img
                    :src="BankData[slotProps.data.bankCode]?.icon"
                    :alt="slotProps.data.bankCode"
                    class="w-6 h-6 mx-auto"
                  />
                  <div class="text-sm text-gray-600">
                    {{ BankData[slotProps.data.bankCode]?.name || slotProps.data.bankCode }}
                  </div>
                </div>
                <div v-else class="flex items-center gap-2">
                  <i class="pi pi-question-circle text-lg text-gray-600"></i>
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="seller"
            header="ผู้ขาย"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <p class="text-sm text-gray-900 font-medium">
                {{ admins?.find((admin) => admin._id === slotProps.data.seller)?.name }}
              </p>
            </template>
          </Column>

          <Column field="note" header="หมายเหตุ" :pt="{ columnHeaderContent: 'min-w-[5rem]' }" />

          <Column
            header="จัดการ"
            :exportable="false"
            frozen
            :pt="{ columnHeaderContent: 'justify-end' }"
          >
            <template #body="slotProps">
              <div class="flex gap-2 justify-end">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  outlined
                  @click="openDeleteModal(slotProps.data)"
                  v-tooltip.top="'ลบรายการขาย'"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  size="small"
                  outlined
                  @click="openEditModal(slotProps.data)"
                  v-tooltip.top="'แก้ไขข้อมูล'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>

  <!-- เพิ่มรายการขาย -->
  <ModalAddSale v-model:visible="showAddModal" :admins="admins || []" />

  <!-- แก้ไขรายการขาย -->
  <ModalEditSale
    v-if="selectedSale"
    v-model:visible="showEditModal"
    :sale-data="selectedSale"
    :admins="admins || []"
  />

  <!-- รายละเอียดรายการขาย -->
  <ModalSaleDetail
    v-if="selectedSale"
    v-model:visible="showDetailModal"
    :sale-data="selectedSale"
  />

  <!-- จัดการสถานะการขาย -->
  <StatusManager
    v-if="selectedSale"
    v-model:visible="showStatusManager"
    :current-status="selectedSale?.status || ''"
    :order-number="selectedSale?.item || ''"
    :current-data="selectedSale"
  />

  <!-- รายละเอียดสินค้า -->
  <ModalProductDetail
    v-if="selectedSale"
    v-model:visible="showProductDetailModal"
    :sale-data="selectedSale"
  />

  <!-- ลบรายการขาย -->
  <ModalDeleteSale
    v-if="!!selectedSaleForDelete"
    :showDeleteModal="showDeleteModal"
    @onCloseDeleteModal="closeDeleteModal"
    :saleData="selectedSaleForDelete"
  />
</template>
