<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Card,
  Button,
  DataTable,
  Column,
  Tag,
  Avatar,
  Dialog,
  InputText,
  Select,
  ToggleButton,
} from 'primevue'
import { toast } from 'vue3-toastify'
import {
  useAdminStore,
  type IAdmin,
  type CreateAdminPayload,
  type EditAdminPayload,
} from '../../stores/admin/admin'
import { useQuery } from '@tanstack/vue-query'

// Store
const adminStore = useAdminStore()

// Data fetching
const {
  data: admins,
  isLoading,
  refetch,
} = useQuery<IAdmin[]>({
  queryKey: ['get_admins'],
  queryFn: () => adminStore.onGetAdmins(),
})

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const selectedAdmin = ref<IAdmin | null>(null)

// Form data
const adminForm = ref<CreateAdminPayload>({
  username: '',
  name: '',
  password: '',
  role: 1,
  email: '',
})

const editForm = ref<EditAdminPayload>({
  _id: '',
  username: '',
  name: '',
  password: '',
  email: '',
  image: '',
  role: 1,
  block: false,
})

// Role options
const roleOptions = ref([
  { label: 'Super Admin', value: 0 },
  { label: 'Admin', value: 1 },
  { label: 'Manager', value: 2 },
  { label: 'Staff', value: 3 },
])

// Computed
const adminStats = computed(() => {
  if (!admins.value) return { total: 0, active: 0, blocked: 0, superAdmin: 0 }

  return {
    total: admins.value.length,
    active: admins.value.filter((admin) => !admin.block).length,
    blocked: admins.value.filter((admin) => admin.block).length,
    superAdmin: admins.value.filter((admin) => admin.role === 0).length,
  }
})

// Modal functions
const openAddModal = () => {
  adminForm.value = {
    username: '',
    name: '',
    password: '',
    role: 1,
    email: '',
  }
  showAddModal.value = true
}

const openEditModal = (admin: IAdmin) => {
  editForm.value = {
    _id: admin._id,
    username: admin.username,
    name: admin.name,
    password: '',
    email: admin.email,
    image: admin.image,
    role: admin.role,
    block: admin.block,
  }
  selectedAdmin.value = admin
  showEditModal.value = true
}

const openDetailModal = (admin: IAdmin) => {
  selectedAdmin.value = admin
  showDetailModal.value = true
}

const openDeleteModal = (admin: IAdmin) => {
  selectedAdmin.value = admin
  showDeleteModal.value = true
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showDetailModal.value = false
  showDeleteModal.value = false
  selectedAdmin.value = null
}

// Form handlers
const handleAddAdmin = async () => {
  try {
    await adminStore.onCreateAdmin(adminForm.value)
    toast.success('เพิ่ม Admin สำเร็จ!')
    closeModals()
    refetch()
  } catch (error) {
    toast.error('เกิดข้อผิดพลาดในการเพิ่ม Admin')
    console.error(error)
  }
}

const handleEditAdmin = async () => {
  try {
    await adminStore.onUpdateAdmin(editForm.value)
    toast.success('แก้ไข Admin สำเร็จ!')
    closeModals()
    refetch()
  } catch (error) {
    toast.error('เกิดข้อผิดพลาดในการแก้ไข Admin')
    console.error(error)
  }
}

const handleDeleteAdmin = async () => {
  if (!selectedAdmin.value) return

  try {
    await adminStore.onDeleteAdmin(selectedAdmin.value._id)
    toast.success('ลบ Admin สำเร็จ!')
    closeModals()
    refetch()
  } catch (error) {
    toast.error('เกิดข้อผิดพลาดในการลบ Admin')
    console.error(error)
  }
}

// Helper functions
const getRoleLabel = (role: number) => {
  const roleMap = {
    0: 'Super Admin',
    1: 'Admin',
    2: 'Manager',
    3: 'Staff',
  }
  return roleMap[role as keyof typeof roleMap] || 'Unknown'
}

const getRoleSeverity = (role: number) => {
  switch (role) {
    case 0:
      return 'danger'
    case 1:
      return 'warning'
    case 2:
      return 'info'
    case 3:
      return 'success'
    default:
      return 'secondary'
  }
}

const getStatusSeverity = (block: boolean) => {
  return block ? 'danger' : 'success'
}

const getStatusLabel = (block: boolean) => {
  return block ? 'ถูกบล็อก' : 'ใช้งานได้'
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">จัดการ Admin</h1>
        <p class="text-gray-600">จัดการผู้ดูแลระบบและสิทธิ์การเข้าถึง</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          label="เพิ่ม Admin"
          icon="pi pi-plus"
          severity="success"
          size="small"
          class="btn-hover"
          @click="openAddModal"
        />
        <Button
          label="รีเฟรช"
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          class="btn-hover"
          @click="() => refetch()"
        />
      </div>
    </div>

    <!-- Admin Stats Dashboard -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card class="p-4 md:p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">Admin ทั้งหมด</p>
              <p class="text-xl md:text-2xl font-bold text-blue-600">
                {{ adminStats.total }}
              </p>
              <p class="text-xs text-gray-500">คน</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-users text-blue-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="p-4 md:p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ใช้งานได้</p>
              <p class="text-xl md:text-2xl font-bold text-green-600">
                {{ adminStats.active }}
              </p>
              <p class="text-xs text-gray-500">คน</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-check-circle text-green-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="p-4 md:p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ถูกบล็อก</p>
              <p class="text-xl md:text-2xl font-bold text-red-600">
                {{ adminStats.blocked }}
              </p>
              <p class="text-xs text-gray-500">คน</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-ban text-red-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="p-4 md:p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">Super Admin</p>
              <p class="text-xl md:text-2xl font-bold text-purple-600">
                {{ adminStats.superAdmin }}
              </p>
              <p class="text-xs text-gray-500">คน</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-crown text-purple-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Admin List -->
    <Card class="rounded-2xl bg-white/80">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold! text-gray-900 mb-1">รายการ Admin</h3>
          <p class="text-sm text-gray-600 mb-4">จัดการข้อมูลผู้ดูแลระบบทั้งหมด</p>

          <DataTable
            :value="admins"
            :loading="isLoading"
            :paginator="true"
            :rows="10"
            class="p-datatable-sm"
            :pt="{
              table: 'min-w-full',
              thead: 'bg-gray-50',
            }"
          >
            <Column
              field="image"
              header="รูปภาพ"
              :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[6rem]' }"
            >
              <template #body="slotProps">
                <Avatar
                  :image="slotProps.data.image"
                  :label="slotProps.data.name.charAt(0)"
                  shape="circle"
                  size="large"
                  class="bg-gradient-to-r from-blue-500 to-purple-600"
                />
              </template>
            </Column>

            <Column
              field="name"
              header="ชื่อ-นามสกุล"
              sortable
              :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[12rem]' }"
            >
              <template #body="slotProps">
                <div>
                  <p class="font-medium text-gray-900">{{ slotProps.data.name }}</p>
                  <p class="text-sm text-gray-500">@{{ slotProps.data.username }}</p>
                </div>
              </template>
            </Column>

            <Column
              field="email"
              header="อีเมล"
              sortable
              :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[15rem]' }"
            >
              <template #body="slotProps">
                <div class="flex items-center gap-2">
                  <i class="pi pi-envelope text-gray-400 text-sm"></i>
                  <span class="text-sm">{{ slotProps.data.email }}</span>
                </div>
              </template>
            </Column>

            <Column
              field="role"
              header="บทบาท"
              sortable
              :pt="{
                columnTitle: 'font-semibold',
                columnHeaderContent: 'justify-center min-w-[8rem]',
                bodyCell: 'text-center',
              }"
            >
              <template #body="slotProps">
                <Tag
                  :value="getRoleLabel(slotProps.data.role)"
                  :severity="getRoleSeverity(slotProps.data.role)"
                  size="small"
                />
              </template>
            </Column>

            <Column
              field="block"
              header="สถานะ"
              :pt="{
                columnTitle: 'font-semibold',
                columnHeaderContent: 'justify-center min-w-[8rem]',
                bodyCell: 'text-center',
              }"
            >
              <template #body="slotProps">
                <Tag
                  :value="getStatusLabel(slotProps.data.block)"
                  :severity="getStatusSeverity(slotProps.data.block)"
                  size="small"
                />
              </template>
            </Column>

            <Column
              field="cat"
              header="สร้างเมื่อ"
              sortable
              :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[10rem]' }"
            >
              <template #body="slotProps">
                <span class="text-sm text-gray-600">
                  {{ formatDate(slotProps.data.cat) }}
                </span>
              </template>
            </Column>

            <Column
              header="จัดการ"
              :pt="{
                columnTitle: 'font-semibold',
                columnHeaderContent: 'justify-end min-w-[12rem]',
              }"
            >
              <template #body="slotProps">
                <div class="flex space-x-2 justify-end">
                  <Button
                    icon="pi pi-eye"
                    size="small"
                    text
                    rounded
                    severity="info"
                    v-tooltip.top="'ดูรายละเอียด'"
                    @click="openDetailModal(slotProps.data)"
                  />
                  <Button
                    icon="pi pi-pencil"
                    size="small"
                    text
                    rounded
                    severity="warning"
                    v-tooltip.top="'แก้ไข'"
                    @click="openEditModal(slotProps.data)"
                  />
                  <Button
                    icon="pi pi-trash"
                    size="small"
                    text
                    rounded
                    severity="danger"
                    v-tooltip.top="'ลบ'"
                    @click="openDeleteModal(slotProps.data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>

    <!-- Add Admin Modal -->
    <Dialog
      v-model:visible="showAddModal"
      modal
      :style="{ width: '50rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
      :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-plus text-white text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold! text-gray-800">เพิ่ม Admin ใหม่</h3>
            <p class="text-sm text-gray-600">กรอกข้อมูลสำหรับ Admin ใหม่</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ชื่อ-นามสกุล *
            </label>
            <InputText v-model="adminForm.name" placeholder="กรอกชื่อ-นามสกุล" fluid size="small" />
          </div>
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-at mr-1.5 !text-sm"></i>
              Username *
            </label>
            <InputText
              v-model="adminForm.username"
              placeholder="กรอก username"
              fluid
              size="small"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-envelope mr-1.5 !text-sm"></i>
              อีเมล *
            </label>
            <InputText v-model="adminForm.email" placeholder="กรอกอีเมล" fluid size="small" />
          </div>
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-key mr-1.5 !text-sm"></i>
              รหัสผ่าน *
            </label>
            <InputText
              v-model="adminForm.password"
              type="password"
              placeholder="กรอกรหัสผ่าน"
              fluid
              size="small"
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
            <i class="pi pi-shield mr-1.5 !text-sm"></i>
            บทบาท *
          </label>
          <Select
            v-model="adminForm.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกบทบาท"
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
            @click="closeModals"
            size="small"
          />
          <Button
            label="เพิ่ม Admin"
            icon="pi pi-plus"
            severity="success"
            @click="handleAddAdmin"
            size="small"
          />
        </div>
      </template>
    </Dialog>

    <!-- Edit Admin Modal -->
    <Dialog
      v-model:visible="showEditModal"
      modal
      :style="{ width: '50rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
      :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-pencil text-white text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold! text-gray-800">แก้ไข Admin</h3>
            <p class="text-sm text-gray-600">แก้ไขข้อมูล Admin</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ชื่อ-นามสกุล *
            </label>
            <InputText v-model="editForm.name" placeholder="กรอกชื่อ-นามสกุล" fluid size="small" />
          </div>
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-at mr-1.5 !text-sm"></i>
              Username *
            </label>
            <InputText v-model="editForm.username" placeholder="กรอก username" fluid size="small" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-envelope mr-1.5 !text-sm"></i>
              อีเมล *
            </label>
            <InputText v-model="editForm.email" placeholder="กรอกอีเมล" fluid size="small" />
          </div>
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-key mr-1.5 !text-sm"></i>
              รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)
            </label>
            <InputText
              v-model="editForm.password"
              type="password"
              placeholder="กรอกรหัสผ่านใหม่"
              fluid
              size="small"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-shield mr-1.5 !text-sm"></i>
              บทบาท *
            </label>
            <Select
              v-model="editForm.role"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกบทบาท"
              fluid
              size="small"
            />
          </div>
          <div class="flex items-center gap-3">
            <ToggleButton
              v-model="editForm.block"
              onLabel="บล็อก"
              offLabel="ใช้งานได้"
              onIcon="pi pi-ban"
              offIcon="pi pi-check"
              class="w-32"
              aria-label="Block status"
            />
            <span class="text-sm font-[500]! text-gray-700">สถานะการใช้งาน</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button
            label="ยกเลิก"
            icon="pi pi-times"
            severity="secondary"
            @click="closeModals"
            size="small"
          />
          <Button
            label="บันทึก"
            icon="pi pi-check"
            severity="success"
            @click="handleEditAdmin"
            size="small"
          />
        </div>
      </template>
    </Dialog>

    <!-- Detail Admin Modal -->
    <Dialog
      v-model:visible="showDetailModal"
      modal
      :style="{ width: '45rem' }"
      :breakpoints="{ '1199px': '70vw', '575px': '90vw' }"
      :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-eye text-white text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold! text-gray-800">รายละเอียด Admin</h3>
            <p class="text-sm text-gray-600">ข้อมูลโดยละเอียดของ Admin</p>
          </div>
        </div>
      </template>

      <div v-if="selectedAdmin" class="space-y-4">
        <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <Avatar
            :image="selectedAdmin.image"
            :label="selectedAdmin.name.charAt(0)"
            shape="circle"
            size="xlarge"
            class="bg-gradient-to-r from-blue-500 to-purple-600"
          />
          <div>
            <h4 class="text-lg font-semibold text-gray-900">{{ selectedAdmin.name }}</h4>
            <p class="text-sm text-gray-600">@{{ selectedAdmin.username }}</p>
            <div class="flex gap-2 mt-2">
              <Tag
                :value="getRoleLabel(selectedAdmin.role)"
                :severity="getRoleSeverity(selectedAdmin.role)"
                size="small"
              />
              <Tag
                :value="getStatusLabel(selectedAdmin.block)"
                :severity="getStatusSeverity(selectedAdmin.block)"
                size="small"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-600">อีเมล</label>
            <p class="text-sm text-gray-900">{{ selectedAdmin.email }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-600">สร้างเมื่อ</label>
            <p class="text-sm text-gray-900">{{ formatDate(selectedAdmin.cat) }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-600">อัปเดตล่าสุด</label>
            <p class="text-sm text-gray-900">{{ formatDate(selectedAdmin.uat) }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button
            label="ปิด"
            icon="pi pi-times"
            severity="secondary"
            @click="closeModals"
            size="small"
          />
        </div>
      </template>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <Dialog
      v-model:visible="showDeleteModal"
      modal
      :style="{ width: '30rem' }"
      :breakpoints="{ '1199px': '50vw', '575px': '90vw' }"
      :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-trash text-white text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold! text-gray-800">ยืนยันการลบ</h3>
            <p class="text-sm text-gray-600">คุณแน่ใจหรือไม่ที่จะลบ Admin นี้?</p>
          </div>
        </div>
      </template>

      <div v-if="selectedAdmin" class="space-y-4">
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center gap-3">
            <Avatar
              :image="selectedAdmin.image"
              :label="selectedAdmin.name.charAt(0)"
              shape="circle"
              size="large"
              class="bg-gradient-to-r from-blue-500 to-purple-600"
            />
            <div>
              <h4 class="font-semibold text-gray-900">{{ selectedAdmin.name }}</h4>
              <p class="text-sm text-gray-600">@{{ selectedAdmin.username }}</p>
              <Tag
                :value="getRoleLabel(selectedAdmin.role)"
                :severity="getRoleSeverity(selectedAdmin.role)"
                size="small"
                class="mt-1"
              />
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-600">
          การลบ Admin นี้จะไม่สามารถกู้คืนได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button
            label="ยกเลิก"
            icon="pi pi-times"
            severity="secondary"
            @click="closeModals"
            size="small"
          />
          <Button
            label="ลบ Admin"
            icon="pi pi-trash"
            severity="danger"
            @click="handleDeleteAdmin"
            size="small"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
