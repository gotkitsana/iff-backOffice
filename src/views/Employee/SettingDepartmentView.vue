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
  Tag,
  Checkbox,
} from 'primevue'
import { toast } from 'vue3-toastify'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import {
  useDepartmentStore,
  type IDepartment,
  type ICreateDepartmentPayload,
  type IUpdateDepartmentPayload,
} from '@/stores/hr/department'

// Stores
const departmentStore = useDepartmentStore()
const queryClient = useQueryClient()
const router = useRouter()

// Queries
const { data: departments } = useQuery<IDepartment[]>({
  queryKey: ['get_departments'],
  queryFn: () => departmentStore.onGetDepartments(),
})

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedDepartment = ref<IDepartment | null>(null)
const searchQuery = ref('')

// Form data
const departmentForm = ref<ICreateDepartmentPayload & { active?: boolean }>({
  name: '',
  detail: '',
  note: '',
  active: true,
})

// Computed
const filteredDepartments = computed(() => {
  if (!departments.value || !searchQuery.value) return departments.value || []
  const query = searchQuery.value.toLowerCase()
  return departments.value.filter(
    (dept) =>
      dept.name?.toLowerCase().includes(query) ||
      dept.detail?.toLowerCase().includes(query) ||
      dept.note?.toLowerCase().includes(query)
  )
})

const totalDepartments = computed(() => departments.value?.length || 0)

// Department Columns Definition
const departmentColumns = ref([
  {
    field: 'name',
    header: 'ชื่อแผนก',
    headCell: 'min-w-[8rem]',
    render: (slotProps: { data: IDepartment }) =>
      h('span', { class: 'text-sm text-gray-900 font-medium' }, slotProps.data.name || '-'),
  },
  {
    field: 'detail',
    header: 'รายละเอียด',
    headCell: 'min-w-[12rem]',
    render: (slotProps: { data: IDepartment }) =>
      h('span', { class: 'text-sm text-gray-600' }, slotProps.data.detail || '-'),
  },
  {
    field: 'note',
    header: 'หมายเหตุ',
    headCell: 'min-w-[10rem]',
    render: (slotProps: { data: IDepartment }) =>
      h('span', { class: 'text-sm text-gray-600' }, slotProps.data.note || '-'),
  },
  {
    field: 'active',
    header: 'สถานะ',
    headCell: 'min-w-[6rem] !justify-center',
    bodyCell: 'text-center',
    render: (slotProps: { data: IDepartment }) => {
      const isActive = slotProps.data.active !== false
      return h(Tag, {
        value: isActive ? 'ใช้งาน' : 'ไม่ใช้งาน',
        severity: isActive ? 'success' : 'warn',
        size: 'small',
      })
    },
  },
])

// Modal functions
const openAddModal = () => {
  resetDepartmentForm()
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  resetDepartmentForm()
}

const openEditModal = (department: IDepartment) => {
  selectedDepartment.value = department
  departmentForm.value = {
    name: department.name || '',
    detail: department.detail || '',
    note: department.note || '',
    active: department.active !== false,
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedDepartment.value = null
  resetDepartmentForm()
}

const openDeleteModal = (department: IDepartment) => {
  selectedDepartment.value = department
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedDepartment.value = null
}

const resetDepartmentForm = () => {
  departmentForm.value = {
    name: '',
    detail: '',
    note: '',
    active: true,
  }
}

// Mutations
const { mutate: createDepartment, isPending: isCreatingDepartment } = useMutation({
  mutationFn: (payload: ICreateDepartmentPayload) => departmentStore.onCreateDepartment(payload),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('เพิ่มแผนกสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_departments'] })
      closeAddModal()
    } else {
      toast.error('เพิ่มแผนกไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('เพิ่มแผนกไม่สำเร็จ')
  },
})

const { mutate: updateDepartment, isPending: isUpdatingDepartment } = useMutation({
  mutationFn: (payload: IUpdateDepartmentPayload) => departmentStore.onUpdateDepartment(payload),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('แก้ไขข้อมูลแผนกสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_departments'] })
      closeEditModal()
    } else {
      toast.error('แก้ไขข้อมูลแผนกไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('แก้ไขข้อมูลแผนกไม่สำเร็จ')
  },
})

const { mutate: deleteDepartment, isPending: isDeletingDepartment } = useMutation({
  mutationFn: (id: string) => departmentStore.onDeleteDepartment(id),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('ลบแผนกสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_departments'] })
      closeDeleteModal()
    } else {
      toast.error('ลบแผนกไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('ลบแผนกไม่สำเร็จ')
  },
})

// Handlers
const handleCreateDepartment = () => {
  if (!departmentForm.value.name) {
    toast.error('กรุณากรอกชื่อแผนก')
    return
  }

  const payload: ICreateDepartmentPayload = {
    name: departmentForm.value.name,
    detail: departmentForm.value.detail || '',
    note: departmentForm.value.note || '',
  }

  createDepartment(payload)
}

const handleUpdateDepartment = () => {
  if (!selectedDepartment.value) return

  if (!departmentForm.value.name) {
    toast.error('กรุณากรอกชื่อแผนก')
    return
  }

  const payload: IUpdateDepartmentPayload = {
    _id: selectedDepartment.value._id,
    name: departmentForm.value.name,
    detail: departmentForm.value.detail || '',
    note: departmentForm.value.note || '',
    active: departmentForm.value.active !== false,
  }

  updateDepartment(payload)
}

const handleDeleteDepartment = () => {
  if (!selectedDepartment.value) return
  deleteDepartment(selectedDepartment.value._id)
}
</script>

<template>
  <!-- Page Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-lg font-semibold! text-gray-900">ตั้งค่าแผนก</h1>
      <p class="text-sm text-gray-600">จัดการข้อมูลแผนกและตั้งค่าสถานะการใช้งาน</p>
    </div>
    <div class="flex justify-end gap-2">
      <Button label="เพิ่มแผนก" icon="pi pi-plus" severity="success" size="small" @click="openAddModal" />
      <Button label="กลับ" icon="pi pi-chevron-left" severity="contrast" size="small"
        @click="router.push('/employee')" />

    </div>
  </div>

  <!-- Summary Card -->
  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 my-3">
    <Card :pt="{ body: 'p-4' }" class="bg-gray-50 border-gray-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-600">{{ totalDepartments }}</div>
          <div class="text-sm text-gray-700">แผนกทั้งหมด</div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-4' }" class="bg-green-50 border-green-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">
            {{departments?.filter((d) => d.active !== false).length || 0}}
          </div>
          <div class="text-sm text-green-700">แผนกที่ใช้งาน</div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-4' }" class="bg-amber-50 border-amber-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-amber-600">
            {{departments?.filter((d) => d.active === false).length || 0}}
          </div>
          <div class="text-sm text-amber-700">แผนกที่ปิดใช้งาน</div>
        </div>
      </template>
    </Card>
  </div>

  <!-- Search and Table -->
  <Card :pt="{ body: 'p-4' }">
    <template #content>


      <DataTable :value="filteredDepartments" :paginator="true" :rows="25" class="p-datatable-sm" :pt="{
        table: 'min-w-full',
        thead: 'bg-gray-50',
        tbody: 'divide-y divide-gray-200',
      }">
        <Column v-for="(item, index) in departmentColumns" :key="index" :field="item.field" :header="item.header" :pt="{
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
              <Button icon="pi pi-pencil" severity="warning" size="small" outlined v-tooltip.top="'แก้ไขข้อมูล'"
                @click="openEditModal(slotProps.data)" />
              <Button icon="pi pi-trash" severity="danger" size="small" outlined v-tooltip.top="'ลบข้อมูล'"
                @click="openDeleteModal(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <!-- Add Department Modal -->
  <Dialog v-model:visible="showAddModal" modal :style="{ width: '40rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }" :pt="{
      header: 'p-4',
      footer: 'p-4',
    }" @update:visible="closeAddModal">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มแผนกใหม่</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลแผนกให้ครบถ้วน</p>
        </div>
      </div>
    </template>

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

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeAddModal" size="small" />
        <Button label="เพิ่มแผนก" icon="pi pi-check" @click="handleCreateDepartment" :loading="isCreatingDepartment"
          severity="success" size="small" />
      </div>
    </template>
  </Dialog>

  <!-- Edit Department Modal -->
  <Dialog v-model:visible="showEditModal" modal :style="{ width: '40rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }" :pt="{
      header: 'p-4',
      footer: 'p-4',
    }" @update:visible="closeEditModal">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-pencil text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">แก้ไขข้อมูลแผนก</h3>
          <p class="text-sm text-gray-600">แก้ไขข้อมูลแผนก</p>
        </div>
      </div>
    </template>

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

      <div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="departmentForm.active" :binary="true" inputId="active" />
          <label for="active" class="text-sm font-medium text-gray-700">สถานะใช้งาน</label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeEditModal" size="small" />
        <Button label="บันทึกการแก้ไข" icon="pi pi-check" @click="handleUpdateDepartment"
          :loading="isUpdatingDepartment" severity="success" size="small" />
      </div>
    </template>
  </Dialog>

  <!-- Delete Department Modal -->
  <Dialog v-model:visible="showDeleteModal" v-if="selectedDepartment" modal :style="{ width: '30rem' }"
    @update:visible="closeDeleteModal" :pt="{
      header: 'p-4',
      footer: 'p-4',
    }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-trash text-white text-lg"></i>
        </div>
        <div>
          <h3 class="font-semibold! text-gray-800">ลบข้อมูลแผนก</h3>
          <p class="text-sm text-gray-600">คุณต้องการลบข้อมูลแผนกนี้หรือไม่?</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
        <p class="text-gray-800 font-medium!">
          คุณต้องการลบข้อมูลแผนก
          <span class="font-bold">{{ selectedDepartment.name }}</span> หรือไม่?
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeDeleteModal" size="small" />
        <Button label="ลบข้อมูล" icon="pi pi-trash" @click="handleDeleteDepartment" :loading="isDeletingDepartment"
          severity="danger" size="small" />
      </div>
    </template>
  </Dialog>
</template>
