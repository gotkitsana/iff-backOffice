<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button, Textarea } from 'primevue'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { Dialog, Select } from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useLotNumberStore,
  type ILotNumber,
  type ICreateLotNumberPayload,
  type IUpdateLotNumberPayload,
} from '../../../stores/product/lot_number'
import { type ICategory } from '@/stores/product/category'

interface IApiResponse {
  data?: unknown
  error?: {
    message: string
  }
}

interface IErrorResponse {
  response?: {
    data?: {
      message: string
    }
  }
}

const props = defineProps<{
  selectedCategory: ICategory
  categoryOptions: { label: string; value: string }[]
}>()

const lotNumberStore = useLotNumberStore()
const queryClient = useQueryClient()

const showModal = ref(false)
const modalType = ref<'add' | 'edit' | 'delete'>('add')
const selectedItem = ref<ILotNumber | null>(null)

const form = ref<ICreateLotNumberPayload>({
  name: '',
  note: '',
  category: props.selectedCategory._id,
  breeder: '',
  age_quality: '',
  grade: '',
  year: '',
})

const ageQualityOptions = [
  { label: 'Tg-Tategoi', value: 'Tg-Tategoi' },
  { label: 'JT-J.Tosai', value: 'JT-J.Tosai' },
  { label: 'Ts-Tosai', value: 'Ts-Tosai' },
  { label: 'Ns-Nisai', value: 'Ns-Nisai' },
  { label: 'Ss-Sasai', value: 'Ss-Sasai' },
]

const gradeOptions = ['A', 'B', 'C']
const yearOptions = ['65', '66', '67', '68', '69', '70']

const generatedName = computed(() => {
  const ageQualityCode = form.value.age_quality ? form.value.age_quality.split('-')[0] : ''

  const parts = [
    form.value.breeder,
    ageQualityCode,
    form.value.grade,
    form.value.year
  ].filter(Boolean)

  if (parts.length === 4) {
    return parts.join('-')
  }
  return ''
})

// Watch for changes to update name
import { watch } from 'vue'
watch(generatedName, (newValue) => {
  form.value.name = newValue
})

const { data: lotNumberData, isLoading } = useQuery<ILotNumber[]>({
  queryKey: ['get_lot_numbers'],
  queryFn: () => lotNumberStore.onGetLotNumbers(),
})

const lotNumbers = computed(() => lotNumberData.value || [])

const { mutate: create, isPending: isCreating } = useMutation({
  mutationFn: (payload: ICreateLotNumberPayload) => lotNumberStore.onCreateLotNumber(payload),
  onSuccess: (data: IApiResponse) => {
    if (data.data) {
      toast.success('เพิ่มเลขล็อตสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_lot_numbers'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'เพิ่มเลขล็อตไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Create lot number error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มเลขล็อตไม่สำเร็จ')
  },
})

const { mutate: update, isPending: isUpdating } = useMutation({
  mutationFn: (payload: IUpdateLotNumberPayload) => lotNumberStore.onUpdateLotNumber(payload),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'modifiedCount' in data.data &&
      (data.data as { modifiedCount: number }).modifiedCount > 0
    ) {
      toast.success('อัปเดตเลขล็อตสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_lot_numbers'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'อัปเดตเลขล็อตไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Update lot number error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตเลขล็อตไม่สำเร็จ')
  },
})

const { mutate: remove, isPending: isDeleting } = useMutation({
  mutationFn: (lotNumberId: string) => lotNumberStore.onDeleteLotNumber(lotNumberId),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'deletedCount' in data.data &&
      (data.data as { deletedCount: number }).deletedCount > 0
    ) {
      toast.success('ลบเลขล็อตสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_lot_numbers'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'ลบเลขล็อตไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Delete lot number error:', error)
    toast.error(error.response?.data?.message || 'ลบเลขล็อตไม่สำเร็จ')
  },
})

const openModal = (type: 'add' | 'edit' | 'delete', item?: ILotNumber) => {
  modalType.value = type
  selectedItem.value = item || null

  if (type === 'add') {
    form.value = {
      name: '',
      note: '',
      category: props.selectedCategory._id,
      breeder: '',
      age_quality: '',
      grade: '',
      year: ''
    }
  } else if (type === 'edit' && item) {
    // Try to parse existing name if fields are missing
    let breeder = item.breeder || ''
    let age_quality = item.age_quality || ''
    let grade = item.grade || ''
    let year = item.year || ''

    if (!breeder && !age_quality && !grade && !year && item.name) {
      const parts = item.name.split('-')
      if (parts.length === 4) {
        breeder = parts[0]
        // Try to find full age_quality from code
        const code = parts[1]
        const matchedOption = ageQualityOptions.find(opt => opt.value.startsWith(code + '-'))
        age_quality = matchedOption ? matchedOption.value : code

        grade = parts[2]
        year = parts[3]
      }
    }

    form.value = {
      name: item.name,
      note: item.note,
      category: item.category?._id,
      breeder,
      age_quality,
      grade,
      year
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = 'add'
  selectedItem.value = null
  form.value = { name: '', note: '', category: '', breeder: '', age_quality: '', grade: '', year: '' }
}

const validate = () => {
  if (!form.value.name.trim()) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสร้างรหัสล็อต')
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validate()) return

  const payload = {
    name: form.value.name.trim(),
    note: form.value.note.trim(),
    category: form.value.category,
    breeder: form.value.breeder,
    age_quality: form.value.age_quality,
    grade: form.value.grade,
    year: form.value.year,
  }

  if (modalType.value === 'add') {
    create(payload)
  } else if (modalType.value === 'edit' && selectedItem.value) {
    update({
      _id: selectedItem.value._id,
      name: payload.name,
      note: payload.note,
      active: selectedItem.value.active,
      cat: selectedItem.value.cat,
      uat: selectedItem.value.uat,
      category: payload.category,
      breeder: payload.breeder,
      age_quality: payload.age_quality,
      grade: payload.grade,
      year: payload.year,
    })
  }
}

const handleDelete = () => {
  if (selectedItem.value) {
    remove(selectedItem.value._id)
  }
}

const isSubmitting = computed(() => isCreating.value || isUpdating.value || isDeleting.value)

const getModalTitle = () => {
  switch (modalType.value) {
    case 'add':
      return 'เพิ่มเลขล็อตใหม่'
    case 'edit':
      return 'แก้ไขเลขล็อต'
    case 'delete':
      return 'ยืนยันการลบเลขล็อต'
    default:
      return ''
  }
}

const filteredLotNumbers = computed(() => {
  return lotNumbers.value.filter((lotNumber) => lotNumber?.category?._id === props.selectedCategory._id)
})
</script>

<template>
  <div>
    <!-- Content Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-600">
            <i class="pi pi-hashtag text-white text-xl"></i>
          </div>
          <div>
            <h2 class="font-semibold! text-gray-900">เลขล็อต</h2>
            <p class="text-gray-600 text-sm">จัดการหมายเลขล็อตของสินค้า</p>
          </div>
        </div>
        <Button label="เพิ่มเลขล็อต" icon="pi pi-plus" severity="success" size="small" @click="openModal('add')" />
      </div>
    </div>

    <!-- Data Table -->
    <div>
      <DataTable :value="filteredLotNumbers" :loading="isLoading" :paginator="true" :rows="10"
        :rowsPerPageOptions="[5, 10, 20]">
        <Column field="name" header="เลขล็อต" :pt="{
          headerCell: ['!min-w-[8.5rem]'],
        }" sortable>
          <template #body="{ data }">
            <span class="text-gray-900">{{ data.name }}</span>
          </template>
        </Column>

        <Column field="breeder" header="ชื่อแม่พันธุ์" :pt="{
          headerCell: ['!min-w-[8rem]'],
        }" sortable>
          <template #body="{ data }">
            <span class="font-medium text-gray-900 text-sm">{{ data.breeder }}</span>
          </template>
        </Column>

        <Column field="age_quality" header="อายุ, คุณภาพ" :pt="{
          headerCell: ['!min-w-[8rem]'],
        }" sortable>
          <template #body="{ data }">
            <span class="font-medium text-gray-900 text-sm">{{ data.age_quality }}</span>
          </template>
        </Column>

        <Column field="grade" header="เกรด" :pt="{
          headerCell: ['!min-w-[4rem]'],
        }" sortable>
          <template #body="{ data }">
            <span class="font-medium text-gray-900 text-sm">{{ data.grade }}</span>
          </template>
        </Column>

        <Column field="year" header="ปี" :pt="{
          headerCell: ['!min-w-[4rem]'],
        }" sortable>
          <template #body="{ data }">
            <span class="font-medium text-gray-900 text-sm">{{ data.year }}</span>
          </template>
        </Column>

        <Column field="category" header="ประเภท">
          <template #body="{ data }">
            <span class="text-gray-700 text-sm">{{ data.category?.name || 'ไม่ระบุ' }}</span>
          </template>
        </Column>

        <Column field="note" header="หมายเหตุ" :pt="{
          headerCell: ['!min-w-[8rem]'],
        }">
          <template #body="{ data }">
            <span class="text-gray-700 text-sm">{{ data.note }}</span>
          </template>
        </Column>

        <Column header="จัดการ" :pt="{ columnHeaderContent: 'justify-end' }">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1">
              <Button icon="pi pi-pencil" size="small" severity="info" text rounded @click="openModal('edit', data)"
                v-tooltip.top="'แก้ไข'" />
              <Button icon="pi pi-trash" size="small" severity="danger" text rounded @click="openModal('delete', data)"
                v-tooltip.top="'ลบ'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal -->
    <Dialog :visible="showModal" @update:visible="closeModal" modal
      :style="{ width: modalType === 'delete' ? '32rem' : '35rem' }">
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-600">
            <i class="pi pi-hashtag text-white"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-800">{{ getModalTitle() }}</h3>
          </div>
        </div>
      </template>

      <!-- Add/Edit Form -->
      <div v-if="modalType !== 'delete'" class="space-y-4">
        <div class="grid grid-cols-1 gap-3">
          <!-- Breeder Name -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ชื่อแม่พันธุ์ <span class="text-red-500">*</span>
            </label>
            <InputText v-model="form.breeder" placeholder="เช่น F4" class="w-full" autocomplete="off" />
          </div>

          <!-- Age / Quality -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              อายุ, คุณภาพ <span class="text-red-500">*</span>
            </label>
            <Select v-model="form.age_quality" :options="ageQualityOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกอายุ, คุณภาพ" fluid size="small" />
          </div>

          <!-- Grade -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              เกรด <span class="text-red-500">*</span>
            </label>
            <Select v-model="form.grade" :options="gradeOptions" placeholder="เลือกเกรด" fluid size="small" />
          </div>

          <!-- Year -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ปี <span class="text-red-500">*</span>
            </label>
            <Select v-model="form.year" :options="yearOptions" placeholder="เลือกปี" fluid size="small" />
          </div>

          <!-- Generated Name Preview -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              รหัสล็อต (สร้างอัตโนมัติ)
            </label>
            <InputText :model-value="generatedName" readonly class="w-full bg-gray-100 text-gray-500" />
          </div>

          <div v-if="modalType == 'edit'">
            <label class="text-sm font-medium text-gray-700 mb-1 block">ประเภทสินค้า</label>
            <Select v-model="form.category" :options="categoryOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกประเภทสินค้า" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              หมายเหตุ <span class="text-red-500">*</span>
            </label>
            <Textarea v-model="form.note" placeholder="รายละเอียดเกี่ยวกับเลขล็อต" rows="3" cols="30" class="w-full"
              autocomplete="off" />
          </div>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <div v-if="modalType === 'delete' && selectedItem" class="space-y-3">
        <div class="flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
          <p class="text-gray-800 font-medium text-lg">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600">เลขล็อต:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">หมายเหตุ:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.note }}</span>
          </div>
        </div>
        <p class="text-sm text-red-600">⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button label="ยกเลิก" severity="secondary" @click="closeModal" size="small" :disabled="isSubmitting" />
          <Button v-if="modalType === 'delete'" label="ลบ" icon="pi pi-trash" @click="handleDelete" severity="danger"
            size="small" :loading="isSubmitting" />
          <Button v-else :label="modalType === 'add' ? 'เพิ่ม' : 'บันทึก'" :loading="isSubmitting" @click="handleSubmit"
            size="small" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
