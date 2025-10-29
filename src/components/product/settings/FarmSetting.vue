<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button, InputText, DataTable, Column, Dialog, Textarea } from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useFarmStore,
  type IFarm,
  type ICreateFarmPayload,
  type IUpdateFarmPayload,
} from '../../../stores/product/farm'

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

const farmStore = useFarmStore()
const queryClient = useQueryClient()

const showModal = ref(false)
const modalType = ref<'add' | 'edit' | 'delete'>('add')
const selectedItem = ref<IFarm | null>(null)

const form = ref<ICreateFarmPayload>({ name: '', note: '' })

const { data: farmsData, isLoading } = useQuery<IFarm[]>({
  queryKey: ['get_farms'],
  queryFn: () => farmStore.onGetFarms(),
})

const farms = computed(() => farmsData.value || [])

const { mutate: create, isPending: isCreating } = useMutation({
  mutationFn: (payload: ICreateFarmPayload) => farmStore.onCreateFarm(payload),
  onSuccess: (data: IApiResponse) => {
    if (data.data) {
      toast.success('เพิ่มฟาร์มสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_farms'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'เพิ่มฟาร์มไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Create farm error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มฟาร์มไม่สำเร็จ')
  },
})

const { mutate: update, isPending: isUpdating } = useMutation({
  mutationFn: (payload: IUpdateFarmPayload) => farmStore.onUpdateFarm(payload),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'modifiedCount' in data.data &&
      (data.data as { modifiedCount: number }).modifiedCount > 0
    ) {
      toast.success('อัปเดตฟาร์มสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_farms'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'อัปเดตฟาร์มไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Update farm error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตฟาร์มไม่สำเร็จ')
  },
})

const { mutate: remove, isPending: isDeleting } = useMutation({
  mutationFn: (id: string) => farmStore.onDeleteFarm(id),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'deletedCount' in data.data &&
      (data.data as { deletedCount: number }).deletedCount > 0
    ) {
      toast.success('ลบฟาร์มสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_farms'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'ลบฟาร์มไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Delete farm error:', error)
    toast.error(error.response?.data?.message || 'ลบฟาร์มไม่สำเร็จ')
  },
})

const openModal = (type: 'add' | 'edit' | 'delete', item?: IFarm) => {
  modalType.value = type
  selectedItem.value = item || null

  if (type === 'add') {
    form.value = { name: '', note: '' }
  } else if (type === 'edit' && item) {
    form.value = {
      name: item.name,
      note: item.note,
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = 'add'
  selectedItem.value = null
  form.value = { name: '', note: '' }
}

const handleSubmit = () => {
  if (!form.value.name.trim()) {
    toast.error('กรุณากรอกชื่อฟาร์ม')
    return
  }
  const payload: ICreateFarmPayload = { ...form.value }
  if (modalType.value === 'add') {
    create(payload)
  } else if (modalType.value === 'edit' && selectedItem.value) {
    update({ _id: selectedItem.value._id, ...payload })
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
      return 'เพิ่มฟาร์มใหม่'
    case 'edit':
      return 'แก้ไขฟาร์ม'
    case 'delete':
      return 'ยืนยันการลบฟาร์ม'
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
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600"
          >
            <i class="pi pi-home text-white text-xl"></i>
          </div>
          <div>
            <h2 class="font-semibold! text-gray-900">ฟาร์ม</h2>
            <p class="text-gray-600 text-sm">จัดการข้อมูลฟาร์ม</p>
          </div>
        </div>
        <Button
          label="เพิ่มฟาร์ม"
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
        :value="farms"
        :loading="isLoading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
      >
        <Column field="name" header="ชื่อฟาร์ม" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.name }}</span>
          </template>
        </Column>

        <Column field="note" header="หมายเหตุ" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.note || '-' }}</span>
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
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600"
          >
            <i class="pi pi-home text-white"></i>
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
              ชื่อฟาร์ม <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="form.name"
              placeholder="กรุณากรอกชื่อฟาร์ม"
              class="w-full"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <Textarea
              v-model="form.note"
              rows="3"
              fluid
              placeholder="หมายเหตุเพิ่มเติม"
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
            <span class="text-gray-600">ชื่อฟาร์ม:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.name }}</span>
          </div>
          <div v-if="selectedItem.note" class="flex justify-between">
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

