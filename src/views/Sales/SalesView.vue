<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, DataTable, Column, Tag, Button, Tabs, TabList, Tab } from 'primevue'
import { useQuery } from '@tanstack/vue-query'
import ModalAddSale from '@/components/sales/modal/ModalAddSale.vue'
import ModalEditSale from '@/components/sales/modal/ModalEditSale.vue'
import ModalSaleDetail from '@/components/sales/modal/ModalSaleDetail.vue'
import ModalProductDetail from '@/components/sales/modal/ModalProductDetail.vue'
import ModalDeleteSale from '@/components/sales/modal/ModalDeleteSale.vue'
import ModalKPI from '@/components/sales/modal/ModalKPI.vue'
import StatusManager from '@/components/sales/status/StatusManager.vue'
import ModalDetailMember from '@/components/member/ModalDetailMember.vue'
import formatCurrency from '@/utils/formatCurrency'
import BankData from '@/config/BankData'
import { useSalesStore } from '@/stores/sales/sales'
import { useMemberStore, type IMember } from '@/stores/member/member'
import type { ISales, SellingStatus, SellingStatusString } from '@/types/sales'
import { convertStatusNumberToString } from '@/types/sales'
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
const showKPIModal = ref(false)
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
  // Filter by status
  return (
    salesData.value?.filter((sale) => {
      const saleStatusString =
        typeof sale.sellingStatus === 'number'
          ? convertStatusNumberToString(sale.sellingStatus)
          : sale.sellingStatus
      return saleStatusString === activeTab.value
    }) || []
  )
})

// Tab counts - Status
const allCount = computed(() => salesData.value?.length || 0)
const orderStatusCount = computed(
  () =>
    salesData.value?.filter((s) => {
      const statusString =
        typeof s.sellingStatus === 'number'
          ? convertStatusNumberToString(s.sellingStatus)
          : s.sellingStatus
      return statusString === 'order'
    }).length || 0
)
const waitPaymentCount = computed(
  () =>
    salesData.value?.filter((s) => {
      const statusString =
        typeof s.sellingStatus === 'number'
          ? convertStatusNumberToString(s.sellingStatus)
          : s.sellingStatus
      return statusString === 'wait_payment'
    }).length || 0
)
const preparingCount = computed(
  () =>
    salesData.value?.filter((s) => {
      const statusString =
        typeof s.sellingStatus === 'number'
          ? convertStatusNumberToString(s.sellingStatus)
          : s.sellingStatus
      return statusString === 'preparing'
    }).length || 0
)
const shippingCount = computed(
  () =>
    salesData.value?.filter((s) => {
      const statusString =
        typeof s.sellingStatus === 'number'
          ? convertStatusNumberToString(s.sellingStatus)
          : s.sellingStatus
      return statusString === 'shipping'
    }).length || 0
)
const deliveredCount = computed(
  () =>
    salesData.value?.filter((s) => {
      const statusString =
        typeof s.sellingStatus === 'number'
          ? convertStatusNumberToString(s.sellingStatus)
          : s.sellingStatus
      return statusString === 'received'
    }).length || 0
)
const damagedCount = computed(
  () =>
    salesData.value?.filter((s) => {
      const statusString =
        typeof s.sellingStatus === 'number'
          ? convertStatusNumberToString(s.sellingStatus)
          : s.sellingStatus
      return statusString === 'damaged'
    }).length || 0
)

// Current filter display
const currentFilterDisplay = computed(() => {
  if (activeTab.value === 'all') {
    return 'ทั้งหมด'
  }

  const statusMap: Record<SellingStatusString, string> = {
    none: 'ไม่ระบุ',
    order: 'ออเดอร์',
    wait_payment: 'รอชำระเงิน',
    preparing: 'แพ็ครอจัดส่ง',
    shipping: 'ระหว่างขนส่ง',
    received: 'ได้รับสินค้าแล้ว',
    damaged: 'สินค้าเสียหาย',
  }
  return statusMap[activeTab.value as SellingStatusString] || activeTab.value
})

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

// Revenue calculations by category
const totalRevenue = computed(() => {
  return (
    salesData.value
      ?.filter((s) => getStatusStepOrder(s.sellingStatus) >= getStatusStepOrder('preparing'))
      .reduce((sum, sale) => {
        const saleTotal = sale.products
          ? sale.products.reduce((productSum, product) => {
              return productSum + (product.price || 0) * product.quantity
            }, 0)
          : 0
        return sum + (saleTotal - sale.discount - sale.deliveryNo)
      }, 0) || 0
  )
})

const totalDiscount = computed(() => {
  return (
    salesData.value
      ?.filter((s) => getStatusStepOrder(s.sellingStatus) >= getStatusStepOrder('preparing'))
      .reduce((sum, sale) => {
        return sum + (sale.discount || 0)
      }, 0) || 0
  )
})

const totalDeposit = computed(() => {
  return (
    salesData.value
      ?.filter((s) => getStatusStepOrder(s.sellingStatus) === getStatusStepOrder('wait_payment'))
      .reduce((sum, sale) => {
        const saleTotal = sale.products
          ? sale.products.reduce((productSum, product) => {
              return productSum + (product.price || 0) * product.quantity
            }, 0)
          : 0
        return sum + (saleTotal - sale.discount)
      }, 0) || 0
  )
})

const totalDelivery = computed(() => {
  return (
    salesData.value
      ?.filter((s) => getStatusStepOrder(s.sellingStatus) >= getStatusStepOrder('preparing'))
      .reduce((sum, sale) => {
        return sum + (sale.deliveryNo || 0)
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
  const productTotal = sale.products
    ? sale.products.reduce((sum: number, product: any) => {
        return sum + (product.price || 0) * product.quantity
      }, 0)
    : 0
  const netAmount = productTotal - (sale.deliveryNo || 0) - sale.discount
  return netAmount < 0 ? 0 : netAmount
}

const getProductTotal = (products: any[] | undefined) => {
  if (!products) return 0
  return products.reduce((sum: number, product: any) => {
    return sum + (product.price || 0) * product.quantity
  }, 0)
}

// Modal functions
const openAddModal = () => {
  showAddModal.value = true
}

const selectedSaleForEdit = ref<ISales | null>(null)
const openEditModal = (sale: ISales) => {
  selectedSaleForEdit.value = sale
  showEditModal.value = true
}
const closeEditModal = () => {
  showEditModal.value = false
  selectedSaleForEdit.value = null
}

const selectedSaleForDetail = ref<ISales | null>(null)
const openDetailModal = (sale: ISales) => {
  selectedSaleForDetail.value = sale
  showDetailModal.value = true
}
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedSaleForDetail.value = null
}

const targetStatus = ref<string | undefined>(undefined)
const openStatusManager = (sale: ISales, status?: string) => {
  selectedSale.value = sale
  targetStatus.value = status
  showStatusManager.value = true
}

const selectedSaleForProductDetail = ref<ISales | null>(null)
const openProductDetailModal = (sale: ISales) => {
  selectedSaleForProductDetail.value = sale
  showProductDetailModal.value = true
}

const closeProductDetailModal = () => {
  showProductDetailModal.value = false
  selectedSaleForProductDetail.value = null
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

const showMemberDetailModal = ref(false)
const selectedMemberId = ref<string | null>(null)

const openMemberDetailModal = (memberId: string) => {
  const id = memberId
  selectedMemberId.value = id
  showMemberDetailModal.value = true
}
const closeMemberDetailModal = () => {
  showMemberDetailModal.value = false
  selectedMemberId.value = null
}

const openKPIModal = () => {
  showKPIModal.value = true
}

const adminStore = useAdminStore()
const { data: admins } = useQuery<IAdmin[]>({
  queryKey: ['get_admins'],
  queryFn: () => adminStore.onGetAdmins(),
})

const { data: members } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})
const findMemberData = (memberId: string) => {
  return members.value?.find((member) => member._id === memberId) || null
}

const getPaymentMethodSeverity = (
  paymentMethod: string | null | undefined
): 'success' | 'info' | 'warning' | 'danger' => {
  switch (paymentMethod) {
    case 'transfer':
    case 'card':
      return 'info' // สีน้ำเงิน
    case 'cod':
    case 'credit':
      return 'success' // สีเขียว
    case 'cash':
      return 'danger' // สีแดง
    case 'order':
      return 'warning' // สีส้ม
    default:
      return 'info'
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white cursor-pointer hover:shadow-lg !transition !ease-in-out !duration-150 hover:scale-105"
          @click="openKPIModal">
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-1">
              <h2 class="text-lg font-semibold!">สรุปยอดขาย</h2>
              <i class="pi pi-chart-line text-xl"></i>
            </div>
            <p class="text-xl font-semibold">{{ formatCurrency(totalRevenue) }}</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-4 text-white">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold! mb-1">สรุปยอดส่วนลด</h2>
            <p class="text-xl font-semibold">{{ formatCurrency(totalDiscount) }}</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold! mb-1">สรุปยอดรอชำระ</h2>
            <p class="text-xl font-semibold">{{ formatCurrency(totalDeposit) }}</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-pink-700 to-pink-900 rounded-2xl p-4 text-white">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold! mb-1">ยอดค่าจัดส่ง</h2>
            <p class="text-xl font-semibold">{{ formatCurrency(totalDelivery) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <Card :pt="{ body: 'p-1.5' }">
      <template #content>
        <Tabs v-model:value="activeTab" class="w-full">
          <TabList class="flex border-b border-gray-200 overflow-x-auto bg-gray-50/50">
            <!-- All Tab -->
            <Tab value="all" class="flex-shrink-0">
              <div class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg">
                <i class="pi pi-list text-blue-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ทั้งหมด</span>
                <Tag :value="allCount.toString()" severity="info" size="small" class="ml-1" />
              </div>
            </Tab>

            <!-- Status Tabs -->
            <Tab value="order" class="flex-shrink-0">
              <div class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg">
                <i class="pi pi-shopping-cart text-orange-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ออเดอร์</span>
                <Tag :value="orderStatusCount.toString()" severity="warning" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="wait_payment" class="flex-shrink-0">
              <div class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg">
                <i class="pi pi-credit-card text-blue-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">รอชำระเงิน</span>
                <Tag :value="waitPaymentCount.toString()" severity="warning" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="preparing" class="flex-shrink-0">
              <div class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg">
                <i class="pi pi-box text-purple-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">แพ็ครอจัดส่ง</span>
                <Tag :value="preparingCount.toString()" severity="info" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="shipping" class="flex-shrink-0">
              <div class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg">
                <i class="pi pi-truck text-indigo-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ระหว่างขนส่ง</span>
                <Tag :value="shippingCount.toString()" severity="info" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="received" class="flex-shrink-0">
              <div class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg">
                <i class="pi pi-home text-green-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ได้รับสินค้าแล้ว</span>
                <Tag :value="deliveredCount.toString()" severity="success" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="damaged" class="flex-shrink-0 pr-10">
              <div class="flex items-center gap-1.5 px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg">
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
              <Tag :value="currentFilterDisplay" :severity="
                  activeTab === 'all'
                    ? 'info'
                    : activeTab === 'received'
                    ? 'success'
                    : activeTab === 'damaged'
                    ? 'danger'
                    : 'warning'
                " size="small" />
              <span class="text-sm text-gray-600"> ({{ filteredSales.length }} รายการ) </span>
            </div>
          </div>
          <Button label="สร้างรายการขาย" icon="pi pi-plus" severity="success" size="small" @click="openAddModal" />
        </div>
      </template>
      <template #content>
        <DataTable :value="filteredSales" :loading="isLoadingSales" :paginator="true" :rows="10" scrollHeight="600px">
          <Column field="uat" header="วันที่ขาย" :pt="{ columnHeaderContent: 'min-w-[4rem]' }">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{
                formatDate(new Date(slotProps.data.uat))
                }}</span>
            </template>
          </Column>

          <Column field="item" header="เลขรายการ" :pt="{ columnHeaderContent: 'min-w-[7rem]' }">
            <template #body="slotProps">
              <span class="font-medium! text-blue-600 cursor-pointer hover:underline text-sm uppercase"
                @click="openDetailModal(slotProps.data)">
                {{ slotProps.data.item }}
              </span>
            </template>
          </Column>

          <Column field="user.displayName" header="ชื่อเล่น">
            <template #body="slotProps">
              <div class="cursor-pointer duration-200" @click="openMemberDetailModal(slotProps.data.user)"
                v-tooltip.top="'คลิกเพื่อดูรายละเอียดลูกค้า'">
                <p class="text-gray-700 text-sm truncate group-hover:text-blue-600 transition-colors">
                  {{ findMemberData(slotProps.data.user)?.displayName || '-' }}
                </p>
              </div>
            </template>
          </Column>

          <Column field="status" header="สถานะรายการ"
            :pt="{ columnHeaderContent: 'min-w-[7rem] justify-center', bodyCell: 'text-center' }">
            <template #body="slotProps">
              <div class="flex flex-col items-center gap-2">
                <Tag :value="salesStore.getStatusTag(slotProps.data.sellingStatus).label"
                  :severity="salesStore.getStatusTag(slotProps.data.sellingStatus).severity" size="small"
                  class="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  @click="openStatusManager(slotProps.data)" v-tooltip.top="'คลิกเพื่อเปลี่ยนสถานะ'" />
              </div>
            </template>
          </Column>

          <Column field="paymentMethod" header="สถานะการชำระ"
            :pt="{ columnHeaderContent: 'min-w-[7rem] justify-center', bodyCell: 'text-center' }">
            <template #body="slotProps">
              <Tag :value="
                  salesStore.paymentMethods.find((pm) => pm.value === slotProps.data.paymentMethod)
                    ?.label || '-'
                " :severity="getPaymentMethodSeverity(slotProps.data.paymentMethod)" size="small" />
            </template>
          </Column>

          <Column field="products" header="สินค้า" :pt="{ columnHeaderContent: 'min-w-[9rem]', bodyCell: 'p-2' }">
            <template #body="slotProps">
              <div class="cursor-pointer group" @click="openProductDetailModal(slotProps.data)"
                v-tooltip.top="'ดูรายละเอียดสินค้า'">
                <div  class="flex items-center justify-between gap-x-1.5">
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

          <Column field="totalAmount" header="ราคารวม"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-end', bodyCell: 'text-end' }">
            <template #body="slotProps">
              <div class="text-end">
                <div class="font-semibold text-green-600 text-sm">
                  {{ formatCurrency(getProductTotal(slotProps.data.products)) }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ slotProps.data.products?.length || 0 }} รายการ
                </div>
              </div>
            </template>
          </Column>

          <Column field="deposit-discount" header="มัดจำ/ส่วนลด"
            :pt="{ columnHeaderContent: 'min-w-[7rem] justify-end', bodyCell: 'text-end' }">
            <template #body="slotProps">
              <div class="text-end space-y-0.5">
                <div v-if="slotProps.data.deposit > 0" class="text-gray-900 text-sm">
                  มัดจำ: {{ formatCurrency(slotProps.data.deposit) }}
                </div>
                <div v-if="slotProps.data.discount > 0" class="text-red-600 text-sm">
                  ส่วนลด: {{ formatCurrency(slotProps.data.discount) }}
                </div>
                <div v-if="slotProps.data.deposit === 0 && slotProps.data.discount === 0" class="text-gray-400 text-xs">
                  ไม่มี
                </div>
              </div>
            </template>
          </Column>

          <Column field="deliveryNo" header="ค่าจัดส่ง"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-end', bodyCell: 'text-end' }">
            <template #body="slotProps">
              <div class="text-end">
                <div class="font-medium! text-green-600 text-sm">
                  {{ formatCurrency(slotProps.data.deliveryNo || 0) }}
                </div>
              </div>
            </template>
          </Column>

          <Column field="netAmount" header="ยอดสุทธิ"
            :pt="{ columnHeaderContent: 'min-w-[6rem] justify-end', bodyCell: 'text-end' }">
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

          <Column field="paymentMethod" header="ช่องทางการชำระเงิน"
            :pt="{ columnHeaderContent: 'min-w-[8.25rem] justify-center', bodyCell: 'text-center' }">
            <template #body="slotProps">
              <div class="flex flex-col items-center">
                <div v-if="slotProps.data.bankCode" class="flex items-center gap-1.5">
                  <img :src="BankData[slotProps.data.bankCode]?.icon" :alt="slotProps.data.bankCode"
                    class="w-6 h-6 mx-auto" />
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

          <Column field="seller" header="ผู้ขาย"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-center', bodyCell: 'text-center' }">
            <template #body="slotProps">
              <p class="text-sm text-gray-900 font-medium">
                {{ admins?.find((admin) => admin._id === slotProps.data.seller)?.name }}
              </p>
            </template>
          </Column>

          <Column field="note" header="หมายเหตุ" :pt="{ columnHeaderContent: 'min-w-[5rem]' }" />

          <Column header="จัดการ" :exportable="false" frozen :pt="{ columnHeaderContent: 'justify-end' }">
            <template #body="slotProps">
              <div class="flex gap-2 justify-end">
                <Button v-if="slotProps.data.sellingStatus < 5 && false" icon="pi pi-sync" severity="info" size="small"
                  outlined @click="openStatusManager(slotProps.data)" v-tooltip.top="'เปลี่ยนสถานะ'" />
                <Button icon="pi pi-trash" severity="danger" size="small" outlined
                  @click="openDeleteModal(slotProps.data)" v-tooltip.top="'ลบรายการขาย'" />
                <Button icon="pi pi-pencil" severity="warning" size="small" outlined
                  @click="openEditModal(slotProps.data)" v-tooltip.top="'แก้ไขข้อมูล'" />
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
  <ModalEditSale v-if="selectedSaleForEdit" :visible="showEditModal" @close-edit-modal="closeEditModal"
    :sale-data="selectedSaleForEdit" :admins="admins || []" />

  <!-- รายละเอียดรายการขาย -->
  <ModalSaleDetail v-if="selectedSaleForDetail" :visible="showDetailModal" @close-detail-modal="closeDetailModal"
    :sale-data="selectedSaleForDetail" />

  <!-- จัดการสถานะการขาย -->
  <StatusManager v-if="selectedSale" v-model:visible="showStatusManager" :current-status="
      selectedSale
        ? typeof selectedSale.sellingStatus === 'number'
          ? convertStatusNumberToString(selectedSale.sellingStatus)
          : selectedSale.sellingStatus
        : ''
    " :order-number="selectedSale?.item || ''" :current-data="selectedSale" :target-status="targetStatus" />

  <!-- รายละเอียดสินค้า -->
  <ModalProductDetail v-if="selectedSaleForProductDetail" :visible="showProductDetailModal"
    @close-product-detail-modal="closeProductDetailModal" :sale-data="selectedSaleForProductDetail" />

  <!-- ลบรายการขาย -->
  <ModalDeleteSale v-if="!!selectedSaleForDelete" :showDeleteModal="showDeleteModal"
    @onCloseDeleteModal="closeDeleteModal" :saleData="selectedSaleForDelete" />

  <!-- รายละเอียดลูกค้า -->
  <ModalDetailMember v-if="!!selectedMemberId" :showDetailModal="showMemberDetailModal"
    @onCloseDetailModal="closeMemberDetailModal" :id="selectedMemberId" />

  <!-- KPI Modal -->
  <ModalKPI v-model:visible="showKPIModal" :sales-data="salesData || []" />
</template>
