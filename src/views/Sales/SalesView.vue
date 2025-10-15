<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, DataTable, Column, Tag, Button, Select } from 'primevue'
import { useProductStore, type IProduct } from '@/stores/auction/product'
import { useQuery } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import ModalAddSale from '@/components/sales/ModalAddSale.vue'
import ModalEditSale from '@/components/sales/ModalEditSale.vue'
import ModalSaleDetail from '@/components/sales/ModalSaleDetail.vue'
import StatusManager from '@/components/sales/StatusManager.vue'
import formatCurrency from '@/utils/formatCurrency'

// Stores
const productStore = useProductStore()

// Data
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showStatusManager = ref(false)
const showSettingsModal = ref(false)
const selectedSale = ref<{
  id: number
  orderNumber: string
  customerCode: string
  customerType: string
  customerName: string
  customerNickname: string
  customerPhone: string
  customerEmail: string
  customerAddress: string
  customerProvince: string
  productCategory: string
  productType: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  deposit: number
  discount: number
  netAmount: number
  paymentMethod: string
  seller: string
  shippingStatus: string
  saleDate: Date
  status: string
  notes: string
} | null>(null)
const statusFilter = ref('')

// Queries
const { isLoading: productsLoading } = useQuery<IProduct[]>({
  queryKey: ['get_products_for_sale'],
  queryFn: () => productStore.onGetProducts(),
})

// Sample sales data
const sales = ref([
  {
    id: 1,
    orderNumber: 'ORD-2024-001',
    customerCode: '28',
    customerType: 'ลูกค้า',
    customerName: 'คุณสมชาย ใจดี',
    customerNickname: 'ชาย',
    customerPhone: '081-234-5678',
    customerEmail: 'somchai@email.com',
    customerAddress: '123 ถนนสุขุมวิท',
    customerProvince: 'กรุงเทพฯ',
    productCategory: 'ขายสินค้า',
    productType: 'สารปรับสภาพน้ำ',
    productName: 'จุลินทรีย์ SUMI',
    quantity: 2,
    unitPrice: 590,
    totalPrice: 1180,
    deposit: 0,
    discount: 0,
    netAmount: 1180,
    paymentMethod: 'SCB',
    seller: 'Bert',
    shippingStatus: 'ชำระเงินแล้ว',
    saleDate: new Date('2024-10-11T10:30:00'),
    status: 'paid_complete',
    notes: '',
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-002',
    customerCode: '25',
    customerType: 'ลูกค้า',
    customerName: 'คุณนิดา สวยงาม',
    customerNickname: 'นิดา',
    customerPhone: '082-345-6789',
    customerEmail: 'nida@email.com',
    customerAddress: '456 ถนนรัชดาภิเษก',
    customerProvince: 'กรุงเทพฯ',
    productCategory: 'ขายสินค้า',
    productType: 'สารปรับสภาพน้ำ',
    productName: 'จุลินทรีย์ SUMI',
    quantity: 2,
    unitPrice: 590,
    totalPrice: 1180,
    deposit: 0,
    discount: 0,
    netAmount: 1180,
    paymentMethod: 'SCB',
    seller: 'Bert',
    shippingStatus: 'รอชำระเงิน',
    saleDate: new Date('2024-10-11T14:20:00'),
    status: 'wait_payment',
    notes: '',
  },
])

// Computed
const filteredSales = computed(() => {
  if (!statusFilter.value) {
    return sales.value
  }
  return sales.value.filter((sale) => sale.status === statusFilter.value)
})

// Stats
const totalSales = computed(() => sales.value.length)
const completedSales = computed(
  () => sales.value.filter((s) => s.status === 'paid_complete').length
)
const pendingSales = computed(() => sales.value.filter((s) => s.status === 'wait_payment').length)
const totalRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'paid_complete')
    .reduce((sum, sale) => sum + sale.netAmount, 0)
)

// Utility functions
const formatDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

const getStatusTag = (status: string) => {
  switch (status) {
    case 'wait_product':
      return { label: 'รอจัดหา', severity: 'warning' }
    case 'wait_confirm':
      return { label: 'รอยืนยัน', severity: 'warning' }
    case 'wait_payment':
      return { label: 'รอชำระเงิน', severity: 'warning' }
    case 'paid_complete':
      return { label: 'ชำระเงินเรียบร้อย', severity: 'success' }
    case 'pack_and_ship':
      return { label: 'แพ็คเตรียมสินค้ารอจัดส่ง', severity: 'info' }
    case 'shipping':
      return { label: 'อยู่ระหว่างขนส่ง', severity: 'info' }
    case 'received':
      return { label: 'ได้รับสินค้าเรียบร้อย', severity: 'success' }
    case 'damaged':
      return { label: 'สินค้าเสียหาย', severity: 'danger' }
    default:
      return { label: status, severity: 'info' }
  }
}

const getPaymentMethodTag = (method: string) => {
  switch (method) {
    case 'SCB':
      return { label: 'SCB', severity: 'info' }
    case 'KBANK':
      return { label: 'KBANK', severity: 'info' }
    case 'BBL':
      return { label: 'BBL', severity: 'info' }
    case 'cash':
      return { label: 'เงินสด', severity: 'success' }
    case 'transfer':
      return { label: 'โอนเงิน', severity: 'info' }
    case 'credit':
      return { label: 'เครดิต', severity: 'warning' }
    default:
      return { label: method, severity: 'secondary' }
  }
}

// Modal functions
const openAddModal = () => {
  showAddModal.value = true
}

const openEditModal = (sale: (typeof sales.value)[0]) => {
  selectedSale.value = sale
  showEditModal.value = true
}

const openDetailModal = (sale: (typeof sales.value)[0]) => {
  selectedSale.value = sale
  showDetailModal.value = true
}

const openStatusManager = (sale: (typeof sales.value)[0]) => {
  selectedSale.value = sale
  showStatusManager.value = true
}

const handleSaleUpdated = (updatedSale: (typeof sales.value)[0]) => {
  const index = sales.value.findIndex((s) => s.id === updatedSale.id)
  if (index !== -1) {
    sales.value[index] = updatedSale
  }
  showEditModal.value = false
}

const handleCancelSale = (sale: (typeof sales.value)[0]) => {
  if (confirm(`คุณต้องการยกเลิกการขาย ${sale.orderNumber} หรือไม่?`)) {
    sale.status = 'damaged'
    toast.success('ยกเลิกการขายสำเร็จ')
  }
}

const handleCompleteSale = (sale: (typeof sales.value)[0]) => {
  if (confirm(`คุณต้องการยืนยันการขาย ${sale.orderNumber} หรือไม่?`)) {
    sale.status = 'paid_complete'
    toast.success('ยืนยันการขายสำเร็จ')
  }
}

const handleStatusChange = (newStatus: string) => {
  if (selectedSale.value) {
    selectedSale.value.status = newStatus
    toast.success('เปลี่ยนสถานะสำเร็จ')
    showStatusManager.value = false
  }
}

const handleSettingsUpdated = (updatedData: (typeof sales.value)[0] | null) => {
  if (updatedData) {
    const index = sales.value.findIndex((s) => s.id === updatedData.id)
    if (index !== -1) {
      sales.value[index] = updatedData
    }
  }
  showSettingsModal.value = false
}

// Sales status options for filter
const salesStatuses = [
  { label: 'รอจัดหา', value: 'wait_product' },
  { label: 'รอยืนยัน', value: 'wait_confirm' },
  { label: 'รอชำระเงิน', value: 'wait_payment' },
  { label: 'ชำระเงินเรียบร้อย', value: 'paid_complete' },
  { label: 'แพ็คเตรียมสินค้ารอจัดส่ง', value: 'pack_and_ship' },
  { label: 'อยู่ระหว่างขนส่ง', value: 'shipping' },
  { label: 'ได้รับสินค้าเรียบร้อย', value: 'received' },
  { label: 'สินค้าเสียหาย', value: 'damaged' },
]
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ระบบขาย</h1>
        <p class="text-gray-600">จัดการการขายและติดตามยอดขาย</p>
      </div>
      <div class="flex space-x-3">
        <Button
          label="เพิ่มข้อมูล"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openAddModal"
        />
        <!-- <Button label="รายงานยอดขาย" icon="pi pi-chart-bar" severity="info" size="small" /> -->
      </div>
    </div>

    <!-- Sales Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-[600]! text-gray-600 mb-1">ยอดขายทั้งหมด</p>
              <p class="text-xl md:text-2xl text-blue-600">
                {{ totalSales }}
              </p>
              <p class="text-xs text-gray-500">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-shopping-cart text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-[600]! text-gray-600 mb-1">ขายเสร็จสิ้น</p>
              <p class="text-xl md:text-2xl text-green-600">
                {{ completedSales }}
              </p>
              <p class="text-xs text-gray-500">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-check text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-[600]! text-gray-600 mb-1">รอดำเนินการ</p>
              <p class="text-xl md:text-2xl text-orange-600">
                {{ pendingSales }}
              </p>
              <p class="text-xs text-gray-500">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-clock text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-[600]! text-gray-600 mb-1">ยอดขายรวม</p>
              <p class="text-xl md:text-2xl text-purple-600">
                {{ formatCurrency(totalRevenue) }}
              </p>
              <p class="text-xs text-gray-500">บาท</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-money-bill text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filter Section -->
    <Card :pt="{ body: 'p-4' }">
      <template #content>
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <i class="pi pi-filter text-gray-600"></i>
              <span class="font-medium text-gray-700">กรองข้อมูล:</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-600">สถานะรายการขาย:</label>
              <Select
                v-model="statusFilter"
                :options="[{ label: 'ทั้งหมด', value: '' }, ...salesStatuses]"
                optionLabel="label"
                optionValue="value"
                placeholder="เลือกสถานะ"
                class="min-w-[200px]"
                size="small"
                clearable
              />
            </div>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-600">
            <span
              >ทั้งหมด: <span class="font-semibold text-blue-600">{{ totalSales }}</span></span
            >
            <span
              >เสร็จสิ้น:
              <span class="font-semibold text-green-600">{{ completedSales }}</span></span
            >
            <span
              >รอดำเนินการ:
              <span class="font-semibold text-orange-600">{{ pendingSales }}</span></span
            >
          </div>
        </div>
      </template>
    </Card>

    <!-- Sales Table -->
    <Card :pt="{ body: 'p-3' }">
      <template #content>
        <DataTable
          :value="filteredSales"
          :loading="productsLoading"
          :paginator="true"
          :rows="10"
          scrollHeight="600px"
        >
          <Column
            field="saleDate"
            header="วันที่ขาย"
            :pt="{ columnHeaderContent: 'min-w-[4.25rem]' }"
          >
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{ formatDate(slotProps.data.saleDate) }}</span>
            </template>
          </Column>

          <Column
            field="orderNumber"
            header="เลขรายการ"
            :pt="{ columnHeaderContent: 'min-w-[6.5rem]' }"
          >
            <template #body="slotProps">
              <span
                class="font-medium! text-blue-600 cursor-pointer hover:underline text-sm"
                @click="openDetailModal(slotProps.data)"
              >
                {{ slotProps.data.orderNumber }}
              </span>
            </template>
          </Column>



          <Column
            field="customerCode"
            header="รหัสลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[4.5rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <span class="font-medium text-sm text-gray-900">{{
                slotProps.data.customerCode
              }}</span>
            </template>
          </Column>

          <Column
            field="customerType"
            header="ประเภทลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[5.5rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <Tag :value="slotProps.data.customerType" severity="info" size="small" />
            </template>
          </Column>

          <Column
            field="productCategory"
            header="หมวดหมู่สินค้า"
            :pt="{ columnHeaderContent: 'min-w-[6.25rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <Tag :value="slotProps.data.productCategory" severity="success" size="small" />
            </template>
          </Column>

          <Column
            field="productType"
            header="ประเภทสินค้า"
            :pt="{ columnHeaderContent: 'min-w-[7.5rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <Tag :value="slotProps.data.productType" severity="secondary" size="small" />
            </template>
          </Column>

          <Column field="productName" header="รายการ" :pt="{ columnHeaderContent: 'min-w-[6rem]' }">
            <template #body="slotProps">
              <span class="text-sm text-gray-900">{{ slotProps.data.productName }}</span>
            </template>
          </Column>

          <Column
            field="quantity"
            header="จำนวน"
            :pt="{ columnHeaderContent: 'min-w-[4rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <span class="text-center text-sm">{{ slotProps.data.quantity }}</span>
            </template>
          </Column>

          <Column
            field="unitPrice"
            header="ราคาต่อหน่วย"
            :pt="{ columnHeaderContent: 'min-w-[6rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <span class="font-medium text-gray-900 text-sm">
                {{ formatCurrency(slotProps.data.unitPrice) }}
              </span>
            </template>
          </Column>

          <Column
            field="totalPrice"
            header="ราคารวม"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <span class="font-medium text-gray-900 text-sm">
                {{ formatCurrency(slotProps.data.totalPrice) }}
              </span>
            </template>
          </Column>

          <Column
            field="deposit"
            header="มัดจำ"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <span class="text-gray-900 text-sm">
                {{ formatCurrency(slotProps.data.deposit) }}
              </span>
            </template>
          </Column>

          <Column
            field="discount"
            header="ส่วนลด"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <span class="text-red-600 text-sm">
                {{ formatCurrency(slotProps.data.discount) }}
              </span>
            </template>
          </Column>

          <Column
            field="netAmount"
            header="ยอดสุทธิ"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-end', bodyCell: 'text-end' }"
          >
            <template #body="slotProps">
              <span class="font-semibold text-green-600 text-sm">
                {{ formatCurrency(slotProps.data.netAmount) }}
              </span>
            </template>
          </Column>

          <Column
            field="paymentMethod"
            header="ช่องทางการชำระเงิน"
            :pt="{ columnHeaderContent: 'min-w-[8.25rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <Tag
                :value="getPaymentMethodTag(slotProps.data.paymentMethod).label"
                :severity="getPaymentMethodTag(slotProps.data.paymentMethod).severity"
                size="small"
              />
            </template>
          </Column>

          <Column field="seller" header="ผู้ขาย" :pt="{ columnHeaderContent: 'min-w-[4rem]' }">
            <template #body="slotProps">
              <span class="text-sm text-gray-900">{{ slotProps.data.seller }}</span>
            </template>
          </Column>

          <Column
            field="customerName"
            header="ชื่อ/สกุล"
            :pt="{ columnHeaderContent: 'min-w-[7rem]' }"
          >
            <template #body="slotProps">
              <div>
                <p class="font-medium text-gray-900 text-sm">{{ slotProps.data.customerName }}</p>
                <p class="text-sm text-gray-500">{{ slotProps.data.customerNickname }}</p>
              </div>
            </template>
          </Column>

          <Column
            field="customerPhone"
            header="เบอร์โทร"
            :pt="{ columnHeaderContent: 'min-w-[6rem]' }"
          >
            <template #body="slotProps">
              <span class="text-sm text-gray-900">{{ slotProps.data.customerPhone }}</span>
            </template>
          </Column>

           <Column
            field="status"
            header="สถานะรายการขาย"
            :pt="{ columnHeaderContent: 'min-w-[12rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <div class="flex flex-col items-center gap-2">
                <Tag
                  :value="getStatusTag(slotProps.data.status).label"
                  :severity="getStatusTag(slotProps.data.status).severity"
                  size="small"
                />
              </div>
            </template>
          </Column>

          <Column
            header="จัดการการขาย"
            :exportable="false"
            frozen
            :pt="{ columnHeaderContent: 'justify-end min-w-[6rem]' }"
          >
            <template #body="slotProps">
              <div class="flex gap-2 justify-end">
                <Button
                  icon="pi pi-sync"
                  severity="secondary"
                  size="small"
                  outlined
                  @click="openStatusManager(slotProps.data)"
                  v-tooltip.top="'เปลี่ยนสถานะการขาย'"
                />
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
                  icon="pi pi-eye"
                  severity="info"
                  size="small"
                  outlined
                  @click="openDetailModal(slotProps.data)"
                  v-tooltip.top="'ดูรายละเอียด'"
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

  <!-- Modal Components -->
  <ModalAddSale v-model:visible="showAddModal" />

  <ModalEditSale
    v-model:visible="showEditModal"
    :sale-data="selectedSale"
    @sale-updated="handleSaleUpdated"
  />

  <ModalSaleDetail
    v-model:visible="showDetailModal"
    :sale-data="selectedSale"
    @edit-sale="openEditModal"
  />

  <StatusManager
    v-model:visible="showStatusManager"
    :current-status="selectedSale?.status || ''"
    :order-number="selectedSale?.orderNumber || ''"
    @status-changed="handleStatusChange"
  />

  <SaleSettingsModal
    v-model:visible="showSettingsModal"
    :sale-data="selectedSale"
    @settings-updated="handleSettingsUpdated"
  />
</template>
