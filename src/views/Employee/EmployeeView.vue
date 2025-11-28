<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  Card,
  DataTable,
  Column,
  Button,
  Dialog,
  InputText,
  Textarea,
  Select,
  InputNumber,
  DatePicker,
  Tag
} from 'primevue'
import { toast } from 'vue3-toastify'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  useEmployeeStore,
  type IEmployee,
  type ICreateEmployeePayload,
  type IUpdateEmployeePayload,
} from '@/stores/hr/employee'
import {
  useDepartmentStore,
  type IDepartment,
  type ICreateDepartmentPayload,
} from '@/stores/hr/department'
import formatCurrency from '@/utils/formatCurrency'
import BankData from '@/config/BankData'
import dayjs from 'dayjs'

// Stores
const employeeStore = useEmployeeStore()
const departmentStore = useDepartmentStore()
const queryClient = useQueryClient()

// Queries
const { data: employees } = useQuery<IEmployee[]>({
  queryKey: ['get_employees'],
  queryFn: () => employeeStore.onGetEmployees(),
})

const { data: departments } = useQuery<IDepartment[]>({
  queryKey: ['get_departments'],
  queryFn: () => departmentStore.onGetDepartments(),
})

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showAddDepartmentModal = ref(false)
const selectedEmployee = ref<IEmployee | null>(null)
const searchQuery = ref('')

// Form data
const employeeForm = ref<{
  displayName: string
  name: string
  code: string
  status: string
  position: string
  startDate: Date | number
  department: string
  salaryPro: number
  salary: number
  bankCode: string
  bankAccount: string
  note: string
}>({
  displayName: '',
  name: '',
  code: '',
  status: '',
  position: '',
  startDate: new Date(),
  department: '',
  salaryPro: 0,
  salary: 0,
  bankCode: '',
  bankAccount: '',
  note: '',
})

const departmentForm = ref<ICreateDepartmentPayload>({
  name: '',
  detail: '',
  note: '',
})

// Computed
const filteredEmployees = computed(() => {
  if (!employees.value || !searchQuery.value) return employees.value || []
  const query = searchQuery.value.toLowerCase()
  return employees.value.filter(
    (emp) =>
      emp.displayName?.toLowerCase().includes(query) ||
      emp.name?.toLowerCase().includes(query) ||
      emp.code?.toLowerCase().includes(query)
  )
})

const totalEmployees = computed(() => employees.value?.length || 0)
const totalSalaryPro = computed(() => {
  return employees.value?.reduce((sum, e) => sum + (e.salaryPro || 0), 0) || 0
})
const totalSalary = computed(() => {
  return employees.value?.reduce((sum, e) => sum + (e.salary || 0), 0) || 0
})

// Department options
const departmentOptions = computed(() => {
  if (!departments.value) return []
  return departments.value
    .filter((dept) => dept.active !== false)
    .map((dept) => ({
      label: dept.name,
      value: dept._id,
    }))
})

// Bank options
const bankOptions = computed(() => {
  return Object.keys(BankData).map((key) => ({
    label: (BankData as Record<string, { name: string, icon: string }>)[key]?.name || key,
    value: key,
    icon: (BankData as Record<string, { icon: string }>)[key]?.icon || '',
  }))
})

// Computed for date handling
const startDateValue = computed({
  get: () => {
    if (employeeForm.value.startDate instanceof Date) {
      return employeeForm.value.startDate
    }
    return new Date(employeeForm.value.startDate)
  },
  set: (val: Date | null) => {
    if (val) {
      employeeForm.value.startDate = val
    }
  },
})

const getBankName = (bankCode: string) => {
  if (!bankCode) return null
  const bank = (BankData as Record<string, { name: string, icon: string }>)[bankCode]
  if (!bank) return null
  return {
    name: bank.name,
    icon: bank.icon,
  }
}

// Auto-generate employee code
const generateEmployeeCode = (): string => {
  if (!employees.value || employees.value.length === 0) {
    return 'EMP-001'
  }

  // Extract all employee codes and find the highest number
  const codes = employees.value
    .map((emp) => emp.code)
    .filter((code) => code && code.startsWith('EMP-'))
    .map((code) => {
      const match = code.match(/EMP-(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    })

  const maxNumber = codes.length > 0 ? Math.max(...codes) : 0
  const nextNumber = maxNumber + 1

  // Format as EMP-001, EMP-002, etc. (3 digits)
  return `EMP-${String(nextNumber).padStart(3, '0')}`
}

// Employee Columns Definition
const employeeColumns = ref([
  {
    field: 'code',
    header: 'รหัสพนักงาน',
    headCell: 'min-w-[5rem]',
    render: (slotProps: { data: IEmployee }) =>
      h('span', { class: 'text-sm text-gray-900' }, slotProps.data.code || '-'),
  },
  {
    field: 'displayName',
    header: 'ชื่อเล่น',
    render: (slotProps: { data: IEmployee }) =>
      h('span', { class: 'text-sm text-gray-900' }, slotProps.data.displayName || '-'),
  },
  {
    field: 'name',
    header: 'ชื่อ-นามสกุล',
    render: (slotProps: { data: IEmployee }) =>
      h('span', { class: 'text-sm text-gray-900' }, slotProps.data.name || '-'),
  },
  {
    field: 'status',
    header: 'สถานะพนักงาน',
    headCell: 'min-w-[6rem]',
    bodyCell: 'text-center',
    render: (slotProps: { data: IEmployee }) => {
      const status = employeeStore.statusEmployee.find((status) => status.value === slotProps.data.status)
      return h(Tag, {
        value: status?.label || '-',
        severity: status?.severity || 'secondary',
        size: 'small'
      })
    }
  },
  {
    field: 'position',
    header: 'ตำแหน่ง',
    headCell: 'min-w-[6.5rem]',
    render: (slotProps: { data: IEmployee }) =>
      h('span', { class: 'text-sm text-gray-900' }, slotProps.data.position || '-'),
  },
  {
    field: 'department',
    header: 'แผนก',
    headCell: 'min-w-[6.5rem]',
    render: (slotProps: { data: IEmployee }) =>
      h('span', { class: 'text-sm text-gray-900' }, slotProps.data.department?.name || '-'),
  },
  {
    field: 'startDate',
    header: 'วันเริ่มงาน',
    headCell: 'min-w-[6.5rem]',
    render: (slotProps: { data: IEmployee }) =>
      h(
        'span',
        { class: 'text-sm text-gray-900' },
        slotProps.data.startDate ? dayjs(slotProps.data.startDate).format('DD/MM/YYYY') : '-'
      ),
  },
  {
    field: 'salaryPro',
    header: 'เงินเดือน ช่วงทดลองงาน',
    headCell: 'min-w-[9.5rem]',
    bodyCell: 'text-end',
    render: (slotProps: { data: IEmployee }) =>
      h('span', { class: 'text-sm text-gray-900' }, formatCurrency(slotProps.data.salaryPro || 0)),
  },
  {
    field: 'salary',
    header: 'เงินเดือน หลังผ่านงาน',
    headCell: 'min-w-[8.5rem]',
    bodyCell: 'text-end',
    render: (slotProps: { data: IEmployee }) =>
      h('span', { class: 'text-sm text-gray-900' }, formatCurrency(slotProps.data.salary || 0)),
  },
  {
    field: 'bankAccount',
    header: 'เลขบัญชี',
    render: (slotProps: { data: IEmployee }) =>
      h('span', { class: 'text-sm text-gray-900' }, slotProps.data.bankAccount || '-'),
  },
  {
    field: 'bankCode',
    header: 'ธนาคาร',
    headCell: 'min-w-[6.5rem]',
    render: (slotProps: { data: IEmployee }) =>
      h('div', { class: 'flex items-center gap-1.5' }, [
        h('img', { src: getBankName(slotProps.data.bankCode)?.icon, alt: slotProps.data.bankCode, class: 'w-4 h-4' }),
        h('span', { class: 'text-sm text-gray-600' }, getBankName(slotProps.data.bankCode)?.name || '-'),
      ]),
  },
  {
    field: 'diligence',
    header: 'เบี้ยขยัน',
    render: () => h('span', { class: 'text-sm text-gray-900' }, '0'),
  },
])


// Modal functions
const openAddModal = () => {
  resetEmployeeForm()
  // Auto-generate employee code
  employeeForm.value.code = generateEmployeeCode()
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  resetEmployeeForm()
}

const openEditModal = (employee: IEmployee) => {
  selectedEmployee.value = employee
  employeeForm.value = {
    displayName: employee.displayName || '',
    name: employee.name || '',
    code: employee.code || '',
    status: employee.status || '',
    position: employee.position || '',
    startDate: employee.startDate ? new Date(employee.startDate) : new Date(),
    department: employee.department?._id || '',
    salaryPro: employee.salaryPro || 0,
    salary: employee.salary || 0,
    bankCode: employee.bankCode || '',
    bankAccount: employee.bankAccount || '',
    note: employee.note || '',
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedEmployee.value = null
  resetEmployeeForm()
}

const openAddDepartmentModal = () => {
  resetDepartmentForm()
  showAddDepartmentModal.value = true
}

const closeAddDepartmentModal = () => {
  showAddDepartmentModal.value = false
  resetDepartmentForm()
}

const resetEmployeeForm = () => {
  employeeForm.value = {
    displayName: '',
    name: '',
    code: '',
    status: '',
    position: '',
    startDate: new Date(),
    department: '',
    salaryPro: 0,
    salary: 0,
    bankCode: '',
    bankAccount: '',
    note: '',
  }
}

const resetDepartmentForm = () => {
  departmentForm.value = {
    name: '',
    detail: '',
    note: '',
  }
}

// Mutations
const { mutate: createEmployee, isPending: isCreatingEmployee } = useMutation({
  mutationFn: (payload: ICreateEmployeePayload) => employeeStore.onCreateEmployee(payload),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('เพิ่มพนักงานสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_employees'] })
      closeAddModal()
    } else {
      toast.error('เพิ่มพนักงานไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('เพิ่มพนักงานไม่สำเร็จ')
  },
})

const { mutate: updateEmployee, isPending: isUpdatingEmployee } = useMutation({
  mutationFn: (payload: IUpdateEmployeePayload) => employeeStore.onUpdateEmployee(payload),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('แก้ไขข้อมูลพนักงานสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_employees'] })
      closeEditModal()
    } else {
      toast.error('แก้ไขข้อมูลพนักงานไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('แก้ไขข้อมูลพนักงานไม่สำเร็จ')
  },
})

const { mutate: deleteEmployeeMutation, isPending: isDeletingEmployee } = useMutation({
  mutationFn: (id: string) => employeeStore.onDeleteEmployee(id),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('ลบพนักงานสำเร็จ')
      closeDeleteEmployeeModal()
      queryClient.invalidateQueries({ queryKey: ['get_employees'] })
    } else {
      toast.error('ลบพนักงานไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('ลบพนักงานไม่สำเร็จ')
  },
})

const { mutate: createDepartment, isPending: isCreatingDepartment } = useMutation({
  mutationFn: (payload: ICreateDepartmentPayload) => departmentStore.onCreateDepartment(payload),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('เพิ่มแผนกสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_departments'] })
      closeAddDepartmentModal()
    } else {
      toast.error('เพิ่มแผนกไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('เพิ่มแผนกไม่สำเร็จ')
  },
})

// Handlers
const handleCreateEmployee = () => {
  if (!employeeForm.value.displayName || !employeeForm.value.name || !employeeForm.value.status) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  const payload: ICreateEmployeePayload = {
    ...employeeForm.value,
    startDate:
      employeeForm.value.startDate instanceof Date
        ? employeeForm.value.startDate.getTime()
        : typeof employeeForm.value.startDate === 'number'
          ? employeeForm.value.startDate
          : Date.now(),
  }

  createEmployee(payload)
}

const handleUpdateEmployee = () => {
  if (!selectedEmployee.value) return

  if (!employeeForm.value.displayName || !employeeForm.value.name || !employeeForm.value.status) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  const payload: IUpdateEmployeePayload = {
    ...employeeForm.value,
    _id: selectedEmployee.value._id,
    startDate:
      employeeForm.value.startDate instanceof Date
        ? employeeForm.value.startDate.getTime()
        : typeof employeeForm.value.startDate === 'number'
          ? employeeForm.value.startDate
          : Date.now(),
  }

  updateEmployee(payload)
}

const showDeleteEmployeeModal = ref(false)
const handleDeleteEmployee = (employee: IEmployee) => {
  selectedEmployee.value = employee
  showDeleteEmployeeModal.value = true
}

const closeDeleteEmployeeModal = () => {
  showDeleteEmployeeModal.value = false
  selectedEmployee.value = null
}

const handleCreateDepartment = () => {
  if (!departmentForm.value.name) {
    toast.error('กรุณากรอกชื่อแผนก')
    return
  }

  createDepartment(departmentForm.value)
}
</script>

<template>

  <!-- Page Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-lg font-semibold! text-gray-900">ข้อมูลบุคลากร</h1>
      <p class="text-sm text-gray-600">จัดการข้อมูลพนักงานและติดตามสถานะการทำงาน</p>
    </div>
    <div class="flex justify-end gap-2">
      <Button label="เพิ่มแผนก" icon="pi pi-building" severity="info" size="small" @click="openAddDepartmentModal" />
      <Button label="เพิ่มพนักงาน" icon="pi pi-plus" severity="success" size="small" @click="openAddModal" />
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 my-3">
    <Card :pt="{ body: 'p-4' }" class="bg-green-50 border-green-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ totalEmployees }}</div>
          <div class="text-sm text-green-700">พนักงานทั้งหมด</div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-4' }" class="bg-yellow-50 border-yellow-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-600">0</div>
          <div class="text-sm text-yellow-700">ลา</div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-4' }" class="bg-red-50 border-red-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">0</div>
          <div class="text-sm text-red-700">มาสาย</div>
        </div>
      </template>
    </Card>
  </div>

  <!-- Search and Table -->
  <Card :pt="{ body: 'p-4' }">
    <template #content>
      <DataTable :value="filteredEmployees" :paginator="true" :rows="25" class="p-datatable-sm" :pt="{
        table: 'min-w-full',
        thead: 'bg-gray-50',
        tbody: 'divide-y divide-gray-200',
      }">
        <Column v-for="(item, index) in employeeColumns" :key="index" :field="item.field" :header="item.header" :pt="{
          columnHeaderContent: { class: [item.headCell ?? 'min-w-[4rem]'] },
          columnTitle: { class: 'text-sm font-semibold!' },
          bodyCell: { class: [item.bodyCell] },
        }">
          <template #body="slotProps">
            <component :is="item.render?.(slotProps)" v-if="item.render" />
            <span v-else>
              {{ slotProps.data[item.field] }}
            </span>
          </template>
        </Column>

        <Column header="จัดการ" :exportable="false" :pt="{
          columnTitle: { class: 'text-sm font-semibold! text-gray-900' },
          columnHeaderContent: 'min-w-[4.5rem] justify-end',
        }">
          <template #body="slotProps">
            <div class="flex justify-end gap-2">
              <Button icon="pi pi-pencil" severity="warning" size="small" outlined
                @click="openEditModal(slotProps.data)" v-tooltip.top="'แก้ไขข้อมูล'" />
              <Button icon="pi pi-trash" severity="danger" size="small" outlined
                @click="handleDeleteEmployee(slotProps.data)" v-tooltip.top="'ลบข้อมูล'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <!-- Add Employee Modal -->
  <Dialog v-model:visible="showAddModal" modal :style="{ width: '60rem' }" @update:visible="closeAddModal"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }" :pt="{
      header: 'p-4',
      footer: 'p-4',
    }">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มพนักงานใหม่</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลพนักงานให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Basic Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-user text-blue-600"></i>
          <h4 class="text-lg font-semibold! text-gray-800">ข้อมูลพื้นฐาน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อเล่น *</label>
            <InputText v-model="employeeForm.displayName" placeholder="กรุณาระบุชื่อเล่น" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อ-นามสกุล *</label>
            <InputText v-model="employeeForm.name" placeholder="กรุณาระบุชื่อ-นามสกุล" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">สถานะพนักงาน *</label>
            <Select v-model="employeeForm.status" :options="employeeStore.statusEmployee" optionLabel="label"
              optionValue="value" placeholder="เลือกสถานะพนักงาน" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ตำแหน่ง *</label>
            <InputText v-model="employeeForm.position" placeholder="กรุณาระบุตำแหน่ง" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">วันเริ่มงาน *</label>
            <DatePicker v-model="startDateValue" dateFormat="dd/mm/yy" showIcon iconDisplay="input" fluid
              size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">แผนก</label>
            <Select v-model="employeeForm.department" :options="departmentOptions" optionLabel="label"
              optionValue="value" placeholder="เลือกแผนก" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">เงินเดือนช่วงทดลองงาน</label>
            <InputNumber v-model="employeeForm.salaryPro" :min="0" mode="currency" currency="THB" locale="th-TH" fluid
              size="small" placeholder="ระบุเงินเดือน" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">เงินเดือนหลังผ่านงาน</label>
            <InputNumber v-model="employeeForm.salary" :min="0" mode="currency" currency="THB" locale="th-TH" fluid
              size="small" placeholder="ระบุเงินเดือน" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ธนาคาร</label>
            <Select v-model="employeeForm.bankCode" :options="bankOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกธนาคาร" fluid size="small">
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <img :src="slotProps.option.icon" :alt="slotProps.option.label" class="w-5 h-5" />
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Select>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">เลขบัญชี</label>
            <InputText v-model="employeeForm.bankAccount" placeholder="กรุณาระบุเลขบัญชี" fluid size="small" />
          </div>



          <div class="md:col-span-2">
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <Textarea v-model="employeeForm.note" placeholder="กรอกหมายเหตุ (ถ้ามี)" rows="3" fluid size="small" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeAddModal" size="small" />
        <Button label="เพิ่มพนักงาน" icon="pi pi-check" @click="handleCreateEmployee" :loading="isCreatingEmployee"
          severity="success" size="small" />
      </div>
    </template>
  </Dialog>

  <!-- Edit Employee Modal -->
  <Dialog v-model:visible="showEditModal" modal :style="{ width: '60rem' }" @update:visible="closeEditModal"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }" :pt="{
      header: 'p-4',
      footer: 'p-4',
    }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-pencil text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">แก้ไขข้อมูลพนักงาน</h3>
          <p class="text-sm text-gray-600">แก้ไขข้อมูลพนักงาน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Basic Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-user text-blue-600"></i>
          <h4 class="text-lg font-semibold! text-gray-800">ข้อมูลพื้นฐาน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อเล่น *</label>
            <InputText v-model="employeeForm.displayName" placeholder="กรุณาระบุชื่อเล่น" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อ-นามสกุล *</label>
            <InputText v-model="employeeForm.name" placeholder="กรุณาระบุชื่อ-นามสกุล" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">สถานะพนักงาน *</label>
            <Select v-model="employeeForm.status" :options="employeeStore.statusEmployee" optionLabel="label"
              optionValue="value" placeholder="เลือกสถานะพนักงาน" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ตำแหน่ง *</label>
            <InputText v-model="employeeForm.position" placeholder="กรุณาระบุตำแหน่ง" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">วันเริ่มงาน *</label>
            <DatePicker v-model="startDateValue" dateFormat="dd/mm/yy" showIcon iconDisplay="input" fluid
              size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">แผนก</label>
            <Select v-model="employeeForm.department" :options="departmentOptions" optionLabel="label"
              optionValue="value" placeholder="เลือกแผนก" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">เงินเดือนช่วงทดลองงาน</label>
            <InputNumber v-model="employeeForm.salaryPro" :min="0" mode="currency" currency="THB" locale="th-TH" fluid
              size="small" placeholder="ระบุเงินเดือน" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">เงินเดือนหลังผ่านงาน</label>
            <InputNumber v-model="employeeForm.salary" :min="0" mode="currency" currency="THB" locale="th-TH" fluid
              size="small" placeholder="ระบุเงินเดือน" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">เลขบัญชี</label>
            <InputText v-model="employeeForm.bankAccount" placeholder="กรุณาระบุเลขบัญชี" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ธนาคาร</label>
            <Select v-model="employeeForm.bankCode" :options="bankOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกธนาคาร" fluid size="small">
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <img :src="slotProps.option.icon" :alt="slotProps.option.label" class="w-5 h-5" />
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Select>
          </div>

          <div class="md:col-span-2">
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <Textarea v-model="employeeForm.note" placeholder="กรอกหมายเหตุ (ถ้ามี)" rows="3" fluid size="small" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeEditModal" size="small" />
        <Button label="บันทึกการแก้ไข" icon="pi pi-check" @click="handleUpdateEmployee" :loading="isUpdatingEmployee"
          severity="success" size="small" />
      </div>
    </template>
  </Dialog>

  <!-- Add Department Modal -->
  <Dialog v-model:visible="showAddDepartmentModal" modal :style="{ width: '40rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }" :pt="{
      header: 'p-4',
      footer: 'p-4',
    }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-building text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มแผนกใหม่</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลแผนกให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อแผนก *</label>
            <InputText v-model="departmentForm.name" placeholder="กรุณาระบุชื่อแผนก" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">รายละเอียด</label>
            <Textarea v-model="departmentForm.detail" placeholder="กรอกรายละเอียดแผนก" rows="3" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <Textarea v-model="departmentForm.note" placeholder="กรอกหมายเหตุ (ถ้ามี)" rows="2" fluid size="small" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeAddDepartmentModal" size="small" />
        <Button label="เพิ่มแผนก" icon="pi pi-check" @click="handleCreateDepartment" :loading="isCreatingDepartment"
          severity="success" size="small" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="showDeleteEmployeeModal" v-if="selectedEmployee" modal :style="{ width: '30rem' }"
    @update:visible="closeDeleteEmployeeModal" :pt="{
      header: 'p-4',
      footer: 'p-4',
    }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-trash text-white text-lg"></i>
        </div>
        <div>
          <h3 class=" font-semibold! text-gray-800">ลบข้อมูลพนักงาน</h3>
          <p class="text-sm text-gray-600">คุณต้องการลบข้อมูลพนักงานนี้หรือไม่?</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
        <p class="text-gray-800 font-medium!">คุณต้องการลบข้อมูลพนักงาน <span class="font-bold">{{
            selectedEmployee.displayName || selectedEmployee.name }}</span> หรือไม่?</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeDeleteEmployeeModal" size="small" />
        <Button label="ลบข้อมูล" icon="pi pi-trash" @click="deleteEmployeeMutation(selectedEmployee._id)"
          :loading="isDeletingEmployee" severity="danger" size="small" />
      </div>
    </template>
  </Dialog>
</template>
