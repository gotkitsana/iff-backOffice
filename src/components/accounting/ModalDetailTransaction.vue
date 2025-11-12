<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Tag } from 'primevue'

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

const formatDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTypeTag = (type: string) => {
  return type === 'income'
    ? { label: 'รายรับ', severity: 'success' }
    : { label: 'รายจ่าย', severity: 'danger' }
}

const getPaymentMethodTag = (method: string) => {
  switch (method) {
    case 'cash':
      return { label: 'เงินสด', severity: 'success' }
    case 'transfer':
      return { label: 'เงินโอน', severity: 'info' }
    default:
      return { label: method, severity: 'secondary' }
  }
}
</script>

<template>
  <Dialog
    v-model:visible="showModal"
    modal
    header="รายละเอียดรายการบัญชี"
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <div v-if="transaction" class="space-y-4">
      <!-- Header Section -->
      <div
        class="bg-gradient-to-r from-blue-50/30 to-indigo-50/50 rounded-xl p-4 border border-blue-100"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              :class="
                transaction.type === 'income'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                  : 'bg-gradient-to-br from-red-500 to-pink-600'
              "
            >
              <i
                class="pi text-white text-xl"
                :class="transaction.type === 'income' ? 'pi-arrow-up' : 'pi-arrow-down'"
              ></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold! text-gray-900">{{ transaction.item }}</h3>
              <p class="text-sm text-gray-600">รหัสรายการ: #{{ transaction.id }}</p>
            </div>
          </div>
          <Tag
            :value="getTypeTag(transaction.type).label"
            :severity="getTypeTag(transaction.type).severity"
            size="small"
          />
        </div>
      </div>

      <!-- Transaction Information -->
      <div class="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-info-circle text-blue-600 text-sm"></i>
          </div>
          ข้อมูลรายการ
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ประเภท</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <Tag
                :value="getTypeTag(transaction.type).label"
                :severity="getTypeTag(transaction.type).severity"
                size="small"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">รูปแบบการชำระเงิน</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <Tag
                :value="getPaymentMethodTag(transaction.paymentMethod).label"
                :severity="getPaymentMethodTag(transaction.paymentMethod).severity"
                size="small"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">แผนก</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ transaction.department }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">โครงการ</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ transaction.project }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">จำนวนหน่วย</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ transaction.quantity }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ราคาหน่วย</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ formatCurrency(transaction.unitPrice) }}</span>
            </div>
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ยอดรวม</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span
                class="text-lg font-semibold"
                :class="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'"
              >
                {{ transaction.type === 'income' ? '+' : '-'
                }}{{ formatCurrency(transaction.total) }}
              </span>
            </div>
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">จุดประสงค์รายการ</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3 border border-gray-200 min-h-[60px]">
              <span class="text-gray-900 text-sm whitespace-pre-line">{{
                transaction.purpose || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">วันที่</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ formatDate(transaction.date) }}</span>
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

