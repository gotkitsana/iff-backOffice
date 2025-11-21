<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import {
  Dialog,
  Button,
  Tag,
  Textarea,
  Select,
  InputText,
  InputNumber,
  DatePicker,
  Image as PrimeImage,
  TabView,
  TabPanel,
} from 'primevue'
import { useSalesStore } from '@/stores/sales/sales'
import type {
  StatusWorkflow,
  SellingStatusString,
  ISales,
  IUpdateSalesPayload,
} from '@/types/sales'
import {
  SellingStatus,
  convertStatusNumberToString,
  convertStatusStringToNumber,
} from '@/types/sales'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import SlipUploadSection from './SlipUploadSection.vue'
import ShippingSlipUploadSection from './ShippingSlipUploadSection.vue'
import BankSelectionSection from './BankSelectionSection.vue'
import ProductItemForm from './ProductItemForm.vue'
import PaymentCalculationSection from './PaymentCalculationSection.vue'
import StatusStepper from './StatusStepper.vue'
import SummaryCard from './SummaryCard.vue'
import formatCurrency from '@/utils/formatCurrency'
import { getSlipUrl, getShippingSlipUrl } from '@/utils/imageUrl'
import { useMemberStore, type IMember } from '@/stores/member/member'
import {
  useProductStore,
  type IProduct,
  type IUpdateProductPayload,
} from '@/stores/product/product'
import { executeStockDeduction } from '@/utils/stockDeduction'
// import { useAdminStore, type IAdmin } from '@/stores/admin/admin'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { useFoodSaleStore, type IFoodSale } from '@/stores/product/food_sale'
import { useProductSelection } from '@/composables/useProductSelection'
import { useMemberStatusUpdate } from '@/composables/useMemberStatusUpdate'
import {
  validateStatusForStatusChange,
  getAvailableStatuses,
  canEditField,
} from '@/utils/salesStatusValidation'
import { useAdminStore, type IAdmin } from '@/stores/admin/admin'

// Props
const props = defineProps<{
  visible: boolean
  currentStatus: string
  orderNumber: string
  currentData: ISales
  targetStatus?: string // ส่งมาจากปุ่มในตาราง
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// Stores
const salesStore = useSalesStore()
const memberStore = useMemberStore()
const productStore = useProductStore()
// const adminStore = useAdminStore()
const categoryStore = useCategoryStore()

// Form data
const saleForm = ref<IUpdateSalesPayload>({
  _id: props.currentData._id,
  payment: props.currentData.payment || 'cash',
  bankCode: props.currentData.bankCode || '',
  bankAccount: props.currentData.bankAccount || '',
  cat: props.currentData.cat || 0,
  item: props.currentData.item || '',
  sellingStatus:
    typeof props.currentData.sellingStatus === 'number'
      ? props.targetStatus
        ? convertStatusStringToNumber(props.targetStatus)
        : props.currentData.sellingStatus
      : convertStatusStringToNumber(props.targetStatus || props.currentStatus || 'none'),
  user: props.currentData.user || '',
  products:
    props.currentData.products?.map((p) => ({
      id: p.id || '',
      quantity: p.quantity || 1,
      category: p.category || '',
      price: p.price || 0,
    })) || [],
  deposit: props.currentData.deposit || 0,
  discount: props.currentData.discount || 0,
  seller: props.currentData.seller || '',
  note: props.currentData.note || '',
  deliveryNo: props.currentData.deliveryNo || 0,
  delivery: props.currentData.delivery || '',
  deliveryStatus: props.currentData.deliveryStatus || undefined,
  paymentDueDate: props.currentData.paymentDueDate || undefined,
  shippingAddress: props.currentData.shippingAddress || undefined,
  shippingProvince: props.currentData.shippingProvince || undefined,
  customProducts: props.currentData.customProducts || [],
})

// Reactive data
const hasSlip = ref(false)
const hasShippingSlip = ref(false)
const totalAmount = ref(0)
const isSubmitting = ref(false)

// Slip upload states (from ModalEditSale)
const hasPendingSlipUpload = ref(false)
const hasPendingShippingSlipUpload = ref(false)
const skipShippingSlipUpload = ref(false)
const requireShippingSlipUpload = ref(true) // ค่าเริ่มต้น = true (ต้องอัพโหลด)
const finalSaleStatus = ref<'received' | 'damaged' | null>(null)

// Queries
const { data: members } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})

const { data: productsData } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: allSales } = useQuery<ISales[]>({
  queryKey: ['get_sales'],
  queryFn: () => salesStore.onGetSales(),
})

// const { data: admins } = useQuery<IAdmin[]>({
//   queryKey: ['get_admins'],
//   queryFn: () => adminStore.onGetAdmins(),
// })

const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

const foodSaleStore = useFoodSaleStore()
const { data: foodSales } = useQuery<IFoodSale[]>({
  queryKey: ['get_food_sales'],
  queryFn: () => foodSaleStore.onGetFoodSales(),
})

// Use composable for product selection
const productSelection = useProductSelection(
  productsData,
  categories,
  foodSales,
  computed(() => saleForm.value.products || [])
)

// Provide composable to child components
provide(Symbol.for('productSelection'), productSelection)

// Use composable for member status update
const memberStatusUpdate = useMemberStatusUpdate()

// Helper function for status step index (from ModalEditSale)
const getStatusStepIndex = (status: SellingStatus | number | string) => {
  const statusString =
    typeof status === 'number'
      ? convertStatusNumberToString(status)
      : typeof status === 'string'
      ? status
      : convertStatusNumberToString(status)
  return salesStore.sellingStatusOptions.findIndex((option) => option.value === statusString)
}

// Current status string computed (from ModalEditSale)
const currentStatusString = computed(() => {
  return typeof props.currentData.sellingStatus === 'number'
    ? convertStatusNumberToString(props.currentData.sellingStatus)
    : props.currentStatus
})

const currentStatusInfo = computed(() => {
  return salesStore.statusWorkflow[currentStatusString.value as keyof StatusWorkflow]
})

// Status options for select (from ModalEditSale)
const statusOptionsForSelect = computed(() => {
  const availableStatuses = getAvailableStatuses(
    currentStatusString.value as SellingStatusString,
    'status-change'
  )
  return salesStore.sellingStatusOptions.map((opt) => ({
    ...opt,
    disabled: !availableStatuses.includes(opt.value as SellingStatusString),
  }))
})

// Computed for showing slip upload (from ModalEditSale)
const showSlipUpload = computed(() => {
  const pm = props.currentData.paymentMethod
  const statusStr = currentStatusString.value

  // สำหรับ cash: ซ่อนเมื่อ deliveryStatus = preparing
  if (pm === 'cash' && props.currentData.deliveryStatus === 'preparing') {
    return false
  }

  // สำหรับ cod: ไม่ต้องแสดง
  if (pm === 'cod') {
    return false
  }

  if (pm === 'credit') {
    return false
  }

  // สำหรับ order: แสดงเมื่อ status = wait_payment หรือมากกว่า
  if (pm === 'order') {
    const currentStepIndex = getStatusStepIndex(statusStr)
    const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
    return currentStepIndex >= waitPaymentStepIndex
  }

  // สำหรับ transfer/card: แสดงเมื่อ status >= wait_payment
  const currentStepIndex = getStatusStepIndex(statusStr)
  const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
  return currentStepIndex >= waitPaymentStepIndex
})

// Computed for showing shipping slip upload (from ModalEditSale)
const showShippingSlipUpload = computed(() => {
  // แสดงเฉพาะเมื่อ status = preparing เท่านั้น
  const statusStr = currentStatusString.value
  const currentStepIndex = getStatusStepIndex(statusStr)
  const preparingStepIndex = getStatusStepIndex('preparing')
  return currentStepIndex >= preparingStepIndex
})

// Selected member details (from ModalEditSale)
const selectedMemberDetails = computed(() => {
  if (!saleForm.value.user || !members.value) return null
  return members.value.find((m) => m._id === saleForm.value.user)
})

// Computed properties for showing sections (from ModalEditSale)
const showProductSelection = computed(() => {
  return true // แสดงได้เสมอ แต่จะควบคุมด้วยเงื่อนไขอื่น
})

const showCustomProducts = computed(() => {
  // แสดงเฉพาะเมื่อ paymentMethod === 'order' และไม่มีสินค้าปกติ
  const hasProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false
  return props.currentData.paymentMethod === 'order' && !hasProducts
})

const showDeliveryStatus = computed(() => {
  return props.currentData.paymentMethod === 'cash'
})

const showPaymentDueDate = computed(() => {
  return props.currentData.paymentMethod === 'credit'
})

const showBankSelection = computed(() => {
  const pm = props.currentData.paymentMethod
  // สำหรับ order: แสดงเมื่อมีสินค้า
  if (pm === 'order') {
    const hasProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false
    return hasProducts
  }
  // สำหรับ transfer/card: แสดงเสมอ
  return pm === 'transfer' || pm === 'card'
})

const showShippingAddress = computed(() => {
  const pm = props.currentData.paymentMethod
  if (pm === 'cash') {
    // เงินสด: แสดงถ้าเลือก "แพ็ครอจัดส่ง"
    return props.currentData.deliveryStatus === 'preparing'
  }
  if (pm === 'order') {
    // สำหรับ order: แสดงเมื่อมีสินค้า
    const hasProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false
    return hasProducts
  }
  // เครดิต, โอน, บัตร, ปลายทาง: บังคับ
  return pm === 'credit' || pm === 'transfer' || pm === 'card' || pm === 'cod'
})

const showAdditionalInfo = computed(() => {
  // ซ่อนเมื่อ paymentMethod = cash และ deliveryStatus = received
  if (
    props.currentData.paymentMethod === 'cash' &&
    props.currentData.deliveryStatus === 'received'
  ) {
    return false
  }
  return true
})

// Computed properties for showing detailed/summary views based on step
const showDetailedProducts = computed(() => {
  const status = currentStatusString.value
  // แสดงรายละเอียดเต็มรูปแบบสำหรับ order, wait_payment, preparing
  return status === 'order' || status === 'wait_payment' || status === 'preparing'
})

const showSummaryProducts = computed(() => {
  const status = currentStatusString.value
  // แสดงสรุปสำหรับ shipping, received, damaged
  return status === 'shipping' || status === 'received' || status === 'damaged'
})

const showDetailedPayment = computed(() => {
  const status = currentStatusString.value
  // แสดงรายละเอียดเต็มรูปแบบสำหรับ wait_payment, preparing
  return status === 'wait_payment' || status === 'preparing'
})

const showSummaryPayment = computed(() => {
  const status = currentStatusString.value
  // แสดงสรุปสำหรับ shipping, received, damaged
  return status === 'shipping' || status === 'received' || status === 'damaged'
})

const showDetailedDocuments = computed(() => {
  const status = currentStatusString.value
  // แสดงรายละเอียดเต็มรูปแบบสำหรับ wait_payment, preparing, shipping
  return status === 'wait_payment' || status === 'preparing' || status === 'shipping'
})

const showSummaryDocuments = computed(() => {
  const status = currentStatusString.value
  // แสดงสรุปสำหรับ received, damaged
  return status === 'received' || status === 'damaged'
})

// Computed property สำหรับแสดงแทปแก้ไข
const showEditTab = computed(() => {
  const status = currentStatusString.value
  return status !== 'received' && status !== 'damaged'
})

// Computed properties สำหรับควบคุมการแสดงผลในแทปแก้ไขตาม step ปัจจุบัน
const showProductsInEditTab = computed(() => {
  const status = currentStatusString.value
  const currentStepOrder = salesStore.statusWorkflow[status as keyof StatusWorkflow]?.stepOrder ?? 0
  const waitPaymentStepOrder = salesStore.statusWorkflow['wait_payment']?.stepOrder ?? 0
  // แสดงเมื่อ status = order หรือ wait_payment (ก่อน preparing)
  return currentStepOrder <= waitPaymentStepOrder
})

const showShippingAddressInEditTab = computed(() => {
  const status = currentStatusString.value
  const pm = props.currentData.paymentMethod
  // แสดงเมื่อ status = wait_payment และ paymentMethod = order
  return status === 'wait_payment' && pm === 'order'
})

const showBankInfoInEditTab = computed(() => {
  const status = currentStatusString.value
  const pm = props.currentData.paymentMethod
  // แสดงเมื่อ status = wait_payment และ paymentMethod = transfer/card/order
  return status === 'wait_payment' && (pm === 'transfer' || pm === 'card' || pm === 'order')
})

const showSlipUploadInEditTab = computed(() => {
  const status = currentStatusString.value
  const pm = props.currentData.paymentMethod
  // แสดงเมื่อ status = wait_payment หรือ preparing และ paymentMethod ต้องใช้สลิป
  if (pm === 'cash' || pm === 'cod' || pm === 'credit') return false
  return status === 'wait_payment' || status === 'preparing'
})

const showShippingSlipInEditTab = computed(() => {
  const status = currentStatusString.value
  // แสดงเมื่อ status = preparing
  return status === 'preparing'
})

const showCompleteSaleInEditTab = computed(() => {
  const status = currentStatusString.value
  // แสดงเมื่อ status = shipping
  return status === 'shipping'
})

// Computed properties for slip URLs
const slipUrl = computed(() => {
  if (!props.currentData._id || !hasSlip.value) return ''
  return getSlipUrl(props.currentData._id)
})

const shippingSlipUrl = computed(() => {
  if (!props.currentData._id || !hasShippingSlip.value) return ''
  // ลองหา extension หลายแบบ (ใช้ jpg เป็น default)
  return getShippingSlipUrl(props.currentData._id, 'jpg')
})

// Total amount computed (from ModalEditSale)
const totalAmountComputed = computed(() => {
  return (
    saleForm.value.products?.reduce((sum, product) => {
      if (!product.id) return 0

      const productDetail = productSelection.availableProducts.value?.find(
        (p) => p._id === product.id
      )
      if (productDetail && productDetail.price) {
        return sum + (productDetail.price || 0) * product.quantity
      }
      return sum
    }, 0) || 0
  )
})

// Watch totalAmountComputed and update totalAmount
watch(
  totalAmountComputed,
  (newAmount) => {
    totalAmount.value = newAmount
  },
  { immediate: true }
)

// Handlers
const handleSlipStatusChanged = (status: boolean) => {
  hasSlip.value = status
}

const handleShippingSlipStatusChanged = (status: boolean) => {
  hasShippingSlip.value = status
}

// Slip upload handlers (from ModalEditSale)
const handleSlipUploaded = async (saleId: string) => {
  if (!saleId || saleId !== props.currentData._id) return

  // ตรวจสอบว่าสถานะปัจจุบันเป็น wait_payment หรือไม่
  const currentStatusStr = currentStatusString.value
  if (currentStatusStr !== 'wait_payment') return

  // ตรวจสอบว่ามีสลิปแล้วจริงๆ โดย query ด้วย saleId
  try {
    const apiUrl = (import.meta as any).env.VITE_API_URL as string
    const slipUrl = `${apiUrl}/erp/download/slip?saleId=${saleId}`

    // ตรวจสอบว่ามีสลิปจริงๆ หรือไม่
    const slipExists = await new Promise<boolean>((resolve) => {
      const img = new Image()
      const timeout = setTimeout(() => {
        resolve(false)
      }, 5000)

      img.onload = () => {
        clearTimeout(timeout)
        resolve(true)
      }

      img.onerror = () => {
        clearTimeout(timeout)
        resolve(false)
      }

      img.src = slipUrl
    })

    // ถ้ามีสลิปแล้ว ให้เปลี่ยนสถานะเป็น preparing
    if (slipExists) {
      // อัพเดทสถานะเป็น preparing
      const payload: IUpdateSalesPayload = {
        ...saleForm.value,
        sellingStatus: SellingStatus.preparing,
      }

      updateSalesStatus(payload)
    }
  } catch (error) {
    console.error('Error checking slip:', error)
  }
}

const handleSlipPendingUpload = (isPending: boolean) => {
  hasPendingSlipUpload.value = isPending
}

const handleShippingSlipPendingUpload = (isPending: boolean) => {
  hasPendingShippingSlipUpload.value = isPending
}

const handleSkipShippingSlipUploadChanged = (skip: boolean) => {
  skipShippingSlipUpload.value = skip
}

const handleRequireShippingSlipUploadChanged = (require: boolean) => {
  requireShippingSlipUpload.value = require
}

const handleDeliveryChanged = (delivery: string) => {
  saleForm.value.delivery = delivery
}

// Handler สำหรับเมื่ออัพโหลด shipping slip สำเร็จ (from ModalEditSale)
const handleShippingSlipUploaded = async (saleId: string) => {
  if (!saleId || saleId !== props.currentData._id) return

  const currentStatusStr = currentStatusString.value
  if (currentStatusStr !== 'preparing') return

  // ตรวจสอบว่ามี shipping slip แล้วจริงๆ
  try {
    const apiUrl = (import.meta as any).env.VITE_API_URL as string
    const extensions = ['jpg', 'jpeg', 'png']
    let found = false

    for (const ext of extensions) {
      const shippingSlipUrl = `${apiUrl}/erp/download/shipping-slip?saleId=${saleId}&ext=${ext}`
      const slipExists = await new Promise<boolean>((resolve) => {
        const img = new Image()
        const timeout = setTimeout(() => {
          resolve(false)
        }, 5000)

        img.onload = () => {
          clearTimeout(timeout)
          resolve(true)
        }

        img.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }

        img.src = shippingSlipUrl
      })

      if (slipExists) {
        found = true
        break
      }
    }

    // ถ้ามี shipping slip แล้ว ให้เปลี่ยนสถานะเป็น shipping
    if (found) {
      const payload: IUpdateSalesPayload = {
        ...saleForm.value,
        sellingStatus: SellingStatus.shipping,
      }

      updateSalesStatus(payload)
    }
  } catch (error) {
    console.error('Error checking shipping slip:', error)
  }
}

const handleClose = () => {
  emit('update:visible', false)
  resetForm()
}

const resetForm = () => {
  saleForm.value = {
    _id: props.currentData._id,
    payment: props.currentData.payment || 'cash',
    bankCode: props.currentData.bankCode || '',
    bankAccount: props.currentData.bankAccount || '',
    cat: props.currentData.cat || 0,
    item: props.currentData.item || '',
    sellingStatus:
      typeof props.currentData.sellingStatus === 'number'
        ? props.targetStatus
          ? convertStatusStringToNumber(props.targetStatus)
          : props.currentData.sellingStatus
        : convertStatusStringToNumber(props.targetStatus || props.currentStatus || 'none'),
    user: props.currentData.user || '',
    products:
      props.currentData.products?.map((p) => ({
        id: p.id || '',
        quantity: p.quantity || 1,
        category: p.category || '',
        price: p.price || 0,
      })) || [],
    deposit: props.currentData.deposit || 0,
    discount: props.currentData.discount || 0,
    seller: props.currentData.seller || '',
    note: props.currentData.note || '',
    deliveryNo: props.currentData.deliveryNo || 0,
    delivery: props.currentData.delivery || '',
  }
  hasSlip.value = false
  hasShippingSlip.value = false
  totalAmount.value = 0
  isSubmitting.value = false
  // Reset slip upload states (from ModalEditSale)
  finalSaleStatus.value = null
  hasPendingSlipUpload.value = false
  hasPendingShippingSlipUpload.value = false
  skipShippingSlipUpload.value = false
  requireShippingSlipUpload.value = true
}

// Watch for dialog visibility and props changes
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // Reset form when dialog opens
      resetForm()
      if (props.targetStatus) {
        saleForm.value.sellingStatus = convertStatusStringToNumber(props.targetStatus)
      }
    } else {
      resetForm()
    }
  }
)

watch(
  () => props.currentData,
  () => {
    if (props.visible) {
      resetForm()
    }
  },
  { deep: true }
)

// Check slip exists on mount
watch(
  () => props.currentData._id,
  (newId) => {
    if (newId) {
      // Check slip exists
      const slipUrl = `${(import.meta as any).env.VITE_API_URL}/erp/download/slip?saleId=${newId}`
      const img = new Image()
      img.onload = () => {
        hasSlip.value = true
      }
      img.onerror = () => {
        hasSlip.value = false
      }
      img.src = slipUrl

      // Check shipping slip exists
      const shippingSlipUrl = `${
        (import.meta as any).env.VITE_API_URL
      }/erp/download/shipping-slip?saleId=${newId}`
      const shippingImg = new Image()
      shippingImg.onload = () => {
        hasShippingSlip.value = true
      }
      shippingImg.onerror = () => {
        hasShippingSlip.value = false
      }
      shippingImg.src = shippingSlipUrl
    }
  },
  { immediate: true }
)

// Submit handler (from ModalEditSale)
const handleSubmit = () => {
  isSubmitting.value = true

  const currentStatusStr = currentStatusString.value
  const selectedStatusString =
    typeof saleForm.value.sellingStatus === 'number'
      ? convertStatusNumberToString(saleForm.value.sellingStatus)
      : (saleForm.value.sellingStatus as string) || currentStatusStr

  // Check if all products are valid
  const hasValidProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false

  // Use utility function for status validation
  const validationResult = validateStatusForStatusChange({
    selectedStatus: selectedStatusString as SellingStatusString,
    hasProducts: hasValidProducts,
    hasBankInfo: !!saleForm.value.bankCode,
    hasSlip: hasSlip.value,
    hasShippingSlip: hasShippingSlip.value,
    currentStatus: currentStatusStr as SellingStatusString,
    mode: 'status-change',
  })

  // Show validation errors
  if (!validationResult.isValid) {
    validationResult.errors.forEach((error) => {
      toast.error(error)
    })
    isSubmitting.value = false
    return
  }

  // ตรวจสอบว่ามี pending upload หรือไม่
  if (hasPendingSlipUpload.value) {
    toast.error('กรุณากด ยืนยันการอัปโหลด')
    isSubmitting.value = false
    return
  }

  if (hasPendingShippingSlipUpload.value) {
    toast.error('กรุณากด ยืนยันการอัปโหลด')
    isSubmitting.value = false
    return
  }

  // ตรวจสอบ shipping slip validation
  if (
    requireShippingSlipUpload.value &&
    !skipShippingSlipUpload.value &&
    !hasShippingSlip.value &&
    currentStatusStr === 'preparing'
  ) {
    toast.error('กรุณาอัพโหลดสลิปการจัดส่งหรือเลือกข้ามการอัพโหลด')
    isSubmitting.value = false
    return
  }

  let finalStatus: SellingStatus

  // ตรวจสอบ currentStatus step เพื่อป้องกันไม่ให้ย้อนกลับ
  const currentStepIndex = getStatusStepIndex(currentStatusStr)
  const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
  const preparingStepIndex = getStatusStepIndex('preparing')

  // Logic สำหรับคำนวณ finalStatus ตาม paymentMethod และ currentStatus (from ModalEditSale)
  const paymentMethod = props.currentData.paymentMethod

  if (paymentMethod === 'order') {
    // Order: ถ้า currentStatus >= wait_payment ให้คงสถานะเดิมไว้
    if (currentStepIndex >= waitPaymentStepIndex) {
      finalStatus =
        typeof props.currentData.sellingStatus === 'number'
          ? props.currentData.sellingStatus
          : convertStatusStringToNumber(currentStatusStr)
    } else {
      // ถ้ามีสินค้า + bankCode + shippingAddress → wait_payment
      if (hasValidProducts && saleForm.value.bankCode) {
        finalStatus = SellingStatus.wait_payment
      } else {
        finalStatus = SellingStatus.order
      }
    }
  } else if (paymentMethod === 'cash') {
    // Cash: ตาม deliveryStatus
    if (props.currentData.deliveryStatus === 'received') {
      finalStatus = SellingStatus.received
    } else {
      finalStatus = SellingStatus.preparing
    }
  } else if (paymentMethod === 'credit') {
    // Credit: ถ้า currentStatus >= preparing ให้คงสถานะเดิมไว้
    if (currentStepIndex >= preparingStepIndex) {
      finalStatus =
        typeof props.currentData.sellingStatus === 'number'
          ? props.currentData.sellingStatus
          : convertStatusStringToNumber(currentStatusStr)
    } else {
      finalStatus = SellingStatus.preparing
    }
  } else if (paymentMethod === 'transfer' || paymentMethod === 'card') {
    // Transfer/Card: ถ้า currentStatus >= preparing ให้คงสถานะเดิมไว้
    if (currentStepIndex >= preparingStepIndex) {
      finalStatus =
        typeof props.currentData.sellingStatus === 'number'
          ? props.currentData.sellingStatus
          : convertStatusStringToNumber(currentStatusStr)
    } else {
      finalStatus = SellingStatus.wait_payment
    }
  } else if (paymentMethod === 'cod') {
    // COD: ถ้า currentStatus >= preparing ให้คงสถานะเดิมไว้
    if (currentStepIndex >= preparingStepIndex) {
      finalStatus =
        typeof props.currentData.sellingStatus === 'number'
          ? props.currentData.sellingStatus
          : convertStatusStringToNumber(currentStatusStr)
    } else {
      finalStatus = SellingStatus.preparing
    }
  } else {
    // Default: ใช้ validation result
    finalStatus = convertStatusStringToNumber(validationResult.finalStatus)
  }

  // ถ้า currentStatus เป็น preparing และมี shipping slip หรือเลือกข้าม → shipping
  if (currentStatusStr === 'preparing' && (hasShippingSlip.value || skipShippingSlipUpload.value)) {
    finalStatus = SellingStatus.shipping
  }

  // ถ้า currentStatus เป็น shipping → ยังคงเป็น shipping (ไม่เปลี่ยน)
  // แต่ถ้ามี finalSaleStatus ให้ใช้ finalSaleStatus แทน
  if (currentStatusStr === 'shipping') {
    if (finalSaleStatus.value === 'received') {
      finalStatus = SellingStatus.received
    } else if (finalSaleStatus.value === 'damaged') {
      finalStatus = SellingStatus.damaged
    } else {
      finalStatus = SellingStatus.shipping
    }
  }

  // Prepare payload
  const payload: IUpdateSalesPayload = {
    ...saleForm.value,
    sellingStatus: finalStatus,
  }

  updateSalesStatus(payload)
}

// Mutation (from ModalEditSale)
const queryClient = useQueryClient()
const { mutate: updateSalesStatus } = useMutation({
  mutationFn: (payload: IUpdateSalesPayload) => salesStore.onUpdateSales(payload),
  onSuccess: async (data: unknown, variables: IUpdateSalesPayload) => {
    if ((data as { data: { modifiedCount: number } }).data) {
      toast.success('เปลี่ยนสถานะการขายสำเร็จ')

      const statusString =
        typeof variables.sellingStatus === 'number'
          ? convertStatusNumberToString(variables.sellingStatus)
          : variables.sellingStatus

      // ตรวจสอบ status เดิมเพื่อป้องกันการตัดสต็อกซ้ำ
      const previousStatusString = currentStatusString.value
      const previousStepIndex = getStatusStepIndex(previousStatusString)
      const preparingStepIndex = getStatusStepIndex('preparing')

      if (
        salesStore.statusWorkflow[statusString as keyof StatusWorkflow]?.stepOrder >=
        salesStore.statusWorkflow['preparing'].stepOrder
      ) {
        // A. อัพเดทสถานะสมาชิก, purchaseHistory และ customerLevel ในครั้งเดียว
        // ใช้ฟังก์ชันรวมเพื่อป้องกัน race condition
        const preparingStepOrder = salesStore.statusWorkflow['preparing'].stepOrder
        memberStatusUpdate.updateMemberStatusAndPurchaseHistory(
          variables,
          members.value,
          preparingStepOrder,
          {
            allSales: allSales.value,
            allProducts: productsData.value || [],
          }
        )

        // B. ตัดสต็อกสินค้า - ตัดเฉพาะเมื่อ status เดิมน้อยกว่า preparing
        // เพื่อป้องกันการตัดสต็อกซ้ำเมื่อเปลี่ยนจาก preparing เป็น shipping
        if (productsData.value && previousStepIndex < preparingStepIndex) {
          executeStockDeduction(variables, productsData.value, updateProduct, (warning) =>
            toast.warning(warning)
          )
        }
      }

      queryClient.invalidateQueries({ queryKey: ['get_sales'] })
      queryClient.invalidateQueries({ queryKey: ['get_products'] })
      emit('update:visible', false)
      resetForm()
    } else {
      toast.error('เปลี่ยนสถานะการขายไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
  onError: (error: unknown) => {
    console.error(error)
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'เปลี่ยนสถานะการขายไม่สำเร็จ'
    toast.error(errorMessage)
    isSubmitting.value = false
  },
})

const { mutate: updateProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
})

const adminStore = useAdminStore()
const { data: admins } = useQuery<IAdmin[]>({
  queryKey: ['get_admins'],
  queryFn: () => adminStore.onGetAdmins(),
})
const findAdminData = (id: string) => {
  if (!admins.value) return null
  return admins.value.find((admin) => admin._id === id)
}

const findProvinceData = (id: string) => {
  if (!memberStore.provinceOptions) return null
  return memberStore.provinceOptions.find((province) => province.value === id)
}

const updateDeposit = (deposit: number) => {
  saleForm.value.deposit = deposit
}

const updateDiscount = (discount: number) => {
  saleForm.value.discount = discount
}

const updateDeliveryNo = (deliveryNo: number) => {
  saleForm.value.deliveryNo = deliveryNo
}

const readOnly = computed(() => {
  return (
    currentStatusString.value === 'preparing' ||
    currentStatusString.value === 'received' ||
    currentStatusString.value === 'shipping' ||
    currentStatusString.value === 'damaged'
  )
})

const customProducts = ref<Array<{ name: string; quantity: number; description: string }>>([])
const addProduct = () => {
  if (saleForm.value.products.length < 10) {
    // ถ้ามี customProducts ให้ clear ออก
    if (customProducts.value.length > 0) {
      customProducts.value = []
    }
    saleForm.value.products.push({ id: '', quantity: 1, category: '', price: 0 })
  } else {
    toast.warning('สามารถเพิ่มสินค้าได้สูงสุด 10 รายการ')
  }
}

const canEditProducts = computed(() => {
  return canEditField('products', currentStatusString.value as SellingStatusString)
})

const deliveryStatusLabel = computed(() => {
  if (!props.currentData.deliveryStatus) return '-'
  const map: Record<string, string> = {
    received: 'ได้รับสินค้าแล้ว',
    preparing: 'แพ็ครอจัดส่ง',
    shipping: 'กำลังจัดส่ง',
  }
  return map[props.currentData.deliveryStatus] || props.currentData.deliveryStatus
})
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '99vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
    class="status-manager-dialog"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3 w-full">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-arrow-right-arrow-left text-white text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-800">เปลี่ยนสถานะการขาย</h3>
            <p class="text-sm text-gray-600">
              รายการ: <span class="font-semibold">{{ orderNumber }}</span>
            </p>
          </div>
        </div>
        <Tag :value="currentStatusInfo?.label" :severity="currentStatusInfo?.color" size="small" />
      </div>
    </template>

    <div class="space-y-4">
      <StatusStepper :current-status="currentStatusString" />

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon="pi pi-user"
          label="ลูกค้า"
          :value="selectedMemberDetails?.name || selectedMemberDetails?.displayName || '-'"
          :description="selectedMemberDetails?.phone || '-'"
          variant="info"
        />
        <SummaryCard
          icon="pi pi-box"
          label="สินค้า"
          :value="`${saleForm.products.length} รายการ`"
          :description="`หมวดหมู่ ${currentStatusInfo?.label || '-'}`"
          variant="primary"
        />
        <SummaryCard
          icon="pi pi-wallet"
          label="ยอดรวม"
          :value="formatCurrency(totalAmount || 0)"
          :description="`เงินมัดจำ ${formatCurrency(saleForm.deposit || 0)}`"
          variant="success"
        />
        <SummaryCard
          icon="pi pi-truck"
          label="สถานะขนส่ง"
          :value="deliveryStatusLabel"
          :description="currentData.delivery || 'ยังไม่ระบุ'"
          variant="warning"
        />
      </div>

      <TabView>
        <!-- แทปแก้ไข/ปรับสถานะ -->
        <TabPanel v-if="showEditTab" value="edit" header="แก้ไข/ปรับสถานะ">
          <div class="space-y-4 pt-4">
            <!-- ข้อมูลลูกค้า & รายการสินค้า -->
            <div v-if="showProductsInEditTab" class="space-y-4">
              <!-- Summary View -->
              <div
                v-if="showSummaryProducts"
                class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <div class="text-sm text-gray-600 mb-1">จำนวนรายการ</div>
                    <div class="text-lg font-medium text-gray-900">
                      {{ saleForm.products.length + (currentData.customProducts?.length || 0) }}
                      รายการ
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-600 mb-1">ยอดรวมสินค้า</div>
                    <div class="text-lg font-medium text-gray-900">
                      {{ formatCurrency(totalAmount || 0) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed View -->
              <div v-if="showDetailedProducts">
                <div
                  v-if="
                    showCustomProducts &&
                    currentData.customProducts &&
                    currentData.customProducts.length > 0
                  "
                  class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <h4 class="text-base font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <i class="pi pi-shopping-cart text-orange-600"></i>
                    สินค้านอกเหนือรายการ
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-for="(product, index) in currentData.customProducts"
                      :key="index"
                      class="p-3 bg-gray-50 rounded-lg space-y-3"
                    >
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label class="text-sm font-medium text-gray-700 mb-1 block"
                            >ชื่อสินค้า</label
                          >
                          <InputText
                            :model-value="product.name"
                            fluid
                            size="small"
                            disabled
                            class="opacity-60"
                          />
                        </div>
                        <div>
                          <label class="text-sm font-medium text-gray-700 mb-1 block">จำนวน</label>
                          <InputNumber
                            :model-value="product.quantity"
                            :min="1"
                            fluid
                            size="small"
                            disabled
                            class="opacity-60"
                          />
                        </div>
                      </div>
                      <div>
                        <label class="text-sm font-medium text-gray-700 mb-1 block"
                          >รายละเอียด</label
                        >
                        <Textarea
                          :model-value="product.description"
                          rows="3"
                          fluid
                          size="small"
                          disabled
                          class="opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="showProductSelection"
                  class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-medium text-gray-800 flex items-center gap-2">
                      <i class="pi pi-box text-blue-600"></i>
                      รายการสินค้า
                    </h4>
                    <Button
                      v-if="canEditProducts"
                      label="เพิ่มสินค้า"
                      icon="pi pi-plus"
                      severity="success"
                      size="small"
                      @click="addProduct"
                      :disabled="saleForm.products.length >= 10"
                    />
                  </div>

                  <div class="space-y-4">
                    <ProductItemForm
                      v-for="(product, index) in saleForm.products"
                      :key="index"
                      :product="product"
                      :index="index"
                      :is-submitting="isSubmitting"
                      :products-data="productsData"
                      :can-remove="false"
                      :is-read-only="true"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- การชำระเงิน & ข้อมูลเพิ่มเติม -->
            <div class="space-y-4">
              <!-- Summary View -->
              <div
                v-if="showSummaryPayment"
                class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
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
                      {{
                        salesStore.paymentMethods.find(
                          (pm) => pm.value === props.currentData.paymentMethod
                        )?.label || '-'
                      }}
                    </div>
                  </div>
                  <div v-if="currentData.bankCode">
                    <div class="text-sm text-gray-600 mb-1">ธนาคาร</div>
                    <div class="text-lg font-medium text-gray-900">
                      {{ currentData.bankCode || '-' }}
                    </div>
                  </div>
                  <div v-if="saleForm.deposit > 0">
                    <div class="text-sm text-gray-600 mb-1">เงินมัดจำ</div>
                    <div class="text-lg font-medium text-gray-900">
                      {{ formatCurrency(saleForm.deposit || 0) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed View -->
              <div v-if="showDetailedPayment">
                <PaymentCalculationSection
                  :total-amount="totalAmount"
                  :deposit="saleForm.deposit"
                  :discount="saleForm.discount"
                  :delivery-no="saleForm.deliveryNo"
                  :is-submitting="isSubmitting"
                  :read-only="readOnly"
                  @update:deposit="updateDeposit"
                  @update:discount="updateDiscount"
                  @update:delivery-no="updateDeliveryNo"
                />

                <div
                  v-if="showAdditionalInfo"
                  class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div class="flex items-center gap-2 mb-4">
                    <i class="pi pi-info-circle text-blue-600"></i>
                    <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลเพิ่มเติม</h4>
                  </div>

                  <div v-if="showPaymentDueDate && currentData.paymentDueDate" class="mt-4">
                    <label class="text-sm font-medium text-gray-700 mb-1 block"
                      >กำหนดวันชำระเงิน</label
                    >
                    <DatePicker
                      :model-value="new Date(currentData.paymentDueDate)"
                      dateFormat="dd/mm/yy"
                      showIcon
                      iconDisplay="input"
                      fluid
                      size="small"
                      disabled
                      class="opacity-60"
                    />
                  </div>

                  <div v-if="showDeliveryStatus && currentData.deliveryStatus" class="mt-4">
                    <label class="text-sm font-medium text-gray-700 mb-1 block">สถานะการส่ง</label>
                    <Select
                      :model-value="currentData.deliveryStatus"
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

                  <div v-if="showBankInfoInEditTab && showBankSelection" class="mt-4">
                    <BankSelectionSection
                      :selected-bank-code="saleForm.bankCode || currentData.bankCode || ''"
                      :is-submitting="isSubmitting"
                      :is-current-bank="currentData.bankCode"
                      :is-current-status="currentStatusString"
                      :is-read-only="false"
                    />
                  </div>

                  <div
                    v-if="showShippingAddressInEditTab && showShippingAddress"
                    class="mt-4 space-y-2"
                  >
                    <label class="text-sm font-medium text-gray-700">ที่อยู่จัดส่ง</label>
                    <Textarea
                      :value="
                        `${currentData.shippingAddress || ''}, ${
                          findProvinceData(currentData.shippingProvince || '')?.label || ''
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

            <!-- เอกสาร & การจัดส่ง -->
            <div v-if="showSlipUploadInEditTab || showShippingSlipInEditTab" class="space-y-4">
              <!-- Summary View -->
              <div v-if="showSummaryDocuments" class="space-y-4">
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <i class="pi pi-file text-blue-600 text-xs"></i>
                    เอกสารการชำระเงินและการจัดส่ง
                  </h4>
                  <div class="flex flex-wrap gap-4">
                    <!-- Slip Summary -->
                    <div v-if="hasSlip" class="space-y-2">
                      <div class="text-xs font-medium text-gray-700">สลิปการโอนเงิน</div>
                      <div class="relative">
                        <PrimeImage
                          :src="slipUrl"
                          :alt="'สลิปการโอนเงิน'"
                          :preview="true"
                          class="max-w-[120px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </div>
                    </div>
                    <div v-else class="space-y-2">
                      <div class="text-xs font-medium text-gray-700">สลิปการโอนเงิน</div>
                      <div class="text-xs text-gray-500 italic">ไม่มีสลิป</div>
                    </div>

                    <!-- Shipping Slip Summary -->
                    <div v-if="hasShippingSlip" class="space-y-2">
                      <div class="text-xs font-medium text-gray-700">ใบเสร็จการขนส่ง</div>
                      <div class="relative">
                        <PrimeImage
                          :src="shippingSlipUrl"
                          :alt="'ใบเสร็จการขนส่ง'"
                          :preview="true"
                          class="max-w-[120px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </div>
                    </div>
                    <div v-else class="space-y-2">
                      <div class="text-xs font-medium text-gray-700">ใบเสร็จการขนส่ง</div>
                      <div class="text-xs text-gray-500 italic">ไม่มีใบเสร็จ</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed View -->
              <div v-if="showDetailedDocuments">
                <div
                  v-if="currentStatus === 'preparing' || currentStatusString === 'preparing'"
                  class="mb-4"
                >
                  <div
                    class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200"
                  >
                    <div class="flex items-start gap-3">
                      <div
                        class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0"
                      >
                        <i class="pi pi-check-circle text-white text-lg"></i>
                      </div>
                      <div class="flex-1">
                        <h4 class="font-medium text-green-900 mb-1">สลิปการโอนเงินยืนยันแล้ว</h4>
                        <p class="text-sm text-green-700">
                          กรุณาอัปโหลดใบเสร็จการขนส่งเพื่อดำเนินการจัดส่งสินค้า
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <SlipUploadSection
                    v-if="showSlipUploadInEditTab && showSlipUpload"
                    :sale-id="currentData._id || ''"
                    :selected-status="currentStatusString"
                    :is-current-status="currentStatusString"
                    :is-submitting="isSubmitting"
                    @slip-status-changed="handleSlipStatusChanged"
                    @slip-pending-upload="handleSlipPendingUpload"
                    @slip-uploaded="handleSlipUploaded"
                  />

                  <ShippingSlipUploadSection
                    v-if="showShippingSlipInEditTab && showShippingSlipUpload"
                    :sale-id="currentData._id || ''"
                    :selected-status="currentStatusString"
                    :is-current-status="currentStatusString"
                    :is-submitting="isSubmitting"
                    :skip-upload="skipShippingSlipUpload"
                    :require-upload="requireShippingSlipUpload"
                    :delivery="saleForm.delivery"
                    :is-read-only="
                      currentStatusString === 'received' || currentStatusString === 'damaged'
                    "
                    @shipping-slip-status-changed="handleShippingSlipStatusChanged"
                    @shipping-slip-pending-upload="handleShippingSlipPendingUpload"
                    @shipping-slip-uploaded="handleShippingSlipUploaded"
                    @skip-upload-changed="handleSkipShippingSlipUploadChanged"
                    @require-upload-changed="handleRequireShippingSlipUploadChanged"
                    @delivery-changed="handleDeliveryChanged"
                  />
                </div>
              </div>
            </div>

            <!-- จบการขาย & หมายเหตุ -->
            <div v-if="showCompleteSaleInEditTab" class="space-y-4">
              <div
                v-if="
                  (typeof saleForm.sellingStatus === 'number'
                    ? convertStatusNumberToString(saleForm.sellingStatus)
                    : saleForm.sellingStatus) === 'shipping' || currentStatus === 'shipping'
                "
                class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                <div
                  class="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200"
                >
                  <h4 class="font-medium text-gray-900 flex items-center gap-2">
                    <i class="pi pi-send text-purple-600"></i>
                    จบการขาย
                  </h4>
                </div>
                <div class="p-4 space-y-3">
                  <div
                    v-for="option in [
                      {
                        value: 'received',
                        label: 'ได้รับสินค้าแล้ว',
                        icon: 'pi-check-circle',
                        color: 'success',
                        description: 'ลูกค้าได้รับสินค้าเรียบร้อยแล้ว',
                      },
                      {
                        value: 'damaged',
                        label: 'สินค้าเสียหาย',
                        icon: 'pi-times-circle',
                        color: 'danger',
                        description: 'สินค้าเสียหายระหว่างการขนส่ง',
                      },
                    ]"
                    :key="option.value"
                    :class="`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      finalSaleStatus === option.value
                        ? option.color === 'success'
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-red-500 bg-red-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`"
                    @click="finalSaleStatus = option.value === 'received' ? 'received' : 'damaged'"
                  >
                    <div class="flex items-center gap-4">
                      <div
                        :class="`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                          option.color === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`"
                      >
                        <i
                          :class="`pi ${option.icon} text-xl ${
                            option.color === 'success' ? 'text-green-600' : 'text-red-600'
                          }`"
                        ></i>
                      </div>
                      <div class="flex-1">
                        <div class="font-semibold text-gray-900 text-lg">{{ option.label }}</div>
                        <div class="text-sm text-gray-600 mt-0.5">{{ option.description }}</div>
                      </div>
                      <div
                        v-if="finalSaleStatus === option.value"
                        :class="`w-8 h-8 rounded-full flex items-center justify-center ${
                          option.color === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`"
                      >
                        <i class="pi pi-check text-white text-sm"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div
                  class="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200"
                >
                  <h4 class="font-medium text-gray-900 flex items-center gap-2">
                    <i class="pi pi-file-edit text-gray-600"></i>
                    หมายเหตุ
                  </h4>
                </div>
                <div class="p-4">
                  <Textarea
                    :model-value="saleForm.note || currentData.note || ''"
                    placeholder="ไม่มีหมายเหตุ"
                    rows="3"
                    fluid
                    size="small"
                    disabled
                    class="opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- แทปประวัติการอัพเดทสถานะ -->
        <TabPanel value="history" header="ประวัติการอัพเดท">
          <div class="space-y-4 pt-4">
            <!-- สินค้า -->
            <div
              v-if="currentData.products && currentData.products.length > 0"
              class="bg-white border border-gray-200 rounded-lg p-4"
            >
              <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <i class="pi pi-box text-blue-600 text-xs"></i>
                สินค้าที่เพิ่มแล้ว
              </h4>
              <div class="space-y-3">
                <div
                  v-for="(product, index) in currentData.products"
                  :key="index"
                  class="p-3 bg-gray-50 rounded-lg"
                >
                  <div class="text-sm font-medium text-gray-900">
                    {{ product.name || `สินค้า ${index + 1}` }}
                  </div>
                  <div class="text-xs text-gray-600 mt-1">
                    จำนวน: {{ product.quantity }} {{ product.unit || 'ชิ้น' }} | ราคา:
                    {{ formatCurrency(product.price || 0) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- สินค้านอกเหนือรายการ -->
            <div
              v-if="currentData.customProducts && currentData.customProducts.length > 0"
              class="bg-white border border-gray-200 rounded-lg p-4"
            >
              <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <i class="pi pi-shopping-cart text-orange-600 text-xs"></i>
                สินค้านอกเหนือรายการ
              </h4>
              <div class="space-y-3">
                <div
                  v-for="(product, index) in currentData.customProducts"
                  :key="index"
                  class="p-3 bg-gray-50 rounded-lg"
                >
                  <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                  <div class="text-xs text-gray-600 mt-1">จำนวน: {{ product.quantity }} ชิ้น</div>
                  <div v-if="product.description" class="text-xs text-gray-500 mt-1">
                    {{ product.description }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ที่อยู่จัดส่ง -->
            <div
              v-if="currentData.shippingAddress || currentData.shippingProvince"
              class="bg-white border border-gray-200 rounded-lg p-4"
            >
              <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <i class="pi pi-map-marker text-green-600 text-xs"></i>
                ที่อยู่จัดส่ง
              </h4>
              <div class="text-sm text-gray-700">
                {{ currentData.shippingAddress }}
                <span v-if="currentData.shippingProvince">
                  , {{ findProvinceData(currentData.shippingProvince)?.label }}
                </span>
              </div>
            </div>

            <!-- ข้อมูลธนาคาร -->
            <div v-if="currentData.bankCode" class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <i class="pi pi-building text-purple-600 text-xs"></i>
                ข้อมูลธนาคาร
              </h4>
              <div class="space-y-2">
                <div class="text-sm text-gray-700">
                  <span class="font-medium">ธนาคาร:</span> {{ currentData.bankCode }}
                </div>
                <div v-if="currentData.bankAccount" class="text-sm text-gray-700">
                  <span class="font-medium">เลขบัญชี:</span> {{ currentData.bankAccount }}
                </div>
              </div>
            </div>

            <!-- สลิปการโอนเงิน -->
            <div v-if="hasSlip" class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <i class="pi pi-file text-blue-600 text-xs"></i>
                สลิปการโอนเงิน
              </h4>
              <div class="relative">
                <PrimeImage
                  :src="slipUrl"
                  :alt="'สลิปการโอนเงิน'"
                  :preview="true"
                  class="max-w-[120px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                />
              </div>
            </div>

            <!-- ใบเสร็จการขนส่ง -->
            <div v-if="hasShippingSlip" class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <i class="pi pi-truck text-orange-600 text-xs"></i>
                ใบเสร็จการขนส่ง
              </h4>
              <div class="relative">
                <PrimeImage
                  :src="shippingSlipUrl"
                  :alt="'ใบเสร็จการขนส่ง'"
                  :preview="true"
                  class="max-w-[120px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                />
              </div>
            </div>

            <!-- ข้อความเมื่อไม่มีข้อมูล -->
            <div
              v-if="
                (!currentData.products || currentData.products.length === 0) &&
                (!currentData.customProducts || currentData.customProducts.length === 0) &&
                !currentData.shippingAddress &&
                !currentData.bankCode &&
                !hasSlip &&
                !hasShippingSlip
              "
              class="bg-white border border-gray-200 rounded-lg p-4 text-center"
            >
              <div class="text-sm text-gray-500 italic">ยังไม่มีข้อมูลประวัติการอัพเดท</div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>

    <template #footer>
      <div class="flex gap-3 ml-auto">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
          outlined
        />

        <Button
          v-if="currentStatus !== 'received' && currentStatus !== 'damaged'"
          label="เปลี่ยนสถานะ"
          icon="pi pi-check"
          severity="success"
          @click="handleSubmit"
          size="small"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          class="font-semibold shadow-md"
        />
      </div>
    </template>
  </Dialog>
</template>
