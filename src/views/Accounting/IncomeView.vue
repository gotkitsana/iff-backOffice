<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { toast } from 'vue3-toastify'
import dayjs from 'dayjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// Components
import { Button, Select, DatePicker, DataTable, Column, InputText, Image, Tag } from 'primevue'
import ModalAddIncome from '@/components/accounting/ModalAddIncome.vue'

// Stores
import { useAccountIncomeStore } from '@/stores/accounting/income'
import { useAccountCategoryStore } from '@/stores/accounting/category'
import { useDepartmentStore } from '@/stores/hr/department'


// Types
import type { IIncome } from '@/stores/accounting/income'
import type { IAccountCategory } from '@/stores/accounting/category'
import type { IDepartment } from '@/stores/hr/department'

defineOptions({
  name: 'IncomeView',
})

const queryClient = useQueryClient()
const incomeStore = useAccountIncomeStore()
const categoryStore = useAccountCategoryStore()
const departmentStore = useDepartmentStore()


// State
const categories = ref<IAccountCategory[]>([])
const departments = ref<IDepartment[]>([])
const modalVisible = ref(false)

// Filters
const selectedDepartment = ref<string | null>(null)
const dateRange = ref<Date[]>([])
const selectedQuickDate = ref<string | null>(null)
// const globalFilter = ref('') // Removed as per request to not use DataTable filter

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

// TanStack Query for Incomes
const { data: incomes, isPending: loading } = useQuery({
  queryKey: ['incomes', selectedDepartment, dateRange],
  queryFn: async () => {
    if (!dateRange.value || dateRange.value.length < 2 || !dateRange.value[0] || !dateRange.value[1]) {
      return []
    }
    const from = dayjs(dateRange.value[0]).valueOf()
    const to = dayjs(dateRange.value[1]).valueOf()

    if (selectedDepartment.value) {
      return await incomeStore.onGetIncomeByDepartment({
        department: selectedDepartment.value,
        from,
        to,
      })
    } else {
      return await incomeStore.onGetIncomes({ from, to })
    }
  },
  enabled: computed(() => !!dateRange.value && dateRange.value.length === 2 && !!dateRange.value[0] && !!dateRange.value[1]),
})

// Mutation for Creating Income
const createIncomeMutation = useMutation({
  mutationFn: async ({ payload, file }: { payload: any; file: File | null }) => {
    const res = await incomeStore.onCreateIncome(payload)
    if (res.data && file) {
      await incomeStore.onSendIncomeSlip({ id: res.data._id, image: file })
    }
    return res
  },
  onSuccess: () => {
    toast.success('บันทึกข้อมูลสำเร็จ')
    modalVisible.value = false
    queryClient.invalidateQueries({ queryKey: ['incomes'] })
  },
  onError: (error) => {
    console.error(error)
    toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
  },
})

// KPI
const totalIncome = computed(() => {
  return (incomes.value || [])
    .filter((i: IIncome) => i.type === 'รายรับ')
    .reduce((sum: number, i: IIncome) => sum + i.amount, 0)
})

const totalExpense = computed(() => {
  return (incomes.value || [])
    .filter((i: IIncome) => i.type === 'รายจ่าย')
    .reduce((sum: number, i: IIncome) => sum + i.amount, 0)
})

const profit = computed(() => totalIncome.value - totalExpense.value)


const onResetFilter = () => {
  selectedDepartment.value = null
  selectedQuickDate.value = 'this_month'
  applyQuickDate()
}

const onSaveIncome = (data: { payload: any; file: File | null }) => {
  createIncomeMutation.mutate(data)
}

const getDepartmentName = (id: string) => {
  const dept = departments.value.find((d) => d._id === id)
  return dept ? dept.name : '-'
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

</script>

<template>
  <div class="space-y-3">
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-3">
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-3 md:p-4">
        <h3 class="text-gray-500 text-sm">รายรับ</h3>
        <p class="text-xl font-bold text-green-600">{{ formatCurrency(totalIncome) }}</p>
      </div>
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-3  md:p-4">
        <h3 class="text-gray-500 text-sm">รายจ่าย</h3>
        <p class="text-xl font-bold text-red-600">{{ formatCurrency(totalExpense) }}</p>
      </div>
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-3  md:p-4">
        <h3 class="text-gray-500 text-sm">กำไร/ขาดทุน</h3>
        <p class="text-xl font-bold" :class="profit >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ formatCurrency(profit) }}
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-3 bg-white p-3 md:p-4 rounded-lg shadow">
      <div class="flex items-center flex-wrap justify-between gap-3 mb-3">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-[600]! text-gray-800">
            รายรับ
          </h3>
        </div>

        <div class="flex items-center flex-wrap gap-2">
          <Button label="บันทึกรายรับ" icon="pi pi-plus" severity="success" size="small" @click="modalVisible = true" />

          <Button label="ตั้งค่า" icon="pi pi-cog" severity="info" size="small" />
        </div>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">แผนก</label>
            <Select v-model="selectedDepartment" :options="departments" optionLabel="name" optionValue="_id"
              placeholder="เลือกแผนก" size="small" fluid filter />
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
    </div>

    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <!-- DataTable -->
      <DataTable :value="incomes" :paginator="true" :rows="10" :rowsPerPageOptions="[10, 20, 50]" :loading="loading"
        stripedRows removableSort
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="แสดง {first} ถึง {last} จาก {totalRecords}">
        <template #empty> ไม่พบข้อมูล </template>

        <Column field="cat" header="วันที่" class="text-sm"
        :pt="{
          headerCell: ['!min-w-[6.5rem]']
        }"
        >
          <template #body="slotProps">
            {{ formatDate(slotProps.data.cat) }}
          </template>
        </Column>
        <Column field="type" header="ประเภทค่าใช้จ่าย" class="text-sm"
        :pt="{
          headerCell: ['!min-w-[9.5rem]']
        }"
        >
          <template #body="slotProps">
            <Tag :value="slotProps.data.type" :severity="slotProps.data.type === 'รายรับ' ? 'success' : 'danger'"
              size="small" />
          </template>
        </Column>
        <Column field="item" header="รายการ" class="text-sm"></Column>
        <Column field="admin" header="ผู้บันทึก" class="text-sm">
          <template #body="slotProps">
            <span class="text-gray-600 text-sm">{{ slotProps.data.admin || '-' }}</span>
          </template>
        </Column>
        <Column field="department" header="แผนก" class="text-sm">
          <template #body="slotProps">
            {{ getDepartmentName(slotProps.data.department) }}
          </template>
        </Column>
        <Column field="amount" header="จำนวนเงิน" class="text-sm">
          <template #body="slotProps">
            <span :class="slotProps.data.type === 'รายรับ' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
              {{ formatCurrency(slotProps.data.amount) }}
            </span>
          </template>
        </Column>

        <Column header="รูปภาพสลิป" class="text-sm">
          <template #body="slotProps">
            <div v-if="slotProps.data.image">
              <Image v-if="(slotProps.data as any).image" :src="(slotProps.data as any).image" alt="Slip" width="50"
                preview />
              <span v-else>-</span>
            </div>
            <div v-else>-</div>
          </template>
        </Column>
        <Column field="note" header="หมายเหตุ" class="text-sm"></Column>
      </DataTable>
    </div>

    <ModalAddIncome v-model:visible="modalVisible" :categories="categories" :departments="departments"
      @save="onSaveIncome" />
  </div>
</template>
