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
  Tag,
  Checkbox,
} from 'primevue'
import { toast } from 'vue3-toastify'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import {
  useAccountCategoryStore,
  type IAccountCategory,
  type ICreateAccountCategoryPayload,
  type IUpdateAccountCategoryPayload,
} from '@/stores/accounting/category'
import {
  useDepartmentStore,
  type IDepartment,
} from '@/stores/hr/department'
import { useAccountExpenseStore, type IExpenseTypeValue } from '@/stores/accounting/expense'

// Stores
const categoryStore = useAccountCategoryStore()
const departmentStore = useDepartmentStore()
const expenseStore = useAccountExpenseStore()
const queryClient = useQueryClient()
const router = useRouter()

// Queries
const { data: categories } = useQuery<IAccountCategory[]>({
  queryKey: ['get_categories_accounting'], // get_categories_accounting
  queryFn: () => categoryStore.onGetCategories(),
})

const { data: departments } = useQuery<IDepartment[]>({
  queryKey: ['get_departments'],
  queryFn: () => departmentStore.onGetDepartments(),
})

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedCategory = ref<IAccountCategory | null>(null)
const searchQuery = ref('')

// Form data
const categoryForm = ref<ICreateAccountCategoryPayload & { active?: boolean }>({
  name: '',
  detail: '',
  department: '',
  type: '' as IExpenseTypeValue | '',
  note: '',
  active: true,
})


// Filter categories for expense type only (categories where type is one of expense types)
const expenseCategories = computed(() => {
  if (!categories.value) return []
  const expenseTypeValues = expenseStore.expense_types.map(t => t.value)
  return categories.value.filter((cat) => expenseTypeValues.includes(cat.type))
})

// Computed
const filteredCategories = computed(() => {
  if (!expenseCategories.value || !searchQuery.value) return expenseCategories.value || []
  const query = searchQuery.value.toLowerCase()
  return expenseCategories.value.filter(
    (cat) =>
      cat.name?.toLowerCase().includes(query) ||
      cat.detail?.toLowerCase().includes(query) ||
      cat.note?.toLowerCase().includes(query)
  )
})

const totalCategories = computed(() => expenseCategories.value?.length || 0)

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

// Helper functions
const getDepartmentName = (department: IDepartment | string | null) => {
  if (!department || !departments.value) return '-'
  // If department is an object, get the name directly
  if (typeof department === 'object' && 'name' in department) {
    return department.name || '-'
  }
  // If department is a string (ID), find it
  const dept = departments.value.find((d) => d._id === department)
  return dept ? dept.name : '-'
}

const getExpenseTypeLabel = (type: IExpenseTypeValue | string) => {
  const expenseType = expenseStore.expense_types.find((t) => t.value === type)
  return expenseType ? expenseType.label : type
}

// Category Columns Definition
const categoryColumns = ref([
  {
    field: 'name',
    header: 'ชื่อรายการ',
    headCell: 'min-w-[10rem]',
    render: (slotProps: { data: IAccountCategory }) =>
      h('span', { class: 'text-sm text-gray-900 font-medium' }, slotProps.data.name || '-'),
  },
  {
    field: 'type',
    header: 'ประเภทค่าใช้จ่าย',
    headCell: 'min-w-[8rem]',
    render: (slotProps: { data: IAccountCategory }) => {
      return h('span', { class: 'text-sm text-gray-600' }, slotProps.data.type ? getExpenseTypeLabel(slotProps.data.type) : '-')
    },
  },
  {
    field: 'note',
    header: 'หมายเหตุ',
    headCell: 'min-w-[10rem]',
    render: (slotProps: { data: IAccountCategory }) =>
      h('span', { class: 'text-sm text-gray-600' }, slotProps.data.note || '-'),
  },
  {
    field: 'department',
    header: 'แผนก',
    headCell: 'min-w-[8rem]',
    render: (slotProps: { data: IAccountCategory }) =>
      h('span', { class: 'text-sm text-gray-600' }, getDepartmentName(slotProps.data.department)),
  },
  {
    field: 'detail',
    header: 'รายละเอียด',
    headCell: 'min-w-[12rem]',
    render: (slotProps: { data: IAccountCategory }) =>
      h('span', { class: 'text-sm text-gray-600' }, slotProps.data.detail || '-'),
  },
  {
    field: 'active',
    header: 'สถานะ',
    headCell: 'min-w-[6rem] !justify-center',
    bodyCell: 'text-center',
    render: (slotProps: { data: IAccountCategory }) => {
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
  resetCategoryForm()
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  resetCategoryForm()
}

const openEditModal = (category: IAccountCategory) => {
  selectedCategory.value = category
  categoryForm.value = {
    name: category.name || '',
    detail: category.detail || '',
    department: typeof category.department === 'string' ? category.department : (category.department?._id || ''),
    type: category.type || ('' as IExpenseTypeValue | ''),
    note: category.note || '',
    active: category.active !== false,
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedCategory.value = null
  resetCategoryForm()
}

const openDeleteModal = (category: IAccountCategory) => {
  selectedCategory.value = category
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedCategory.value = null
}

const resetCategoryForm = () => {
  categoryForm.value = {
    name: '',
    detail: '',
    department: '',
    type: '' as IExpenseTypeValue | '',
    note: '',
    active: true,
  }
}

// Mutations
const { mutate: createCategory, isPending: isCreatingCategory } = useMutation({
  mutationFn: (payload: ICreateAccountCategoryPayload) => categoryStore.onCreateAccountCategory(payload),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('เพิ่มรายการค่าใช้จ่ายสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_categories_accounting'] })
      closeAddModal()
    } else {
      toast.error('เพิ่มรายการค่าใช้จ่ายไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('เพิ่มรายการค่าใช้จ่ายไม่สำเร็จ')
  },
})

const { mutate: updateCategory, isPending: isUpdatingCategory } = useMutation({
  mutationFn: (payload: IUpdateAccountCategoryPayload) => categoryStore.onUpdateAccountCategory(payload),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('แก้ไขข้อมูลรายการค่าใช้จ่ายสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_categories_accounting'] })
      closeEditModal()
    } else {
      toast.error('แก้ไขข้อมูลรายการค่าใช้จ่ายไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('แก้ไขข้อมูลรายการค่าใช้จ่ายไม่สำเร็จ')
  },
})

const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation({
  mutationFn: (id: string) => categoryStore.onDeleteAccountCategory(id),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('ลบรายการค่าใช้จ่ายสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_categories_accounting'] })
      closeDeleteModal()
    } else {
      toast.error('ลบรายการค่าใช้จ่ายไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('ลบรายการค่าใช้จ่ายไม่สำเร็จ')
  },
})

// Handlers
const handleCreateCategory = () => {
  if (!categoryForm.value.name) {
    toast.error('กรุณากรอกชื่อรายการ')
    return
  }
  if (!categoryForm.value.department) {
    toast.error('กรุณาเลือกแผนก')
    return
  }
  if (!categoryForm.value.type) {
    toast.error('กรุณาเลือกประเภทค่าใช้จ่าย')
    return
  }

  const payload: ICreateAccountCategoryPayload = {
    name: categoryForm.value.name,
    detail: categoryForm.value.detail || '',
    department: categoryForm.value.department,
    type: categoryForm.value.type as IExpenseTypeValue,
    note: categoryForm.value.note || '',
  }

  createCategory(payload)
}

const handleUpdateCategory = () => {
  if (!selectedCategory.value) return

  if (!categoryForm.value.name) {
    toast.error('กรุณากรอกชื่อรายการ')
    return
  }
  if (!categoryForm.value.department) {
    toast.error('กรุณาเลือกแผนก')
    return
  }
  if (!categoryForm.value.type) {
    toast.error('กรุณาเลือกประเภทค่าใช้จ่าย')
    return
  }

  const payload: IUpdateAccountCategoryPayload = {
    _id: selectedCategory.value._id,
    name: categoryForm.value.name,
    detail: categoryForm.value.detail || '',
    department: categoryForm.value.department,
    type: categoryForm.value.type as IExpenseTypeValue,
    note: categoryForm.value.note || '',
    active: categoryForm.value.active !== false,
  }

  updateCategory(payload)
}

const handleDeleteCategory = () => {
  if (!selectedCategory.value) return
  deleteCategory(selectedCategory.value._id)
}
</script>

<template>
  <!-- Page Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-lg font-semibold! text-gray-900">ตั้งค่ารายการค่าใช้จ่าย</h1>
      <p class="text-sm text-gray-600">จัดการข้อมูลรายการค่าใช้จ่ายและตั้งค่าสถานะการใช้งาน</p>
    </div>
    <div class="flex justify-end gap-2">
      <Button label="เพิ่มรายการ" icon="pi pi-plus" severity="success" size="small" @click="openAddModal" />
      <Button label="กลับ" icon="pi pi-chevron-left" severity="contrast" size="small"
        @click="router.push('/accounting/expense')" />
    </div>
  </div>

  <!-- Summary Card -->
  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 my-3">
    <Card :pt="{ body: 'p-4' }" class="bg-gray-50 border-gray-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-600">{{ totalCategories }}</div>
          <div class="text-sm text-gray-700">รายการทั้งหมด</div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-4' }" class="bg-green-50 border-green-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">
            {{expenseCategories?.filter((c) => c.active !== false).length || 0}}
          </div>
          <div class="text-sm text-green-700">รายการที่ใช้งาน</div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-4' }" class="bg-amber-50 border-amber-200">
      <template #content>
        <div class="text-center">
          <div class="text-2xl font-bold text-amber-600">
            {{expenseCategories?.filter((c) => c.active === false).length || 0}}
          </div>
          <div class="text-sm text-amber-700">รายการที่ปิดใช้งาน</div>
        </div>
      </template>
    </Card>
  </div>

  <!-- Search and Table -->
  <Card :pt="{ body: 'p-4' }">
    <template #content>
      <DataTable :value="filteredCategories" :paginator="true" :rows="25" class="p-datatable-sm" :pt="{
        table: 'min-w-full',
        thead: 'bg-gray-50',
        tbody: 'divide-y divide-gray-200',
      }">
        <Column v-for="(item, index) in categoryColumns" :key="index" :field="item.field" :header="item.header" :pt="{
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

  <!-- Add Category Modal -->
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
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มรายการค่าใช้จ่ายใหม่</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลรายการค่าใช้จ่ายให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">แผนก *</label>
        <Select v-model="categoryForm.department" :options="departmentOptions" optionLabel="label" optionValue="value"
          placeholder="เลือกแผนก" fluid size="small" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">ประเภทค่าใช้จ่าย *</label>
        <Select v-model="categoryForm.type" :options="expenseStore.expense_types" optionLabel="label"
          optionValue="value" placeholder="เลือกประเภทค่าใช้จ่าย" fluid size="small" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อรายการ *</label>
        <InputText v-model="categoryForm.name" placeholder="กรุณาระบุชื่อรายการ" fluid size="small" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">รายละเอียด</label>
        <Textarea v-model="categoryForm.detail" placeholder="กรอกรายละเอียด" rows="3" fluid size="small" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
        <Textarea v-model="categoryForm.note" placeholder="กรอกหมายเหตุ (ถ้ามี)" rows="2" fluid size="small" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeAddModal" size="small" />
        <Button label="เพิ่มรายการ" icon="pi pi-check" @click="handleCreateCategory" :loading="isCreatingCategory"
          severity="success" size="small" />
      </div>
    </template>
  </Dialog>

  <!-- Edit Category Modal -->
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
          <h3 class="text-lg font-semibold! text-gray-800">แก้ไขข้อมูลรายการค่าใช้จ่าย</h3>
          <p class="text-sm text-gray-600">แก้ไขข้อมูลรายการค่าใช้จ่าย</p>
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">แผนก *</label>
        <Select v-model="categoryForm.department" :options="departmentOptions" optionLabel="label" optionValue="value"
          placeholder="เลือกแผนก" fluid size="small" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">ประเภทค่าใช้จ่าย *</label>
        <Select v-model="categoryForm.type" :options="expenseStore.expense_types" optionLabel="label"
          optionValue="value" placeholder="เลือกประเภทค่าใช้จ่าย" fluid size="small" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อรายการ *</label>
        <InputText v-model="categoryForm.name" placeholder="กรุณาระบุชื่อรายการ" fluid size="small" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">รายละเอียด</label>
        <Textarea v-model="categoryForm.detail" placeholder="กรอกรายละเอียด" rows="3" fluid size="small" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
        <Textarea v-model="categoryForm.note" placeholder="กรอกหมายเหตุ (ถ้ามี)" rows="2" fluid size="small" />
      </div>

      <div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="categoryForm.active" :binary="true" inputId="active" />
          <label for="active" class="text-sm font-medium text-gray-700">สถานะใช้งาน</label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeEditModal" size="small" />
        <Button label="บันทึกการแก้ไข" icon="pi pi-check" @click="handleUpdateCategory" :loading="isUpdatingCategory"
          severity="success" size="small" />
      </div>
    </template>
  </Dialog>

  <!-- Delete Category Modal -->
  <Dialog v-model:visible="showDeleteModal" v-if="selectedCategory" modal :style="{ width: '30rem' }"
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
          <h3 class="font-semibold! text-gray-800">ลบข้อมูลรายการค่าใช้จ่าย</h3>
          <p class="text-sm text-gray-600">คุณต้องการลบข้อมูลรายการค่าใช้จ่ายนี้หรือไม่?</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
        <p class="text-gray-800 font-medium!">
          คุณต้องการลบข้อมูลรายการค่าใช้จ่าย
          <span class="font-bold">{{ selectedCategory.name }}</span> หรือไม่?
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeDeleteModal" size="small" />
        <Button label="ลบข้อมูล" icon="pi pi-trash" @click="handleDeleteCategory" :loading="isDeletingCategory"
          severity="danger" size="small" />
      </div>
    </template>
  </Dialog>
</template>
