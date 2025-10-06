<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Card,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Tab,
  Badge,
  DataTable,
  Column,
  Tag,
  Button,
  Dialog,
  InputText,
  Textarea,
  Select,
  InputNumber,
  Calendar,
  Dropdown,
} from 'primevue'
import { useProductStore, type IProduct } from '@/stores/auction/product'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'

// Stores
const productStore = useProductStore()

// Data
const activeTab = ref('overview')
const showSaleModal = ref(false)
const showInvoiceModal = ref(false)
const selectedProduct = ref<IProduct | null>(null)
const selectedSale = ref<any>(null)

// Form data for new sale
const saleForm = ref({
  productId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  paymentMethod: 'cash',
  notes: '',
})

// Queries
const {
  data: products,
  isLoading: productsLoading,
  refetch: refetchProducts,
} = useQuery<IProduct[]>({
  queryKey: ['get_products_for_sale'],
  queryFn: () => productStore.onGetProducts(),
})

// Sample sales data
const sales = ref([
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    customerName: 'คุณสมชาย ใจดี',
    customerPhone: '081-234-5678',
    productName: 'ปลาคราฟโคฮากุ',
    productSize: 45,
    quantity: 1,
    unitPrice: 150000,
    discount: 5000,
    totalAmount: 145000,
    paymentMethod: 'transfer',
    saleDate: new Date('2024-01-15T10:30:00'),
    status: 'completed',
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-002',
    customerName: 'คุณนิดา สวยงาม',
    customerPhone: '082-345-6789',
    productName: 'ปลาคราฟไทชู',
    productSize: 38,
    quantity: 1,
    unitPrice: 120000,
    discount: 0,
    totalAmount: 120000,
    paymentMethod: 'cash',
    saleDate: new Date('2024-01-15T14:20:00'),
    status: 'completed',
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-003',
    customerName: 'คุณปิยะ เก่งมาก',
    customerPhone: '083-456-7890',
    productName: 'ปลาคราฟชิโรอุตสึริ',
    productSize: 42,
    quantity: 1,
    unitPrice: 180000,
    discount: 10000,
    totalAmount: 170000,
    paymentMethod: 'credit',
    saleDate: new Date('2024-01-15T16:45:00'),
    status: 'pending',
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
  switch (activeTab.value) {
    case 'completed':
      return sales.value.filter((sale) => sale.status === 'completed')
    case 'pending':
      return sales.value.filter((sale) => sale.status === 'pending')
    case 'cancelled':
      return sales.value.filter((sale) => sale.status === 'cancelled')
    default:
      return sales.value
  }
})

// Stats
const totalSales = computed(() => sales.value.length)
const completedSales = computed(() => sales.value.filter((s) => s.status === 'completed').length)
const pendingSales = computed(() => sales.value.filter((s) => s.status === 'pending').length)
const totalRevenue = computed(() =>
  sales.value
    .filter((s) => s.status === 'completed')
    .reduce((sum, sale) => sum + sale.totalAmount, 0)
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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusTag = (status: string) => {
  switch (status) {
    case 'completed':
      return { label: 'เสร็จสิ้น', severity: 'success' }
    case 'pending':
      return { label: 'รอดำเนินการ', severity: 'warning' }
    case 'cancelled':
      return { label: 'ยกเลิก', severity: 'danger' }
    default:
      return { label: status, severity: 'info' }
  }
}

const getPaymentMethodTag = (method: string) => {
  switch (method) {
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
const openSaleModal = () => {
  resetSaleForm()
  showSaleModal.value = true
}

const closeSaleModal = () => {
  showSaleModal.value = false
  resetSaleForm()
}

const openInvoiceModal = (sale: any) => {
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
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    paymentMethod: 'cash',
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

// Handlers
const handleCreateSale = () => {
  if (!saleForm.value.productId || !saleForm.value.customerName) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  const newSale = {
    id: sales.value.length + 1,
    invoiceNumber: `INV-2024-${String(sales.value.length + 1).padStart(3, '0')}`,
    customerName: saleForm.value.customerName,
    customerPhone: saleForm.value.customerPhone,
    productName: selectedProductDetails.value?.name || '',
    productSize: selectedProductDetails.value?.size || 0,
    quantity: saleForm.value.quantity,
    unitPrice: saleForm.value.unitPrice,
    discount: saleForm.value.discount,
    totalAmount: totalAmount.value,
    paymentMethod: saleForm.value.paymentMethod,
    saleDate: new Date(),
    status: 'completed',
  }

  sales.value.unshift(newSale)
  toast.success('บันทึกการขายสำเร็จ')
  closeSaleModal()
}

const handleCancelSale = (sale: any) => {
  if (confirm(`คุณต้องการยกเลิกการขาย ${sale.invoiceNumber} หรือไม่?`)) {
    sale.status = 'cancelled'
    toast.success('ยกเลิกการขายสำเร็จ')
  }
}

const handleCompleteSale = (sale: any) => {
  if (confirm(`คุณต้องการยืนยันการขาย ${sale.invoiceNumber} หรือไม่?`)) {
    sale.status = 'completed'
    toast.success('ยืนยันการขายสำเร็จ')
  }
}

// Payment method options
const paymentMethods = [
  { label: 'เงินสด', value: 'cash' },
  { label: 'โอนเงิน', value: 'transfer' },
  { label: 'เครดิต', value: 'credit' },
]
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ระบบขายปลาคาร์ฟ</h1>
        <p class="text-gray-600">จัดการการขายปลาคาร์ฟและติดตามยอดขาย</p>
      </div>
      <div class="flex space-x-3">
        <Button
          label="ขายใหม่"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openSaleModal"
          :disabled="availableProducts.length === 0"
        />
        <Button label="รายงานยอดขาย" icon="pi pi-chart-bar" severity="info" size="small" />
        <Button
          label="จัดการปลาคาร์ฟ"
          icon="pi pi-fish"
          severity="secondary"
          size="small"
          @click="$router.push('/koi-store')"
        />
      </div>
    </div>

    <!-- Alert for no available products -->
    <div
      v-if="availableProducts.length === 0"
      class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-yellow-600 text-xl"></i>
        <div>
          <h3 class="text-sm font-medium text-yellow-800">ไม่มีปลาคาร์ฟพร้อมขาย</h3>
          <p class="text-sm text-yellow-700 mt-1">
            กรุณาเพิ่มปลาคาร์ฟในหน้า "จัดการปลาคาร์ฟ" ก่อนเริ่มขาย
          </p>
        </div>
        <Button
          label="ไปจัดการปลาคาร์ฟ"
          icon="pi pi-arrow-right"
          severity="warning"
          size="small"
          @click="$router.push('/koi-store')"
        />
      </div>
    </div>

    <!-- Sales Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card :pt="{ body: 'p-4 md:p-6' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ยอดขายทั้งหมด</p>
              <p class="text-2xl md:text-3xl font-bold text-blue-600">
                {{ totalSales }}
              </p>
              <p class="text-xs text-gray-500 mt-1">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-shopping-cart text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4 md:p-6' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ขายเสร็จสิ้น</p>
              <p class="text-2xl md:text-3xl font-bold text-green-600">
                {{ completedSales }}
              </p>
              <p class="text-xs text-gray-500 mt-1">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-check text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4 md:p-6' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">รอดำเนินการ</p>
              <p class="text-2xl md:text-3xl font-bold text-orange-600">
                {{ pendingSales }}
              </p>
              <p class="text-xs text-gray-500 mt-1">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-clock text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4 md:p-6' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ยอดขายรวม</p>
              <p class="text-2xl md:text-3xl font-bold text-purple-600">
                {{ formatCurrency(totalRevenue) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
            <!-- <div
              class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-money-bill text-white text-2xl"></i>
            </div> -->
          </div>
        </template>
      </Card>
    </div>

    <!-- Sales Table -->
    <Card :pt="{ body: 'p-3' }">
      <template #content>
        <Tabs :value="activeTab">
          <TabList size="small">
            <Tab value="overview" as="div" class="flex items-center gap-2">
              <i class="pi pi-hashtag" />
              <span class="font-bold whitespace-nowrap">ทั้งหมด</span>
              <Badge :value="totalSales" severity="info" size="small" />
            </Tab>

            <Tab value="completed" as="div" class="flex items-center gap-2">
              <i class="pi pi-check-circle" />
              <span class="font-bold whitespace-nowrap">เสร็จสิ้น</span>
              <Badge :value="completedSales" severity="success" size="small" />
            </Tab>

            <Tab value="pending" as="div" class="flex items-center gap-2">
              <i class="pi pi-clock" />
              <span class="font-bold whitespace-nowrap">รอดำเนินการ</span>
              <Badge :value="pendingSales" severity="warning" size="small" />
            </Tab>

            <Tab value="cancelled" as="div" class="flex items-center gap-2">
              <i class="pi pi-times-circle" />
              <span class="font-bold whitespace-nowrap">ยกเลิก</span>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="overview" as="div">
              <DataTable
                :value="filteredSales"
                :loading="productsLoading"
                :paginator="true"
                :rows="10"
                class="p-datatable-sm"
              >
                <Column field="invoiceNumber" header="เลขที่ใบเสร็จ" sortable :pt="{ columnHeaderContent: 'min-w-[7rem]' }">
                  <template #body="slotProps">
                    <span
                      class="font-medium text-blue-600 cursor-pointer hover:underline"
                      @click="openInvoiceModal(slotProps.data)"
                    >
                      {{ slotProps.data.invoiceNumber }}
                    </span>
                  </template>
                </Column>

                <Column field="customerName" header="ลูกค้า" sortable :pt="{ columnHeaderContent: 'min-w-[7rem]' }">
                  <template #body="slotProps">
                    <div>
                      <p class="font-medium text-gray-900">{{ slotProps.data.customerName }}</p>
                      <p class="text-sm text-gray-500">{{ slotProps.data.customerPhone }}</p>
                    </div>
                  </template>
                </Column>

                <Column field="productName" header="สินค้า" sortable :pt="{ columnHeaderContent: 'min-w-[7rem]' }">
                  <template #body="slotProps">
                    <div>
                      <p class="font-medium text-gray-900">{{ slotProps.data.productName }}</p>
                      <p class="text-sm text-gray-500">{{ slotProps.data.productSize }} ซม.</p>
                    </div>
                  </template>
                </Column>

                <Column field="totalAmount" header="ยอดรวม" sortable>
                  <template #body="slotProps">
                    <span class="font-semibold text-green-600">
                      {{ formatCurrency(slotProps.data.totalAmount) }}
                    </span>
                  </template>
                </Column>

                <Column field="paymentMethod" header="ชำระเงิน" sortable :pt="{ columnHeaderContent: 'min-w-[5rem]' }">
                  <template #body="slotProps">
                    <Tag
                      :value="getPaymentMethodTag(slotProps.data.paymentMethod).label"
                      :severity="getPaymentMethodTag(slotProps.data.paymentMethod).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column field="saleDate" header="วันที่ขาย" sortable :pt="{ columnHeaderContent: 'min-w-[7.5rem]' }">
                  <template #body="slotProps">
                    <span class="text-sm text-gray-600">{{
                      formatDate(slotProps.data.saleDate)
                    }}</span>
                  </template>
                </Column>

                <Column field="status" header="สถานะ" sortable :pt="{ columnHeaderContent: 'min-w-[6.5rem]' }">
                  <template #body="slotProps">
                    <Tag
                      :value="getStatusTag(slotProps.data.status).label"
                      :severity="getStatusTag(slotProps.data.status).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column header="การจัดการ" :exportable="false" style="min-width: 8rem">
                  <template #body="slotProps">
                    <div class="flex gap-2">
                      <Button
                        icon="pi pi-eye"
                        severity="info"
                        size="small"
                        outlined
                        @click="openInvoiceModal(slotProps.data)"
                      />
                      <Button
                        v-if="slotProps.data.status === 'pending'"
                        icon="pi pi-check"
                        severity="success"
                        size="small"
                        outlined
                        @click="handleCompleteSale(slotProps.data)"
                      />
                      <Button
                        v-if="slotProps.data.status === 'pending'"
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
            </TabPanel>

            <TabPanel value="completed" as="div" class="m-0">
              <!-- Same table as overview but filtered -->
            </TabPanel>

            <TabPanel value="pending" as="div" class="m-0">
              <!-- Same table as overview but filtered -->
            </TabPanel>

            <TabPanel value="cancelled" as="div" class="m-0">
              <!-- Same table as overview but filtered -->
            </TabPanel>
          </TabPanels>
        </Tabs>
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
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ชื่อลูกค้า *
            </label>
            <InputText
              v-model="saleForm.customerName"
              placeholder="กรอกชื่อลูกค้า"
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

          <div class="md:col-span-2">
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
        </div>

        <!-- Price Summary -->
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">ยอดรวมก่อนส่วนลด:</span>
            <span class="font-medium">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">ส่วนลด:</span>
            <span class="font-medium text-red-600">-{{ formatCurrency(discountAmount) }}</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-gray-200">
            <span class="text-lg font-bold text-gray-900">ยอดรวมทั้งสิ้น:</span>
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
          <p class="text-sm text-gray-600">{{ selectedSale?.invoiceNumber }}</p>
        </div>
      </div>
    </template>

    <div v-if="selectedSale" class="space-y-4">
      <!-- Invoice Header -->
      <div class="text-center border-b border-gray-200 pb-4">
        <h2 class="text-2xl font-bold text-gray-900">ใบเสร็จรับเงิน</h2>
        <p class="text-gray-600">เลขที่: {{ selectedSale.invoiceNumber }}</p>
        <p class="text-gray-600">วันที่: {{ formatDate(selectedSale.saleDate) }}</p>
      </div>

      <!-- Customer Info -->
      <div class="grid grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">ข้อมูลลูกค้า</h4>
          <p class="text-sm text-gray-600">{{ selectedSale.customerName }}</p>
          <p class="text-sm text-gray-600">{{ selectedSale.customerPhone }}</p>
        </div>
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">ข้อมูลสินค้า</h4>
          <p class="text-sm text-gray-600">{{ selectedSale.productName }}</p>
          <p class="text-sm text-gray-600">ขนาด: {{ selectedSale.productSize }} ซม.</p>
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
                {{ formatCurrency(selectedSale.unitPrice * selectedSale.quantity) }}
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
                ยอดรวมทั้งสิ้น:
              </td>
              <td class="px-4 py-2 text-right text-lg font-bold text-green-600">
                {{ formatCurrency(selectedSale.totalAmount) }}
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
        <div class="text-right">
          <p class="text-sm text-gray-600">สถานะ:</p>
          <Tag
            :value="getStatusTag(selectedSale.status).label"
            :severity="getStatusTag(selectedSale.status).severity"
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
