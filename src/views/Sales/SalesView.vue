<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Card,
  DataTable,
  Column,
  Tag,
  Button,
  Dialog,
  InputText,
  Textarea,
  Select,
  InputNumber,
} from 'primevue'
import { useProductStore, type IProduct } from '@/stores/auction/product'
import { useQuery } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'

// Stores
const productStore = useProductStore()

// Data
const showSaleModal = ref(false)
const showInvoiceModal = ref(false)
const selectedProduct = ref<IProduct | null>(null)
const statusFilter = ref('')
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

// Form data for new sale
const saleForm = ref({
  productId: '',
  customerCode: '',
  customerType: 'ลูกค้า',
  customerName: '',
  customerNickname: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  customerProvince: '',
  productCategory: 'ขายสินค้า',
  productType: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  deposit: 0,
  discount: 0,
  netAmount: 0,
  paymentMethod: 'SCB',
  seller: 'Bert',
  shippingStatus: 'รอตัดสินใจ',
  notes: '',
})

// Queries
const { data: products, isLoading: productsLoading } = useQuery<IProduct[]>({
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
    status: 'ชำระเงินเรียบร้อย',
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
    status: 'รอชำระเงิน',
    notes: '',
  },
])

// Computed
const availableProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter((p) => !p.sold && p.auctionOnly === 0)
})

const productOptions = computed(() => {
  return availableProducts.value.map((product) => ({
    label: `${product.name} (${product.size} ซม.) - ${product.category || 'ไม่ระบุหมวดหมู่'}`,
    value: product._id,
    product: product,
  }))
})

const filteredSales = computed(() => {
  if (!statusFilter.value) {
    return sales.value
  }
  return sales.value.filter((sale) => sale.status === statusFilter.value)
})

// Stats
const totalSales = computed(() => sales.value.length)
const completedSales = computed(
  () => sales.value.filter((s) => s.status === 'ชำระเงินเรียบร้อย').length
)
const pendingSales = computed(() => sales.value.filter((s) => s.status === 'รอชำระเงิน').length)
const totalRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'ชำระเงินเรียบร้อย')
    .reduce((sum, sale) => sum + sale.netAmount, 0)
)

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

const getStatusTag = (status: string) => {
  switch (status) {
    case 'รอจัดหา':
      return { label: 'รอจัดหา', severity: 'warning' }
    case 'รอยืนยัน':
      return { label: 'รอยืนยัน', severity: 'warning' }
    case 'รอชำระเงิน':
      return { label: 'รอชำระเงิน', severity: 'warning' }
    case 'ชำระเงินเรียบร้อย':
      return { label: 'ชำระเงินเรียบร้อย', severity: 'success' }
    case 'แพ็คเตรียมสินค้ารอจัดส่ง':
      return { label: 'แพ็คเตรียมสินค้ารอจัดส่ง', severity: 'info' }
    case 'อยู่ระหว่างขนส่ง':
      return { label: 'อยู่ระหว่างขนส่ง', severity: 'info' }
    case 'ได้รับสินค้าเรียบร้อย':
      return { label: 'ได้รับสินค้าเรียบร้อย', severity: 'success' }
    case 'สินค้าเสียหาย':
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

const getShippingStatusTag = (status: string) => {
  switch (status) {
    case 'รอตัดสินใจ':
      return { label: 'รอตัดสินใจ', severity: 'warning' }
    case 'รอชำระเงิน':
      return { label: 'รอชำระเงิน', severity: 'warning' }
    case 'ชำระเงินแล้ว':
      return { label: 'ชำระเงินแล้ว', severity: 'info' }
    case 'กำลังจัดเตรียม':
      return { label: 'กำลังจัดเตรียม', severity: 'info' }
    case 'อยู่ระหว่างจัดส่ง':
      return { label: 'อยู่ระหว่างจัดส่ง', severity: 'warning' }
    case 'จัดส่งสำเร็จ':
      return { label: 'จัดส่งสำเร็จ', severity: 'success' }
    case 'รับสินค้าเรียบร้อย':
      return { label: 'รับสินค้าเรียบร้อย', severity: 'success' }
    default:
      return { label: status, severity: 'secondary' }
  }
}

// Modal functions
const openSaleModal = () => {
  resetSaleForm()
  showSaleModal.value = true
}

const closeSaleModal = () => {
  showSaleModal.value = false
  resetSaleForm()
}

const openInvoiceModal = (sale: (typeof sales.value)[0]) => {
  selectedSale.value = sale
  showInvoiceModal.value = true
}

const closeInvoiceModal = () => {
  showInvoiceModal.value = false
  selectedSale.value = null
}

const resetSaleForm = () => {
  saleForm.value = {
    productId: '',
    customerCode: '',
    customerType: 'ลูกค้า',
    customerName: '',
    customerNickname: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerProvince: '',
    productCategory: 'ขายสินค้า',
    productType: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    deposit: 0,
    discount: 0,
    netAmount: 0,
    paymentMethod: 'SCB',
    seller: 'Bert',
    shippingStatus: 'รอตัดสินใจ',
    notes: '',
  }
  selectedProduct.value = null
}

// Selected product details
const selectedProductDetails = computed(() => {
  if (!saleForm.value.productId || !availableProducts.value) return null
  return availableProducts.value.find((p) => p._id === saleForm.value.productId)
})

// Watch for product selection
watch(
  () => saleForm.value.productId,
  (newProductId) => {
    if (newProductId && selectedProductDetails.value) {
      saleForm.value.unitPrice = selectedProductDetails.value.price || 0
    }
  }
)

// Calculate totals
const subtotal = computed(() => saleForm.value.unitPrice * saleForm.value.quantity)
const discountAmount = computed(() => saleForm.value.discount)
const totalAmount = computed(() => subtotal.value - discountAmount.value)

// Watch for price changes to update totals
watch(
  [() => saleForm.value.unitPrice, () => saleForm.value.quantity, () => saleForm.value.discount],
  () => {
    saleForm.value.totalPrice = subtotal.value
    saleForm.value.netAmount = totalAmount.value
  }
)

// Handlers
const handleCreateSale = () => {
  if (!saleForm.value.productId || !saleForm.value.customerName) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  const newSale = {
    id: sales.value.length + 1,
    orderNumber: `ORD-2024-${String(sales.value.length + 1).padStart(3, '0')}`,
    customerCode: saleForm.value.customerCode || String(sales.value.length + 1),
    customerType: saleForm.value.customerType,
    customerName: saleForm.value.customerName,
    customerNickname: saleForm.value.customerNickname,
    customerPhone: saleForm.value.customerPhone,
    customerEmail: saleForm.value.customerEmail,
    customerAddress: saleForm.value.customerAddress,
    customerProvince: saleForm.value.customerProvince,
    productCategory: saleForm.value.productCategory,
    productType: saleForm.value.productType,
    productName: selectedProductDetails.value?.name || '',
    quantity: saleForm.value.quantity,
    unitPrice: saleForm.value.unitPrice,
    totalPrice: saleForm.value.totalPrice,
    deposit: saleForm.value.deposit,
    discount: saleForm.value.discount,
    netAmount: saleForm.value.netAmount,
    paymentMethod: saleForm.value.paymentMethod,
    seller: saleForm.value.seller,
    shippingStatus: saleForm.value.shippingStatus,
    saleDate: new Date(),
    status: 'ชำระเงินเรียบร้อย',
    notes: saleForm.value.notes,
  }

  sales.value.unshift(newSale)
  toast.success('บันทึกการขายสำเร็จ')
  closeSaleModal()
}

const handleCancelSale = (sale: (typeof sales.value)[0]) => {
  if (confirm(`คุณต้องการยกเลิกการขาย ${sale.orderNumber} หรือไม่?`)) {
    sale.status = 'สินค้าเสียหาย'
    toast.success('ยกเลิกการขายสำเร็จ')
  }
}

const handleCompleteSale = (sale: (typeof sales.value)[0]) => {
  if (confirm(`คุณต้องการยืนยันการขาย ${sale.orderNumber} หรือไม่?`)) {
    sale.status = 'ชำระเงินเรียบร้อย'
    toast.success('ยืนยันการขายสำเร็จ')
  }
}

// Payment method options
const paymentMethods = [
  { label: 'SCB', value: 'SCB' },
  { label: 'KBANK', value: 'KBANK' },
  { label: 'BBL', value: 'BBL' },
  { label: 'เงินสด', value: 'cash' },
  { label: 'โอนเงิน', value: 'transfer' },
  { label: 'เครดิต', value: 'credit' },
]

// Customer type options
const customerTypes = [
  { label: 'ลูกค้า', value: 'ลูกค้า' },
  { label: 'ตัวแทนจำหน่าย', value: 'ตัวแทนจำหน่าย' },
  { label: 'ร้านค้า', value: 'ร้านค้า' },
]

// Product category options
const productCategories = [
  { label: 'ขายสินค้า', value: 'ขายสินค้า' },
  { label: 'บริการ', value: 'บริการ' },
]

// Product type options
const productTypes = [
  { label: 'สารปรับสภาพน้ำ', value: 'สารปรับสภาพน้ำ' },
  { label: 'อาหารปลา', value: 'อาหารปลา' },
  { label: 'อุปกรณ์', value: 'อุปกรณ์' },
]

// Sales status options
const salesStatuses = [
  { label: 'รอจัดหา', value: 'รอจัดหา' },
  { label: 'รอยืนยัน', value: 'รอยืนยัน' },
  { label: 'รอชำระเงิน', value: 'รอชำระเงิน' },
  { label: 'ชำระเงินเรียบร้อย', value: 'ชำระเงินเรียบร้อย' },
  { label: 'แพ็คเตรียมสินค้ารอจัดส่ง', value: 'แพ็คเตรียมสินค้ารอจัดส่ง' },
  { label: 'อยู่ระหว่างขนส่ง', value: 'อยู่ระหว่างขนส่ง' },
  { label: 'ได้รับสินค้าเรียบร้อย', value: 'ได้รับสินค้าเรียบร้อย' },
  { label: 'สินค้าเสียหาย', value: 'สินค้าเสียหาย' },
]

// Shipping status options
const shippingStatuses = [
  { label: 'รอตัดสินใจ', value: 'รอตัดสินใจ' },
  { label: 'รอชำระเงิน', value: 'รอชำระเงิน' },
  { label: 'ชำระเงินแล้ว', value: 'ชำระเงินแล้ว' },
  { label: 'กำลังจัดเตรียม', value: 'กำลังจัดเตรียม' },
  { label: 'อยู่ระหว่างจัดส่ง', value: 'อยู่ระหว่างจัดส่ง' },
  { label: 'จัดส่งสำเร็จ', value: 'จัดส่งสำเร็จ' },
  { label: 'รับสินค้าเรียบร้อย', value: 'รับสินค้าเรียบร้อย' },
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
          label="ขายใหม่"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openSaleModal"
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
                @click="openInvoiceModal(slotProps.data)"
              >
                {{ slotProps.data.orderNumber }}
              </span>
            </template>
          </Column>

          <Column
            field="status"
            header="สถานะรายการขาย"
            :pt="{ columnHeaderContent: 'min-w-[8rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <Tag
                :value="getStatusTag(slotProps.data.status).label"
                :severity="getStatusTag(slotProps.data.status).severity"
                size="small"
              />
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
            field="shippingStatus"
            header="สถานะการจัดส่ง"
            :pt="{ columnHeaderContent: 'min-w-[7rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <Tag
                :value="getShippingStatusTag(slotProps.data.shippingStatus).label"
                :severity="getShippingStatusTag(slotProps.data.shippingStatus).severity"
                size="small"
              />
            </template>
          </Column>

          <Column
            header="การจัดการ"
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
                  @click="openInvoiceModal(slotProps.data)"
                />
                <Button
                  v-if="slotProps.data.status === 'รอชำระเงิน'"
                  icon="pi pi-check"
                  severity="success"
                  size="small"
                  outlined
                  @click="handleCompleteSale(slotProps.data)"
                />
                <Button
                  v-if="slotProps.data.status === 'รอชำระเงิน'"
                  icon="pi pi-times"
                  severity="danger"
                  size="small"
                  outlined
                  @click="handleCancelSale(slotProps.data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>

  <!-- New Sale Modal -->
  <Dialog
    v-model:visible="showSaleModal"
    modal
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">ขายปลาคาร์ฟ</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลการขายให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Product Selection -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-fish text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">เลือกปลาคาร์ฟ</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tag mr-1.5 !text-sm"></i>
              เลือกปลาคาร์ฟ *
            </label>
            <Select
              v-model="saleForm.productId"
              :options="productOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกปลาคาร์ฟที่ต้องการขาย"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-sort-numeric-up mr-1.5 !text-sm"></i>
              จำนวน *
            </label>
            <InputNumber v-model="saleForm.quantity" :min="1" :max="10" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-th-large mr-1.5 !text-sm"></i>
              หมวดหมู่สินค้า
            </label>
            <Select
              v-model="saleForm.productCategory"
              :options="productCategories"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tags mr-1.5 !text-sm"></i>
              ประเภทสินค้า
            </label>
            <Select
              v-model="saleForm.productType"
              :options="productTypes"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
            />
          </div>
        </div>

        <!-- Selected Product Details -->
        <div
          v-if="selectedProductDetails"
          class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-fish text-blue-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <h5 class="font-semibold text-gray-900">{{ selectedProductDetails.name }}</h5>
              <p class="text-sm text-gray-600">
                {{ selectedProductDetails.category || 'ไม่ระบุหมวดหมู่' }} -
                {{ selectedProductDetails.size }} ซม.
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ selectedProductDetails.detail }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-green-600">
                {{
                  selectedProductDetails.price
                    ? formatCurrency(selectedProductDetails.price)
                    : 'ไม่ระบุราคา'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-user text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลลูกค้า</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-hashtag mr-1.5 !text-sm"></i>
              รหัสลูกค้า
            </label>
            <InputText
              v-model="saleForm.customerCode"
              placeholder="กรอกรหัสลูกค้า"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-users mr-1.5 !text-sm"></i>
              ประเภทลูกค้า
            </label>
            <Select
              v-model="saleForm.customerType"
              :options="customerTypes"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ชื่อ/สกุล *
            </label>
            <InputText
              v-model="saleForm.customerName"
              placeholder="กรอกชื่อ-สกุลลูกค้า"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user-plus mr-1.5 !text-sm"></i>
              ชื่อเล่น
            </label>
            <InputText
              v-model="saleForm.customerNickname"
              placeholder="กรอกชื่อเล่น"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-phone mr-1.5 !text-sm"></i>
              เบอร์โทรศัพท์
            </label>
            <InputText
              v-model="saleForm.customerPhone"
              placeholder="กรอกเบอร์โทรศัพท์"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-envelope mr-1.5 !text-sm"></i>
              อีเมล
            </label>
            <InputText
              v-model="saleForm.customerEmail"
              placeholder="กรอกอีเมล"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-map-marker mr-1.5 !text-sm"></i>
              ที่อยู่
            </label>
            <InputText
              v-model="saleForm.customerAddress"
              placeholder="กรอกที่อยู่"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-building mr-1.5 !text-sm"></i>
              จังหวัด
            </label>
            <InputText
              v-model="saleForm.customerProvince"
              placeholder="กรอกจังหวัด"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-dollar text-yellow-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลราคา</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-money-bill mr-1.5 !text-sm"></i>
              ราคาต่อหน่วย (บาท) *
            </label>
            <InputNumber
              v-model="saleForm.unitPrice"
              :min="0"
              :max="999999999"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-wallet mr-1.5 !text-sm"></i>
              มัดจำ (บาท)
            </label>
            <InputNumber
              v-model="saleForm.deposit"
              :min="0"
              :max="saleForm.unitPrice * saleForm.quantity"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-percentage mr-1.5 !text-sm"></i>
              ส่วนลด (บาท)
            </label>
            <InputNumber
              v-model="saleForm.discount"
              :min="0"
              :max="saleForm.unitPrice * saleForm.quantity"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-credit-card mr-1.5 !text-sm"></i>
              วิธีการชำระเงิน *
            </label>
            <Select
              v-model="saleForm.paymentMethod"
              :options="paymentMethods"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ผู้ขาย
            </label>
            <InputText v-model="saleForm.seller" placeholder="กรอกชื่อผู้ขาย" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-truck mr-1.5 !text-sm"></i>
              สถานะการจัดส่ง
            </label>
            <Select
              v-model="saleForm.shippingStatus"
              :options="shippingStatuses"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
            />
          </div>
        </div>

        <!-- Price Summary -->
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">ยอดรวมก่อนส่วนลด:</span>
            <span class="font-medium">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">มัดจำ:</span>
            <span class="font-medium text-blue-600">{{ formatCurrency(saleForm.deposit) }}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">ส่วนลด:</span>
            <span class="font-medium text-red-600">-{{ formatCurrency(discountAmount) }}</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-gray-200">
            <span class="text-lg font-bold text-gray-900">ยอดสุทธิหลังส่วนลด:</span>
            <span class="text-xl font-bold text-green-600">{{ formatCurrency(totalAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-file-edit text-purple-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">หมายเหตุ</h4>
        </div>

        <Textarea
          v-model="saleForm.notes"
          placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
          rows="3"
          fluid
          size="small"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="closeSaleModal"
          size="small"
        />
        <Button
          label="บันทึกการขาย"
          icon="pi pi-check"
          @click="handleCreateSale"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>

  <!-- Invoice Modal -->
  <Dialog
    v-model:visible="showInvoiceModal"
    modal
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-file-pdf text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">ใบเสร็จรับเงิน</h3>
          <p class="text-sm text-gray-600">{{ selectedSale?.orderNumber }}</p>
        </div>
      </div>
    </template>

    <div v-if="selectedSale" class="space-y-4">
      <!-- Invoice Header -->
      <div class="text-center border-b border-gray-200 pb-4">
        <h2 class="text-2xl font-bold text-gray-900">ใบเสร็จรับเงิน</h2>
        <p class="text-gray-600">เลขที่: {{ selectedSale.orderNumber }}</p>
        <p class="text-gray-600">วันที่: {{ formatDate(selectedSale.saleDate) }}</p>
      </div>

      <!-- Customer Info -->
      <div class="grid grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">ข้อมูลลูกค้า</h4>
          <p class="text-sm text-gray-600">รหัส: {{ selectedSale.customerCode }}</p>
          <p class="text-sm text-gray-600">ชื่อ: {{ selectedSale.customerName }}</p>
          <p class="text-sm text-gray-600">ชื่อเล่น: {{ selectedSale.customerNickname }}</p>
          <p class="text-sm text-gray-600">โทร: {{ selectedSale.customerPhone }}</p>
          <p class="text-sm text-gray-600">ที่อยู่: {{ selectedSale.customerAddress }}</p>
          <p class="text-sm text-gray-600">จังหวัด: {{ selectedSale.customerProvince }}</p>
        </div>
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">ข้อมูลสินค้า</h4>
          <p class="text-sm text-gray-600">หมวดหมู่: {{ selectedSale.productCategory }}</p>
          <p class="text-sm text-gray-600">ประเภท: {{ selectedSale.productType }}</p>
          <p class="text-sm text-gray-600">รายการ: {{ selectedSale.productName }}</p>
          <p class="text-sm text-gray-600">จำนวน: {{ selectedSale.quantity }}</p>
          <p class="text-sm text-gray-600">ผู้ขาย: {{ selectedSale.seller }}</p>
        </div>
      </div>

      <!-- Invoice Details -->
      <div class="border border-gray-200 rounded-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-900">รายการ</th>
              <th class="px-4 py-2 text-center text-sm font-medium text-gray-900">จำนวน</th>
              <th class="px-4 py-2 text-right text-sm font-medium text-gray-900">ราคา</th>
              <th class="px-4 py-2 text-right text-sm font-medium text-gray-900">รวม</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-gray-200">
              <td class="px-4 py-2 text-sm text-gray-900">{{ selectedSale.productName }}</td>
              <td class="px-4 py-2 text-center text-sm text-gray-900">
                {{ selectedSale.quantity }}
              </td>
              <td class="px-4 py-2 text-right text-sm text-gray-900">
                {{ formatCurrency(selectedSale.unitPrice) }}
              </td>
              <td class="px-4 py-2 text-right text-sm text-gray-900">
                {{ formatCurrency(selectedSale.unitPrice * selectedSale.quantity) }}
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50">
            <tr>
              <td colspan="3" class="px-4 py-2 text-right text-sm font-medium text-gray-900">
                ยอดรวมก่อนส่วนลด:
              </td>
              <td class="px-4 py-2 text-right text-sm font-medium text-gray-900">
                {{ formatCurrency(selectedSale.totalPrice) }}
              </td>
            </tr>
            <tr>
              <td colspan="3" class="px-4 py-2 text-right text-sm font-medium text-gray-900">
                มัดจำ:
              </td>
              <td class="px-4 py-2 text-right text-sm font-medium text-blue-600">
                {{ formatCurrency(selectedSale.deposit) }}
              </td>
            </tr>
            <tr>
              <td colspan="3" class="px-4 py-2 text-right text-sm font-medium text-gray-900">
                ส่วนลด:
              </td>
              <td class="px-4 py-2 text-right text-sm font-medium text-red-600">
                -{{ formatCurrency(selectedSale.discount) }}
              </td>
            </tr>
            <tr class="border-t-2 border-gray-300">
              <td colspan="3" class="px-4 py-2 text-right text-lg font-bold text-gray-900">
                ยอดสุทธิหลังส่วนลด:
              </td>
              <td class="px-4 py-2 text-right text-lg font-bold text-green-600">
                {{ formatCurrency(selectedSale.netAmount) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Payment Info -->
      <div class="flex justify-between items-center pt-4 border-t border-gray-200">
        <div>
          <p class="text-sm text-gray-600">วิธีการชำระเงิน:</p>
          <Tag
            :value="getPaymentMethodTag(selectedSale.paymentMethod).label"
            :severity="getPaymentMethodTag(selectedSale.paymentMethod).severity"
            size="small"
          />
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600">สถานะการขาย:</p>
          <Tag
            :value="getStatusTag(selectedSale.status).label"
            :severity="getStatusTag(selectedSale.status).severity"
            size="small"
          />
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-600">สถานะการจัดส่ง:</p>
          <Tag
            :value="getShippingStatusTag(selectedSale.shippingStatus).label"
            :severity="getShippingStatusTag(selectedSale.shippingStatus).severity"
            size="small"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="closeInvoiceModal"
          size="small"
        />
        <Button label="พิมพ์ใบเสร็จ" icon="pi pi-print" severity="info" size="small" />
      </div>
    </template>
  </Dialog>
</template>
