<script setup lang="ts">
import { computed } from 'vue'
import type { ISales } from '@/types/sales'

const props = defineProps<{
  saleData: ISales
  hasSlip: boolean
  hasShippingSlip: boolean
  currentStatus: string
}>()

const dataSummary = computed(() => {
  const summary = {
    hasProducts: !!props.saleData.products && props.saleData.products.length > 0,
    hasBank: !!props.saleData.bankCode,
    hasSlip: props.hasSlip,
    hasShippingSlip: props.hasShippingSlip,
    hasDelivery: !!props.saleData.delivery,
    missingItems: [] as string[],
  }

  // Check missing items based on current status
  const currentStepIndex = getCurrentStepIndex()

  if (props.currentStatus === 'wait_payment' || currentStepIndex >= 3) {
    if (!summary.hasBank) summary.missingItems.push('ข้อมูลบัญชีธนาคาร')
    if (!summary.hasSlip && currentStepIndex >= 3) {
      summary.missingItems.push('สลิปการโอนเงิน')
    }
  }

  if (props.currentStatus === 'preparing' || props.currentStatus === 'shipping') {
    if (!summary.hasShippingSlip) summary.missingItems.push('ใบเสร็จการขนส่ง')
  }

  if (
    (props.currentStatus === 'wait_confirm' || props.currentStatus === 'wait_payment') &&
    !summary.hasProducts
  ) {
    summary.missingItems.push('สินค้า')
  }

  return summary
})

const getCurrentStepIndex = () => {
  const statusOrder = [
    'wait_product',
    'wait_confirm',
    'wait_payment',
    'preparing',
    'shipping',
    'received',
    'damaged',
  ]
  return statusOrder.indexOf(props.currentStatus)
}
</script>

<template>
  <div class="bg-white rounded-lg p-4 border border-gray-200">
    <h4 class="font-semibold text-gray-900 mb-4">สรุปข้อมูล</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div class="text-sm font-medium text-gray-700 mb-2">ข้อมูลที่มีแล้ว:</div>
        <div class="space-y-2">
          <div
            v-if="dataSummary.hasProducts"
            class="flex items-center gap-2 text-sm text-green-600"
          >
            <i class="pi pi-check-circle"></i>
            <span>สินค้า ({{ saleData.products?.length || 0 }} รายการ)</span>
          </div>
          <div v-if="dataSummary.hasBank" class="flex items-center gap-2 text-sm text-green-600">
            <i class="pi pi-check-circle"></i>
            <span>ข้อมูลบัญชีธนาคาร</span>
          </div>
          <div v-if="dataSummary.hasSlip" class="flex items-center gap-2 text-sm text-green-600">
            <i class="pi pi-check-circle"></i>
            <span>สลิปการโอนเงิน</span>
          </div>
          <div
            v-if="dataSummary.hasShippingSlip"
            class="flex items-center gap-2 text-sm text-green-600"
          >
            <i class="pi pi-check-circle"></i>
            <span>ใบเสร็จการขนส่ง</span>
          </div>
        </div>
      </div>
      <div>
        <div class="text-sm font-medium text-gray-700 mb-2">ข้อมูลที่ยังขาด:</div>
        <div v-if="dataSummary.missingItems.length === 0" class="text-sm text-green-600">
          <i class="pi pi-check-circle"></i> ข้อมูลครบถ้วนแล้ว
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in dataSummary.missingItems"
            :key="item"
            class="flex items-center gap-2 text-sm text-orange-600"
          >
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ item }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

