<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, DataTable, Column, Tag, Button, Tabs, TabList, Tab } from 'primevue'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useQuery } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import ModalAddSale from '@/components/sales/ModalAddSale.vue'
import ModalEditSale from '@/components/sales/ModalEditSale.vue'
import ModalSaleDetail from '@/components/sales/ModalSaleDetail.vue'
import StatusManager from '@/components/sales/StatusManager.vue'
import formatCurrency from '@/utils/formatCurrency'
import { useSalesStore, type ISales } from '@/stores/sales/sales'

// Stores
const productStore = useProductStore()
const salesStore = useSalesStore()

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
const activeTab = ref('all')

// Queries
const { isLoading: productsLoading } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: salesData, isLoading: isLoadingSales } = useQuery<ISales[]>({
  queryKey: ['get_sales'],
  queryFn: () => salesStore.onGetSales(),
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
    productType: 'จุลินทรีย์',
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
    productType: 'จุลินทรีย์',
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
  {
    id: 3,
    orderNumber: 'ORD-2024-003',
    customerCode: '30',
    customerType: 'ลูกค้า',
    customerName: 'คุณสมศักดิ์ ใจดี',
    customerNickname: 'ศักดิ์',
    customerPhone: '083-456-7890',
    customerEmail: 'somsak@email.com',
    customerAddress: '789 ถนนลาดพร้าว',
    customerProvince: 'กรุงเทพฯ',
    productCategory: 'ขายสินค้า',
    productType: 'อาหาร',
    productName: 'อาหารปลาคาร์ฟ',
    quantity: 1,
    unitPrice: 1200,
    totalPrice: 1200,
    deposit: 0,
    discount: 100,
    netAmount: 1100,
    paymentMethod: 'KTB',
    seller: 'Alice',
    shippingStatus: 'รอจัดหา',
    saleDate: new Date('2024-10-12T09:15:00'),
    status: 'wait_product',
    notes: 'ต้องการสีแดง',
  },
  {
    id: 4,
    orderNumber: 'ORD-2024-004',
    customerCode: '35',
    customerType: 'ลูกค้า',
    customerName: 'คุณมาลี สวยงาม',
    customerNickname: 'มาลี',
    customerPhone: '084-567-8901',
    customerEmail: 'malee@email.com',
    customerAddress: '321 ถนนสุขุมวิท',
    customerProvince: 'กรุงเทพฯ',
    productCategory: 'ขายสินค้า',
    productType: 'คอนสทรัคชั่น',
    productName: 'เครื่องกรองน้ำ',
    quantity: 1,
    unitPrice: 2500,
    totalPrice: 2500,
    deposit: 500,
    discount: 0,
    netAmount: 2000,
    paymentMethod: 'BBL',
    seller: 'Charlie',
    shippingStatus: 'อยู่ระหว่างขนส่ง',
    saleDate: new Date('2024-10-12T16:30:00'),
    status: 'shipping',
    notes: 'ส่งด่วน',
  },
  {
    id: 5,
    orderNumber: 'ORD-2024-005',
    customerCode: '40',
    customerType: 'ลูกค้า',
    customerName: 'คุณวิชัย ใจดี',
    customerNickname: 'วิชัย',
    customerPhone: '085-678-9012',
    customerEmail: 'wichai@email.com',
    customerAddress: '654 ถนนรัชดาภิเษก',
    customerProvince: 'กรุงเทพฯ',
    productCategory: 'ขายสินค้า',
    productType: 'ปลา',
    productName: 'ปลาคาร์ฟ',
    quantity: 3,
    unitPrice: 800,
    totalPrice: 2400,
    deposit: 0,
    discount: 0,
    netAmount: 2400,
    paymentMethod: 'SCB',
    seller: 'David',
    shippingStatus: 'ได้รับสินค้าเรียบร้อย',
    saleDate: new Date('2024-10-13T11:45:00'),
    status: 'delivered',
    notes: 'ลูกค้าพอใจมาก',
  },
  {
    id: 6,
    orderNumber: 'ORD-2024-006',
    customerCode: '45',
    customerType: 'ลูกค้า',
    customerName: 'คุณสมพร ใจดี',
    customerNickname: 'สมพร',
    customerPhone: '086-789-0123',
    customerEmail: 'somporn@email.com',
    customerAddress: '987 ถนนวิภาวดี',
    customerProvince: 'กรุงเทพฯ',
    productCategory: 'ขายสินค้า',
    productType: 'บริการ',
    productName: 'บริการติดตั้งระบบกรอง',
    quantity: 1,
    unitPrice: 5000,
    totalPrice: 5000,
    deposit: 1000,
    discount: 0,
    netAmount: 4000,
    paymentMethod: 'KTB',
    seller: 'Eve',
    shippingStatus: 'ชำระเงินแล้ว',
    saleDate: new Date('2024-10-14T08:20:00'),
    status: 'paid_complete',
    notes: 'ติดตั้งเสร็จแล้ว',
  },
  {
    id: 7,
    orderNumber: 'ORD-2024-007',
    customerCode: '50',
    customerType: 'ลูกค้า',
    customerName: 'คุณวิไล สวยงาม',
    customerNickname: 'วิไล',
    customerPhone: '087-890-1234',
    customerEmail: 'wilai@email.com',
    customerAddress: '147 ถนนลาดพร้าว',
    customerProvince: 'กรุงเทพฯ',
    productCategory: 'ขายสินค้า',
    productType: 'ปลา',
    productName: 'ปลาคาร์ฟสีแดง',
    quantity: 2,
    unitPrice: 1500,
    totalPrice: 3000,
    deposit: 0,
    discount: 200,
    netAmount: 2800,
    paymentMethod: 'BBL',
    seller: 'Frank',
    shippingStatus: 'ชำระเงินแล้ว',
    saleDate: new Date('2024-10-14T15:45:00'),
    status: 'paid_complete',
    notes: 'ปลาสวยมาก',
  },
  {
    id: 8,
    orderNumber: 'ORD-2024-008',
    customerCode: '55',
    customerType: 'ลูกค้า',
    customerName: 'คุณสมศักดิ์ ใจดี',
    customerNickname: 'ศักดิ์',
    customerPhone: '088-901-2345',
    customerEmail: 'somsak2@email.com',
    customerAddress: '258 ถนนรัชดาภิเษก',
    customerProvince: 'กรุงเทพฯ',
    productCategory: 'ขายสินค้า',
    productType: 'อุปกรณ์',
    productName: 'ปั๊มน้ำ',
    quantity: 1,
    unitPrice: 3500,
    totalPrice: 3500,
    deposit: 0,
    discount: 0,
    netAmount: 3500,
    paymentMethod: 'SCB',
    seller: 'Grace',
    shippingStatus: 'ชำระเงินแล้ว',
    saleDate: new Date('2024-10-15T10:30:00'),
    status: 'paid_complete',
    notes: 'อุปกรณ์คุณภาพดี',
  },
  {
    id: 9,
    orderNumber: 'ORD-2024-009',
    customerCode: '60',
    customerType: 'ลูกค้า',
    customerName: 'คุณมาลี สวยงาม',
    customerNickname: 'มาลี',
    customerPhone: '089-012-3456',
    customerEmail: 'malee2@email.com',
    customerAddress: '369 ถนนสุขุมวิท',
    customerProvince: 'กรุงเทพฯ',
    productCategory: 'ขายสินค้า',
    productType: 'ยา',
    productName: 'ยาปฏิชีวนะสำหรับปลา',
    quantity: 3,
    unitPrice: 800,
    totalPrice: 2400,
    deposit: 0,
    discount: 100,
    netAmount: 2300,
    paymentMethod: 'KTB',
    seller: 'Henry',
    shippingStatus: 'ชำระเงินแล้ว',
    saleDate: new Date('2024-10-15T14:20:00'),
    status: 'paid_complete',
    notes: 'ยาคุณภาพสูง',
  },
])

// Computed
const filteredSales = computed(() => {
  if (activeTab.value === 'all') {
    return sales.value
  }
  return sales.value.filter((sale) => sale.status === activeTab.value)
})

// Tab counts
const allCount = computed(() => sales.value.length)
const waitProductCount = computed(
  () => sales.value.filter((s) => s.status === 'wait_product').length
)
const waitConfirmCount = computed(
  () => sales.value.filter((s) => s.status === 'wait_confirm').length
)
const waitPaymentCount = computed(
  () => sales.value.filter((s) => s.status === 'wait_payment').length
)
const paidCompleteCount = computed(
  () => sales.value.filter((s) => s.status === 'paid_complete').length
)
const preparingCount = computed(() => sales.value.filter((s) => s.status === 'preparing').length)
const shippingCount = computed(() => sales.value.filter((s) => s.status === 'shipping').length)
const deliveredCount = computed(() => sales.value.filter((s) => s.status === 'delivered').length)
const damagedCount = computed(() => sales.value.filter((s) => s.status === 'damaged').length)

// Current filter display
const currentFilterDisplay = computed(() => {
  const statusMap: Record<string, string> = {
    all: 'ทั้งหมด',
    wait_product: 'รอจัดหา',
    wait_confirm: 'รอยืนยัน',
    wait_payment: 'รอชำระเงิน',
    paid_complete: 'ชำระเงินเรียบร้อย',
    preparing: 'แพ็คเตรียมสินค้ารอจัดส่ง',
    shipping: 'อยู่ระหว่างขนส่ง',
    delivered: 'ได้รับสินค้าเรียบร้อย',
    damaged: 'สินค้าเสียหาย',
  }
  return statusMap[activeTab.value] || 'ทั้งหมด'
})

// Stats
const totalSales = computed(() => sales.value.length)
const completedSales = computed(
  () => sales.value.filter((s) => s.status === 'paid_complete').length
)

// Revenue calculations by category
const totalRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'paid_complete')
    .reduce((sum, sale) => sum + sale.netAmount, 0)
)

const fishRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'paid_complete' && s.productType === 'ปลา')
    .reduce((sum, sale) => sum + sale.netAmount, 0)
)

const serviceRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'paid_complete' && s.productType === 'บริการ')
    .reduce((sum, sale) => sum + sale.netAmount, 0)
)

const constructionRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'paid_complete' && s.productType === 'คอนสทรัคชั่น')
    .reduce((sum, sale) => sum + sale.netAmount, 0)
)

const microorganismRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'paid_complete' && s.productType === 'จุลินทรีย์')
    .reduce((sum, sale) => sum + sale.netAmount, 0)
)

const foodRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'paid_complete' && s.productType === 'อาหาร')
    .reduce((sum, sale) => sum + sale.netAmount, 0)
)

const equipmentRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'paid_complete' && s.productType === 'อุปกรณ์')
    .reduce((sum, sale) => sum + sale.netAmount, 0)
)

const medicineRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'paid_complete' && s.productType === 'ยา')
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
              <i class="pi pi-fish text-white text-2xl"></i>
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
              <i class="pi pi-cog text-white text-lg"></i>
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
        <Tabs v-model="activeTab" class="w-full " :value="activeTab">
          <TabList class="flex border-b border-gray-200 overflow-x-auto bg-gray-50/50">
            <Tab value="all" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5  px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-list text-blue-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ทั้งหมด</span>
                <Tag :value="allCount.toString()" severity="info" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="wait_product" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5  px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
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
                class="flex items-center gap-1.5  px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-clock text-yellow-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">รอคอมเปริม</span>
                <Tag
                  :value="waitConfirmCount.toString()"
                  severity="warning"
                  size="small"
                  class="ml-1"
                />
              </div>
            </Tab>
            <Tab value="paid_complete" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5  px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
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
                class="flex items-center gap-1.5  px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-box text-purple-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ระหว่างรอจัดส่ง</span>
                <Tag :value="preparingCount.toString()" severity="info" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="shipping" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5  px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
              >
                <i class="pi pi-truck text-indigo-600 text-sm"></i>
                <span class="text-sm font-medium text-gray-700">ระหว่างขนส่ง</span>
                <Tag :value="shippingCount.toString()" severity="info" size="small" class="ml-1" />
              </div>
            </Tab>
            <Tab value="delivered" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5  px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
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
            <Tab value="damaged" class="flex-shrink-0">
              <div
                class="flex items-center gap-1.5  px-3 transition-all duration-200 hover:bg-white/80 rounded-t-lg"
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
            label="บันทึกรายการขาย"
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
                />
              </div>
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
            header="สถานะลูกค้า"
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
                :value="salesStore.getPaymentMethodTag(slotProps.data.paymentMethod).label"
                :severity="salesStore.getPaymentMethodTag(slotProps.data.paymentMethod).severity"
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
            header="จัดการสถานะ"
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
</template>
