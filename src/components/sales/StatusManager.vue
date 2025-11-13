<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button, Tag, Card, Select } from 'primevue'
import { useSalesStore } from '@/stores/sales/sales'
import type { StatusWorkflow, SellingStatus, ISales, IUpdateSalesPayload } from '@/types/sales'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import SlipUploadSection from './SlipUploadSection.vue'
import BankSelectionSection from './BankSelectionSection.vue'
import { useMemberStore, type IMember, type UpdateMemberPayload } from '@/stores/member/member'
import {
  useProductStore,
  type IProduct,
  type IUpdateProductPayload,
} from '@/stores/product/product'
import ProductManagementSection from './ProductManagementSection.vue'

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

// const availableNextSteps = computed(() => {
//   if (!currentStatusInfo.value) return []

//   const currentStepIndex = allSteps.value.findIndex((step) => step.key === props.currentStatus)

//   // ถ้าเป็น step สุดท้าย (damaged) ไม่แสดง step อื่น
//   if (currentStepIndex === allSteps.value.length - 1) {
//     return []
//   }

//   return currentStatusInfo.value.nextSteps
//     .map((status: SellingStatus) => ({
//       value: status,
//       ...salesStore.statusWorkflow[status as keyof StatusWorkflow],
//     }))
//     .filter((step) => {
//       const stepIndex = allSteps.value.findIndex((s) => s.key === step.value)
//       return stepIndex > currentStepIndex
//     })
// })

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
  statusForm.value.hasSlip = false
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

  if (!props.currentData.products) {
    toast.error('กรุณาเลือกสินค้า')
    return
  }

  updateSalesStatus({
    _id: props.currentData._id,
    status: statusForm.value.status,
    bankCode: statusForm.value.bankCode ? statusForm.value.bankCode : props.currentData.bankCode,
    bankAccount: props.currentData.bankAccount,
    item: props.currentData.item,
    user: props.currentData.user._id,
    products: props.currentData.products?.map((p) => ({
      id: p.id || '',
      category: p.category || '',
      price: p.price || 0,
      quantity: p.quantity || 1,
    })),
    deposit: props.currentData.deposit,
    discount: props.currentData.discount,
    seller: props.currentData.seller,
    note: props.currentData.note,
    payment: props.currentData.payment,
    cat: props.currentData.cat,
    deliveryNo: props.currentData.deliveryNo,
    delivery: props.currentData.delivery,
  })
}
// Mutation for updating sales status
const { data: members } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})

const productStore = useProductStore()
const { data: productsData } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: allSales } = useQuery<ISales[]>({
  queryKey: ['get_sales'],
  queryFn: () => salesStore.onGetSales(),
})

const { statusWorkflow } = useSalesStore()
const queryClient = useQueryClient()
const { mutate: updateSalesStatus } = useMutation({
  mutationFn: (payload: IUpdateSalesPayload) => salesStore.onUpdateSales(payload),
  onSuccess: (data: any, variables: IUpdateSalesPayload) => {
    if (data.data.modifiedCount > 0) {
      toast.success('เปลี่ยนสถานะการขายสำเร็จ')

      if (
        statusWorkflow[variables.status as keyof StatusWorkflow]?.stepOrder >=
        statusWorkflow['paid_complete'].stepOrder
      ) {
        // A. อัพเดทสถานะสมาชิก
        const member = members.value?.find((m) => m._id === variables.user)

        if (member && member.status !== 'css') {
          // คำนวณยอดซื้อรวมทั้งหมด (รายการปัจจุบัน + ยอดซื้อในอดีต)
          const currentTotal = calculateOrderTotal(variables, productsData.value || [])
          const previousTotal =
            allSales.value
              ?.filter(
                (s) =>
                  s.user._id === variables.user &&
                  salesStore.statusWorkflow[s.status as keyof StatusWorkflow]?.stepOrder >=
                    salesStore.statusWorkflow['paid_complete'].stepOrder &&
                  s._id !== variables._id
              )
              .reduce((sum, s) => sum + calculateSaleTotal(s, productsData.value || []), 0) || 0

          const totalSpending = currentTotal + previousTotal

          const shouldBeCss = totalSpending >= 50000
          const shouldBeCs = !shouldBeCss && member.status === 'ci'

          if (shouldBeCss || shouldBeCs) {
            const newStatus = shouldBeCss ? 'css' : 'cs'
            const newCode = member.code.replace('ci', newStatus).replace(/^cs(?!s)/, newStatus)

            mutateUpdate({
              _id: member._id,
              status: newStatus,
              code: newCode,
              contacts: member.contacts || [],
              interests: member.interests || [],
              displayName: member.displayName,
              name: member.name,
              address: member.address,
              province: member.province,
              phone: member.phone,
              type: member.type,
              username: member.username,
              password: member.password,
              bidder: member.bidder,
              cat: member.cat,
              uat: member.uat,
            })
          }
        }

        // B. ตัดสต็อกสินค้า - แยก logic ปลา vs สินค้าทั่วไป
        const products = productsData.value?.filter((p) =>
          variables.products.some((product) => product.id === p._id)
        )

        if (products && products.length > 0) {
          products.forEach((product) => {
            const purchasedItem = variables.products.find((p) => p.id === product._id)
            if (!purchasedItem) return

            const quantity = purchasedItem.quantity
            const isFish = product.category?.name === 'ปลา'

            let newSoldStatus = product.sold
            let newBalance = product.balance || 0

            if (isFish) {
              // === กรณีปลา: ไม่ใช้ balance แค่เปลี่ยน sold ===
              newSoldStatus = true
              newBalance = product.balance || 0
            } else {
              // === กรณีสินค้าทั่วไป: ใช้ทั้ง balance และ sold ===
              const balance = product.balance || 0

              if (balance >= quantity) {
                // กรณีมีสต็อกเพียงพอ
                newBalance = balance - quantity
                newSoldStatus = newBalance === 0 // sold = true ถ้าสินค้าหมด
              } else {
                // กรณีสต็อกไม่พอ (ไม่ควรเกิด แต่เผื่อ)
                newBalance = 0
                newSoldStatus = true
                console.warn(
                  `สินค้า ${product.sku} มีสต็อกไม่เพียงพอ (มี: ${balance}, ขาย: ${quantity})`
                )
              }
            }

            updateProduct({
              ...product,
              fishpond: product.fishpond?._id || undefined,
              species: product.species?._id || undefined,
              farm: product.farm?._id || undefined,
              quality: product.quality?._id || undefined,
              lotNumber: product.lotNumber?._id || undefined,
              seedSize: product.seedSize?._id || undefined,
              foodtype: product.foodtype?._id || undefined,
              brand: product.brand?._id || undefined,
              fishStatus: product.fishStatus?._id || undefined,

              sold: newSoldStatus,
              balance: newBalance,
            })
          })
        }
      }

      queryClient.invalidateQueries({ queryKey: ['get_sales'] })
      emit('update:visible', false)
      resetForm()
    }
  },
  onError: (error: unknown) => {
    console.log(error)
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'เปลี่ยนสถานะการขายไม่สำเร็จ'
    toast.error(errorMessage)
  },
})

// ฟังก์ชันช่วยคำนวณยอดเงินรวมของออเดอร์ปัจจุบัน
const calculateOrderTotal = (order: IUpdateSalesPayload, allProducts: IProduct[]): number => {
  const productsTotal = order.products.reduce((sum, item) => {
    const product = allProducts.find((p) => p._id === item.id)
    if (!product) return sum

    if (product.category?.name === 'ปลา') {
      const price = product.price || 0
      return sum + price
    } else {
      const price = product.food?.customerPrice || 0
      return sum + price * item.quantity
    }
  }, 0)

  // ยอดสุทธิ = ยอดสินค้า - ส่วนลด
  return productsTotal - (order.discount || 0)
}

// ฟังก์ชันช่วยคำนวณยอดเงินรวมของ sale ในอดีต
const calculateSaleTotal = (sale: ISales, allProducts: IProduct[]): number => {
  const productsTotal = sale.products?.reduce((sum, item) => {
    const product = allProducts.find((p) => p._id === item.id)
    if (!product) return sum

    if (product.category?.name === 'ปลา') {
      const price = product.price || 0
      return sum + price
    } else {
      const price = product.food?.customerPrice || 0
      return sum + price * item.quantity
    }
  }, 0)

  return productsTotal ? productsTotal - (sale.discount || 0) : 0
}

const memberStore = useMemberStore()
const { mutate: mutateUpdate } = useMutation({
  mutationFn: (payload: UpdateMemberPayload) => memberStore.onUpdateMember(payload),
})

const { mutate: updateProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
})

const getSelectedStepColor = (value: string) => {
  const step = availableNextSteps.value.find((s) => s.value === value)
  if (!step) return 'bg-gray-100'

  return step.color === 'success'
    ? 'bg-green-100'
    : step.color === 'warning'
    ? 'bg-yellow-100'
    : step.color === 'danger'
    ? 'bg-red-100'
    : 'bg-blue-100'
}

const getSelectedStepIcon = (value: string) => {
  const step = availableNextSteps.value.find((s) => s.value === value)
  return step?.icon || 'pi pi-question'
}

const getSelectedStepIconColor = (value: string) => {
  const step = availableNextSteps.value.find((s) => s.value === value)
  if (!step) return 'text-gray-400'

  return step.color === 'success'
    ? 'text-green-600'
    : step.color === 'warning'
    ? 'text-yellow-600'
    : step.color === 'danger'
    ? 'text-red-600'
    : 'text-blue-600'
}

const getSelectedStepLabel = (value: string) => {
  const step = availableNextSteps.value.find((s) => s.value === value)
  return step?.label || value
}

const availableNextSteps = computed(() => {
  if (!currentStatusInfo.value) return []

  const currentStepIndex = allSteps.value.findIndex((step) => step.key === props.currentStatus)

  // ถ้าเป็น step สุดท้าย (damaged) ไม่แสดง step อื่น
  if (currentStepIndex === allSteps.value.length - 1) {
    return []
  }

  return currentStatusInfo.value.nextSteps
    .map((status: SellingStatus) => ({
      value: status,
      ...salesStore.statusWorkflow[status as keyof StatusWorkflow],
    }))
    .filter((step) => {
      const stepIndex = allSteps.value.findIndex((s) => s.key === step.value)
      // ป้องกันการเลือก step ที่ผ่านมาแล้ว (stepIndex ต้องมากกว่า currentStepIndex)
      return stepIndex > currentStepIndex
    })
})
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
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
        <h4 class="font-semibold text-gray-900 mb-3">ขั้นตอนการขาย</h4>
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

      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <h4 class="font-semibold text-gray-900 mb-3">เปลี่ยนเป็นสถานะ</h4>
        <div v-if="availableNextSteps.length > 0" class="space-y-4">
          <Select
            v-model="statusForm.status"
            :options="availableNextSteps"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกสถานะที่ต้องการเปลี่ยน"
            fluid
            size="small"
            :invalid="!statusForm.status"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-3">
                <div
                  :class="`w-8 h-8 rounded-lg flex items-center justify-center ${
                    option.color === 'success'
                      ? 'bg-green-100'
                      : option.color === 'warning'
                      ? 'bg-yellow-100'
                      : option.color === 'danger'
                      ? 'bg-red-100'
                      : 'bg-blue-100'
                  }`"
                >
                  <i
                    :class="`${option.icon} ${
                      option.color === 'success'
                        ? 'text-green-600'
                        : option.color === 'warning'
                        ? 'text-yellow-600'
                        : option.color === 'danger'
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`"
                  ></i>
                </div>
                <div class="flex-1">
                  <div class="font-medium text-sm text-gray-900">{{ option.label }}</div>
                  <div class="text-xs text-gray-500">{{ option.description }}</div>
                </div>
              </div>
            </template>

            <template #value="{ value }">
              <div v-if="value" class="flex items-center gap-2">
                <div
                  :class="`w-8 h-8 rounded-lg flex items-center justify-center ${getSelectedStepColor(
                    value
                  )}`"
                >
                  <i
                    :class="`${getSelectedStepIcon(value)} ${getSelectedStepIconColor(value)}`"
                  ></i>
                </div>
                <span class="font-medium">{{ getSelectedStepLabel(value) }}</span>
              </div>
              <span v-else class="text-gray-500">เลือกสถานะที่ต้องการเปลี่ยน</span>
            </template>
          </Select>
        </div>
      </div>

      <!-- Bank Selection Section -->
      <BankSelectionSection
        v-if="showBankSelection"
        :selected-bank-code="statusForm.bankCode || props.currentData.bankCode"
        :is-submitting="false"
        :is-current-bank="props.currentData.bankCode"
        :is-current-status="props.currentData.status"
        @update:selected-bank-code="updateBankCode"
      />

      <!-- Slip Confirmation Section -->
      <SlipUploadSection
        v-if="showSlipConfirmation"
        :sale-id="props.currentData._id"
        :selected-status="statusForm.status || props.currentStatus"
        :is-current-status="props.currentStatus"
        :is-submitting="false"
        @slip-status-changed="handleSlipStatusChanged"
      />

      <ProductManagementSection
        :products="
          props.currentData.products?.map((product) => ({
            id: product.id || '',
            quantity: product.quantity || 1,
            category: product.category || '',
            price: product.price || 0,
          }))
        "
        :is-submitting="false"
        :read-only="true"
      />
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
