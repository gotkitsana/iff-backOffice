<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import {Dialog, Select} from 'primevue'
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
    form.value = { name: '', note: '', category: props.selectedCategory._id }
  } else if (type === 'edit' && item) {
    form.value = {
      name: item.name,
      note: item.note,
      category: item.category?._id,
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = 'add'
  selectedItem.value = null
  form.value = { name: '', note: '', category: '' }
}

const validate = () => {
  if (!form.value.name.trim()) {
    toast.error('กรุณากรอกเลขล็อต')
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
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-600"
          >
            <i class="pi pi-hashtag text-white text-xl"></i>
          </div>
          <div>
            <h2 class="font-semibold! text-gray-900">เลขล็อต</h2>
            <p class="text-gray-600 text-sm">จัดการหมายเลขล็อตของสินค้า</p>
          </div>
        </div>
        <Button
          label="เพิ่มเลขล็อต"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openModal('add')"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div>
      <DataTable
        :value="filteredLotNumbers"
        :loading="isLoading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
      >
        <Column field="name" header="เลขล็อต" sortable>
          <template #body="{ data }">
            <span class="font-medium text-gray-900">{{ data.name }}</span>
          </template>
        </Column>

        <Column field="category" header="ประเภท" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.category?.name || 'ไม่ระบุ' }}</span>
          </template>
        </Column>

        <Column field="note" header="หมายเหตุ" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.note }}</span>
          </template>
        </Column>

        <Column header="จัดการ" :pt="{ columnHeaderContent: 'justify-end' }">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1">
              <Button
                icon="pi pi-pencil"
                size="small"
                severity="info"
                text
                rounded
                @click="openModal('edit', data)"
                v-tooltip.top="'แก้ไข'"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                rounded
                @click="openModal('delete', data)"
                v-tooltip.top="'ลบ'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal -->
    <Dialog
      :visible="showModal"
      @update:visible="closeModal"
      modal
      :style="{ width: modalType === 'delete' ? '32rem' : '35rem' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-600"
          >
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
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              เลขล็อต <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="form.name"
              placeholder="เช่น LOT001"
              class="w-full"
              autocomplete="off"
            />
          </div>

          <div v-if="modalType == 'edit'">
            <label class="text-sm font-medium text-gray-700 mb-1 block">ประเภทสินค้า</label>
            <Select
              v-model="form.category"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกประเภทสินค้า"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              หมายเหตุ <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="form.note"
              placeholder="รายละเอียดเกี่ยวกับเลขล็อต"
              class="w-full"
              autocomplete="off"
            />
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
          <Button
            label="ยกเลิก"
            severity="secondary"
            @click="closeModal"
            size="small"
            :disabled="isSubmitting"
          />
          <Button
            v-if="modalType === 'delete'"
            label="ลบ"
            icon="pi pi-trash"
            @click="handleDelete"
            severity="danger"
            size="small"
            :loading="isSubmitting"
          />
          <Button
            v-else
            :label="modalType === 'add' ? 'เพิ่ม' : 'บันทึก'"
            :loading="isSubmitting"
            @click="handleSubmit"
            size="small"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
