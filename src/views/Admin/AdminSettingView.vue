<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Card,
  Button,
  DataTable,
  Column,
  Tag,
  Dialog,
  InputText,
  Select,
  Checkbox,
  Password
} from 'primevue'
import { toast } from 'vue3-toastify'
import {
  useAdminStore,
  type IAdmin,
  type CreateAdminPayload,
  type EditAdminPayload,
} from '../../stores/admin/admin'
import { useMutation, useQuery } from '@tanstack/vue-query'

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
// const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const selectedAdmin = ref<IAdmin | null>(null)

// Form data
const adminForm = ref({
  username: '',
  name: '',
  password: '',
  role: null,
  email: '',
})

const editForm = ref({
  _id: '',
  username: '',
  name: '',
  password: '',
  email: '',
  image: '',
  role: null as number | null,
  block: false,
})

// Role options
const roleOptions = ref([
  { label: 'Sales', value: 1 },
  { label: 'User', value: 2 },
  { label: 'Admin', value: 3 },
  { label: 'Super Admin', value: 5 },
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
    role: null,
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

// const openDetailModal = (admin: IAdmin) => {
//   selectedAdmin.value = admin
//   showDetailModal.value = true
// }

const openDeleteModal = (admin: IAdmin) => {
  selectedAdmin.value = admin
  showDeleteModal.value = true
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showDeleteModal.value = false
  selectedAdmin.value = null
  adminForm.value = {
    username: '',
    name: '',
    password: '',
    role: null,
    email: '',
  }
  editForm.value = {
    _id: '',
    username: '',
    name: '',
    password: '',
    email: '',
    image: '',
    role: null,
    block: false,
  }
}

// Form handlers
const handleAddAdmin = async () => {
  if (!adminForm.value.username) {
    toast.error('กรุณาระบุชื่อผู้ใช้งาน')
    return
  }

  if (!adminForm.value.name) {
    toast.error('กรุณาระบุชื่อ')
    return
  }

  if (!adminForm.value.password) {
    toast.error('กรุณาระบุรหัสผ่าน')
    return
  }

  if (!adminForm.value.role || adminForm.value.role === null) {
    toast.error('กรุณาระบุบทบาท')
    return
  }

  createAdmin({
    username: adminForm.value.username,
    name: adminForm.value.name,
    password: adminForm.value.password,
    role: adminForm.value.role,
    email: adminForm.value.email,
  })
}

const { mutate: createAdmin, isPending: isCreating } = useMutation({
  mutationFn: (payload: CreateAdminPayload) => adminStore.onCreateAdmin(payload),
  onSuccess: (data: any) => {
    if (data.data) {
      toast.success('เพิ่ม Admin สำเร็จ!')
      closeModals()
      refetch()
    } else {
      toast.error(data.error.message || 'เพิ่ม Admin ไม่สำเร็จ!')
    }
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'เพิ่ม Admin ไม่สำเร็จ!')
  },
})

const handleEditAdmin = async () => {
  if (!editForm.value.username) {
    toast.error('กรุณาระบุชื่อผู้ใช้งาน')
    return
  }

  if (!editForm.value.name) {
    toast.error('กรุณาระบุชื่อ')
    return
  }

  if (!editForm.value.role || editForm.value.role === null) {
    toast.error('กรุณาระบุบทบาท')
    return
  }

  updateAdmin({
    _id: editForm.value._id,
    username: editForm.value.username,
    name: editForm.value.name,
    password: editForm.value.password,
    role: editForm.value.role,
    email: editForm.value.email,
    image: editForm.value.image,
    block: editForm.value.block,
  })
}

const { mutate: updateAdmin, isPending: isUpdating } = useMutation({
  mutationFn: (payload: EditAdminPayload) => adminStore.onUpdateAdmin(payload),
  onSuccess: (data: any) => {
    if (data.data) {
      toast.success('แก้ไข Admin สำเร็จ!')
      closeModals()
      refetch()
    } else {
      toast.error(data.error.message || 'แก้ไข Admin ไม่สำเร็จ!')
    }
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'แก้ไข Admin ไม่สำเร็จ!')
  },
})

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
    1: 'Sales',
    2: 'User',
    3: 'Admin',
    5: 'Super Admin',
  }
  return roleMap[role as keyof typeof roleMap] || 'Unknown'
}

const getRoleSeverity = (role: number) => {
  switch (role) {
    case 1:
      return 'warn'
    case 2:
      return 'contrast'
    case 3:
      return 'primary'
    case 5:
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
    </div>

    <!-- Admin Stats Dashboard -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card class="card-hover">
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

      <Card class="card-hover">
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

      <Card class="card-hover">
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

      <Card class="card-hover">
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
        <div class="flex gap-2 justify-between items-center mb-4">
          <div>
            <h3 class="text-lg font-semibold! text-gray-900">รายการ Admin</h3>
            <p class="text-sm text-gray-600">จัดการข้อมูลผู้ดูแลระบบทั้งหมด</p>
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
          </div>
        </div>

        <DataTable
          :value="admins"
          :loading="isLoading"
          :paginator="true"
          :rows="20"
          :pt="{
            table: 'min-w-full text-sm',
            thead: 'bg-gray-50',
            tbody: 'divide-y divide-gray-200 text-sm',
          }"
        >
          <Column
            field="name"
            header="ชื่อ"
            :pt="{
              headerCell: 'min-w-[5rem]',
            }"
          >
            <template #body="slotProps">
              <div>
                <p class="font-medium! text-gray-900">{{ slotProps.data.name }}</p>
                <p class="text-sm text-gray-500">@{{ slotProps.data.username }}</p>
              </div>
            </template>
          </Column>

          <Column
            field="email"
            header="อีเมล"
            :pt="{
              headerCell: 'min-w-[6rem]',
            }"
          >
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <span class="text-sm">{{ slotProps.data.email || '-' }}</span>
              </div>
            </template>
          </Column>

          <Column
            field="role"
            header="บทบาท"
            :pt="{
              headerCell: 'min-w-[5rem]',
              columnHeaderContent: '!justify-center',
              bodyCell: 'text-center',
            }"
          >
            <template #body="slotProps">
              <Tag
                :value="getRoleLabel(slotProps.data.role)"
                :severity="getRoleSeverity(slotProps.data.role)"
                size="small"
                class="text-xs"
              />
            </template>
          </Column>

          <Column
            field="block"
            header="สถานะ"
            :pt="{
              headerCell: 'min-w-[6rem]',
              columnHeaderContent: '!justify-center',
              bodyCell: 'text-center',
            }"
          >
            <template #body="slotProps">
              <Tag
                :value="getStatusLabel(slotProps.data.block)"
                :severity="getStatusSeverity(slotProps.data.block)"
                size="small"
                class="text-xs"
              />
            </template>
          </Column>

          <Column
            field="cat"
            header="สร้างเมื่อ"
            :pt="{
              headerCell: 'min-w-[9rem]',
            }"
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
              columnHeaderContent: '!justify-end',
            }"
          >
            <template #body="slotProps">
              <div class="flex space-x-2 justify-end">
                <!-- <Button
                  icon="pi pi-eye"
                  size="small"
                  text
                  rounded
                  severity="info"
                  v-tooltip.top="'ดูรายละเอียด'"
                  @click="openDetailModal(slotProps.data)"
                /> -->
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
      </template>
    </Card>

    <!-- Add Admin Modal -->
    <Dialog
      v-model:visible="showAddModal"
      @update:visible="closeModals"
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
              ชื่อ *
            </label>
            <InputText v-model="adminForm.name" placeholder="กรอกชื่อ" fluid size="small" />
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
            <Password
              v-model="adminForm.password"
              type="password"
              placeholder="กรอกรหัสผ่าน"
              fluid
              size="small"
              toggleMask
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
            :loading="isCreating"
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
              ชื่อ *
            </label>
            <InputText v-model="editForm.name" placeholder="กรอกชื่อ" fluid size="small" />
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
            <Password
              v-model="editForm.password"
              type="password"
              placeholder="กรอกรหัสผ่านใหม่"
              fluid
              size="small"
              toggleMask
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

          <div class="flex items-center gap-2 pt-3">
            <Checkbox v-model="editForm.block" size="small" binary />
            <span class="text-sm font-[500]! text-gray-700"> บล็อกบัญชี </span>
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
            :loading="isUpdating"
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
        <p class="text-gray-900">คุณต้องการลบ Admin {{ selectedAdmin.name }} หรือไม่?</p>
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
