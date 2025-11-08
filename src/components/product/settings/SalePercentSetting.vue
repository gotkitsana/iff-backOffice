<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { Dialog, Select, InputNumber, Textarea } from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useSalePercentStore,
  type ISalePercent,
  type ICreateSalePercentPayload,
  type IUpdateSalePercentPayload,
} from '../../../stores/product/sale_percent'
import type { ICategory } from '@/stores/product/category'

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

const salePercentStore = useSalePercentStore()
const queryClient = useQueryClient()

const showModal = ref(false)
const modalType = ref<'add' | 'edit' | 'delete'>('add')
const selectedItem = ref<ISalePercent | null>(null)

const form = ref<ICreateSalePercentPayload>({
  name: '',
  note: '',
  percent: 0,
  category: props.selectedCategory._id,
})

const { data: salePercentData, isLoading } = useQuery<ISalePercent[]>({
  queryKey: ['get_sell_percents'],
  queryFn: () => salePercentStore.onGetSalePercents(),
})

const salePercents = computed(() => salePercentData.value || [])

const { mutate: create, isPending: isCreating } = useMutation({
  mutationFn: (payload: ICreateSalePercentPayload) => salePercentStore.onCreateSalePercent(payload),
  onSuccess: (data: IApiResponse) => {
    if (data.data) {
      toast.success('เพิ่มเปอร์เซ็นต์กำไรสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_sell_percents'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'เพิ่มเปอร์เซ็นต์กำไรไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Create food brand error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มเปอร์เซ็นต์กำไรไม่สำเร็จ')
  },
})

const { mutate: update, isPending: isUpdating } = useMutation({
  mutationFn: (payload: IUpdateSalePercentPayload) => salePercentStore.onUpdateSalePercent(payload),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'modifiedCount' in data.data &&
      (data.data as { modifiedCount: number }).modifiedCount > 0
    ) {
      toast.success('อัปเดตเปอร์เซ็นต์กำไรสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_sell_percents'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'อัปเดตเปอร์เซ็นต์กำไรไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Update food brand error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตเปอร์เซ็นต์กำไรไม่สำเร็จ')
  },
})

const { mutate: remove, isPending: isDeleting } = useMutation({
  mutationFn: (salePercentId: string) => salePercentStore.onDeleteSalePercent(salePercentId),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'deletedCount' in data.data &&
      (data.data as { deletedCount: number }).deletedCount > 0
    ) {
      toast.success('ลบเปอร์เซ็นต์กำไรสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_sell_percents'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'ลบเปอร์เซ็นต์กำไรไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Delete food brand error:', error)
    toast.error(error.response?.data?.message || 'ลบเปอร์เซ็นต์กำไรไม่สำเร็จ')
  },
})

const openModal = (type: 'add' | 'edit' | 'delete', item?: ISalePercent) => {
  modalType.value = type
  selectedItem.value = item || null

  if (type === 'add') {
    form.value = { name: '', note: '', percent: 0, category: props.selectedCategory._id }
  } else if (type === 'edit' && item) {
    form.value = {
      name: item.name,
      note: item.note,
      percent: item.percent,
      category: item.category?._id,
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = 'add'
  selectedItem.value = null
  form.value = { name: '', note: '', percent: 0, category: '' }
}

const validate = () => {
  if (!form.value.name.trim()) {
    toast.error('กรุณากรอกชื่อเปอร์เซ็นต์กำไร')
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validate()) return

  const payload = {
    name: form.value.name.trim(),
    note: form.value.note.trim(),
    percent: form.value.percent,
    category: form.value.category,
  }

  if (modalType.value === 'add') {
    create(payload)
  } else if (modalType.value === 'edit' && selectedItem.value) {
    update({
      _id: selectedItem.value._id,
      name: payload.name,
      note: payload.note,
      percent: payload.percent,
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
      return 'เพิ่มเปอร์เซ็นต์กำไร'
    case 'edit':
      return 'แก้ไขเปอร์เซ็นต์กำไร'
    case 'delete':
      return 'ยืนยันการลบเปอร์เซ็นต์กำไร'
    default:
      return ''
  }
}

const filteredSalePercents = computed(() => {
  const filtered = salePercents.value.filter(
    (salePercent) => salePercent?.category?._id === props.selectedCategory._id
  )
  return filtered
})
</script>

<template>
  <div>
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-600"
          >
            <i class="pi pi-percentage text-white text-xl"></i>
          </div>
          <div>
            <h2 class="font-semibold! text-gray-900">ราคาขาย</h2>
            <p class="text-gray-600 text-sm">จัดการราคาขายสินค้า</p>
          </div>
        </div>
        <Button
          label="เพิ่มราคาขาย"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openModal('add')"
        />
      </div>
    </div>

    <div>
      <DataTable
        :value="filteredSalePercents"
        :loading="isLoading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
      >
        <Column field="name" header="ชื่อเปอร์เซ็นต์กำไร">
          <template #body="{ data }">
            <span class="font-medium text-gray-900 text-sm">
              {{ salePercentStore.PercentNameOptions.find((option) => option.value == data.name)?.label }}
            </span>
          </template>
        </Column>

        <Column field="percent" header="เปอร์เซ็นต์กำไร">
          <template #body="{ data }">
            <span class="text-gray-700 text-sm">{{ data.percent }}%</span>
          </template>
        </Column>

        <Column field="note" header="หมายเหตุ">
          <template #body="{ data }">
            <span class="text-gray-700 text-sm">{{ data.note }}</span>
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

    <Dialog
      :visible="showModal"
      @update:visible="closeModal"
      modal
      :style="{ width: modalType === 'delete' ? '32rem' : '35rem' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-600"
          >
            <i class="pi pi-percentage text-white"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-800">{{ getModalTitle() }}</h3>
          </div>
        </div>
      </template>

      <div v-if="modalType !== 'delete'" class="space-y-4">
        <div class="grid grid-cols-1 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >ชื่อเปอร์เซ็นต์กำไร <span class="text-red-500">*</span></label
            >
            <Select
              v-model="form.name"
              :options="
                salePercentStore.PercentNameOptions.filter((option) =>
                  !filteredSalePercents.some((salePercent) => salePercent.name == option.value)
                )
              "
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              placeholder="เลือกชื่อเปอร์เซ็นต์กำไร"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >เปอร์เซ็นต์กำไร <span class="text-red-500">*</span></label
            >
            <InputNumber
              v-model="form.percent"
              :min="0"
              :max="100"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              :step="0.1"
              suffix="%"
              fluid
              size="small"
              :invalid="!form.percent && isSubmitting"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <Textarea
              v-model="form.note"
              placeholder="หมายเหตุเพิ่มเติม"
              class="w-full"
              autocomplete="off"
            />
          </div>
        </div>
      </div>

      <div v-if="modalType === 'delete' && selectedItem" class="space-y-3">
        <div class="flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
          <p class="text-gray-800 font-medium text-lg">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600">ชื่อเปอร์เซ็นต์กำไร:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">เปอร์เซ็นต์กำไร:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.percent }}</span>
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
