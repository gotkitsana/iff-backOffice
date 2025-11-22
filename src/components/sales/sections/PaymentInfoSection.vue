<script setup lang="ts">
import { DatePicker, Select, Textarea } from 'primevue'
import PaymentCalculationSection from '../forms/PaymentCalculationSection.vue'
import BankSelectionSection from '../forms/BankSelectionSection.vue'
import formatCurrency from '@/utils/formatCurrency'
import { useSalesStore } from '@/stores/sales/sales'
import { useMemberStore } from '@/stores/member/member'

// Props
const props = defineProps<{
  totalAmount: number
  deposit: number
  discount: number
  deliveryNo: number
  paymentMethod: string
  bankCode?: string
  bankAccount?: string
  paymentDueDate?: Date | string
  deliveryStatus?: string
  shippingAddress?: string
  shippingProvince?: string
  showSummary: boolean
  showDetailed: boolean
  showAdditionalInfo: boolean
  showPaymentDueDate: boolean
  showDeliveryStatus: boolean
  showBankInfo: boolean
  showShippingAddress: boolean
  readOnly: boolean
  isSubmitting: boolean
  currentStatusString: string
}>()

// Emits
const emit = defineEmits<{
  'update:deposit': [value: number]
  'update:discount': [value: number]
  'update:delivery-no': [value: number]
}>()

const salesStore = useSalesStore()
const memberStore = useMemberStore()

const findProvinceData = (id: string) => {
  if (!id) return null
  return memberStore.provinceOptions.find((province) => province.value === id)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Summary View -->
    <div v-if="showSummary" class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-gray-600 mb-1">ยอดรวม</div>
          <div class="text-lg font-medium text-gray-900">
            {{ formatCurrency(totalAmount || 0) }}
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-600 mb-1">วิธีชำระเงิน</div>
          <div class="text-lg font-medium text-gray-900">
            {{ salesStore.paymentMethods.find((pm) => pm.value === paymentMethod)?.label || '-' }}
          </div>
        </div>
        <div v-if="bankCode">
          <div class="text-sm text-gray-600 mb-1">ธนาคาร</div>
          <div class="text-lg font-medium text-gray-900">{{ bankCode || '-' }}</div>
        </div>
        <div v-if="deposit > 0">
          <div class="text-sm text-gray-600 mb-1">เงินมัดจำ</div>
          <div class="text-lg font-medium text-gray-900">{{ formatCurrency(deposit || 0) }}</div>
        </div>
      </div>
    </div>

    <!-- Detailed View -->
    <div v-if="showDetailed">
      <PaymentCalculationSection
        :total-amount="totalAmount"
        :deposit="deposit"
        :discount="discount"
        :delivery-no="deliveryNo"
        :is-submitting="isSubmitting"
        :read-only="readOnly"
        @update:deposit="emit('update:deposit', $event)"
        @update:discount="emit('update:discount', $event)"
        @update:delivery-no="emit('update:delivery-no', $event)"
      />

      <div
        v-if="showAdditionalInfo"
        class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
      >
        <div class="flex items-center gap-2 mb-4">
          <i class="pi pi-info-circle text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลเพิ่มเติม</h4>
        </div>

        <div v-if="showPaymentDueDate && paymentDueDate" class="mt-4">
          <label class="text-sm font-medium text-gray-700 mb-1 block">กำหนดวันชำระเงิน</label>
          <DatePicker
            :model-value="new Date(paymentDueDate)"
            dateFormat="dd/mm/yy"
            showIcon
            iconDisplay="input"
            fluid
            size="small"
            disabled
            class="opacity-60"
          />
        </div>

        <div v-if="showDeliveryStatus && deliveryStatus" class="mt-4">
          <label class="text-sm font-medium text-gray-700 mb-1 block">สถานะการส่ง</label>
          <Select
            :model-value="deliveryStatus"
            :options="[
              { label: 'ได้รับสินค้าแล้ว', value: 'received' },
              { label: 'แพ็ครอจัดส่ง', value: 'preparing' },
            ]"
            optionLabel="label"
            optionValue="value"
            fluid
            size="small"
            disabled
            class="opacity-60"
          />
        </div>

        <div v-if="showBankInfo" class="mt-4">
          <BankSelectionSection
            :selected-bank-code="(bankCode || '') as string"
            :is-submitting="isSubmitting"
            :is-current-bank="bankCode || ''"
            :is-current-status="currentStatusString"
            :is-read-only="false"
          />
        </div>

        <div v-if="showShippingAddress" class="mt-4 space-y-2">
          <label class="text-sm font-medium text-gray-700">ที่อยู่จัดส่ง</label>
          <Textarea
            :value="
              `${shippingAddress || ''}, ${
                findProvinceData(shippingProvince || '')?.label || ''
              }` || ''
            "
            rows="3"
            fluid
            size="small"
            readonly
            class="opacity-75"
          />
        </div>
      </div>
    </div>
  </div>
</template>

