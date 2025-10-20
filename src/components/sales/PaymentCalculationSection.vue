<script setup lang="ts">
import { computed } from 'vue'
import { InputNumber } from 'primevue'
import formatCurrency from '@/utils/formatCurrency'

// Props
const props = defineProps<{
  totalAmount: number
  deposit: number
  discount: number
  isSubmitting: boolean
  readOnly?: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:deposit': [value: number]
  'update:discount': [value: number]
}>()

// Computed
const netAmount = computed(() => {
  const netAmount = props.totalAmount - props.discount
  return netAmount < 0 ? 0 : netAmount
})

const updateDeposit = (value: number | null) => {
  emit('update:deposit', value || 0)
}

const updateDiscount = (value: number | null) => {
  emit('update:discount', value || 0)
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div class="flex items-center gap-2 mb-4">
      <i class="pi pi-calculator text-purple-600"></i>
      <h4 class="text-lg font-[500]! text-gray-800">การคำนวณยอดเงิน</h4>
    </div>

    <!-- Input Fields -->
    <div v-if="!props.readOnly" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
          มัดจำ (บาท)
        </label>
        <InputNumber
          :modelValue="deposit"
          @update:modelValue="updateDeposit"
          :min="0"
          mode="currency"
          currency="THB"
          locale="th-TH"
          fluid
          size="small"
          placeholder="ระบุยอดมัดจำ"
        />
      </div>

      <div>
        <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
          ส่วนลด (บาท)
        </label>
        <InputNumber
          :modelValue="discount"
          @update:modelValue="updateDiscount"
          :min="0"
          mode="currency"
          currency="THB"
          locale="th-TH"
          fluid
          size="small"
          placeholder="ระบุส่วนลด"
        />
      </div>
    </div>

    <!-- Summary -->
    <div class="p-4 bg-green-50 border border-green-200 rounded-xl">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">มูลค่าสินค้า:</span>
          <span class="text-sm font-medium text-gray-800">{{ formatCurrency(totalAmount) }}</span>
        </div>

        <div v-if="discount > 0" class="flex items-center justify-between">
          <span class="text-sm text-red-600">ส่วนลด:</span>
          <span class="text-sm font-medium text-red-600">-{{ formatCurrency(discount) }}</span>
        </div>

        <div v-if="deposit > 0" class="flex items-center justify-between">
          <span class="text-sm text-blue-600">มัดจำ:</span>
          <span class="text-sm font-medium text-blue-600">{{ formatCurrency(deposit) }}</span>
        </div>

        <div class="border-t border-green-300 pt-2">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-green-600">ยอดสุทธิ:</span>
            <span class="font-bold text-lg text-green-600">{{ formatCurrency(netAmount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
