<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { Dialog, Button, Tag, TabView, TabPanel } from 'primevue'
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
import StatusStepper from './StatusStepper.vue'
import SummaryCard from '../sections/SummaryCard.vue'
import ProductEditSection from '../sections/ProductEditSection.vue'
import CustomProductsSection from '../sections/CustomProductsSection.vue'
import PaymentInfoSection from '../sections/PaymentInfoSection.vue'
import DocumentSection from '../sections/DocumentSection.vue'
import CompleteSaleSection from './CompleteSaleSection.vue'
import HistoryTabContent from '../sections/HistoryTabContent.vue'
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
import { useMemberStatusUpdate } from '@/composables/useMemberStatusUpdate'
import { useSlipManagement } from '@/composables/useSlipManagement'
import { useProductManagement } from '@/composables/useProductManagement'
import { useFormFieldUpdates } from '@/composables/useFormFieldUpdates'
import { useSalesVisibility } from '@/composables/useSalesVisibility'
import { useStatusHelpers } from '@/composables/useStatusHelpers'
import {
  validateStatusForStatusChange,
  canEditField,
  getAvailableStatuses,
} from '@/utils/salesStatusValidation'
import BankData from '@/config/BankData'
import dayjs from 'dayjs'

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
const isSubmitting = ref(false)
const finalSaleStatus = ref<'received' | 'damaged' | null>(null)
const customProducts = ref<Array<{ name: string; quantity: number; description: string }>>([])

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

// Use composable for member status update
const memberStatusUpdate = useMemberStatusUpdate()

// Use status helpers
const { getStatusStepIndex, currentStatusString } = useStatusHelpers({
  sellingStatus: computed(() => props.currentData.sellingStatus),
  currentStatus: props.currentStatus,
})

const currentStatusInfo = computed(() => {
  return salesStore.statusWorkflow[currentStatusString.value as keyof StatusWorkflow]
})

// Selected member details
const selectedMemberDetails = computed(() => {
  if (!saleForm.value.user || !members.value) return null
  return members.value.find((m) => m._id === saleForm.value.user)
})

// Use product management
const productManagement = useProductManagement({
  products: computed(() => saleForm.value.products || []),
  productsData,
  foodSales,
  categories,
  customProducts,
  maxProducts: 10,
  minProducts: 1,
})

// Provide composable to child components
provide(Symbol.for('productSelection'), productManagement.productSelection)

// Use sales visibility
const visibility = useSalesVisibility({
  paymentMethod: computed(() => props.currentData.paymentMethod as string | undefined),
  deliveryStatus: computed(() => props.currentData.deliveryStatus as string | undefined),
  currentStatusString: computed(() => currentStatusString.value),
  products: computed(() => saleForm.value.products || []),
  getStatusStepIndex,
})

// Watch totalAmount and update ref
const totalAmount = ref(0)
watch(
  () => productManagement.totalAmount.value,
  (newAmount) => {
    totalAmount.value = newAmount
  },
  { immediate: true }
)

// Watch products and productsData to recalculate totalAmount when modal opens
watch(
  [() => saleForm.value.products, productsData],
  () => {
    if (props.visible && saleForm.value.products && saleForm.value.products.length > 0) {
      // Force recalculation by accessing the computed value
      // Use nextTick to ensure all reactive updates are complete
      setTimeout(() => {
        totalAmount.value = productManagement.totalAmount.value
      }, 0)
    }
  },
  { immediate: true, deep: true }
)

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
  // แสดงรายละเอียดเต็มรูปแบบสำหรับ wait_payment เท่านั้น
  // preparing (แพ็ครอจัดส่ง) ไม่ต้องแสดง เพราะมีสินค้าแล้ว
  return status === 'wait_payment'
})

const showSummaryPayment = computed(() => {
  const status = currentStatusString.value
  const paymentMethod = props.currentData.paymentMethod

  // ถ้าชำระด้วยเครดิต ไม่แสดง summary (เพราะไม่มีธนาคารและสลิป)
  if (paymentMethod === 'credit') {
    return false
  }

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

// Mutation (from ModalEditSale) - ต้องประกาศก่อน slipManagement
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

// Use slip management
const slipManagement = useSlipManagement({
  saleId: props.currentData._id || '',
  currentStatusString: computed(() => currentStatusString.value),
  onStatusUpdate: (payload: IUpdateSalesPayload) => {
    updateSalesStatus(payload)
  },
})

// Computed properties for slip URLs
const slipUrl = computed(() => {
  if (!props.currentData._id || !slipManagement.hasSlip.value) return ''
  return getSlipUrl(props.currentData._id)
})

const shippingSlipUrl = computed(() => {
  if (!props.currentData._id || !slipManagement.hasShippingSlip.value) return ''
  return getShippingSlipUrl(props.currentData._id, 'jpg')
})

// Use form field updates
const formFieldUpdates = useFormFieldUpdates({
  saleForm,
  selectedMemberDetails: computed(() => selectedMemberDetails.value || null),
})

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
  // Don't reset totalAmount here, let it be recalculated from products
  isSubmitting.value = false
  finalSaleStatus.value = null
  slipManagement.resetSlipStates()
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
      // Recalculate totalAmount after form is reset and products are loaded
      // Use nextTick to ensure products are loaded
      setTimeout(() => {
        if (saleForm.value.products && saleForm.value.products.length > 0) {
          totalAmount.value = productManagement.totalAmount.value
        }
      }, 100)
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
      // Recalculate totalAmount after form is reset
      setTimeout(() => {
        if (saleForm.value.products && saleForm.value.products.length > 0) {
          totalAmount.value = productManagement.totalAmount.value
        }
      }, 100)
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
        slipManagement.hasSlip.value = true
      }
      img.onerror = () => {
        slipManagement.hasSlip.value = false
      }
      img.src = slipUrl

      // Check shipping slip exists
      const shippingSlipUrl = `${
        (import.meta as any).env.VITE_API_URL
      }/erp/download/shipping-slip?saleId=${newId}`
      const shippingImg = new Image()
      shippingImg.onload = () => {
        slipManagement.hasShippingSlip.value = true
      }
      shippingImg.onerror = () => {
        slipManagement.hasShippingSlip.value = false
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
  let selectedStatusString =
    typeof saleForm.value.sellingStatus === 'number'
      ? convertStatusNumberToString(saleForm.value.sellingStatus)
      : (saleForm.value.sellingStatus as string) || currentStatusStr

  // ตรวจสอบว่าถ้า selectedStatus เท่ากับ currentStatus ให้ใช้สถานะถัดไปที่ถูกต้อง
  if (selectedStatusString === currentStatusStr) {
    const availableStatuses = getAvailableStatuses(
      currentStatusStr as SellingStatusString,
      'status-change'
    )
    if (availableStatuses.length > 0) {
      // ใช้สถานะถัดไปที่ถูกต้องตาม workflow
      selectedStatusString = availableStatuses[0]
    } else {
      // ไม่มีสถานะถัดไป ให้แสดง error
      toast.error('ไม่สามารถเปลี่ยนสถานะได้ เนื่องจากสถานะปัจจุบันไม่สามารถเปลี่ยนได้')
      isSubmitting.value = false
      return
    }
  }

  // Check if all products are valid
  const hasValidProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false

  // Use utility function for status validation
  const validationResult = validateStatusForStatusChange({
    selectedStatus: selectedStatusString as SellingStatusString,
    hasProducts: hasValidProducts,
    hasBankInfo: !!saleForm.value.bankCode,
    hasSlip: slipManagement.hasSlip.value,
    hasShippingSlip: slipManagement.hasShippingSlip.value,
    currentStatus: currentStatusStr as SellingStatusString,
    mode: 'status-change',
    skipShippingSlipUpload: slipManagement.skipShippingSlipUpload.value,
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
  if (slipManagement.hasPendingSlipUpload.value) {
    toast.error('กรุณากด ยืนยันการอัปโหลด')
    isSubmitting.value = false
    return
  }

  if (slipManagement.hasPendingShippingSlipUpload.value) {
    toast.error('กรุณากด ยืนยันการอัปโหลด')
    isSubmitting.value = false
    return
  }

  // ตรวจสอบ shipping slip validation
  if (
    slipManagement.requireShippingSlipUpload.value &&
    !slipManagement.skipShippingSlipUpload.value &&
    !slipManagement.hasShippingSlip.value &&
    currentStatusStr === 'preparing'
  ) {
    toast.error('กรุณาอัพโหลดสลิปการจัดส่งหรือเลือกข้ามการอัพโหลด')
    isSubmitting.value = false
    return
  }

  // หลังจาก validation (หลังบรรทัด 556)
  // ตรวจสอบว่าถ้าจะจบการขาย (เปลี่ยนจาก shipping เป็น received/damaged) ต้องเลือกสถานะจบการขายก่อน
  if (currentStatusStr === 'shipping') {
    const willCompleteSale =
      selectedStatusString === 'received' ||
      selectedStatusString === 'damaged' ||
      (selectedStatusString === 'shipping' &&
        getAvailableStatuses('shipping' as SellingStatusString, 'status-change').includes(
          'received'
        ))

    if (willCompleteSale && !finalSaleStatus.value) {
      toast.error('กรุณาเลือกสถานะจบการขาย (ได้รับสินค้าแล้ว หรือ สินค้าเสียหาย)')
      isSubmitting.value = false
      return
    }
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
  if (
    currentStatusStr === 'preparing' &&
    (slipManagement.hasShippingSlip.value || slipManagement.skipShippingSlipUpload.value)
  ) {
    finalStatus = SellingStatus.shipping
  }

  // ถ้า currentStatus เป็น shipping → ยังคงเป็น shipping (ไม่เปลี่ยน)
  // แต่ถ้ามี finalSaleStatus ให้ใช้ finalSaleStatus แทน
  if (currentStatusStr === 'shipping') {
    // ตรวจสอบว่าถ้าจะเปลี่ยนสถานะ (selectedStatusString เป็น received/damaged) ต้องมี finalSaleStatus
    const willChangeStatus =
      selectedStatusString === 'received' ||
      selectedStatusString === 'damaged' ||
      (selectedStatusString === 'shipping' &&
        getAvailableStatuses('shipping' as SellingStatusString, 'status-change').length > 0)

    if (willChangeStatus && !finalSaleStatus.value) {
      toast.error('กรุณาเลือกสถานะจบการขาย (ได้รับสินค้าแล้ว หรือ สินค้าเสียหาย)')
      isSubmitting.value = false
      return
    }

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

const readOnly = computed(() => {
  return (
    currentStatusString.value === 'preparing' ||
    currentStatusString.value === 'received' ||
    currentStatusString.value === 'shipping' ||
    currentStatusString.value === 'damaged'
  )
})

const canEditProducts = computed(() => {
  return canEditField('products', currentStatusString.value as SellingStatusString)
})

const paymentMethodLabel = computed(() => {
  if (!props.currentData.paymentMethod) return '-'
  const method = salesStore.paymentMethods.find((m) => m.value === props.currentData.paymentMethod)
  return method?.label || props.currentData.paymentMethod
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
            <i class="pi pi-arrow-right-arrow-left text-white text-base"></i>
          </div>
          <div>
            <h3 class="text-base font-medium text-gray-800">เปลี่ยนสถานะการขาย</h3>
            <p class="text-sm text-gray-600">
              รายการ: <span class="font-semibold">{{ orderNumber }}</span>
            </p>
          </div>
        </div>
        <Tag :value="currentStatusInfo?.label" :severity="currentStatusInfo?.color" size="small" />
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <StatusStepper :current-status="currentStatusString" />

      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <SummaryCard
          icon="pi pi-user"
          label="ลูกค้า"
          :value="selectedMemberDetails?.name || selectedMemberDetails?.displayName || '-'"
          variant="info"
        />
        <SummaryCard
          icon="pi pi-box"
          label="สินค้า"
          :value="`${saleForm.products.length} รายการ`"
          variant="primary"
        />
        <SummaryCard
          icon="pi pi-wallet"
          label="ยอดรวม"
          :value="formatCurrency(totalAmount || 0)"
          variant="success"
        />
        <SummaryCard
          icon="pi pi-credit-card"
          label="วิธีชำระเงิน"
          :value="paymentMethodLabel"
          variant="warning"
        />
      </div>

      <TabView :pt="{ root: 'px-0', nav: 'px-0', panelContainer: 'px-0' }">
        <!-- แทปแก้ไข/ปรับสถานะ -->
        <TabPanel
          v-if="showEditTab"
          value="edit"
          header="แก้ไข/ปรับสถานะ"
          :pt="{ root: 'px-0', content: 'px-0' }"
        >
          <div class="flex flex-col gap-4">
            <!-- ข้อมูลลูกค้า & รายการสินค้า -->
            <div v-if="showProductsInEditTab" class="flex flex-col gap-4">
              <!-- Summary View -->
              <div
                v-if="showSummaryProducts"
                class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <div class="text-xs text-gray-600 mb-1">จำนวนรายการ</div>
                    <div class="text-base font-medium text-gray-900">
                      {{ saleForm.products.length + (currentData.customProducts?.length || 0) }}
                      รายการ
                    </div>
                  </div>
                  <div>
                    <div class="text-xs text-gray-600 mb-1">ยอดรวมสินค้า</div>
                    <div class="text-base font-medium text-gray-900">
                      {{ formatCurrency(totalAmount || 0) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed View -->
              <div v-if="showDetailedProducts">
                <CustomProductsSection
                  :custom-products="currentData.customProducts"
                  :show-custom-products="visibility.showCustomProducts.value"
                />

                <ProductEditSection
                  :products="saleForm.products"
                  :products-data="productsData"
                  :can-edit="canEditProducts"
                  :is-submitting="isSubmitting"
                  @add-product="productManagement.addProduct"
                  @remove-product="productManagement.removeProduct"
                  @update-product="productManagement.updateProductForIndex"
                  @update-quantity="(idx, qty) => (saleForm.products[idx].quantity = qty)"
                />
              </div>
            </div>

            <!-- การชำระเงิน & ข้อมูลเพิ่มเติม -->
            <!-- แสดงเฉพาะเมื่อยังอยู่ใน step ที่ต้องเลือกสินค้า (order, wait_payment) -->
            <!-- preparing (แพ็ครอจัดส่ง) ไม่แสดง เพราะมีสินค้าแล้ว -->
            <PaymentInfoSection
              v-if="
                (showDetailedPayment || showSummaryPayment) && currentStatusString !== 'preparing'
              "
              :total-amount="totalAmount"
              :deposit="saleForm.deposit"
              :discount="saleForm.discount"
              :delivery-no="saleForm.deliveryNo"
              :payment-method="props.currentData.paymentMethod || ''"
              :bank-code="currentData.bankCode"
              :bank-account="currentData.bankAccount"
              :payment-due-date="currentData.paymentDueDate"
              :delivery-status="currentData.deliveryStatus"
              :shipping-address="currentData.shippingAddress"
              :shipping-province="currentData.shippingProvince"
              :show-summary="showSummaryPayment"
              :show-detailed="showDetailedPayment"
              :show-additional-info="visibility.showAdditionalInfo.value"
              :show-payment-due-date="visibility.showPaymentDueDate.value"
              :show-delivery-status="visibility.showDeliveryStatus.value"
              :show-bank-info="showBankInfoInEditTab && visibility.showBankSelection.value"
              :show-shipping-address="
                showShippingAddressInEditTab && visibility.showShippingAddress.value
              "
              :read-only="readOnly"
              :is-submitting="isSubmitting"
              :current-status-string="currentStatusString"
              @update:deposit="formFieldUpdates.updateDeposit"
              @update:discount="formFieldUpdates.updateDiscount"
              @update:delivery-no="formFieldUpdates.updateDeliveryNo"
            />

            <!-- เอกสาร & การจัดส่ง -->
            <DocumentSection
              :has-slip="slipManagement.hasSlip.value"
              :has-shipping-slip="slipManagement.hasShippingSlip.value"
              :slip-url="slipUrl"
              :shipping-slip-url="shippingSlipUrl"
              :show-summary="showSummaryDocuments"
              :show-detailed="showDetailedDocuments"
              :show-slip-upload="showSlipUploadInEditTab && visibility.showSlipUpload.value"
              :show-shipping-slip-upload="
                showShippingSlipInEditTab && visibility.showShippingSlipUpload.value
              "
              :sale-id="currentData._id || ''"
              :current-status-string="currentStatusString"
              :is-submitting="isSubmitting"
              :skip-shipping-slip-upload="slipManagement.skipShippingSlipUpload.value"
              :require-shipping-slip-upload="slipManagement.requireShippingSlipUpload.value"
              :delivery="saleForm.delivery"
              :is-read-only="
                currentStatusString === 'received' || currentStatusString === 'damaged'
              "
              :current-status="currentStatus"
              @slip-status-changed="slipManagement.handleSlipStatusChanged"
              @slip-pending-upload="slipManagement.handleSlipPendingUpload"
              @slip-uploaded="(saleId) => slipManagement.handleSlipUploaded(saleId, saleForm)"
              @shipping-slip-status-changed="slipManagement.handleShippingSlipStatusChanged"
              @shipping-slip-pending-upload="slipManagement.handleShippingSlipPendingUpload"
              @shipping-slip-uploaded="
                (saleId) => slipManagement.handleShippingSlipUploaded(saleId, saleForm)
              "
              @skip-upload-changed="slipManagement.handleSkipShippingSlipUploadChanged"
              @require-upload-changed="slipManagement.handleRequireShippingSlipUploadChanged"
              @delivery-changed="formFieldUpdates.handleDeliveryChanged"
            />

            <!-- จบการขาย & หมายเหตุ -->
            <CompleteSaleSection
              :final-sale-status="finalSaleStatus"
              :note="saleForm.note || currentData.note || ''"
              :show-complete-sale="
                showCompleteSaleInEditTab &&
                ((typeof saleForm.sellingStatus === 'number'
                  ? convertStatusNumberToString(saleForm.sellingStatus)
                  : saleForm.sellingStatus) === 'shipping' ||
                  currentStatus === 'shipping')
              "
              @update:final-sale-status="finalSaleStatus = $event"
            />
          </div>
        </TabPanel>

        <!-- แทปประวัติการอัพเดทสถานะ -->
        <TabPanel value="history" header="ประวัติการอัพเดท" :pt="{ root: 'px-0', content: 'px-0' }">
          <HistoryTabContent
            :current-data="currentData"
            :products-data="productsData"
            :has-slip="slipManagement.hasSlip.value"
            :has-shipping-slip="slipManagement.hasShippingSlip.value"
            :total-amount="totalAmount"
          />
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
