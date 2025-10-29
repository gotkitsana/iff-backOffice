<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button, InputText, DataTable, Column, Dialog } from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useSpeciesStore,
  type ISpecies,
  type ICreateSpeciesPayload,
  type IUpdateSpeciesPayload,
} from '../../../stores/product/species'

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

const speciesStore = useSpeciesStore()
const queryClient = useQueryClient()

const showModal = ref(false)
const modalType = ref<'add' | 'edit' | 'delete'>('add')
const selectedItem = ref<ISpecies | null>(null)

const form = ref<ICreateSpeciesPayload>({
  name: '',
  detail: '',
})

const { data: speciesData, isLoading } = useQuery<ISpecies[]>({
  queryKey: ['get_species'],
  queryFn: () => speciesStore.onGetSpecies(),
})

const species = computed(() => speciesData.value || [])

const { mutate: create, isPending: isCreating } = useMutation({
  mutationFn: (payload: ICreateSpeciesPayload) => speciesStore.onCreateSpecies(payload),
  onSuccess: (data: IApiResponse) => {
    if (data.data) {
      toast.success('เพิ่มสายพันธุ์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_species'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'เพิ่มสายพันธุ์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Create species error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มสายพันธุ์ไม่สำเร็จ')
  },
})

const { mutate: update, isPending: isUpdating } = useMutation({
  mutationFn: (payload: IUpdateSpeciesPayload) => speciesStore.onUpdateSpecies(payload),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'modifiedCount' in data.data &&
      (data.data as { modifiedCount: number }).modifiedCount > 0
    ) {
      toast.success('อัปเดตสายพันธุ์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_species'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'อัปเดตสายพันธุ์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Update species error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตสายพันธุ์ไม่สำเร็จ')
  },
})

const { mutate: remove, isPending: isDeleting } = useMutation({
  mutationFn: (speciesId: string) => speciesStore.onDeleteProduct(speciesId),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'deletedCount' in data.data &&
      (data.data as { deletedCount: number }).deletedCount > 0
    ) {
      toast.success('ลบสายพันธุ์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_species'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'ลบสายพันธุ์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Delete species error:', error)
    toast.error(error.response?.data?.message || 'ลบสายพันธุ์ไม่สำเร็จ')
  },
})

const openModal = (type: 'add' | 'edit' | 'delete', item?: ISpecies) => {
  modalType.value = type
  selectedItem.value = item || null

  if (type === 'add') {
    form.value = { name: '', detail: '' }
  } else if (type === 'edit' && item) {
    form.value = {
      name: item.name,
      detail: item.detail,
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = 'add'
  selectedItem.value = null
  form.value = { name: '', detail: '' }
}

const validate = () => {
  if (!form.value.name.trim()) {
    toast.error('กรุณากรอกชื่อสายพันธุ์')
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validate()) return

  const payload = {
    name: form.value.name.trim(),
    detail: form.value.detail.trim(),
  }

  if (modalType.value === 'add') {
    create(payload)
  } else if (modalType.value === 'edit' && selectedItem.value) {
    update({
      _id: selectedItem.value._id,
      name: payload.name,
      detail: payload.detail,
      active: selectedItem.value.active,
      cat: selectedItem.value.cat,
      uat: selectedItem.value.uat,
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
      return 'เพิ่มสายพันธุ์ปลาใหม่'
    case 'edit':
      return 'แก้ไขสายพันธุ์ปลา'
    case 'delete':
      return 'ยืนยันการลบสายพันธุ์ปลา'
    default:
      return ''
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Content Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-600"
          >
            <i class="pi pi-star text-white text-xl"></i>
          </div>
          <div>
            <h2 class="font-semibold! text-gray-900">สายพันธุ์ปลา</h2>
            <p class="text-gray-600 text-sm">จัดการสายพันธุ์ปลาคาร์ฟ</p>
          </div>
        </div>
        <Button
          label="เพิ่มสายพันธุ์ปลา"
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
        :value="species"
        :loading="isLoading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
      >
        <Column field="name" header="ชื่อสายพันธุ์" sortable>
          <template #body="{ data }">
            <span class="font-medium text-gray-900">{{ data.name }}</span>
          </template>
        </Column>

        <Column field="detail" header="รายละเอียด" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.detail }}</span>
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
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-600"
          >
            <i class="pi pi-star text-white"></i>
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
              ชื่อสายพันธุ์ <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="form.name"
              placeholder="เช่น ปลาคาร์ฟโคฮากุ"
              class="w-full"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              รายละเอียด <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="form.detail"
              placeholder="รายละเอียดเกี่ยวกับสายพันธุ์"
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
            <span class="text-gray-600">ชื่อสายพันธุ์:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">รายละเอียด:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.detail }}</span>
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

