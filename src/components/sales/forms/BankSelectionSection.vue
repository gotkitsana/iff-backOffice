<script setup lang="ts">
import { computed } from 'vue'
import SalebankData from '@/config/Salebank_data'
import type { SellingStatusString } from '@/types/sales'

// Props
const props = defineProps<{
  selectedBankCode: string
  isSubmitting: boolean
  isCurrentBank: string
  isCurrentStatus: string
}>()

// Emits
const emit = defineEmits<{
  'update:selectedBankCode': [value: string]
}>()

// Computed
const bankOptions = computed(() => {
  return Object.entries(
    SalebankData as Record<
      string,
      { name: string; icon: string; color: string; fullname: string; account: string }
    >
  ).map(([key, bank]) => ({
    value: key,
    label: bank.name,
    icon: bank.icon,
    color: bank.color,
    fullname: bank.fullname,
    account: bank.account,
  }))
})

// Get selected bank details
const selectedBank = computed(() => {
  if (!props.isCurrentBank) return null
  return bankOptions.value.find((bank) => bank.value === props.isCurrentBank)
})

const handleBankSelect = (bankCode: string) => {
  emit('update:selectedBankCode', bankCode)
}

const statusSteps: SellingStatusString[] = [
  'order',
  'wait_payment',
  'preparing',
  'shipping',
  'received',
  'damaged',
]
const closeEditBank = computed(() => {
  const currentStepIndex = statusSteps.indexOf(props.isCurrentStatus as SellingStatusString)
  const preparingStepIndex = statusSteps.indexOf('preparing')
  return currentStepIndex >= preparingStepIndex
})
</script>

<template>
  <div class="mt-4 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <i class="pi pi-credit-card text-blue-600 text-lg"></i>
      </div>
      <div>
        <h4 class="font-semibold text-blue-900">ข้อมูลการชำระเงิน</h4>
        <p class="text-sm text-blue-700">
          {{ !!isCurrentBank ? 'บัญชีธนาคารที่เลือก' : 'เลือกบัญชีธนาคารที่จะให้ลูกค้าโอนเงินมา' }}
        </p>
      </div>
    </div>

    <!-- Bank Selection Grid -->
    <div
      v-if="selectedBank && !!closeEditBank"
      class="bg-white border border-gray-200 rounded-lg p-3 md:p-4"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <img :src="selectedBank.icon" :alt="selectedBank.label" class="w-8 h-8 object-contain" />
        </div>
        <div class="flex-1">
          <h5 class="text-sm md:text-base font-[500]! text-gray-900">
            {{ selectedBank.fullname }}
          </h5>
          <p class="text-xs text-gray-600">เลขบัญชี: {{ selectedBank.account }}</p>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 md:gap-3 gap-2">
      <div
        v-for="bank in bankOptions"
        :key="bank.value"
        :class="`p-2 md:p-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${
          selectedBankCode === bank.value
            ? 'border-blue-400 bg-blue-500 text-white shadow-md'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
        }`"
        @click="handleBankSelect(bank.value)"
      >
        <div class="flex items-center gap-2 md:gap-2.5">
          <div class="w-8 h-8 flex items-center justify-center">
            <img :src="bank.icon" :alt="bank.label" class="w-7 h-7 md:w-8 md:h-8 object-contain" />
          </div>
          <div class="flex-1">
            <p class="text-xs md:text-sm font-[500]!">{{ bank.label }}</p>
            <p
              class="text-xs"
              :class="selectedBankCode === bank.value ? 'text-gray-200' : 'text-gray-500'"
            >
              {{ bank.account }}
            </p>
          </div>
          <div
            v-if="selectedBankCode === bank.value"
            class="w-5 h-5 flex items-center justify-center"
          >
            <i class="pi pi-check text-white text-sm"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Bank Display (when locked) -->

    <!-- Validation Message -->
    <div
      v-if="!selectedBankCode && isSubmitting"
      class="mt-3 bg-red-50 border border-red-200 rounded-lg p-3"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle text-red-500"></i>
        <p class="text-sm text-red-700">กรุณาเลือกบัญชีธนาคารสำหรับการชำระเงิน</p>
      </div>
    </div>
  </div>
</template>
