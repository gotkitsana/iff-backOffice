<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Tag, Image } from 'primevue'
import type { IExpense } from '@/stores/accounting/expense'
import dayjs from 'dayjs'

const props = defineProps<{
  visible: boolean
  expense: IExpense | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
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

const getPaymentMethodSeverity = (method: string) => {
  const severities: Record<string, string> = {
    cash: 'success',
    transfer: 'info',
    check: 'warning',
    credit_card: 'secondary',
  }
  return severities[method] || 'secondary'
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
</script>

<template>
  <Dialog
    v-model:visible="showModal"
    modal
    header="รายละเอียดรายจ่าย"
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <div v-if="expense" class="space-y-4">
      <!-- Header Section -->
      <div
        class="bg-gradient-to-r from-red-50/30 to-pink-50/50 rounded-xl p-4 border border-red-100"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-pink-600"
            >
              <i class="pi pi-arrow-down text-white text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold! text-gray-900">{{ expense.item }}</h3>
              <p class="text-sm text-gray-600">รหัสรายการ: #{{ expense._id.slice(-8) }}</p>
            </div>
          </div>
          <Tag
            :value="getItemStatusLabel(expense.itemStatus)"
            :severity="getItemStatusSeverity(expense.itemStatus)"
            size="small"
          />
        </div>
      </div>

      <!-- Expense Information -->
      <div class="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-info-circle text-blue-600 text-sm"></i>
          </div>
          ข้อมูลรายการ
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">หมวดหมู่</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ expense.category?.name || '-' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">แผนก</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ expense.department?.name || '-' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">จำนวนเงิน</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-lg font-semibold text-red-600">
                {{ formatCurrency(expense.amount) }}
              </span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">กำหนดชำระ</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ expense.dueDate || '-' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">วิธีการชำระ</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <Tag
                :value="getPaymentMethodLabel(expense.paymentMethod)"
                :severity="getPaymentMethodSeverity(expense.paymentMethod)"
                size="small"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">สถานะรายการ</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <Tag
                :value="getItemStatusLabel(expense.itemStatus)"
                :severity="getItemStatusSeverity(expense.itemStatus)"
                size="small"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ผู้บันทึก</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ expense.admin || '-' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">วันที่สร้าง</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ formatDate(expense.cat) }}</span>
            </div>
          </div>

          <div v-if="expense.note" class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">หมายเหตุ</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3 border border-gray-200 min-h-[60px]">
              <span class="text-gray-900 text-sm whitespace-pre-line">{{ expense.note }}</span>
            </div>
          </div>

          <div v-if="(expense as any).image" class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">สลิป</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3 border border-gray-200">
              <Image :src="(expense as any).image" alt="Slip" width="300" preview />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button
          label="ปิด"
          icon="pi pi-times"
          @click="showModal = false"
          severity="secondary"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>

