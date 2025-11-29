<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Tag } from 'primevue'
import type { IExpense } from '@/stores/accounting/expense'
import dayjs from 'dayjs'

const props = defineProps<{
  visible: boolean
  expense: IExpense | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'confirm-delete': [id: string]
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

const formatDate = (timestamp: number) => {
  return dayjs(timestamp).format('DD/MM/YYYY HH:mm')
}

const getPaymentMethodLabel = (method: string) => {
  const methods: Record<string, string> = {
    cash: 'เงินสด',
    transfer: 'โอน',
    check: 'เช็ค',
    credit_card: 'บัตรเครดิต',
  }
  return methods[method] || method
}

const getItemStatusLabel = (status: string) => {
  const statuses: Record<string, string> = {
    pending: 'รอชำระ',
    paid: 'ชำระแล้ว',
    cancelled: 'ยกเลิก',
  }
  return statuses[status] || status
}

const getItemStatusSeverity = (status: string) => {
  const severities: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    cancelled: 'danger',
  }
  return severities[status] || 'secondary'
}

const handleDelete = () => {
  if (!props.expense) {
    return
  }

  emit('confirm-delete', props.expense._id)
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

      <div v-if="expense" class="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
        <div class="flex justify-between">
          <span class="text-gray-600">รายการ:</span>
          <span class="font-medium text-gray-900">{{ expense.item }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">แผนก:</span>
          <span class="font-medium text-gray-900">{{ expense.department?.name || '-' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">หมวดหมู่:</span>
          <span class="font-medium text-gray-900">{{ expense.category?.name || '-' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">จำนวนเงิน:</span>
          <span class="font-medium text-red-600">{{ formatCurrency(expense.amount) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">วิธีการชำระ:</span>
          <span class="font-medium text-gray-900">{{ getPaymentMethodLabel(expense.paymentMethod) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">สถานะ:</span>
          <Tag
            :value="getItemStatusLabel(expense.itemStatus)"
            :severity="getItemStatusSeverity(expense.itemStatus)"
            size="small"
          />
        </div>
        <div v-if="expense.dueDate" class="flex justify-between">
          <span class="text-gray-600">กำหนดชำระ:</span>
          <span class="font-medium text-gray-900">{{ expense.dueDate }}</span>
        </div>
        <div v-if="expense.note" class="pt-2 border-t border-gray-300">
          <span class="text-gray-600 text-sm">หมายเหตุ:</span>
          <p class="text-gray-900 text-sm mt-1">{{ expense.note }}</p>
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

