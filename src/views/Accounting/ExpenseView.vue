<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { toast } from 'vue3-toastify'
import dayjs from 'dayjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// Components
import { Button, Select, DatePicker, DataTable, Column, Image, Tag, Card } from 'primevue'
import ModalAddExpense from '@/components/accounting/ModalAddExpense.vue'
import ModalDeleteExpense from '@/components/accounting/ModalDeleteExpense.vue'
import ModalDetailExpense from '@/components/accounting/ModalDetailExpense.vue'
import { useRouter } from 'vue-router'

// Stores
import { useAccountExpenseStore } from '@/stores/accounting/expense'
import { useAccountCategoryStore } from '@/stores/accounting/category'
import { useDepartmentStore } from '@/stores/hr/department'

// Types
import type { IExpense, ICreateExpensePayload, IUpdateExpensePayload } from '@/stores/accounting/expense'
import type { IAccountCategory } from '@/stores/accounting/category'
import type { IDepartment } from '@/stores/hr/department'

defineOptions({
  name: 'ExpenseView',
})

const queryClient = useQueryClient()
const router = useRouter()
const expenseStore = useAccountExpenseStore()
const categoryStore = useAccountCategoryStore()
const departmentStore = useDepartmentStore()

// State
const categories = ref<IAccountCategory[]>([])
const departments = ref<IDepartment[]>([])
const modalVisible = ref(false)
const deleteModalVisible = ref(false)
const detailModalVisible = ref(false)
const selectedExpense = ref<IExpense | null>(null)
const editingExpense = ref<IExpense | null>(null)

// Filters
const selectedDepartment = ref<string | null>(null)
const selectedCategory = ref<string | null>(null)
const dateRange = ref<Date[]>([])
const selectedQuickDate = ref<string | null>(null)

const quickDateOptions = [
  { label: 'วันนี้', value: 'today' },
  { label: 'เมื่อวาน', value: 'yesterday' },
  { label: 'สัปดาห์นี้', value: 'this_week' },
  { label: 'สัปดาห์ที่แล้ว', value: 'last_week' },
  { label: 'เดือนนี้', value: 'this_month' },
  { label: 'เดือนที่แล้ว', value: 'last_month' },
]

// Initial Data Fetch
const fetchInitialData = async () => {
  try {
    const [cats, depts] = await Promise.all([
      categoryStore.onGetCategories(),
      departmentStore.onGetDepartments(),
    ])
    categories.value = cats
    departments.value = depts

    // Default to This Month
    selectedQuickDate.value = 'this_month'
    applyQuickDate()
  } catch (error) {
    console.error(error)
    toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลเริ่มต้น')
  }
}

const applyQuickDate = () => {
  const now = dayjs()
  let start, end

  switch (selectedQuickDate.value) {
    case 'today':
      start = now.startOf('day')
      end = now.endOf('day')
      break
    case 'yesterday':
      start = now.subtract(1, 'day').startOf('day')
      end = now.subtract(1, 'day').endOf('day')
      break
    case 'this_week':
      start = now.startOf('week')
      end = now.endOf('week')
      break
    case 'last_week':
      start = now.subtract(1, 'week').startOf('week')
      end = now.subtract(1, 'week').endOf('week')
      break
    case 'this_month':
      start = now.startOf('month')
      end = now.endOf('month')
      break
    case 'last_month':
      start = now.subtract(1, 'month').startOf('month')
      end = now.subtract(1, 'month').endOf('month')
      break
    default:
      return
  }

  dateRange.value = [start.toDate(), end.toDate()]
}

// TanStack Query for Expenses
const { data: expenses, isPending: loading } = useQuery({
  queryKey: ['expenses', selectedDepartment, selectedCategory, dateRange],
  queryFn: async () => {
    if (!dateRange.value || dateRange.value.length < 2 || !dateRange.value[0] || !dateRange.value[1]) {
      return []
    }
    const from = dayjs(dateRange.value[0]).valueOf()
    const to = dayjs(dateRange.value[1]).valueOf()

    if (selectedDepartment.value || selectedCategory.value) {
      return await expenseStore.onGetExpenseByFilter({
        department: selectedDepartment.value || '',
        category: selectedCategory.value || '',
        from,
        to,
      })
    } else {
      return await expenseStore.onGetExpenses({ from, to })
    }
  },
  enabled: computed(() => !!dateRange.value && dateRange.value.length === 2 && !!dateRange.value[0] && !!dateRange.value[1]),
})

// Mutation for Creating Expense
const createExpenseMutation = useMutation({
  mutationFn: async ({ payload, file }: { payload: ICreateExpensePayload; file: File | null }) => {
    const res = await expenseStore.onCreateExpense(payload)
    if (res.data && file) {
      await expenseStore.onSendExpenseSlip({ id: res.data._id, image: file })
    }
    return res
  },
  onSuccess: () => {
    toast.success('บันทึกข้อมูลสำเร็จ')
    modalVisible.value = false
    editingExpense.value = null
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
  },
  onError: (error) => {
    console.error(error)
    toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
  },
})

// Mutation for Updating Expense
const updateExpenseMutation = useMutation({
  mutationFn: async ({ payload, file }: { payload: IUpdateExpensePayload; file: File | null }) => {
    const res = await expenseStore.onUpdateExpense(payload)
    if (res.data && file) {
      await expenseStore.onSendExpenseSlip({ id: payload._id, image: file })
    }
    return res
  },
  onSuccess: () => {
    toast.success('แก้ไขข้อมูลสำเร็จ')
    modalVisible.value = false
    editingExpense.value = null
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
  },
  onError: (error) => {
    console.error(error)
    toast.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล')
  },
})

// Mutation for Deleting Expense
const deleteExpenseMutation = useMutation({
  mutationFn: async (id: string) => {
    return await expenseStore.onDeleteExpense(id)
  },
  onSuccess: () => {
    toast.success('ลบข้อมูลสำเร็จ')
    deleteModalVisible.value = false
    selectedExpense.value = null
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
  },
  onError: (error) => {
    console.error(error)
    toast.error('เกิดข้อผิดพลาดในการลบข้อมูล')
  },
})

// KPI
const totalExpenses = computed(() => {
  return (expenses.value || []).reduce((sum: number, e: IExpense) => sum + e.amount, 0)
})

const totalCount = computed(() => {
  return (expenses.value || []).length
})

const averageExpense = computed(() => {
  if (totalCount.value === 0) return 0
  return totalExpenses.value / totalCount.value
})

const onResetFilter = () => {
  selectedDepartment.value = null
  selectedCategory.value = null
  selectedQuickDate.value = 'this_month'
  applyQuickDate()
}

const onSaveExpense = (data: { payload: ICreateExpensePayload | IUpdateExpensePayload; file: File | null; isEdit: boolean }) => {
  if (data.isEdit) {
    updateExpenseMutation.mutate({ payload: data.payload as IUpdateExpensePayload, file: data.file })
  } else {
    createExpenseMutation.mutate({ payload: data.payload as ICreateExpensePayload, file: data.file })
  }
}

const onEditExpense = (expense: IExpense) => {
  editingExpense.value = expense
  modalVisible.value = true
}

const onDeleteExpense = (expense: IExpense) => {
  selectedExpense.value = expense
  deleteModalVisible.value = true
}

const onViewDetail = (expense: IExpense) => {
  selectedExpense.value = expense
  detailModalVisible.value = true
}

const onConfirmDelete = (id: string) => {
  deleteExpenseMutation.mutate(id)
}

const getDepartmentName = (id: string | null) => {
  if (!id) return '-'
  const dept = departments.value.find((d) => d._id === id)
  return dept ? dept.name : '-'
}

const getCategoryName = (id: string | null) => {
  if (!id) return '-'
  const cat = categories.value.find((c) => c._id === id)
  return cat ? cat.name : '-'
}

const getPaymentMethodLabel = (method: string) => {
  const methods: Record<string, string> = {
    cash: 'เงินสด',
    transfer: 'โอน',
    check: 'เช็ค',
    credit_card: 'บัตรเครดิต',
  }
  return methods[method] || method
}

const getItemStatusLabel = (status: string) => {
  const statuses: Record<string, string> = {
    pending: 'รอชำระ',
    paid: 'ชำระแล้ว',
    cancelled: 'ยกเลิก',
  }
  return statuses[status] || status
}

const getItemStatusSeverity = (status: string) => {
  const severities: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    cancelled: 'danger',
  }
  return severities[status] || 'secondary'
}

// Watchers
watch(selectedQuickDate, () => {
  if (selectedQuickDate.value) {
    applyQuickDate()
  }
})

onMounted(() => {
  fetchInitialData()
})

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value)
}

// Format date
const formatDate = (timestamp: number) => {
  return dayjs(timestamp).format('DD/MM/YYYY HH:mm')
}

// Filter categories for expense type
const expenseCategories = computed(() => {
  return categories.value.filter((c) => c.type === 'รายจ่าย' && c.active)
})

// Helper to get image from expense (image field may not be in type definition)
const getExpenseImage = (expense: IExpense): string | undefined => {
  return (expense as IExpense & { image?: string }).image
}
</script>

<template>
  <!-- Page Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-lg font-semibold! text-gray-900">รายจ่าย</h1>
      <p class="text-sm text-gray-600">จัดการข้อมูลรายจ่ายและติดตามสถานะการชำระเงิน</p>
    </div>
    <div class="flex justify-end gap-2">
      <Button label="บันทึกรายจ่าย" icon="pi pi-plus" severity="success" size="small"
        @click="editingExpense = null; modalVisible = true" />
      <Button label="ตั้งค่ารายการ" icon="pi pi-cog" severity="info" size="small"
        @click="router.push('/accounting/expense/category-settings')" />
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 my-3">
    <Card :pt="{ body: 'p-4' }" class="bg-red-50 border-red-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ formatCurrency(totalExpenses) }}</div>
          <div class="text-sm text-red-700">ยอดรวมรายจ่าย</div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-4' }" class="bg-gray-50 border-gray-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-600">{{ totalCount }}</div>
          <div class="text-sm text-gray-700">จำนวนรายการ</div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-4' }" class="bg-amber-50 border-amber-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-amber-600">{{ formatCurrency(averageExpense) }}</div>
          <div class="text-sm text-amber-700">รายจ่ายเฉลี่ย</div>
        </div>
      </template>
    </Card>
  </div>

  <!-- DataTable -->
  <Card class="mt-4">
    <template #content>
      <!-- DataTable -->
      <div class="space-y-2 mb-3">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">แผนก</label>
            <Select v-model="selectedDepartment" :options="departments" optionLabel="name" optionValue="_id"
              placeholder="เลือกแผนก" size="small" fluid filter />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมวดหมู่</label>
            <Select v-model="selectedCategory" :options="expenseCategories" optionLabel="name" optionValue="_id"
              placeholder="เลือกหมวดหมู่" size="small" fluid filter />
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700 mb-1 block">เลือกช่วงวันที่</label>
            <DatePicker v-model="dateRange" selectionMode="range" :manualInput="false" dateFormat="dd/mm/yy"
              placeholder="เลือกช่วงวันที่" showIcon fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-semibold text-gray-700 mb-1 block">ช่วงเวลาด่วน</label>
            <Select v-model="selectedQuickDate" :options="quickDateOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกช่วงเวลา" fluid size="small" />
          </div>
        </div>

        <Button label="รีเซ็ตตัวกรอง" icon="pi pi-refresh" variant="text" severity="danger" size="small"
          @click="onResetFilter" />
      </div>

      <DataTable :value="expenses" :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50]" :loading="loading"
        stripedRows removableSort
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="แสดง {first} ถึง {last} จาก {totalRecords}">
        <template #empty> ไม่พบข้อมูล </template>

        <Column field="cat" header="วันที่" class="text-sm" :pt="{ headerCell: ['!min-w-[6.5rem]'] }">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.cat) }}
          </template>
        </Column>

        <Column field="item" header="รายการ" class="text-sm"></Column>

        <Column field="category" header="หมวดหมู่" class="text-sm">
          <template #body="slotProps">
            {{ getCategoryName(slotProps.data.category?._id || slotProps.data.category) }}
          </template>
        </Column>

        <Column field="department" header="แผนก" class="text-sm">
          <template #body="slotProps">
            {{ getDepartmentName(slotProps.data.department?._id || slotProps.data.department) }}
          </template>
        </Column>

        <Column field="amount" header="จำนวนเงิน" class="text-sm">
          <template #body="slotProps">
            <span class="text-red-600 font-bold">
              {{ formatCurrency(slotProps.data.amount) }}
            </span>
          </template>
        </Column>

        <Column field="paymentMethod" header="วิธีการชำระ" class="text-sm">
          <template #body="slotProps">
            <span class="text-gray-600 text-sm">
              {{ getPaymentMethodLabel(slotProps.data.paymentMethod) }}
            </span>
          </template>
        </Column>

        <Column field="itemStatus" header="สถานะ" class="text-sm">
          <template #body="slotProps">
            <Tag :value="getItemStatusLabel(slotProps.data.itemStatus)"
              :severity="getItemStatusSeverity(slotProps.data.itemStatus)" size="small" />
          </template>
        </Column>

        <Column field="dueDate" header="กำหนดชำระ" class="text-sm">
          <template #body="slotProps">
            <span class="text-gray-600 text-sm">{{ slotProps.data.dueDate || '-' }}</span>
          </template>
        </Column>

        <Column header="รูปภาพสลิป" class="text-sm">
          <template #body="slotProps">
            <div v-if="getExpenseImage(slotProps.data)">
              <Image :src="getExpenseImage(slotProps.data)" alt="Slip" width="50" preview />
            </div>
            <div v-else>-</div>
          </template>
        </Column>

        <Column header="จัดการ" class="text-sm" :pt="{ headerCell: ['!min-w-[8rem]'] }">
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <Button icon="pi pi-eye" severity="info" size="small" text rounded @click="onViewDetail(slotProps.data)"
                v-tooltip.top="'ดูรายละเอียด'" />
              <Button icon="pi pi-pencil" severity="warning" size="small" text rounded
                @click="onEditExpense(slotProps.data)" v-tooltip.top="'แก้ไข'" />
              <Button icon="pi pi-trash" severity="danger" size="small" text rounded
                @click="onDeleteExpense(slotProps.data)" v-tooltip.top="'ลบ'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <!-- Modals -->
  <ModalAddExpense v-model:visible="modalVisible" :categories="categories" :departments="departments"
    :expense="editingExpense" @save="onSaveExpense" />

  <ModalDeleteExpense v-model:visible="deleteModalVisible" :expense="selectedExpense"
    @confirm-delete="onConfirmDelete" />

  <ModalDetailExpense v-model:visible="detailModalVisible" :expense="selectedExpense" />
</template>
