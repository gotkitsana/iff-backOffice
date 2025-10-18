<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, DataTable, Column, Tag, Button, Tabs, TabList, Tab } from 'primevue'
import { useQuery } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import ModalAddSale from '@/components/sales/ModalAddSale.vue'
import ModalEditSale from '@/components/sales/ModalEditSale.vue'
import ModalSaleDetail from '@/components/sales/ModalSaleDetail.vue'
import StatusManager from '@/components/sales/StatusManager.vue'
import formatCurrency from '@/utils/formatCurrency'
import BankData from '@/config/BankData'
import { useSalesStore, type ISales, type SellingStatus } from '@/stores/sales/sales'

// Stores
const salesStore = useSalesStore()

// Data
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showStatusManager = ref(false)
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
  () => salesData.value?.filter((s) => s.status === 'delivered').length || 0
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

// Revenue calculations by category
const totalRevenue = computed(() => {
  return (
    salesData.value
      ?.filter((s) => s.status === 'paid_complete')
      .reduce((sum, sale) => {
        const saleTotal = sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0)
        return sum + saleTotal - sale.discount + sale.deposit
      }, 0) || 0
  )
})

const fishRevenue = computed(() => {
  return (
    salesData.value
      ?.filter((s) => s.status === 'paid_complete' && s.products.some((p) => p.category === 'fish'))
      .reduce((sum, sale) => {
        const saleTotal = sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0)
        return sum + saleTotal - sale.discount + sale.deposit
      }, 0) || 0
  )
})

const serviceRevenue = computed(() => {
  return (
    salesData.value
      ?.filter(
        (s) => s.status === 'paid_complete' && s.products.some((p) => p.category === 'service')
      )
      .reduce((sum, sale) => {
        const saleTotal = sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0)
        return sum + saleTotal - sale.discount + sale.deposit
      }, 0) || 0
  )
})

const constructionRevenue = computed(() => {
  return (
    salesData.value
      ?.filter(
        (s) => s.status === 'paid_complete' && s.products.some((p) => p.category === 'construction')
      )
      .reduce((sum, sale) => {
        const saleTotal = sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0)
        return sum + saleTotal - sale.discount + sale.deposit
      }, 0) || 0
  )
})

const microorganismRevenue = computed(() => {
  return (
    salesData.value
      ?.filter(
        (s) =>
          s.status === 'paid_complete' && s.products.some((p) => p.category === 'microorganism')
      )
      .reduce((sum, sale) => {
        const saleTotal = sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0)
        return sum + saleTotal - sale.discount + sale.deposit
      }, 0) || 0
  )
})

const foodRevenue = computed(() => {
  return (
    salesData.value
      ?.filter((s) => s.status === 'paid_complete' && s.products.some((p) => p.category === 'food'))
      .reduce((sum, sale) => {
        const saleTotal = sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0)
        return sum + saleTotal - sale.discount + sale.deposit
      }, 0) || 0
  )
})

const equipmentRevenue = computed(() => {
  return (
    salesData.value
      ?.filter(
        (s) => s.status === 'paid_complete' && s.products.some((p) => p.category === 'equipment')
      )
      .reduce((sum, sale) => {
        const saleTotal = sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0)
        return sum + saleTotal - sale.discount + sale.deposit
      }, 0) || 0
  )
})

const medicineRevenue = computed(() => {
  return (
    salesData.value
      ?.filter(
        (s) => s.status === 'paid_complete' && s.products.some((p) => p.category === 'medicine')
      )
      .reduce((sum, sale) => {
        const saleTotal = sale.products.reduce((productSum, product) => {
          return productSum + (product.price || 0) * product.quantity
        }, 0)
        return sum + saleTotal - sale.discount + sale.deposit
      }, 0) || 0
  )
})

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
  const productTotal = sale.products.reduce((sum, product) => {
    return sum + (product.price || 0) * product.quantity
  }, 0)
  return productTotal - sale.discount + sale.deposit
}

const getSaleProductCount = (sale: ISales) => {
  return sale.products.reduce((sum, product) => sum + product.quantity, 0)
}

const getSaleCategories = (sale: ISales) => {
  const categories = [
    ...new Set(sale.products.map((p) => p.category).filter((cat): cat is string => cat !== null)),
  ]
  return categories
}

const getCategoryIcon = (category: string | null) => {
  const iconMap: Record<string, string> = {
    fish: 'pi-fish',
    equipment: 'pi-box',
    service: 'pi-wrench',
    construction: 'pi-building',
    medicine: 'pi-plus-circle',
    food: 'pi-heart',
    microorganism: 'pi-circle',
    water: 'pi-droplet',
  }
  return iconMap[category || ''] || 'pi-box'
}

const getCategoryColor = (category: string | null) => {
  const colorMap: Record<string, string> = {
    fish: 'text-gray-600',
    equipment: 'text-green-600',
    service: 'text-purple-600',
    construction: 'text-orange-600',
    medicine: 'text-red-600',
    food: 'text-pink-600',
    microorganism: 'text-teal-600',
    water: 'text-blue-600',
  }
  return colorMap[category || ''] || 'text-gray-600'
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

const handleSaleUpdated = (updatedSale: ISales) => {
  const index = salesData.value?.findIndex((s) => s._id === updatedSale._id)
  if (index !== -1 && salesData.value) {
    salesData.value[index as number] = updatedSale
  }
  showEditModal.value = false
}

const handleCancelSale = (sale: ISales) => {
  if (confirm(`คุณต้องการยกเลิกการขาย ${sale.item} หรือไม่?`)) {
    sale.status = 'damaged'
    toast.success('ยกเลิกการขายสำเร็จ')
  }
}

const handleStatusChange = (
  newStatus: string,
  bankInfo?: { bank: string; accountNumber?: string; amount?: number }
) => {
  if (selectedSale.value) {
    selectedSale.value.status = newStatus

    // Update bank information if provided
    if (bankInfo) {
      selectedSale.value.bankCode = bankInfo.bank
      selectedSale.value.bankAccount = bankInfo.accountNumber || ''
    }

    toast.success('เปลี่ยนสถานะสำเร็จ')
    showStatusManager.value = false
  }
}
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
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold! mb-1">📊 สรุปรายงาน การขาย</h2>
            <p class="text-blue-100">ภาพรวมยอดขายแยกตามหมวดหมู่สินค้า</p>
          </div>
          <div class="hidden md:block">
            <div class="text-right">
              <p class="text-3xl font-bold">{{ formatCurrency(totalRevenue) }}</p>
              <p class="text-blue-100">ยอดขายรวมทั้งหมด</p>
            </div>
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
        <Tabs v-model="activeTab" class="w-full" :value="activeTab">
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
            <Tab value="delivered" class="flex-shrink-0">
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
        <div class="flex items-center justify-between px-4 pt-4">
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
          <Column field="uat" header="วันที่ขาย" :pt="{ columnHeaderContent: 'min-w-[4.25rem]' }">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{
                formatDate(new Date(slotProps.data.uat * 1000))
              }}</span>
            </template>
          </Column>

          <Column field="item" header="เลขรายการ" :pt="{ columnHeaderContent: 'min-w-[6.5rem]' }">
            <template #body="slotProps">
              <span
                class="font-medium! text-blue-600 cursor-pointer hover:underline text-sm"
                @click="openDetailModal(slotProps.data)"
              >
                {{ slotProps.data.item }}
              </span>
            </template>
          </Column>

          <Column
            field="status"
            header="สถานะรายการ"
            :pt="{ columnHeaderContent: 'min-w-[9.25rem] justify-center', bodyCell: 'text-center' }"
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
            field="user"
            header="ลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[6rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <div class="flex flex-col items-center">
                <span class="font-medium text-sm text-gray-900">
                  {{ slotProps.data.user || 'ไม่ระบุ' }}
                </span>
                <span class="text-xs text-gray-500"> ID: {{ slotProps.data._id.slice(-6) }} </span>
              </div>
            </template>
          </Column>

          <Column
            field="products"
            header="สินค้า"
            :pt="{ columnHeaderContent: 'min-w-[12rem]', bodyCell: 'p-2' }"
          >
            <template #body="slotProps">
              <div class="space-y-2">
                <!-- Product List -->
                <div class="space-y-1">
                  <div
                    v-for="(product, index) in slotProps.data.products"
                    :key="index"
                    class="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                  >
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <i
                        :class="`pi ${getCategoryIcon(product.category)} text-sm ${getCategoryColor(
                          product.category
                        )}`"
                      ></i>
                      <span class="text-sm text-gray-900 truncate">{{ product.name }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-gray-600">
                      <span>{{ product.quantity }} ชิ้น</span>
                      <span class="font-medium">
                        {{ formatCurrency((product.price || 0) * product.quantity) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Summary -->
                <div class="flex items-center justify-between pt-1 border-t border-gray-200">
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-gray-500">รวม:</span>
                    <span class="text-sm font-medium text-gray-900"
                      >{{ getSaleProductCount(slotProps.data) }} ชิ้น</span
                    >
                  </div>
                  <div class="text-sm font-semibold text-gray-900">
                    {{
                      formatCurrency(
                        slotProps.data.products.reduce(
                          (sum: number, p: { price: number | null; quantity: number }) => sum + (p.price || 0) * p.quantity,
                          0
                        )
                      )
                    }}
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="categories"
            header="หมวดหมู่"
            :pt="{ columnHeaderContent: 'min-w-[8rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <div class="flex flex-wrap gap-1 justify-center">
                <Tag
                  v-for="category in getSaleCategories(slotProps.data)"
                  :key="category"
                  :value="
                    salesStore.categoryTypes.find((t) => t.value === category)?.label || category
                  "
                  severity="secondary"
                  size="small"
                  class="text-xs"
                />
              </div>
            </template>
          </Column>

          <Column
            field="deposit"
            header="มัดจำ/ส่วนลด"
            :pt="{ columnHeaderContent: 'min-w-[6rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <div class="text-end space-y-1">
                <div v-if="slotProps.data.deposit > 0" class="text-gray-900 text-sm">
                  มัดจำ: {{ formatCurrency(slotProps.data.deposit) }}
                </div>
                <div v-if="slotProps.data.discount > 0" class="text-red-600 text-sm">
                  ส่วนลด: -{{ formatCurrency(slotProps.data.discount) }}
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
            field="netAmount"
            header="ยอดสุทธิ"
            :pt="{ columnHeaderContent: 'min-w-[6rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <div class="text-end">
                <div class="font-semibold text-green-600 text-sm">
                  {{ formatCurrency(getSaleTotalAmount(slotProps.data)) }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ slotProps.data.products.length }} รายการ
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
              <div class="flex flex-col items-center gap-1">
                <div v-if="slotProps.data.payment === 'transfer' && slotProps.data.bankCode">
                  <img
                    :src="BankData[slotProps.data.bankCode]?.icon"
                    :alt="slotProps.data.bankCode"
                    class="w-6 h-6 mx-auto"
                  />
                  <div class="text-xs text-gray-500 mt-1">
                    {{ BankData[slotProps.data.bankCode]?.name || slotProps.data.bankCode }}
                  </div>
                </div>
                <div v-else class="flex items-center gap-2">
                  <i
                    :class="[
                      `pi ${
                        slotProps.data.payment === 'cash'
                          ? 'pi-money-bill'
                          : slotProps.data.payment === 'credit'
                          ? 'pi-credit-card'
                          : slotProps.data.payment === 'promptpay'
                          ? 'pi-qrcode'
                          : 'pi-question-circle'
                      } text-lg`,
                      {
                        'text-green-600': slotProps.data.payment === 'cash',
                        'text-blue-600': slotProps.data.payment === 'credit',
                        'text-purple-600': slotProps.data.payment === 'promptpay',
                        'text-gray-600': slotProps.data.payment === 'other',
                      },
                    ]"
                  ></i>
                  <span class="text-xs text-gray-600">
                    {{
                      salesStore.paymentMethods.find((p) => p.value === slotProps.data.payment)
                        ?.label || slotProps.data.payment
                    }}
                  </span>
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
              <div class="flex flex-col items-center">
                <span class="text-sm text-gray-900 font-medium">{{ slotProps.data.seller }}</span>
                <span class="text-xs text-gray-500">{{ slotProps.data.deliveryStatus }}</span>
              </div>
            </template>
          </Column>

          <Column
            header="จัดการ"
            :exportable="false"
            frozen
            :pt="{ columnHeaderContent: 'justify-end' }"
          >
            <template #body="slotProps">
              <div class="flex gap-2 justify-end">
                <Button
                  v-if="
                    slotProps.data.status === 'wait_product' ||
                    slotProps.data.status === 'wait_confirm'
                  "
                  icon="pi pi-times"
                  severity="danger"
                  size="small"
                  outlined
                  @click="handleCancelSale(slotProps.data)"
                  v-tooltip.top="'ยกเลิกการขายนี้'"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  size="small"
                  outlined
                  @click="openEditModal(slotProps.data)"
                  v-tooltip.top="'แก้ไขข้อมูล'"
                />
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  size="small"
                  outlined
                  @click="openDetailModal(slotProps.data)"
                  v-tooltip.top="'ดูรายละเอียด'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>

  <!-- Modal Components -->
  <ModalAddSale v-model:visible="showAddModal" />

  <ModalEditSale
    v-model:visible="showEditModal"
    :sale-data="selectedSale"
    @sale-updated="handleSaleUpdated"
  />

  <ModalSaleDetail
    v-if="selectedSale"
    v-model:visible="showDetailModal"
    :sale-data="selectedSale"
  />

  <StatusManager
    v-model:visible="showStatusManager"
    :current-status="selectedSale?.status || ''"
    :order-number="selectedSale?.item || ''"
    @status-changed="handleStatusChange"
  />
</template>
