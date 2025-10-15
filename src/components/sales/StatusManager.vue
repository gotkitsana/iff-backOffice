<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, Button, Tag, Card } from 'primevue'
import { useSalesStore } from '@/stores/sales/sales'

// Props
const props = defineProps<{
  visible: boolean
  currentStatus: string
  orderNumber: string
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'status-changed': [newStatus: string]
}>()

// Stores
const salesStore = useSalesStore()

// Status workflow configuration
const statusWorkflow = {
  wait_product: {
    label: 'รอจัดหา',
    color: 'warning',
    icon: 'pi pi-clock',
    nextSteps: ['wait_confirm'],
    description: 'กำลังจัดหาสินค้าตามที่ลูกค้าต้องการ',
  },
  wait_confirm: {
    label: 'รอยืนยัน',
    color: 'info',
    icon: 'pi pi-check-circle',
    nextSteps: ['wait_payment', 'wait_product'],
    description: 'รอการยืนยันจากลูกค้า',
  },
  wait_payment: {
    label: 'รอชำระเงิน',
    color: 'warning',
    icon: 'pi pi-credit-card',
    nextSteps: ['paid_complete', 'wait_confirm'],
    description: 'รอการชำระเงินจากลูกค้า',
  },
  paid_complete: {
    label: 'ชำระเงินเรียบร้อย',
    color: 'success',
    icon: 'pi pi-check',
    nextSteps: ['pack_and_ship'],
    description: 'การชำระเงินเสร็จสิ้นแล้ว',
  },
  pack_and_ship: {
    label: 'แพ็คเตรียมสินค้ารอจัดส่ง',
    color: 'info',
    icon: 'pi pi-box',
    nextSteps: ['shipping'],
    description: 'กำลังแพ็คและเตรียมสินค้าสำหรับจัดส่ง',
  },
  shipping: {
    label: 'อยู่ระหว่างขนส่ง',
    color: 'info',
    icon: 'pi pi-truck',
    nextSteps: ['received', 'damaged'],
    description: 'สินค้าอยู่ระหว่างการขนส่ง',
  },
  received: {
    label: 'ได้รับสินค้าเรียบร้อย',
    color: 'success',
    icon: 'pi pi-check-circle',
    nextSteps: [],
    description: 'ลูกค้าได้รับสินค้าเรียบร้อยแล้ว',
  },
  damaged: {
    label: 'สินค้าเสียหาย',
    color: 'danger',
    icon: 'pi pi-times-circle',
    nextSteps: ['wait_product'],
    description: 'สินค้าเสียหายระหว่างการขนส่ง',
  },
}

// Computed
const currentStatusInfo = computed(() => {
  return statusWorkflow[props.currentStatus as keyof typeof statusWorkflow]
})

const availableNextSteps = computed(() => {
  if (!currentStatusInfo.value) return []
  return currentStatusInfo.value.nextSteps.map((status) => ({
    value: status,
    ...statusWorkflow[status as keyof typeof statusWorkflow],
  }))
})

// Handlers
const handleStatusChange = (newStatus: string) => {
  emit('status-changed', newStatus)
  emit('update:visible', false)
}

const handleClose = () => {
  emit('update:visible', false)
}

// Get status color for Tag component
const getStatusColor = (status: string) => {
  const statusInfo = statusWorkflow[status as keyof typeof statusWorkflow]
  return statusInfo?.color || 'secondary'
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-sync text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เปลี่ยนสถานะการขาย</h3>
          <p class="text-sm text-gray-600">รายการ: {{ orderNumber }}</p>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Current Status -->
      <Card :pt="{ body: 'p-4' }" class="bg-gray-50">
        <template #content>
          <div class="flex items-center gap-3">
            <div
              :class="`w-12 h-12 rounded-lg flex items-center justify-center ${
                currentStatusInfo?.color === 'success'
                  ? 'bg-green-100'
                  : currentStatusInfo?.color === 'warning'
                  ? 'bg-yellow-100'
                  : currentStatusInfo?.color === 'danger'
                  ? 'bg-red-100'
                  : 'bg-blue-100'
              }`"
            >
              <i
                :class="`${currentStatusInfo?.icon} text-xl ${
                  currentStatusInfo?.color === 'success'
                    ? 'text-green-600'
                    : currentStatusInfo?.color === 'warning'
                    ? 'text-yellow-600'
                    : currentStatusInfo?.color === 'danger'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`"
              ></i>
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900">สถานะปัจจุบัน</h4>
              <Tag
                :value="currentStatusInfo?.label"
                :severity="getStatusColor(currentStatus)"
                size="large"
                class="mt-1"
              />
              <p class="text-sm text-gray-600 mt-2">{{ currentStatusInfo?.description }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Available Next Steps -->
      <div v-if="availableNextSteps.length > 0">
        <h4 class="font-semibold text-gray-900 mb-3">เปลี่ยนเป็นสถานะ:</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card
            v-for="step in availableNextSteps"
            :key="step.value"
            :pt="{ body: 'p-4' }"
            class="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
            @click="handleStatusChange(step.value)"
          >
            <template #content>
              <div class="flex items-center gap-3">
                <div
                  :class="`w-10 h-10 rounded-lg flex items-center justify-center ${
                    step.color === 'success'
                      ? 'bg-green-100'
                      : step.color === 'warning'
                      ? 'bg-yellow-100'
                      : step.color === 'danger'
                      ? 'bg-red-100'
                      : 'bg-blue-100'
                  }`"
                >
                  <i
                    :class="`${step.icon} ${
                      step.color === 'success'
                        ? 'text-green-600'
                        : step.color === 'warning'
                        ? 'text-yellow-600'
                        : step.color === 'danger'
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`"
                  ></i>
                </div>
                <div class="flex-1">
                  <h5 class="font-medium text-gray-900">{{ step.label }}</h5>
                  <p class="text-xs text-gray-600 mt-1">{{ step.description }}</p>
                </div>
                <i class="pi pi-arrow-right text-gray-400"></i>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- No Next Steps Available -->
      <div v-else class="text-center py-8">
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <i class="pi pi-check text-gray-400 text-2xl"></i>
        </div>
        <h4 class="font-medium text-gray-900 mb-2">สถานะสุดท้าย</h4>
        <p class="text-sm text-gray-600">รายการนี้อยู่ในสถานะสุดท้ายแล้ว ไม่สามารถเปลี่ยนได้</p>
      </div>

      <!-- Status Flow Visualization -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3">ขั้นตอนการขาย</h4>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(status, key) in statusWorkflow"
            :key="key"
            :class="`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
              key === currentStatus
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-white text-gray-600 border border-gray-200'
            }`"
          >
            <i :class="status.icon"></i>
            <span>{{ status.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
