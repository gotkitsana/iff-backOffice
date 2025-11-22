<template>
  <div class="w-full">
    <div class="grid grid-cols-2 md:grid-cols-3 items-start gap-2.5 md:gap-4">
      <div v-for="step in orderedSteps" :key="step.value" class="flex items-start gap-2 flex-1">
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center text-base flex-none',
            step.state === 'completed'
              ? 'bg-green-500 text-white'
              : step.state === 'active'
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-indigo-100 text-indigo-600 grayscale',
          ]"
        >
          <i :class="step.icon"></i>
        </div>
        <div class="flex flex-col gap-0.5 text-sm font-normal text-gray-800">
          <span>{{ step.label }}</span>
          <small v-if="step.description" class="text-xs text-gray-500">{{
            step.description
          }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSalesStore } from '@/stores/sales/sales'
import type { SellingStatusString, StatusWorkflow } from '@/types/sales'

const props = defineProps<{
  currentStatus: SellingStatusString | string
}>()

const salesStore = useSalesStore()

const statusIconMap: Record<string, string> = {
  none: 'pi pi-circle',
  order: 'pi pi-shopping-cart',
  wait_payment: 'pi pi-hourglass',
  preparing: 'pi pi-box',
  shipping: 'pi pi-send',
  received: 'pi pi-check-circle',
  damaged: 'pi pi-exclamation-circle',
}

const orderedSteps = computed(() => {
  const workflowEntries = (
    Object.entries(salesStore.statusWorkflow) as Array<
      [SellingStatusString, StatusWorkflow[SellingStatusString]]
    >
  )
    .filter(([value]) => value !== 'none') // กรอง "ไม่ระบุ" ออก
    .sort((a, b) => a[1].stepOrder - b[1].stepOrder)

  return workflowEntries.map(([value, info]) => {
    const stepOrder = info.stepOrder
    const currentOrder =
      salesStore.statusWorkflow[props.currentStatus as keyof typeof salesStore.statusWorkflow]
        ?.stepOrder ?? 0

    let state: 'completed' | 'active' | 'default' = 'default'
    if (stepOrder < currentOrder) {
      state = 'completed'
    } else if (stepOrder === currentOrder) {
      // received และ damaged ไม่มี active state ให้เป็น completed เลย
      if (value === 'received' || value === 'damaged') {
        state = 'completed'
      } else {
        state = 'active'
      }
    }

    return {
      value,
      label: info.label,
      description: info.description,
      icon: info.icon || statusIconMap[value] || 'pi pi-circle',
      state,
    }
  })
})
</script>

