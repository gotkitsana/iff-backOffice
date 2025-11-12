<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Card, Tabs, TabList, TabPanel, TabPanels, Tab, Badge, DataTable, Column, Tag, Button, Dialog, InputText, Textarea, Select, InputNumber, Calendar, Dropdown } from 'primevue'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'

// Data
const activeTab = ref('overview')
const showTransactionModal = ref(false)
const showReportModal = ref(false)
const selectedTransaction = ref<any>(null)

// Form data for new transaction
const transactionForm = ref({
  type: 'income', // income, expense
  category: '',
  description: '',
  amount: 0,
  date: new Date(),
  paymentMethod: 'cash',
  reference: '',
  notes: ''
})

// Sample accounting data
const transactions = ref([
  {
    id: 1,
    type: 'income',
    category: 'ขายปลาคาร์ฟ',
    description: 'ขายปลาคราฟโคฮากุ',
    amount: 150000,
    date: new Date('2024-01-15T10:30:00'),
    paymentMethod: 'transfer',
    reference: 'INV-2024-001',
    status: 'completed'
  },
  {
    id: 2,
    type: 'income',
    category: 'ประมูลปลาคาร์ฟ',
    description: 'ประมูลปลาคราฟไทชู',
    amount: 120000,
    date: new Date('2024-01-15T14:20:00'),
    paymentMethod: 'cash',
    reference: 'AUC-2024-001',
    status: 'completed'
  },
  {
    id: 3,
    type: 'expense',
    category: 'ค่าอาหารปลา',
    description: 'ซื้ออาหารปลาคุณภาพสูง',
    amount: 5000,
    date: new Date('2024-01-15T16:45:00'),
    paymentMethod: 'transfer',
    reference: 'EXP-2024-001',
    status: 'completed'
  },
  {
    id: 4,
    type: 'expense',
    category: 'ค่าบำรุงรักษา',
    description: 'ซ่อมแซมระบบกรองน้ำ',
    amount: 8000,
    date: new Date('2024-01-16T09:15:00'),
    paymentMethod: 'credit',
    reference: 'EXP-2024-002',
    status: 'pending'
  },
  {
    id: 5,
    type: 'income',
    category: 'ขายปลาคาร์ฟ',
    description: 'ขายปลาคราฟชิโรอุตสึริ',
    amount: 180000,
    date: new Date('2024-01-16T11:30:00'),
    paymentMethod: 'transfer',
    reference: 'INV-2024-002',
    status: 'completed'
  }
])

// Computed
const filteredTransactions = computed(() => {
  switch (activeTab.value) {
    case 'income':
      return transactions.value.filter(t => t.type === 'income')
    case 'expense':
      return transactions.value.filter(t => t.type === 'expense')
    case 'pending':
      return transactions.value.filter(t => t.status === 'pending')
    default:
      return transactions.value
  }
})

// Stats
const totalIncome = computed(() =>
  transactions.value
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
)

const totalExpense = computed(() =>
  transactions.value
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
)

const netProfit = computed(() => totalIncome.value - totalExpense.value)

const pendingAmount = computed(() =>
  transactions.value
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
)

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(value)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTypeTag = (type: string) => {
  return type === 'income'
    ? { label: 'รายรับ', severity: 'success' }
    : { label: 'รายจ่าย', severity: 'danger' }
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
const openTransactionModal = () => {
  resetTransactionForm()
  showTransactionModal.value = true
}

const closeTransactionModal = () => {
  showTransactionModal.value = false
  resetTransactionForm()
}

const openReportModal = () => {
  showReportModal.value = true
}

const closeReportModal = () => {
  showReportModal.value = false
}

const resetTransactionForm = () => {
  transactionForm.value = {
    type: 'income',
    category: '',
    description: '',
    amount: 0,
    date: new Date(),
    paymentMethod: 'cash',
    reference: '',
    notes: ''
  }
}

// Handlers
const handleCreateTransaction = () => {
  if (!transactionForm.value.category || !transactionForm.value.description || !transactionForm.value.amount) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  const newTransaction = {
    id: transactions.value.length + 1,
    ...transactionForm.value,
    status: 'completed'
  }

  transactions.value.unshift(newTransaction)
  toast.success('บันทึกรายการบัญชีสำเร็จ')
  closeTransactionModal()
}

// Category options
const incomeCategories = [
  { label: 'ขายปลาคาร์ฟ', value: 'ขายปลาคาร์ฟ' },
  { label: 'ประมูลปลาคาร์ฟ', value: 'ประมูลปลาคาร์ฟ' },
  { label: 'ค่าบริการ', value: 'ค่าบริการ' },
  { label: 'รายได้อื่นๆ', value: 'รายได้อื่นๆ' }
]

const expenseCategories = [
  { label: 'ค่าอาหารปลา', value: 'ค่าอาหารปลา' },
  { label: 'ค่าบำรุงรักษา', value: 'ค่าบำรุงรักษา' },
  { label: 'ค่าไฟฟ้า', value: 'ค่าไฟฟ้า' },
  { label: 'ค่าน้ำ', value: 'ค่าน้ำ' },
  { label: 'ค่าแรงงาน', value: 'ค่าแรงงาน' },
  { label: 'รายจ่ายอื่นๆ', value: 'รายจ่ายอื่นๆ' }
]

const currentCategories = computed(() => {
  return transactionForm.value.type === 'income' ? incomeCategories : expenseCategories
})

const paymentMethods = [
  { label: 'เงินสด', value: 'cash' },
  { label: 'โอนเงิน', value: 'transfer' },
  { label: 'เครดิต', value: 'credit' }
]

// Watch for type change to reset category
watch(() => transactionForm.value.type, () => {
  transactionForm.value.category = ''
})
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ระบบบัญชี</h1>
        <p class="text-gray-600">จัดการรายรับ-รายจ่ายและติดตามสถานะทางการเงิน</p>
      </div>
      <div class="flex space-x-3">
        <Button
          label="เพิ่มรายการ"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openTransactionModal"
        />
        <Button
          label="รายงาน"
          icon="pi pi-chart-bar"
          severity="info"
          size="small"
          @click="openReportModal"
        />
        <Button
          label="ส่งออกข้อมูล"
          icon="pi pi-download"
          severity="secondary"
          size="small"
        />
      </div>
    </div>

    <!-- Financial Overview -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">รายรับรวม</p>
              <p class="text-xl md:text-2xl font-medium! text-green-600">
                {{ formatCurrency(totalIncome) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
            <div
              class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-arrow-up text-white text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">รายจ่ายรวม</p>
              <p class="text-xl md:text-2xl font-medium! text-red-600">
                {{ formatCurrency(totalExpense) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
            <div
              class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-arrow-down text-white text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">กำไรสุทธิ</p>
              <p class="text-xl md:text-2xl font-medium! text-blue-600" :class="netProfit >= 0 ? 'text-blue-600' : 'text-red-600'">
                {{ formatCurrency(netProfit) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              :class="netProfit >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-red-500 to-pink-600'"
            >
              <i class="pi pi-calculator text-white text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">รอดำเนินการ</p>
              <p class="text-xl md:text-2xl font-medium! text-orange-600">
                {{ formatCurrency(pendingAmount) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
            <div
              class="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-clock text-white text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Transactions Table -->
    <Card :pt="{ body: 'p-3' }">
      <template #content>
        <Tabs :value="activeTab" :pt="{ tablist: 'p-3' }">
          <TabList size="small">
            <Tab value="overview" as="div" class="flex items-center gap-2">
              <i class="pi pi-hashtag" />
              <span class="font-bold whitespace-nowrap">ทั้งหมด</span>
              <Badge :value="transactions.length" severity="info" size="small" />
            </Tab>

            <Tab value="income" as="div" class="flex items-center gap-2">
              <i class="pi pi-arrow-up" />
              <span class="font-bold whitespace-nowrap">รายรับ</span>
              <Badge :value="transactions.filter(t => t.type === 'income').length" severity="success" size="small" />
            </Tab>

            <Tab value="expense" as="div" class="flex items-center gap-2">
              <i class="pi pi-arrow-down" />
              <span class="font-bold whitespace-nowrap">รายจ่าย</span>
              <Badge :value="transactions.filter(t => t.type === 'expense').length" severity="danger" size="small" />
            </Tab>

            <Tab value="pending" as="div" class="flex items-center gap-2">
              <i class="pi pi-clock" />
              <span class="font-bold whitespace-nowrap">รอดำเนินการ</span>
              <Badge :value="transactions.filter(t => t.status === 'pending').length" severity="warning" size="small" />
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="overview" as="div" class="m-0">
              <DataTable
                :value="filteredTransactions"
                :paginator="true"
                :rows="10"
                class="p-datatable-sm"
                :pt="{
                  table: 'min-w-full',
                  thead: 'bg-gray-50',
                  tbody: 'divide-y divide-gray-200'
                }"
              >
                <Column field="date" header="วันที่" sortable>
                  <template #body="slotProps">
                    <span class="text-sm text-gray-600">{{ formatDate(slotProps.data.date) }}</span>
                  </template>
                </Column>

                <Column field="type" header="ประเภท" sortable>
                  <template #body="slotProps">
                    <Tag
                      :value="getTypeTag(slotProps.data.type).label"
                      :severity="getTypeTag(slotProps.data.type).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column field="category" header="หมวดหมู่" sortable>
                  <template #body="slotProps">
                    <span class="font-medium text-gray-900">{{ slotProps.data.category }}</span>
                  </template>
                </Column>

                <Column field="description" header="รายละเอียด" sortable>
                  <template #body="slotProps">
                    <div>
                      <p class="font-medium text-gray-900">{{ slotProps.data.description }}</p>
                      <p class="text-sm text-gray-500">{{ slotProps.data.reference }}</p>
                    </div>
                  </template>
                </Column>

                <Column field="amount" header="จำนวนเงิน" sortable>
                  <template #body="slotProps">
                    <span
                      class="font-semibold"
                      :class="slotProps.data.type === 'income' ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ slotProps.data.type === 'income' ? '+' : '-' }}{{ formatCurrency(slotProps.data.amount) }}
                    </span>
                  </template>
                </Column>

                <Column field="paymentMethod" header="ชำระเงิน" sortable>
                  <template #body="slotProps">
                    <Tag
                      :value="getPaymentMethodTag(slotProps.data.paymentMethod).label"
                      :severity="getPaymentMethodTag(slotProps.data.paymentMethod).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column field="status" header="สถานะ" sortable>
                  <template #body="slotProps">
                    <Tag
                      :value="getStatusTag(slotProps.data.status).label"
                      :severity="getStatusTag(slotProps.data.status).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column header="การจัดการ" :exportable="false" style="min-width:8rem">
                  <template #body="slotProps">
                    <div class="flex gap-2">
                      <Button
                        icon="pi pi-eye"
                        severity="info"
                        size="small"
                        outlined
                      />
                      <Button
                        icon="pi pi-pencil"
                        severity="warning"
                        size="small"
                        outlined
                      />
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        outlined
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <TabPanel value="income" as="div" class="m-0">
              <!-- Same table as overview but filtered -->
            </TabPanel>

            <TabPanel value="expense" as="div" class="m-0">
              <!-- Same table as overview but filtered -->
            </TabPanel>

            <TabPanel value="pending" as="div" class="m-0">
              <!-- Same table as overview but filtered -->
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>

  <!-- New Transaction Modal -->
  <Dialog
    v-model:visible="showTransactionModal"
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
        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มรายการบัญชี</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลรายรับหรือรายจ่าย</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Transaction Type -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-tag text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ประเภทรายการ</h4>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-arrow-up mr-1.5 !text-sm"></i>
              ประเภท *
            </label>
            <Select
              v-model="transactionForm.type"
              :options="[
                { label: 'รายรับ', value: 'income' },
                { label: 'รายจ่าย', value: 'expense' }
              ]"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-sitemap mr-1.5 !text-sm"></i>
              หมวดหมู่ *
            </label>
            <Select
              v-model="transactionForm.category"
              :options="currentCategories"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกหมวดหมู่"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- Transaction Details -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-file-edit text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">รายละเอียด</h4>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-file-text mr-1.5 !text-sm"></i>
              รายละเอียด *
            </label>
            <InputText
              v-model="transactionForm.description"
              placeholder="กรอกรายละเอียดรายการ"
              fluid
              size="small"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
                <i class="pi pi-money-bill mr-1.5 !text-sm"></i>
                จำนวนเงิน (บาท) *
              </label>
              <InputNumber
                v-model="transactionForm.amount"
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
                <i class="pi pi-calendar mr-1.5 !text-sm"></i>
                วันที่ *
              </label>
              <Calendar
                v-model="transactionForm.date"
                showIcon
                fluid
                size="small"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
                <i class="pi pi-credit-card mr-1.5 !text-sm"></i>
                วิธีการชำระเงิน *
              </label>
              <Select
                v-model="transactionForm.paymentMethod"
                :options="paymentMethods"
                optionLabel="label"
                optionValue="value"
                fluid
                size="small"
              />
            </div>

            <div>
              <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
                <i class="pi pi-hashtag mr-1.5 !text-sm"></i>
                หมายเลขอ้างอิง
              </label>
              <InputText
                v-model="transactionForm.reference"
                placeholder="เช่น INV-2024-001"
                fluid
                size="small"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-file-edit mr-1.5 !text-sm"></i>
              หมายเหตุ
            </label>
            <Textarea
              v-model="transactionForm.notes"
              placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
              rows="3"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="closeTransactionModal"
          size="small"
        />
        <Button
          label="บันทึก"
          icon="pi pi-check"
          @click="handleCreateTransaction"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>

  <!-- Report Modal -->
  <Dialog
    v-model:visible="showReportModal"
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
        <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-chart-bar text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">รายงานทางการเงิน</h3>
          <p class="text-sm text-gray-600">สรุปข้อมูลทางการเงิน</p>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card class="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <template #content>
            <div class="text-center">
              <i class="pi pi-arrow-up text-green-600 text-3xl mb-2"></i>
              <h3 class="text-lg font-semibold text-green-800">รายรับรวม</h3>
              <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalIncome) }}</p>
            </div>
          </template>
        </Card>

        <Card class="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
          <template #content>
            <div class="text-center">
              <i class="pi pi-arrow-down text-red-600 text-3xl mb-2"></i>
              <h3 class="text-lg font-semibold text-red-800">รายจ่ายรวม</h3>
              <p class="text-2xl font-bold text-red-600">{{ formatCurrency(totalExpense) }}</p>
            </div>
          </template>
        </Card>

        <Card class="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <template #content>
            <div class="text-center">
              <i class="pi pi-calculator text-blue-600 text-3xl mb-2"></i>
              <h3 class="text-lg font-semibold text-blue-800">กำไรสุทธิ</h3>
              <p class="text-2xl font-bold" :class="netProfit >= 0 ? 'text-blue-600' : 'text-red-600'">
                {{ formatCurrency(netProfit) }}
              </p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Transaction Summary -->
      <Card>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">สรุปรายการล่าสุด</h3>
        </template>
        <template #content>
          <div class="space-y-3">
            <div
              v-for="transaction in transactions.slice(0, 5)"
              :key="transaction.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'"
                >
                  <i
                    class="pi text-sm"
                    :class="transaction.type === 'income' ? 'pi-arrow-up text-green-600' : 'pi-arrow-down text-red-600'"
                  ></i>
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ transaction.description }}</p>
                  <p class="text-sm text-gray-500">{{ transaction.category }}</p>
                </div>
              </div>
              <div class="text-right">
                <p
                  class="font-semibold"
                  :class="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'"
                >
                  {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                </p>
                <p class="text-sm text-gray-500">{{ formatDate(transaction.date) }}</p>
              </div>
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
          @click="closeReportModal"
          size="small"
        />
        <Button
          label="ส่งออก PDF"
          icon="pi pi-file-pdf"
          severity="info"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
