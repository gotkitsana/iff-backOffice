<script setup lang="ts">
import { ref, computed } from 'vue'
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
  Calendar,
  Avatar,
} from 'primevue'
import { toast } from 'vue3-toastify'

// Data
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const selectedEmployee = ref<{
  id: number
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  salary: number
  startDate: Date
  birthDate: Date | null
  address: string
  emergencyContact: string
  emergencyPhone: string
  avatar: null
} | null>(null)

// Form data
const employeeForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  salary: 0,
  startDate: new Date(),
  birthDate: null as Date | null,
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  employeeId: '',
})

// Sample employees data
const employees = ref([
  {
    id: 1,
    employeeId: 'EMP001',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'somchai@company.com',
    phone: '081-234-5678',
    position: 'ผู้จัดการฟาร์ม',
    department: 'ฟาร์มปลา',
    salary: 35000,
    startDate: new Date('2023-01-15'),
    birthDate: new Date('1990-05-20'),
    avatar: null,
    address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    emergencyContact: 'นางสาวสมหญิง ใจดี',
    emergencyPhone: '082-345-6789',
  },
  {
    id: 2,
    employeeId: 'EMP002',
    firstName: 'นิดา',
    lastName: 'สวยงาม',
    email: 'nida@company.com',
    phone: '082-345-6789',
    position: 'พนักงานขาย',
    department: 'ฝ่ายขาย',
    salary: 25000,
    startDate: new Date('2023-03-20'),
    birthDate: new Date('1995-08-15'),
    avatar: null,
    address: '456 ถนนพระราม 4 กรุงเทพฯ 10500',
    emergencyContact: 'นายสมศักดิ์ สวยงาม',
    emergencyPhone: '083-456-7890',
  },
  {
    id: 3,
    employeeId: 'EMP003',
    firstName: 'ปิยะ',
    lastName: 'เก่งมาก',
    email: 'piya@company.com',
    phone: '083-456-7890',
    position: 'พนักงานบัญชี',
    department: 'ฝ่ายบัญชี',
    salary: 28000,
    startDate: new Date('2023-05-10'),
    birthDate: new Date('1992-12-10'),
    avatar: null,
    address: '789 ถนนสีลม กรุงเทพฯ 10500',
    emergencyContact: 'นางสาวจิรา เก่งมาก',
    emergencyPhone: '084-567-8901',
  },
  {
    id: 4,
    employeeId: 'EMP004',
    firstName: 'วิชัย',
    lastName: 'ขยัน',
    email: 'wichai@company.com',
    phone: '084-567-8901',
    position: 'ช่างเทคนิค',
    department: 'ฟาร์มปลา',
    salary: 22000,
    startDate: new Date('2023-07-01'),
    birthDate: new Date('1988-03-25'),
    avatar: null,
    address: '321 ถนนเพชรบุรี กรุงเทพฯ 10400',
    emergencyContact: 'นายสมพร ขยัน',
    emergencyPhone: '085-678-9012',
  },
  {
    id: 5,
    employeeId: 'EMP005',
    firstName: 'มานี',
    lastName: 'รวยเงิน',
    email: 'manee@company.com',
    phone: '085-678-9012',
    position: 'พนักงานประมูล',
    department: 'ฝ่ายการตลาด',
    salary: 26000,
    startDate: new Date('2023-09-15'),
    birthDate: new Date('1993-07-18'),
    avatar: null,
    address: '654 ถนนรัชดาภิเษก กรุงเทพฯ 10310',
    emergencyContact: 'นางสาวจันทร์ รวยเงิน',
    emergencyPhone: '086-789-0123',
  },
])

// Stats
const totalEmployees = computed(() => employees.value.length)
const totalSalary = computed(() => employees.value.reduce((sum, e) => sum + e.salary, 0))

// Departments
const departments = computed(() => {
  const depts = [...new Set(employees.value.map((e) => e.department))]
  return depts.map((dept) => ({
    name: dept,
    count: employees.value.filter((e) => e.department === dept).length,
  }))
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
    month: 'long',
    day: 'numeric',
  })
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// Modal functions
const openAddModal = () => {
  resetForm()
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  resetForm()
}

const openEditModal = (employee: {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  salary: number
  startDate: Date
  birthDate: Date | null
  address: string
  emergencyContact: string
  emergencyPhone: string
  avatar: null
}) => {
  selectedEmployee.value = employee
  employeeForm.value = {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    department: employee.department,
    salary: employee.salary,
    startDate: employee.startDate,
    birthDate: employee.birthDate,
    address: employee.address,
    emergencyContact: employee.emergencyContact,
    emergencyPhone: employee.emergencyPhone,
    employeeId: employee.employeeId,
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedEmployee.value = null
  resetForm()
}

const openDetailModal = (employee: {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  salary: number
  startDate: Date
  birthDate: Date | null
  address: string
  emergencyContact: string
  emergencyPhone: string
  avatar: null
}) => {
  selectedEmployee.value = employee
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedEmployee.value = null
}

const resetForm = () => {
  employeeForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: 0,
    startDate: new Date(),
    birthDate: null,
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    employeeId: '',
  }
}

// Handlers
const handleCreateEmployee = () => {
  if (
    !employeeForm.value.firstName ||
    !employeeForm.value.lastName ||
    !employeeForm.value.email ||
    !employeeForm.value.position
  ) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  const newEmployee = {
    id: employees.value.length + 1,
    employeeId: `EMP${String(employees.value.length + 1).padStart(3, '0')}`,
    firstName: employeeForm.value.firstName,
    lastName: employeeForm.value.lastName,
    email: employeeForm.value.email,
    phone: employeeForm.value.phone,
    position: employeeForm.value.position,
    department: employeeForm.value.department,
    salary: employeeForm.value.salary,
    startDate: employeeForm.value.startDate,
    birthDate: employeeForm.value.birthDate || new Date(),
    address: employeeForm.value.address,
    emergencyContact: employeeForm.value.emergencyContact,
    emergencyPhone: employeeForm.value.emergencyPhone,
    avatar: null,
  }

  employees.value.unshift(newEmployee)
  toast.success('เพิ่มพนักงานสำเร็จ')
  closeAddModal()
}

const handleUpdateEmployee = () => {
  if (!selectedEmployee.value) return

  const index = employees.value.findIndex((e) => e.id === selectedEmployee.value!.id)
  if (index !== -1) {
    employees.value[index] = {
      ...employees.value[index],
      firstName: employeeForm.value.firstName,
      lastName: employeeForm.value.lastName,
      email: employeeForm.value.email,
      phone: employeeForm.value.phone,
      position: employeeForm.value.position,
      department: employeeForm.value.department,
      salary: employeeForm.value.salary,
      startDate: employeeForm.value.startDate,
      birthDate: employeeForm.value.birthDate || new Date(),
      address: employeeForm.value.address,
      emergencyContact: employeeForm.value.emergencyContact,
      emergencyPhone: employeeForm.value.emergencyPhone,
    }
    toast.success('แก้ไขข้อมูลพนักงานสำเร็จ')
    closeEditModal()
  }
}

const handleDeleteEmployee = (employee: {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  salary: number
  startDate: Date
  birthDate: Date | null
  address: string
  emergencyContact: string
  emergencyPhone: string
  avatar: null
}) => {
  if (confirm(`คุณต้องการลบพนักงาน "${employee.firstName} ${employee.lastName}" หรือไม่?`)) {
    const index = employees.value.findIndex((e) => e.id === employee.id)
    if (index !== -1) {
      employees.value.splice(index, 1)
      toast.success('ลบพนักงานสำเร็จ')
    }
  }
}

// Options
const positionOptions = [
  { label: 'ผู้จัดการฟาร์ม', value: 'ผู้จัดการฟาร์ม' },
  { label: 'พนักงานขาย', value: 'พนักงานขาย' },
  { label: 'พนักงานบัญชี', value: 'พนักงานบัญชี' },
  { label: 'ช่างเทคนิค', value: 'ช่างเทคนิค' },
  { label: 'พนักงานประมูล', value: 'พนักงานประมูล' },
  { label: 'พนักงานดูแลปลา', value: 'พนักงานดูแลปลา' },
]

const departmentOptions = [
  { label: 'ฟาร์มปลา', value: 'ฟาร์มปลา' },
  { label: 'ฝ่ายขาย', value: 'ฝ่ายขาย' },
  { label: 'ฝ่ายบัญชี', value: 'ฝ่ายบัญชี' },
  { label: 'ฝ่ายการตลาด', value: 'ฝ่ายการตลาด' },
  { label: 'ฝ่ายปฏิบัติการ', value: 'ฝ่ายปฏิบัติการ' },
]
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">จัดการบุคลากร</h1>
        <p class="text-gray-600">จัดการข้อมูลพนักงานและติดตามสถานะการทำงาน</p>
      </div>
      <div class="flex space-x-3">
        <Button
          label="เพิ่มพนักงาน"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openAddModal"
        />
      </div>
    </div>

    <!-- Departments Overview -->
    <Card  :pt="{ body: 'p-4' }">
      <template #header>
        <div class="p-4 pb-0">
          <h3 class="text-lg font-semibold! text-gray-900">แผนกต่างๆ</h3>
          <p class="text-sm text-gray-600 lg:mt-1">จำนวนพนักงานในแต่ละแผนก</p>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          <div
            class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 lg:p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-center gap-2.5 lg:gap-3">
              <div class="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-users text-blue-600 text-lg"></i>
              </div>
              <div>
                <h4 class="!text-sm lg:!text-base text-gray-900">พนักงานทั้งหมด</h4>
                <p class="text-xl text-blue-600 font-[600]!">{{ totalEmployees }}</p>
              </div>
            </div>
          </div>

          <!-- <div
            v-for="dept in departments"
            :key="dept.name"
            class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 lg:p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-center gap-2.5 lg:gap-3">
              <div class="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-briefcase text-blue-600 text-lg"></i>
              </div>
              <div>
                <h4 class="!text-sm lg:!text-base text-gray-900">{{ dept.name }}</h4>
                <p class="text-xl text-blue-600 font-[600]!">{{ dept.count }}</p>
              </div>
            </div>
          </div> -->
        </div>
      </template>
    </Card>

    <!-- Employees Table -->
    <Card :pt="{ body: 'p-4' }">
      <template #content>
        <DataTable
          :value="employees"
          :paginator="true"
          :rows="10"
          class="p-datatable-sm"
          :pt="{
            table: 'min-w-full',
            thead: 'bg-gray-50',
            tbody: 'divide-y divide-gray-200',
          }"
        >
          <Column field="employeeId" header="รหัสพนักงาน" sortable :pt="{ columnHeaderContent: 'min-w-[7rem]' }">
            <template #body="slotProps">
              <span class="font-medium! text-sm text-blue-600">{{ slotProps.data.employeeId }}</span>
            </template>
          </Column>

          <Column field="name" header="ชื่อ-นามสกุล" sortable >
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <Avatar
                  :label="getInitials(slotProps.data.firstName, slotProps.data.lastName)"
                  class="bg-blue-100 text-blue-600"
                  size="normal"
                  shape="circle"
                />
                <div>
                  <p class="font-medium! !text-sm text-gray-900">
                    {{ slotProps.data.firstName }} {{ slotProps.data.lastName }}
                  </p>
                  <p class="text-xs text-gray-500">{{ slotProps.data.email }}</p>
                </div>
              </div>
            </template>
          </Column>

          <Column field="position" header="ตำแหน่ง" sortable :pt="{ columnHeaderContent: 'min-w-[6rem]' }">
            <template #body="slotProps">
              <div>
                <p class="font-medium! !text-sm text-gray-900">{{ slotProps.data.position }}</p>
                <p class="text-xs text-gray-500">{{ slotProps.data.department }}</p>
              </div>
            </template>
          </Column>

          <Column field="phone" header="เบอร์โทร" sortable :pt="{ columnHeaderContent: 'min-w-[6.5rem]' }">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{ slotProps.data.phone }}</span>
            </template>
          </Column>

          <Column field="startDate" header="วันที่เริ่มงาน" sortable :pt="{ columnHeaderContent: 'min-w-[7.5rem]' }">
            <template #body="slotProps">
              <span class="text-sm text-gray-600">{{ formatDate(slotProps.data.startDate) }}</span>
            </template>
          </Column>

          <Column header="การจัดการ" :exportable="false" :pt="{ columnHeaderContent: 'min-w-[7.25rem] justify-end' }">
            <template #body="slotProps">
              <div class="flex justify-end gap-2">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  size="small"
                  outlined
                  @click="openDetailModal(slotProps.data)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  size="small"
                  outlined
                  @click="openEditModal(slotProps.data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  outlined
                  @click="handleDeleteEmployee(slotProps.data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>

  <!-- Add Employee Modal -->
  <Dialog
    v-model:visible="showAddModal"
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
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มพนักงานใหม่</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลพนักงานให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Personal Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-user text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลส่วนตัว</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ชื่อ *
            </label>
            <InputText v-model="employeeForm.firstName" placeholder="กรอกชื่อ" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              นามสกุล *
            </label>
            <InputText
              v-model="employeeForm.lastName"
              placeholder="กรอกนามสกุล"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-envelope mr-1.5 !text-sm"></i>
              อีเมล *
            </label>
            <InputText
              v-model="employeeForm.email"
              type="email"
              placeholder="กรอกอีเมล"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-phone mr-1.5 !text-sm"></i>
              เบอร์โทรศัพท์ *
            </label>
            <InputText
              v-model="employeeForm.phone"
              placeholder="กรอกเบอร์โทรศัพท์"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-calendar mr-1.5 !text-sm"></i>
              วันเกิด
            </label>
            <Calendar v-model="employeeForm.birthDate" showIcon fluid size="small" />
          </div>

          <div class="md:col-span-2">
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-map-marker mr-1.5 !text-sm"></i>
              ที่อยู่
            </label>
            <Textarea
              v-model="employeeForm.address"
              placeholder="กรอกที่อยู่"
              rows="2"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- Work Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-briefcase text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลการทำงาน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-id-card mr-1.5 !text-sm"></i>
              ตำแหน่ง *
            </label>
            <Select
              v-model="employeeForm.position"
              :options="positionOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกตำแหน่ง"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-building mr-1.5 !text-sm"></i>
              แผนก *
            </label>
            <Select
              v-model="employeeForm.department"
              :options="departmentOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกแผนก"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-money-bill mr-1.5 !text-sm"></i>
              เงินเดือน (บาท) *
            </label>
            <InputNumber
              v-model="employeeForm.salary"
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
              วันที่เริ่มงาน *
            </label>
            <Calendar v-model="employeeForm.startDate" showIcon fluid size="small" />
          </div>

          <div></div>
        </div>
      </div>

      <!-- Emergency Contact -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-exclamation-circle text-red-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ผู้ติดต่อฉุกเฉิน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ชื่อผู้ติดต่อ
            </label>
            <InputText
              v-model="employeeForm.emergencyContact"
              placeholder="กรอกชื่อผู้ติดต่อฉุกเฉิน"
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
              v-model="employeeForm.emergencyPhone"
              placeholder="กรอกเบอร์โทรศัพท์"
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
          @click="closeAddModal"
          size="small"
        />
        <Button
          label="เพิ่มพนักงาน"
          icon="pi pi-check"
          @click="handleCreateEmployee"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>

  <!-- Edit Employee Modal -->
  <Dialog
    v-model:visible="showEditModal"
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
          class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-pencil text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">แก้ไขข้อมูลพนักงาน</h3>
          <p class="text-sm text-gray-600">แก้ไขข้อมูลพนักงาน</p>
        </div>
      </div>
    </template>

    <!-- Same form as Add Modal -->
    <div class="space-y-4">
      <!-- Personal Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-user text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลส่วนตัว</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ชื่อ *
            </label>
            <InputText v-model="employeeForm.firstName" placeholder="กรอกชื่อ" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              นามสกุล *
            </label>
            <InputText
              v-model="employeeForm.lastName"
              placeholder="กรอกนามสกุล"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-envelope mr-1.5 !text-sm"></i>
              อีเมล *
            </label>
            <InputText
              v-model="employeeForm.email"
              type="email"
              placeholder="กรอกอีเมล"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-phone mr-1.5 !text-sm"></i>
              เบอร์โทรศัพท์ *
            </label>
            <InputText
              v-model="employeeForm.phone"
              placeholder="กรอกเบอร์โทรศัพท์"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-calendar mr-1.5 !text-sm"></i>
              วันเกิด
            </label>
            <Calendar v-model="employeeForm.birthDate" showIcon fluid size="small" />
          </div>

          <div class="md:col-span-2">
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-map-marker mr-1.5 !text-sm"></i>
              ที่อยู่
            </label>
            <Textarea
              v-model="employeeForm.address"
              placeholder="กรอกที่อยู่"
              rows="2"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- Work Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-briefcase text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลการทำงาน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-id-card mr-1.5 !text-sm"></i>
              ตำแหน่ง *
            </label>
            <Select
              v-model="employeeForm.position"
              :options="positionOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกตำแหน่ง"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-building mr-1.5 !text-sm"></i>
              แผนก *
            </label>
            <Select
              v-model="employeeForm.department"
              :options="departmentOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกแผนก"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-money-bill mr-1.5 !text-sm"></i>
              เงินเดือน (บาท) *
            </label>
            <InputNumber
              v-model="employeeForm.salary"
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
              วันที่เริ่มงาน *
            </label>
            <Calendar v-model="employeeForm.startDate" showIcon fluid size="small" />
          </div>

          <div></div>
        </div>
      </div>

      <!-- Emergency Contact -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-exclamation-circle text-red-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ผู้ติดต่อฉุกเฉิน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ชื่อผู้ติดต่อ
            </label>
            <InputText
              v-model="employeeForm.emergencyContact"
              placeholder="กรอกชื่อผู้ติดต่อฉุกเฉิน"
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
              v-model="employeeForm.emergencyPhone"
              placeholder="กรอกเบอร์โทรศัพท์"
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
          @click="closeEditModal"
          size="small"
        />
        <Button
          label="บันทึกการแก้ไข"
          icon="pi pi-check"
          @click="handleUpdateEmployee"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>

  <!-- Detail Employee Modal -->
  <Dialog
    v-model:visible="showDetailModal"
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
          <i class="pi pi-user text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">รายละเอียดพนักงาน</h3>
          <p class="text-sm text-gray-600">ข้อมูลพนักงานโดยละเอียด</p>
        </div>
      </div>
    </template>

    <div v-if="selectedEmployee" class="space-y-6">
      <!-- Profile Header -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div class="flex items-center gap-4">
          <Avatar
            :label="getInitials(selectedEmployee.firstName, selectedEmployee.lastName)"
            class="bg-blue-500 text-white"
            size="xlarge"
            shape="circle"
          />
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-900">
              {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}
            </h3>
            <p class="text-gray-600">{{ selectedEmployee.position }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-sm text-gray-500">รหัส: {{ selectedEmployee.employeeId }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Information Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Personal Information -->
        <Card>
          <template #header>
            <div class="flex items-center gap-2 px-6 pt-6">
              <i class="pi pi-user text-blue-600"></i>
              <h4 class="text-lg font-semibold text-gray-900">ข้อมูลส่วนตัว</h4>
            </div>
          </template>
          <template #content>
            <div class="space-y-3 px-6 pb-6">
              <div>
                <label class="text-sm text-gray-600">อีเมล</label>
                <p class="font-medium text-gray-900">{{ selectedEmployee.email }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-600">เบอร์โทรศัพท์</label>
                <p class="font-medium text-gray-900">{{ selectedEmployee.phone }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-600">วันเกิด</label>
                <p class="font-medium text-gray-900">
                  {{ selectedEmployee.birthDate ? formatDate(selectedEmployee.birthDate) : '-' }}
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-600">ที่อยู่</label>
                <p class="font-medium text-gray-900">{{ selectedEmployee.address || '-' }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Work Information -->
        <Card>
          <template #header>
            <div class="flex items-center gap-2 px-6 pt-6">
              <i class="pi pi-briefcase text-green-600"></i>
              <h4 class="text-lg font-semibold text-gray-900">ข้อมูลการทำงาน</h4>
            </div>
          </template>
          <template #content>
            <div class="space-y-3 px-6 pb-6">
              <div>
                <label class="text-sm text-gray-600">ตำแหน่ง</label>
                <p class="font-medium text-gray-900">{{ selectedEmployee.position }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-600">แผนก</label>
                <p class="font-medium text-gray-900">{{ selectedEmployee.department }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-600">เงินเดือน</label>
                <p class="font-medium text-green-600">
                  {{ formatCurrency(selectedEmployee.salary) }}
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-600">วันที่เริ่มงาน</label>
                <p class="font-medium text-gray-900">
                  {{ formatDate(selectedEmployee.startDate) }}
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Emergency Contact -->
      <Card>
        <template #header>
          <div class="flex items-center gap-2 px-6 pt-6">
            <i class="pi pi-exclamation-circle text-red-600"></i>
            <h4 class="text-lg font-semibold text-gray-900">ผู้ติดต่อฉุกเฉิน</h4>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6">
            <div>
              <label class="text-sm text-gray-600">ชื่อผู้ติดต่อ</label>
              <p class="font-medium text-gray-900">
                {{ selectedEmployee.emergencyContact || '-' }}
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-600">เบอร์โทรศัพท์</label>
              <p class="font-medium text-gray-900">{{ selectedEmployee.emergencyPhone || '-' }}</p>
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
          @click="closeDetailModal"
          size="small"
        />
        <Button
          label="แก้ไข"
          icon="pi pi-pencil"
          severity="warning"
          @click="
            () => {
              closeDetailModal()
              if (selectedEmployee) openEditModal(selectedEmployee)
            }
          "
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
