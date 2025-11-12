<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button } from 'primevue'
import { toast } from 'vue3-toastify'

interface Transaction {
  id: number
  type: 'income' | 'expense'
  department: string
  project: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  paymentMethod: 'cash' | 'transfer'
  purpose: string
  date: Date
  status: 'completed' | 'pending'
}

const props = defineProps<{
  visible: boolean
  transaction: Transaction | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'confirm-delete': [id: number]
}>()

const showModal = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}

const handleDelete = () => {
  if (!props.transaction) {
    toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลรายการ')
    return
  }

  emit('confirm-delete', props.transaction.id)
  showModal.value = false
}

const handleClose = () => {
  showModal.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="showModal"
    modal
    header="ยืนยันการลบรายการ"
    :style="{ width: '32rem' }"
    :pt="{
      header: 'p-4',
      title: 'text-lg font-semibold!',
    }"
  >
    <div class="space-y-3">
      <div class="flex items-center gap-x-3">
        <i class="pi pi-exclamation-triangle text-red-500 !text-4xl"></i>
        <div>
          <p class="font-[500]! text-gray-700 text-lg">คุณต้องการลบรายการนี้หรือไม่?</p>
        </div>
      </div>

      <div v-if="transaction" class="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
        <div class="flex justify-between">
          <span class="text-gray-600">รายการ:</span>
          <span class="font-medium text-gray-900">{{ transaction.item }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">แผนก:</span>
          <span class="font-medium text-gray-900">{{ transaction.department }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">โครงการ:</span>
          <span class="font-medium text-gray-900">{{ transaction.project }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ยอดรวม:</span>
          <span
            class="font-medium"
            :class="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'"
          >
            {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.total) }}
          </span>
        </div>
        <div v-if="transaction.purpose" class="pt-2 border-t border-gray-300">
          <span class="text-gray-600 text-sm">จุดประสงค์:</span>
          <p class="text-gray-900 text-sm mt-1">{{ transaction.purpose }}</p>
        </div>
      </div>

      <p class="text-sm text-red-600 flex items-center gap-1">
        <i class="pi pi-info-circle"></i>
        การดำเนินการนี้ไม่สามารถย้อนกลับได้
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
        <Button
          label="ลบรายการ"
          icon="pi pi-trash"
          severity="danger"
          @click="handleDelete"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>

