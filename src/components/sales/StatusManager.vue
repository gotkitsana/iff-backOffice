<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button, Tag, Card } from 'primevue'
import { useSalesStore } from '@/stores/sales/sales'
import type { StatusWorkflow, SellingStatus, ISales, IUpdateSalesPayload } from '@/types/sales'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import SlipUploadSection from './SlipUploadSection.vue'
import BankSelectionSection from './BankSelectionSection.vue'

// Props
const props = defineProps<{
  visible: boolean
  currentStatus: string
  orderNumber: string
  currentData: ISales
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// Status workflow configuration with step order
// Handlers
const statusForm = ref({
  status: '',
  bankCode: '',
  hasSlip: false,
})

// Computed
const currentStatusInfo = computed(() => {
  return salesStore.statusWorkflow[props.currentStatus as keyof StatusWorkflow]
})

const availableNextSteps = computed(() => {
  if (!currentStatusInfo.value) return []

  const currentStepIndex = allSteps.value.findIndex(step => step.key === props.currentStatus)

  // ถ้าเป็น step สุดท้าย (damaged) ไม่แสดง step อื่น
  if (currentStepIndex === allSteps.value.length - 1) {
    return []
  }

  return currentStatusInfo.value.nextSteps
    .map((status: SellingStatus) => ({
      value: status,
      ...salesStore.statusWorkflow[status as keyof StatusWorkflow],
    }))
    .filter(step => {
      const stepIndex = allSteps.value.findIndex(s => s.key === step.value)
      return stepIndex > currentStepIndex
    })
})

// Step indicator logic
const allSteps = computed(() => {
  return Object.entries(salesStore.statusWorkflow)
    .sort(
      (
        [, a]: [string, StatusWorkflow[keyof StatusWorkflow]],
        [, b]: [string, StatusWorkflow[keyof StatusWorkflow]]
      ) => a.stepOrder - b.stepOrder
    )
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
  const statusSteps: SellingStatus[] = [
    'wait_product',
    'wait_confirm',
    'wait_payment',
    'paid_complete',
    'preparing',
    'shipping',
    'received',
    'damaged',
  ]
  const newStepIndex = statusSteps.indexOf(status as SellingStatus)
  const waitPaymentStepIndex = statusSteps.indexOf('wait_payment')

  return newStepIndex >= waitPaymentStepIndex
}

// Check if slip confirmation is required
const requiresSlipConfirmation = (status: string) => {
  const statusSteps: SellingStatus[] = [
    'wait_product',
    'wait_confirm',
    'wait_payment',
    'paid_complete',
    'preparing',
    'shipping',
    'received',
    'damaged',
  ]
  const newStepIndex = statusSteps.indexOf(status as SellingStatus)
  const paidCompleteStepIndex = statusSteps.indexOf('paid_complete')

  return newStepIndex >= paidCompleteStepIndex
}

// Computed properties for showing sections
const showBankSelection = computed(() => {
  // ถ้า currentStatus >= wait_payment และมี bankCode แล้ว = แสดงตลอด
  if (requiresBankSelection(props.currentStatus) && !!props.currentData.bankCode) {
    return true
  }

  // ถ้าเลือก statusForm.status >= wait_payment แต่ยังไม่มี bankCode = แสดงให้ยืนยัน
  if (statusForm.value.status && requiresBankSelection(statusForm.value.status)) {
    return true
  }

  return false
})

const showSlipConfirmation = computed(() => {
  // ถ้า currentStatus >= paid_complete = แสดงตลอด
  if (requiresSlipConfirmation(props.currentStatus)) {
    return true
  }

  // ถ้าเลือก statusForm.status >= paid_complete = แสดงให้ยืนยัน
  if (statusForm.value.status && requiresSlipConfirmation(statusForm.value.status)) {
    return true
  }

  return false
})

const handleStatusChange = (newStatus: string) => {
  statusForm.value.status = newStatus
}
const updateBankCode = (bankCode: string) => {
  statusForm.value.bankCode = bankCode
}
const handleSlipStatusChanged = (hasSlipStatus: boolean) => {
  statusForm.value.hasSlip = hasSlipStatus
}



const handleClose = () => {
  emit('update:visible', false)
  resetForm()
}

const resetForm = () => {
  statusForm.value.status = ''
  statusForm.value.bankCode = ''
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

const handleSubmit = () => {
  if (!statusForm.value.status) {
    toast.error('กรุณาเลือกสถานะที่ต้องการเปลี่ยน')
    return
  }

  if (
    requiresBankSelection(statusForm.value.status) &&
    !statusForm.value.bankCode &&
    !props.currentData.bankCode
  ) {
    toast.error('กรุณาเลือกบัญชีธนาคารสำหรับการชำระเงิน')
    return
  }

  // เช็คว่าต้องยืนยันสลิปหรือไม่
  if (requiresSlipConfirmation(statusForm.value.status) && !statusForm.value.hasSlip) {
    toast.error('กรุณาอัปโหลดสลิปการโอนเงิน')
    return
  }

  updateSalesStatus({
    _id: props.currentData._id,
    status: statusForm.value.status,
    bankCode: statusForm.value.bankCode ? statusForm.value.bankCode : props.currentData.bankCode,
    bankAccount: props.currentData.bankAccount,
    item: props.currentData.item,
    user: props.currentData.user._id,
    products: props.currentData.products,
    deposit: props.currentData.deposit,
    discount: props.currentData.discount,
    seller: props.currentData.seller,
    note: props.currentData.note,
    payment: props.currentData.payment,
    cat: props.currentData.cat,
  })
}
// Mutation for updating sales status
const queryClient = useQueryClient()
const { mutate: updateSalesStatus } = useMutation({
  mutationFn: (payload: IUpdateSalesPayload) => salesStore.onUpdateSales(payload),
  onSuccess: () => {
    toast.success('เปลี่ยนสถานะการขายสำเร็จ')
    queryClient.invalidateQueries({ queryKey: ['get_sales'] })
    emit('update:visible', false)
    resetForm()
  },
  onError: (error: unknown) => {
    console.log(error)
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'เปลี่ยนสถานะการขายไม่สำเร็จ'
    toast.error(errorMessage)
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
      <div v-if="availableNextSteps.length > 0">
        <h4 class="font-semibold text-gray-900 mb-.15">เปลี่ยนเป็นสถานะ:</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card
            v-for="step in availableNextSteps"
            :key="step.value"
            :pt="{ body: 'p-4' }"
            :class="`hover:shadow-md transition-shadow cursor-pointer border-2 ${
              statusForm.status === step.value
                ? 'border-blue-400 bg-blue-50' // สถานะที่เลือกแล้ว
                : 'border-transparent hover:border-blue-200' // สถานะอื่นๆ
            }`"
            @click="handleStatusChange(step.value)"
          >
            <template #content>
              <div class="flex items-center gap-3">
                <div
                  :class="`w-10 h-10 rounded-lg flex items-center justify-center ${
                    statusForm.status === step.value
                      ? 'bg-blue-200' // สถานะที่เลือกแล้ว
                      : step.color === 'success'
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
                      statusForm.status === step.value
                        ? 'text-blue-700' // สถานะที่เลือกแล้ว
                        : step.color === 'success'
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
                  <h5 class="font-medium text-gray-900">
                    {{ step.label }}
                    <span
                      v-if="statusForm.status === step.value"
                      class="text-blue-600 text-sm ml-2"
                    >
                      (เลือกแล้ว)
                    </span>
                  </h5>
                  <p class="text-xs text-gray-600 mt-1">{{ step.description }}</p>
                </div>
                <i
                  :class="`pi ${
                    statusForm.status === step.value
                      ? 'pi-check text-blue-600' // สถานะที่เลือกแล้ว
                      : 'pi-arrow-right text-gray-400' // สถานะอื่นๆ
                  }`"
                ></i>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Bank Selection Section -->
      <div v-if="showBankSelection" class="space-y-4">
        <BankSelectionSection
          :selected-bank-code="statusForm.bankCode || props.currentData.bankCode"
          :is-submitting="false"
          :is-current-bank="props.currentData.bankCode"
          :is-current-status="props.currentData.status"
          @update:selected-bank-code="updateBankCode"
        />
      </div>

      <!-- Slip Confirmation Section -->
      <div v-if="showSlipConfirmation" class="space-y-4">
        <SlipUploadSection
          :sale-id="props.currentData._id"
          :selected-status="statusForm.status || props.currentStatus"
          :is-current-status="props.currentStatus"
          :is-submitting="false"
          @slip-status-changed="handleSlipStatusChanged"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="danger"
          @click="resetForm"
          size="small"
          :disabled="!statusForm.status"
        />

        <Button
          label="ยืนยันการเปลี่ยนสถานะ"
          icon="pi pi-check"
          severity="success"
          @click="handleSubmit"
          size="small"
          :disabled="!statusForm.status"
        />

        <Button
          label="ปิด"
          icon="pi pi-times-circle"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
