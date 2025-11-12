<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, Button, DataTable, Column, Tag } from 'primevue'
import { toast } from 'vue3-toastify'
import AccountingSummaryCards from '@/components/accounting/AccountingSummaryCards.vue'
import AccountingTransactionForm from '@/components/accounting/AccountingTransactionForm.vue'
import ProjectSettingsModal from '@/components/accounting/ProjectSettingsModal.vue'
import ModalDetailTransaction from '@/components/accounting/ModalDetailTransaction.vue'
import ModalDeleteTransaction from '@/components/accounting/ModalDeleteTransaction.vue'

// Modal states
const showTransactionModal = ref(false)
const showProjectSettingsModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const showEditModal = ref(false)
const selectedTransaction = ref<
  (TransactionData & { id: number; date: Date; status: 'completed' | 'pending' }) | null
>(null)

// Form data for new transaction
interface TransactionData {
  type: 'income' | 'expense'
  paymentMethod: 'cash' | 'transfer'
  department: string
  project: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  purpose: string
}

// Sample accounting data
const transactions = ref([
  {
    id: 1,
    type: 'income',
    department: 'แผนกขาย',
    project: 'โครงการขายปลาคาร์ฟ',
    item: 'ขายปลาคราฟโคฮากุ',
    quantity: 1,
    unitPrice: 150000,
    total: 150000,
    paymentMethod: 'transfer',
    purpose: 'ขายปลาคราฟ',
    date: new Date('2024-01-15T10:30:00'),
    status: 'completed',
  },
  {
    id: 2,
    type: 'expense',
    department: 'แผนกบำรุงรักษา',
    project: 'โครงการซ่อมแซม',
    item: 'ซ่อมแซมระบบกรองน้ำ',
    quantity: 1,
    unitPrice: 8000,
    total: 8000,
    paymentMethod: 'cash',
    purpose: 'บำรุงรักษา',
    date: new Date('2024-01-16T09:15:00'),
    status: 'completed',
  },
])

// Departments and Projects (จะดึงจาก API หรือ store ในอนาคต)
const departments = ref([
  { label: 'แผนกขาย', value: 'แผนกขาย' },
  { label: 'แผนกบำรุงรักษา', value: 'แผนกบำรุงรักษา' },
  { label: 'แผนกการเงิน', value: 'แผนกการเงิน' },
  { label: 'แผนกผลิต', value: 'แผนกผลิต' },
])

const projects = ref([
  { label: 'โครงการขายปลาคาร์ฟ', value: 'โครงการขายปลาคาร์ฟ' },
  { label: 'โครงการซ่อมแซม', value: 'โครงการซ่อมแซม' },
  { label: 'โครงการพัฒนาระบบ', value: 'โครงการพัฒนาระบบ' },
])

// Stats
const totalIncome = computed(() =>
  transactions.value
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.total, 0)
)

const totalExpense = computed(() =>
  transactions.value
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.total, 0)
)

const netProfit = computed(() => totalIncome.value - totalExpense.value)

const receivables = computed(() => {
  // คำนวณลูกหนี้ (ตัวอย่าง: รายรับที่ยังไม่ได้รับเงิน)
  return transactions.value
    .filter((t) => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + t.total, 0)
})

const loans = computed(() => {
  // คำนวณกู้ยืม (ตัวอย่าง: รายจ่ายที่ยังไม่ได้ชำระ)
  return transactions.value
    .filter((t) => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + t.total, 0)
})

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

const getTypeTag = (type: string) => {
  return type === 'income'
    ? { label: 'รายรับ', severity: 'success' }
    : { label: 'รายจ่าย', severity: 'danger' }
}

const getPaymentMethodTag = (method: string) => {
  switch (method) {
    case 'cash':
      return { label: 'เงินสด', severity: 'success' }
    case 'transfer':
      return { label: 'เงินโอน', severity: 'info' }
    default:
      return { label: method, severity: 'secondary' }
  }
}

// Handlers
const handleCreateTransaction = (data: TransactionData) => {
  const newTransaction = {
    id: transactions.value.length + 1,
    ...data,
    date: new Date(),
    status: 'completed' as const,
  }

  transactions.value.unshift(newTransaction)
}

const handleProjectSettings = (data: {
  projectName: string
  departmentName: string
  projectPurpose: string
}) => {
  // เพิ่มแผนกใหม่ถ้ายังไม่มี
  const deptExists = departments.value.some((d) => d.value === data.departmentName)
  if (!deptExists) {
    departments.value.push({
      label: data.departmentName,
      value: data.departmentName,
    })
  }

  // เพิ่มโครงการใหม่ถ้ายังไม่มี
  const projectExists = projects.value.some((p) => p.value === data.projectName)
  if (!projectExists) {
    projects.value.push({
      label: data.projectName,
      value: data.projectName,
    })
  }
}

// Transaction handlers
const handleViewDetail = (
  transaction: TransactionData & { id: number; date: Date; status: 'completed' | 'pending' }
) => {
  selectedTransaction.value = transaction
  showDetailModal.value = true
}

const handleEdit = (
  transaction: TransactionData & { id: number; date: Date; status: 'completed' | 'pending' }
) => {
  selectedTransaction.value = transaction
  showEditModal.value = true
}

const handleDelete = (
  transaction: TransactionData & { id: number; date: Date; status: 'completed' | 'pending' }
) => {
  selectedTransaction.value = transaction
  showDeleteModal.value = true
}

const handleConfirmDelete = (id: number) => {
  const index = transactions.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    transactions.value.splice(index, 1)
    toast.success('ลบรายการสำเร็จ')
  }
  selectedTransaction.value = null
}

const handleUpdateTransaction = (data: TransactionData) => {
  if (!selectedTransaction.value) {
    toast.error('ไม่พบข้อมูลรายการที่ต้องการแก้ไข')
    return
  }

  const index = transactions.value.findIndex((t) => t.id === selectedTransaction.value!.id)
  if (index !== -1) {
    transactions.value[index] = {
      ...transactions.value[index],
      ...data,
    }
    toast.success('แก้ไขรายการสำเร็จ')
    showEditModal.value = false
    selectedTransaction.value = null
  }
}
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ระบบบริหารบัญชี</h1>
        <p class="text-gray-600">จัดการรายรับ-รายจ่ายและติดตามสถานะทางการเงิน</p>
      </div>
      <div class="flex space-x-3">
        <Button
          label="บันทึกรายการ"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="showTransactionModal = true"
        />
        <Button
          label="ตั้งค่าโครงการ"
          icon="pi pi-cog"
          severity="info"
          size="small"
          @click="showProjectSettingsModal = true"
        />
      </div>
    </div>

    <!-- สรุปรายงาน -->
    <div>
      <h2 class="text-lg font-semibold! text-gray-900 mb-3">สรุปรายงาน</h2>
      <AccountingSummaryCards
        :total-income="totalIncome"
        :total-expense="totalExpense"
        :net-profit="netProfit"
        :receivables="receivables"
        :loans="loans"
      />
    </div>

    <!-- Transactions Table -->
    <Card :pt="{ body: 'p-3' }">
      <template #content>
        <DataTable
          :value="transactions"
          :paginator="true"
          :rows="10"
          class="p-datatable-sm"
          :pt="{
            table: 'min-w-full',
            thead: 'bg-gray-50',
            tbody: 'divide-y divide-gray-200',
          }"
        >
          <Column field="date" header="วันที่">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{ formatDate(slotProps.data.date) }}</span>
            </template>
          </Column>

          <Column field="type" header="ประเภท">
            <template #body="slotProps">
              <Tag
                :value="getTypeTag(slotProps.data.type).label"
                :severity="getTypeTag(slotProps.data.type).severity"
                size="small"
                class="text-xs"
              />
            </template>
          </Column>

          <Column field="department" header="แผนก">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{ slotProps.data.department }}</span>
            </template>
          </Column>

          <Column field="project" header="โครงการ">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{ slotProps.data.project }}</span>
            </template>
          </Column>

          <Column field="item" header="รายการ">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{ slotProps.data.item }}</span>
            </template>
          </Column>

          <Column field="purpose" header="จุดประสงค์รายการ">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{ slotProps.data.purpose || '-' }}</span>
            </template>
          </Column>

          <Column field="quantity" header="จำนวนหน่วย">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{ slotProps.data.quantity }}</span>
            </template>
          </Column>

          <Column field="unitPrice" header="ราคาหน่วย">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{
                formatCurrency(slotProps.data.unitPrice)
              }}</span>
            </template>
          </Column>

          <Column field="total" header="ยอดรวม">
            <template #body="slotProps">
              <span
                class="text-sm"
                :class="slotProps.data.type === 'income' ? 'text-green-600' : 'text-red-600'"
              >
            {{ formatCurrency(slotProps.data.total) }}  
              </span>
            </template>
          </Column>

          <Column field="paymentMethod" header="ชำระเงิน">
            <template #body="slotProps">
              <Tag
                :value="getPaymentMethodTag(slotProps.data.paymentMethod).label"
                :severity="getPaymentMethodTag(slotProps.data.paymentMethod).severity"
                size="small"
                class="text-xs"
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
                  v-tooltip.top="'รายละเอียด'"
                  @click="handleViewDetail(slotProps.data)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  size="small"
                  outlined
                  v-tooltip.top="'แก้ไข'"
                  @click="handleEdit(slotProps.data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  outlined
                  v-tooltip.top="'ลบ'"
                  @click="handleDelete(slotProps.data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>

  <!-- Transaction Form Modal -->
  <AccountingTransactionForm
    v-model:visible="showTransactionModal"
    :departments="departments"
    :projects="projects"
    @submit="handleCreateTransaction"
  />

  <!-- Project Settings Modal -->
  <ProjectSettingsModal
    v-model:visible="showProjectSettingsModal"
    @submit="handleProjectSettings"
  />

  <!-- Detail Modal -->
  <ModalDetailTransaction v-model:visible="showDetailModal" :transaction="selectedTransaction" />

  <!-- Delete Modal -->
  <ModalDeleteTransaction
    v-model:visible="showDeleteModal"
    :transaction="selectedTransaction"
    @confirm-delete="handleConfirmDelete"
  />

  <!-- Edit Modal -->
  <AccountingTransactionForm
    v-model:visible="showEditModal"
    :departments="departments"
    :projects="projects"
    :transaction="selectedTransaction"
    @submit="handleUpdateTransaction"
  />
</template>
