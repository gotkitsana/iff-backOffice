<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button, Tag, Card, InputText, Textarea } from 'primevue'
import BankData from '../../config/BankData'
import { useSalesStore } from '@/stores/sales/sales'
import type { StatusWorkflow, IUpdateSalesPayload, SellingStatus } from '@/types/sales'
import { useMutation } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'

// Props
const props = defineProps<{
  visible: boolean
  currentStatus: string
  orderNumber: string
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'status-changed': [
    newStatus: string,
    bankInfo?: { bank: string; accountNumber?: string; amount?: number }
  ]
}>()

// Local state
const selectedBank = ref('')
const accountNumber = ref('')
const paymentAmount = ref<string>('')
const paymentNote = ref('')
const showBankSelection = ref(false)

// Status workflow configuration with step order


// Bank options for payment
const bankOptions = computed(() => {
  return Object.entries(BankData).map(([key, bank]) => ({
    value: key,
    label: (bank as { name: string; icon: string; color: string }).name,
    icon: (bank as { name: string; icon: string; color: string }).icon,
    color: (bank as { name: string; icon: string; color: string }).color,
  }))
})

// Computed
const currentStatusInfo = computed(() => {
  return salesStore.statusWorkflow[props.currentStatus as keyof StatusWorkflow]
})

const availableNextSteps = computed(() => {
  if (!currentStatusInfo.value) return []
  return currentStatusInfo.value.nextSteps.map((status: SellingStatus) => ({
    value: status,
    ...salesStore.statusWorkflow[status as keyof StatusWorkflow],
  }))
})

// Step indicator logic
const allSteps = computed(() => {
  return Object.entries(salesStore.statusWorkflow)
    .sort(([, a]: [string, StatusWorkflow[keyof StatusWorkflow]], [, b]: [string, StatusWorkflow[keyof StatusWorkflow]]) => a.stepOrder - b.stepOrder)
    .map(([key, status]) => ({
      key,
      ...(status as StatusWorkflow[keyof StatusWorkflow]),
    }))
})

const currentStepIndex = computed(() => {
  return allSteps.value.findIndex((step) => step.key === props.currentStatus)
})

const isStepCompleted = (stepIndex: number) => {
  return stepIndex < currentStepIndex.value
}

const isStepCurrent = (stepIndex: number) => {
  return stepIndex === currentStepIndex.value
}

// Check if bank selection is required
const requiresBankSelection = (status: string) => {
  // ต้องเลือกบัญชีธนาคารของบริษัทเมื่อจะผ่านขั้นตอน "รอชำระเงิน"
  // หรือเมื่อเปลี่ยนไปยังสถานะที่เกี่ยวข้องกับการชำระเงิน
  return status === 'wait_payment' || status === 'paid_complete'
}

// Check if the status change will pass through "wait_payment" step
const willPassThroughWaitPayment = (newStatus: string) => {
  const currentStep = currentStepIndex.value
  const newStep = allSteps.value.findIndex((step) => step.key === newStatus)

  // ถ้าขั้นตอนใหม่อยู่หลังขั้นตอน "รอชำระเงิน" และขั้นตอนปัจจุบันอยู่ก่อนขั้นตอน "รอชำระเงิน"
  const waitPaymentStepIndex = allSteps.value.findIndex((step) => step.key === 'wait_payment')

  return currentStep < waitPaymentStepIndex && newStep > waitPaymentStepIndex
}

// Handlers
const targetStatus = ref('')

const handleStatusChange = (newStatus: string) => {
  const needsBankSelection =
    requiresBankSelection(newStatus) || willPassThroughWaitPayment(newStatus)

  if (needsBankSelection) {
    showBankSelection.value = true
    targetStatus.value = newStatus
  } else {
    emit('status-changed', newStatus)
    emit('update:visible', false)
  }
}

const handleBankSelection = () => {
  if (selectedBank.value && targetStatus.value) {
    const bankInfo = {
      bank: selectedBank.value,
      accountNumber: '1234567890',
      amount: paymentAmount.value ? parseFloat(paymentAmount.value) : undefined,
    }
    emit('status-changed', targetStatus.value, bankInfo)
    emit('update:visible', false)
    resetForm()
  }
}

const handleClose = () => {
  emit('update:visible', false)
  resetForm()
}

const resetForm = () => {
  selectedBank.value = ''
  accountNumber.value = ''
  paymentAmount.value = ''
  paymentNote.value = ''
  showBankSelection.value = false
  targetStatus.value = ''
}

// Watch for dialog visibility changes
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      resetForm()
    }
  }
)

// Get status color for Tag component
const getStatusColor = (status: string) => {
  const statusInfo = salesStore.statusWorkflow[status as keyof StatusWorkflow]
  return statusInfo?.color || 'secondary'
}

const salesStore = useSalesStore()
const { mutate: updateSalesDetail } = useMutation({
  mutationFn: async (payload: IUpdateSalesPayload) => await salesStore.onUpdateSales(payload),
  onSuccess: (data: any) => {
    console.log(data)
    toast.success('เปลี่ยนสถานะการขายสำเร็จ')
    emit('update:visible', false)
    resetForm()
  },
})
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

    <div class="space-y-4">
      <!-- Step Indicator -->
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <h4 class="font-semibold text-gray-900 mb-4">ขั้นตอนการขาย</h4>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(step, index) in allSteps"
            :key="step.key"
            :class="`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all duration-200 ${
              isStepCompleted(index)
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : isStepCurrent(index)
                ? 'bg-blue-200 text-blue-800 border-2 border-blue-400 font-medium'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`"
          >
            <i
              :class="`${step.icon} ${
                isStepCompleted(index)
                  ? 'text-blue-600'
                  : isStepCurrent(index)
                  ? 'text-blue-700'
                  : 'text-gray-400'
              }`"
            ></i>
            <span>{{ step.label }}</span>
          </div>
        </div>
      </div>

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
      <div v-if="availableNextSteps.length > 0 && !showBankSelection">
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

      <!-- Bank Selection Modal -->
      <div v-if="showBankSelection" class="space-y-4">
        <Card :pt="{ body: 'p-4' }" class="bg-blue-50 border-blue-200">
          <template #content>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-credit-card text-blue-600 text-lg"></i>
              </div>
              <div>
                <h4 class="font-semibold text-blue-900">ข้อมูลการชำระเงิน</h4>
                <p class="text-sm text-blue-700">เลือกบัญชีธนาคารที่จะให้ลูกค้าจะโอนเงินมา</p>
              </div>
            </div>

            <!-- Bank Selection -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div
                v-for="bank in bankOptions"
                :key="bank.value"
                :class="`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedBank === bank.value
                    ? 'border-blue-400 bg-blue-500/90 text-white'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-blue-500/90 hover:text-white'
                }`"
                @click="selectedBank = bank.value"
              >
                <div class="flex items-center gap-2">
                  <img :src="bank.icon" :alt="bank.label" class="w-6 h-6" />
                  <span class="text-sm font-medium">{{ bank.label }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- No Next Steps Available -->
      <div v-else-if="!showBankSelection" class="text-center py-8">
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <i class="pi pi-check text-gray-400 text-2xl"></i>
        </div>
        <h4 class="font-medium text-gray-900 mb-2">สถานะสุดท้าย</h4>
        <p class="text-sm text-gray-600">รายการนี้อยู่ในสถานะสุดท้ายแล้ว ไม่สามารถเปลี่ยนได้</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          v-if="showBankSelection"
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="resetForm"
          size="small"
        />
        <Button
          v-if="showBankSelection"
          label="ยืนยันการเปลี่ยนสถานะ"
          icon="pi pi-check"
          severity="primary"
          @click="handleBankSelection"
          :disabled="!selectedBank"
          size="small"
        />
        <Button
          v-else
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
