<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import {
  Dialog,
  Textarea,
  Select,
  Button,
  InputText,
  InputNumber,
  DatePicker,
  FileUpload,
} from 'primevue'
import { useMemberStore, type IMember } from '@/stores/member/member'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import { useSalesStore } from '@/stores/sales/sales'
import type {
  ISales,
  IUpdateSalesPayload,
  SellingStatusString,
  StatusWorkflow,
} from '@/types/sales'
import {
  SellingStatus,
  convertStatusNumberToString,
  convertStatusStringToNumber,
} from '@/types/sales'
import BankSelectionSection from '../BankSelectionSection.vue'
import SlipUploadSection from '../SlipUploadSection.vue'
import ShippingSlipUploadSection from '../ShippingSlipUploadSection.vue'
import ProductItemForm from '../ProductItemForm.vue'
import PaymentCalculationSection from '../PaymentCalculationSection.vue'
import type { IAdmin } from '@/stores/admin/admin'
import {
  useProductStore,
  type IProduct,
  type IUpdateProductPayload,
} from '@/stores/product/product'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { executeStockDeduction } from '@/utils/stockDeduction'
import { useProductSelection } from '@/composables/useProductSelection'
import { useMemberStatusUpdate } from '@/composables/useMemberStatusUpdate'
import {
  getAvailableStatuses,
  canEditField,
  validatePaymentMethod,
} from '@/utils/salesStatusValidation'
import { useUploadFileStore } from '@/stores/product/upload_file'
import { getShippingSlipUrl } from '@/utils/imageUrl'
import dayjs from 'dayjs'
// Props
const props = defineProps<{
  visible: boolean
  saleData: ISales
  admins: IAdmin[]
}>()

// Emits
const emit = defineEmits<{
  'close-edit-modal': []
}>()

// Stores
const memberStore = useMemberStore()
const salesStore = useSalesStore()
const uploadFileStore = useUploadFileStore()
const productStore = useProductStore()
const categoryStore = useCategoryStore()

// Form data - ใช้โครงสร้างเดียวกับ ModalAddSale
const saleForm = ref<IUpdateSalesPayload>({
  _id: '',
  payment: 'cash',
  paymentMethod: undefined,
  bankCode: '',
  bankAccount: '',
  cat: 0,
  item: '',
  sellingStatus: SellingStatus.none,
  user: '',
  products: [{ id: '', quantity: 1, category: '', price: 0 }],
  deposit: 0,
  discount: 0,
  seller: '',
  note: '',
  deliveryNo: 0,
  delivery: '',
  deliveryStatus: undefined,
  paymentDueDate: undefined,
  shippingAddress: undefined,
  shippingProvince: undefined,
  customProducts: undefined,
})

// Queries
const { data: members } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})

const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

const { data: productsData, refetch: refetchProducts } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

// Use composable for product selection
const productSelection = useProductSelection(
  productsData,
  categories,
  ref(undefined), // foodSales not used in edit mode
  computed(() => saleForm.value.products || [])
)

// Provide composable to child components
provide(Symbol.for('productSelection'), productSelection)

// Use composable for member status update
const memberStatusUpdate = useMemberStatusUpdate()

// Computed
const totalAmount = computed(() => {
  return (
    saleForm.value.products?.reduce((sum, product) => {
      if (!product.id) return 0

      const productDetail = productSelection.availableProducts.value?.find(
        (p) => p._id === product.id
      )
      if (productDetail && productDetail.price) {
        return sum + (productDetail.price || 0) * product.quantity
      }
      // ถ้าไม่มี productDetail ให้ใช้ price จาก form
      return sum + (product.price || 0) * product.quantity
    }, 0) || 0
  )
})

const selectedMemberDetails = computed(() => {
  if (!saleForm.value.user || !members.value) return null
  return members.value.find((m) => m._id === saleForm.value.user)
})

// Status step checking
const getStatusStepIndex = (status: SellingStatus | number | string) => {
  const statusString =
    typeof status === 'number'
      ? convertStatusNumberToString(status)
      : typeof status === 'string'
      ? status
      : convertStatusNumberToString(status)
  return salesStore.sellingStatusOptions.findIndex((option) => option.value === statusString)
}

// Note: requiresBankSelection removed - using showBankSelection instead

const requiresSlipUpload = computed(() => {
  // ใช้ currentStatusString จาก props.saleData แทน saleForm.value.sellingStatus
  const statusStr = currentStatusString.value
  const currentStepIndex = getStatusStepIndex(statusStr)
  const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
  // แสดงเมื่อ status >= wait_payment (รวม wait_payment ด้วย)
  return currentStepIndex >= waitPaymentStepIndex
})

// Computed สำหรับแสดง SlipUploadSection
const showSlipUpload = computed(() => {
  const pm = saleForm.value.paymentMethod
  const statusStr = currentStatusString.value

  // สำหรับ cash: ซ่อนเมื่อ deliveryStatus = preparing
  if (pm === 'cash' && saleForm.value.deliveryStatus === 'preparing') {
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

  // สำหรับ transfer/card: แสดงเมื่อ showBankSelection หรือ requiresSlipUpload
  return showBankSelection.value || requiresSlipUpload.value
})

// Disable selecting steps that are earlier than current persisted status
const statusOptionsForSelect = computed(() => {
  const currentStatusString =
    typeof props.saleData.sellingStatus === 'number'
      ? convertStatusNumberToString(props.saleData.sellingStatus)
      : props.saleData.sellingStatus
  const availableStatuses = getAvailableStatuses(currentStatusString as SellingStatusString, 'edit')
  return salesStore.sellingStatusOptions.map((opt) => ({
    ...opt,
    disabled: !availableStatuses.includes(opt.value as SellingStatusString),
  }))
})

// Check if can edit fields based on current status
const currentStatusString = computed(() => {
  return typeof props.saleData.sellingStatus === 'number'
    ? convertStatusNumberToString(props.saleData.sellingStatus)
    : props.saleData.sellingStatus
})

const canEditProducts = computed(() => {
  return canEditField('products', currentStatusString.value as SellingStatusString)
})

const canEditBankInfo = computed(() => {
  return canEditField('bankInfo', currentStatusString.value as SellingStatusString)
})

const canEditSlip = computed(() => {
  return canEditField('slip', currentStatusString.value as SellingStatusString)
})

const canEditShippingSlip = computed(() => {
  return canEditField('shippingSlip', currentStatusString.value as SellingStatusString)
})

// Computed สำหรับการแสดงผลตาม payment method
const showProductSelection = computed(() => {
  // แสดงเมื่อ paymentMethod ไม่ใช่ 'order' หรือเมื่อ paymentMethod === 'order' (ให้แสดงได้ทั้งสองแบบ)
  return true // แสดงได้เสมอ แต่จะควบคุมด้วยเงื่อนไขอื่น
})

const showCustomProducts = computed(() => {
  // แสดงเฉพาะเมื่อ paymentMethod === 'order' และไม่มีสินค้าปกติ
  const hasProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false
  return saleForm.value.paymentMethod === 'order' && !hasProducts
})

const showDeliveryStatus = computed(() => {
  return saleForm.value.paymentMethod === 'cash'
})

const showPaymentDueDate = computed(() => {
  return saleForm.value.paymentMethod === 'credit'
})

const showBankSelection = computed(() => {
  const pm = saleForm.value.paymentMethod
  // สำหรับ order: แสดงเมื่อมีสินค้า
  if (pm === 'order') {
    const hasProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false
    return hasProducts
  }
  // สำหรับ transfer/card: แสดงเสมอ
  return pm === 'transfer' || pm === 'card'
})

const showShippingAddress = computed(() => {
  const pm = saleForm.value.paymentMethod
  if (pm === 'cash') {
    // เงินสด: แสดงถ้าเลือก "แพ็ครอจัดส่ง"
    return saleForm.value.deliveryStatus === 'preparing'
  }
  if (pm === 'order') {
    // สำหรับ order: แสดงเมื่อมีสินค้า
    const hasProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false
    return hasProducts
  }
  // เครดิต, โอน, บัตร, ปลายทาง: บังคับ
  return pm === 'credit' || pm === 'transfer' || pm === 'card' || pm === 'cod'
})

const requiresShippingAddress = computed(() => {
  const pm = saleForm.value.paymentMethod
  if (pm === 'cash') {
    return saleForm.value.deliveryStatus === 'preparing'
  }
  if (pm === 'order') {
    // สำหรับ order: บังคับเมื่อมีสินค้า
    const hasProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false
    return hasProducts
  }
  return pm === 'credit' || pm === 'transfer' || pm === 'card' || pm === 'cod'
})

// Computed สำหรับแสดง/ซ่อนส่วน "ข้อมูลเพิ่มเติม"
const showAdditionalInfo = computed(() => {
  // ซ่อนเมื่อ paymentMethod = cash และ deliveryStatus = received
  if (saleForm.value.paymentMethod === 'cash' && saleForm.value.deliveryStatus === 'received') {
    return false
  }
  return true
})

// Custom products management
const customProducts = ref<Array<{ name: string; quantity: number; description: string }>>([])

const addCustomProduct = () => {
  // ถ้ามี products ที่มี id (valid products) ให้ clear ออก
  const hasValidProducts = saleForm.value.products.some((p) => p.id && p.quantity > 0)
  if (hasValidProducts) {
    saleForm.value.products = [{ id: '', quantity: 1, category: '', price: 0 }]
    toast.info('ลบสินค้าปกติออกแล้ว เนื่องจากเพิ่มสินค้านอกเหนือรายการ')
  }
  customProducts.value.push({ name: '', quantity: 1, description: '' })
}

const removeCustomProduct = (index: number) => {
  customProducts.value.splice(index, 1)
}

// Product management functions
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

const removeProduct = (index: number) => {
  if (saleForm.value.products.length > 1) {
    saleForm.value.products.splice(index, 1)
  } else {
    toast.warning('ต้องมีสินค้าอย่างน้อย 1 รายการ')
  }
}

const updateProductForIndex = (index: number, value: string | Record<string, unknown>) => {
  let selectedId: string
  if (typeof value === 'string') {
    selectedId = value
  } else if (value && typeof value === 'object') {
    selectedId = Object.keys(value)[0] || ''
  } else {
    return
  }

  if (!selectedId) return

  const product = productSelection.availableProducts.value?.find((p) => p._id === selectedId)
  if (!product) return

  let price = product.price || 0
  if (product.category?.name != 'ปลา' && product.food?.customerPrice) {
    price = product.food.customerPrice
  }

  saleForm.value.products[index] = {
    id: product._id,
    category: product.category?._id || '',
    price: price,
    quantity: saleForm.value.products[index].quantity || 1,
  }
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

const updateBankCode = (bankCode: string) => {
  saleForm.value.bankCode = bankCode
}

// Update shipping address from member
const updateShippingAddressFromMember = () => {
  if (selectedMemberDetails.value) {
    saleForm.value.shippingAddress = selectedMemberDetails.value.address || ''
    saleForm.value.shippingProvince = selectedMemberDetails.value.province || ''
  }
}

// Computed for showing shipping slip upload
const showShippingSlipUpload = computed(() => {
  // แสดงเฉพาะเมื่อ status = preparing เท่านั้น
  const statusStr = currentStatusString.value
  const currentStepIndex = getStatusStepIndex(statusStr)
  const preparingStepIndex = getStatusStepIndex('preparing')
  return currentStepIndex >= preparingStepIndex
})

// Handlers
const populateForm = (saleData: ISales) => {
  if (!saleData) return

  // แปลงข้อมูลจาก ISales เป็น IUpdateSalesPayload
  saleForm.value = {
    _id: saleData._id || '',
    payment: saleData.payment || 'cash',
    paymentMethod: saleData.paymentMethod,
    bankCode: saleData.bankCode || '',
    bankAccount: saleData.bankAccount || '',
    cat: saleData.cat || 0,
    item: saleData.item || '',
    sellingStatus:
      typeof saleData.sellingStatus === 'number'
        ? saleData.sellingStatus
        : convertStatusStringToNumber(saleData.sellingStatus || 'none'),
    user: saleData.user || '',
    products: saleData.products?.map((p) => ({
      id: p.id || '',
      quantity: p.quantity || 1,
      category: p.category || '',
      price: p.price || 0,
    })) || [{ id: '', quantity: 1, category: '', price: 0 }],
    deposit: saleData.deposit || 0,
    discount: saleData.discount || 0,
    seller: saleData.seller || '',
    note: saleData.note || '',
    deliveryNo: saleData.deliveryNo || 0,
    delivery: saleData.delivery || '',
    deliveryStatus: saleData.deliveryStatus,
    paymentDueDate: dayjs(saleData.paymentDueDate).toDate(),
    shippingAddress: saleData.shippingAddress,
    shippingProvince: saleData.shippingProvince,
    customProducts: saleData.customProducts,
  }

  // Load customProducts into ref
  if (saleData.customProducts && saleData.customProducts.length > 0) {
    customProducts.value = [...saleData.customProducts]
  } else {
    customProducts.value = []
  }
}

// Watch for props changes to populate form
watch(
  () => props.saleData,
  (newSaleData) => {
    if (newSaleData) {
      populateForm(newSaleData)
    }
  },
  { immediate: true }
)

const isSubmitting = ref(false)
const handleSubmit = () => {
  isSubmitting.value = true

  // Basic validation
  if (!saleForm.value.user) {
    toast.error('กรุณาเลือกลูกค้า')
    return
  }

  if (!saleForm.value.paymentMethod) {
    toast.error('กรุณาเลือกวิธีชำระเงิน')
    return
  }

  if (!saleForm.value.seller) {
    toast.error('กรุณาเลือกผู้ขาย')
    return
  }

  // Check if all products are valid
  const hasValidProducts = saleForm.value.products.some((p) => p.id && p.quantity > 0)
  const hasCustomProducts = customProducts.value.some((p) => p.name && p.quantity > 0)

  // Validate payment method - สำหรับ order ใช้ hasCustomProducts ถ้าไม่มี products
  const hasAnyProductsForValidation =
    saleForm.value.paymentMethod === 'order'
      ? hasValidProducts || hasCustomProducts
      : hasValidProducts

  const paymentValidation = validatePaymentMethod({
    paymentMethod: saleForm.value.paymentMethod,
    hasProducts: hasAnyProductsForValidation,
    hasBankInfo: !!saleForm.value.bankCode,
    hasSlip: hasSlip.value,
    hasShippingSlip: hasShippingSlip.value,
    hasShippingAddress: !!(saleForm.value.shippingAddress && saleForm.value.shippingProvince),
    deliveryStatus: saleForm.value.deliveryStatus,
    hasPaymentDueDate: !!saleForm.value.paymentDueDate,
    hasCustomProducts: hasCustomProducts,
    mode: 'edit',
    currentStatus: currentStatusString.value as SellingStatusString, // ส่ง currentStatus เพื่อตรวจสอบเงื่อนไข
    skipShippingSlipUpload: skipShippingSlipUpload.value, // ส่ง skipShippingSlipUpload เพื่อรองรับการข้ามการอัพโหลด
  })

  // Show validation errors
  if (!paymentValidation.isValid) {
    paymentValidation.errors.forEach((error) => {
      toast.error(error)
    })
    return
  }

  // ตรวจสอบว่ามี pending upload หรือไม่
  if (hasPendingSlipUpload.value) {
    toast.error('กรุณากด ยืนยันการอัปโหลด')
    return
  }

  if (hasPendingShippingSlipUpload.value) {
    toast.error('กรุณากด ยืนยันการอัปโหลด')
    return
  }

  // คำนวณ finalStatus จาก paymentMethod และ currentStatus
  // ใช้ computed property currentStatusString ที่ประกาศไว้แล้ว
  const currentStatusStr = currentStatusString.value

  // ตรวจสอบ shipping slip validation
  // ถ้า requireShippingSlipUpload = true และ skipShippingSlipUpload = false และไม่มี shipping slip → แสดง error
  if (
    requireShippingSlipUpload.value &&
    !skipShippingSlipUpload.value &&
    !hasShippingSlip.value &&
    currentStatusStr === 'preparing'
  ) {
    toast.error('กรุณาอัพโหลดสลิปการจัดส่งหรือเลือกข้ามการอัพโหลด')
    return
  }

  let finalStatus: SellingStatus

  // ตรวจสอบ currentStatus step เพื่อป้องกันไม่ให้ย้อนกลับ
  const currentStepIndex = getStatusStepIndex(currentStatusStr)
  const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
  const preparingStepIndex = getStatusStepIndex('preparing')

  // Logic สำหรับคำนวณ finalStatus ตาม paymentMethod และ currentStatus
  if (saleForm.value.paymentMethod === 'order') {
    // Order: ถ้า currentStatus >= wait_payment ให้คงสถานะเดิมไว้
    if (currentStepIndex >= waitPaymentStepIndex) {
      finalStatus =
        typeof props.saleData.sellingStatus === 'number'
          ? props.saleData.sellingStatus
          : convertStatusStringToNumber(currentStatusStr)
    } else {
      // ถ้ามีสินค้า (products หรือ customProducts) + bankCode + shippingAddress → wait_payment
      const hasAnyProducts = hasValidProducts || hasCustomProducts
      if (hasAnyProducts && saleForm.value.bankCode && saleForm.value.shippingAddress) {
        finalStatus = SellingStatus.wait_payment
      } else {
        // ถ้ายังไม่มีข้อมูลครบ → ยังคงเป็น order
        finalStatus = SellingStatus.order
      }
    }
  } else if (saleForm.value.paymentMethod === 'cash') {
    // Cash: ตาม deliveryStatus
    if (saleForm.value.deliveryStatus === 'received') {
      finalStatus = SellingStatus.received
    } else {
      finalStatus = SellingStatus.preparing
    }
  } else if (saleForm.value.paymentMethod === 'credit') {
    // Credit: ถ้า currentStatus >= preparing ให้คงสถานะเดิมไว้
    if (currentStepIndex >= preparingStepIndex) {
      finalStatus =
        typeof props.saleData.sellingStatus === 'number'
          ? props.saleData.sellingStatus
          : convertStatusStringToNumber(currentStatusStr)
    } else {
      finalStatus = SellingStatus.preparing
    }
  } else if (
    saleForm.value.paymentMethod === 'transfer' ||
    saleForm.value.paymentMethod === 'card'
  ) {
    // Transfer/Card: ถ้า currentStatus >= preparing ให้คงสถานะเดิมไว้
    if (currentStepIndex >= preparingStepIndex) {
      finalStatus =
        typeof props.saleData.sellingStatus === 'number'
          ? props.saleData.sellingStatus
          : convertStatusStringToNumber(currentStatusStr)
    } else if (hasSlip.value) {
      // ถ้ามี shipping slip → shipping
      if (hasShippingSlip.value) {
        finalStatus = SellingStatus.shipping
      } else {
        finalStatus = SellingStatus.preparing
      }
    } else {
      finalStatus = SellingStatus.wait_payment
    }
  } else if (saleForm.value.paymentMethod === 'cod') {
    // COD: ถ้า currentStatus >= preparing ให้คงสถานะเดิมไว้
    if (currentStepIndex >= preparingStepIndex) {
      finalStatus =
        typeof props.saleData.sellingStatus === 'number'
          ? props.saleData.sellingStatus
          : convertStatusStringToNumber(currentStatusStr)
    } else {
      finalStatus = SellingStatus.preparing
    }
  } else {
    // Default: ใช้ currentStatus
    finalStatus =
      typeof props.saleData.sellingStatus === 'number'
        ? props.saleData.sellingStatus
        : convertStatusStringToNumber(currentStatusStr)
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

  // Filter products to only include those with valid id and quantity
  const validProducts = saleForm.value.products.filter((p) => p.id && p.quantity > 0)
  const hasValidCustomProducts = customProducts.value.some((p) => p.name && p.quantity > 0)

  // ตรวจสอบว่ามีทั้ง products และ customProducts หรือไม่
  // ถ้ามีทั้งสองอย่าง ให้ลบ customProducts ออก (ให้ความสำคัญกับ products)
  let finalCustomProducts:
    | Array<{ name: string; quantity: number; description: string }>
    | undefined = customProducts.value
  if (validProducts.length > 0 && hasValidCustomProducts) {
    finalCustomProducts = undefined
  } else if (validProducts.length === 0 && hasValidCustomProducts) {
    // ถ้าไม่มี products แต่มี customProducts ให้ใช้ customProducts
    finalCustomProducts = customProducts.value
  } else {
    // ถ้าไม่มี customProducts หรือไม่มีทั้งสองอย่าง
    finalCustomProducts = undefined
  }

  // Prepare payload with customProducts if paymentMethod is 'order'
  const payload: IUpdateSalesPayload = {
    ...saleForm.value,
    products: validProducts.length > 0 ? validProducts : [],
    sellingStatus: finalStatus,
    customProducts: saleForm.value.paymentMethod === 'order' ? finalCustomProducts : undefined,
  }

  // Use final status from validation result
  updateSale(payload)
}

const { data: allSales } = useQuery<ISales[]>({
  queryKey: ['get_sales'],
  queryFn: () => salesStore.onGetSales(),
})

const queryClient = useQueryClient()
const { mutate: updateSale, isPending: isUpdatingSale } = useMutation({
  mutationFn: (sale: IUpdateSalesPayload) => salesStore.onUpdateSales(sale),
  onSuccess: async (data: unknown, variables: IUpdateSalesPayload) => {
    if ((data as { data: { modifiedCount: number } }).data) {
      toast.success('แก้ไขข้อมูลการขายสำเร็จ')

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
        // A. อัพเดทสถานะสมาชิก
        const preparingStepOrder = salesStore.statusWorkflow['preparing'].stepOrder
        memberStatusUpdate.updateMemberStatusIfNeeded(
          variables,
          members.value,
          allSales.value,
          productsData.value || [],
          preparingStepOrder
        )

        // A.1. อัพเดท customerLevel เมื่อ status >= preparing
        // (จะทำงานเมื่อมีการยืนยันสลิปผ่าน handleSlipUploaded หรือเปลี่ยน status เป็น preparing ขึ้นไป)
        memberStatusUpdate.updateMemberCustomerLevelIfNeeded(
          variables,
          members.value,
          allSales.value,
          productsData.value || [],
          preparingStepOrder
        )

        // B. ตัดสต็อกสินค้า - ตัดเฉพาะเมื่อ status เดิมน้อยกว่า preparing
        // เพื่อป้องกันการตัดสต็อกซ้ำเมื่อเปลี่ยนจาก preparing เป็น shipping
        if (productsData.value && previousStepIndex < preparingStepIndex) {
          executeStockDeduction(variables, productsData.value, updateProduct, (warning) =>
            toast.warning(warning)
          )
        }
      }

      refetchProducts()
      queryClient.invalidateQueries({ queryKey: ['get_sales'] })
      handleClose()
    } else {
      toast.error('แก้ไขข้อมูลการขายไม่สำเร็จ')
    }
  },
})

const { mutate: updateProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
})

const handleClose = () => {
  resetForm()
  isSubmitting.value = false
  emit('close-edit-modal')
}

const resetForm = () => {
  saleForm.value = {
    _id: '',
    payment: 'cash',
    paymentMethod: undefined,
    bankCode: '',
    bankAccount: '',
    cat: 0,
    item: '',
    sellingStatus: SellingStatus.none,
    user: '',
    products: [{ id: '', quantity: 1, category: '', price: 0 }],
    deposit: 0,
    discount: 0,
    seller: '',
    note: '',
    deliveryNo: 0,
    delivery: '',
    deliveryStatus: undefined,
    paymentDueDate: undefined,
    shippingAddress: undefined,
    shippingProvince: undefined,
    customProducts: undefined,
  }
  customProducts.value = []
  finalSaleStatus.value = null
  deliveryPhoto.value = null
  deliveryPhotoPreview.value = ''
  hasPendingSlipUpload.value = false
  hasPendingShippingSlipUpload.value = false
  skipShippingSlipUpload.value = false
  requireShippingSlipUpload.value = true // Reset เป็นค่าเริ่มต้น
}

const hasSlip = ref(false)
const hasShippingSlip = ref(false)

// Track pending upload states
const hasPendingSlipUpload = ref(false)
const hasPendingShippingSlipUpload = ref(false)

// Track shipping slip upload option
const skipShippingSlipUpload = ref(false)
const requireShippingSlipUpload = ref(true) // ค่าเริ่มต้น = true (ต้องอัพโหลด)

// สำหรับจบการขายเมื่อ status = shipping
const finalSaleStatus = ref<'received' | 'damaged' | null>(null)
const deliveryPhoto = ref<File | null>(null)
const deliveryPhotoPreview = ref<string>('')

const handleSlipStatusChanged = (status: boolean) => {
  hasSlip.value = status
}

const handleShippingSlipStatusChanged = (status: boolean) => {
  hasShippingSlip.value = status
}

// Handler สำหรับเมื่ออัพโหลดสลิปสำเร็จ - ตรวจสอบและเปลี่ยนสถานะอัตโนมัติ
const handleSlipUploaded = async (saleId: string) => {
  // ตรวจสอบว่า saleId ตรงกับ current sale หรือไม่
  if (!saleId || !props.saleData._id || saleId !== props.saleData._id) return

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

      updateSale(payload)
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

// Handler สำหรับเมื่ออัพโหลด shipping slip สำเร็จ - ตรวจสอบและเปลี่ยนสถานะอัตโนมัติ
const handleShippingSlipUploaded = async (saleId: string) => {
  // ตรวจสอบว่า saleId ตรงกับ current sale หรือไม่
  if (!saleId || !props.saleData._id || saleId !== props.saleData._id) return

  // ตรวจสอบว่าสถานะปัจจุบันเป็น preparing หรือไม่
  const currentStatusStr = currentStatusString.value
  if (currentStatusStr !== 'preparing') return

  // ตรวจสอบว่ามี shipping slip แล้วจริงๆ โดย query ด้วย saleId
  try {
    const extensions = ['jpg', 'jpeg', 'png']
    let found = false

    for (const ext of extensions) {
      const shippingSlipUrl = getShippingSlipUrl(saleId, ext)
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
      // อัพเดทสถานะเป็น shipping
      const payload: IUpdateSalesPayload = {
        ...saleForm.value,
        sellingStatus: SellingStatus.shipping,
      }

      updateSale(payload)
    }
  } catch (error) {
    console.error('Error checking shipping slip:', error)
  }
}

// Handler สำหรับจบการขาย
const handleCompleteSale = async () => {
  isSubmitting.value = true
  if (!finalSaleStatus.value) {
    toast.error('กรุณาเลือกสถานะการขาย (ได้รับสินค้าแล้ว หรือ สินค้าเสียหาย)')
    return
  }

  try {
    // อัพเดท status เป็น received หรือ damaged
    const finalStatus =
      finalSaleStatus.value === 'received' ? SellingStatus.received : SellingStatus.damaged

    const payload: IUpdateSalesPayload = {
      ...saleForm.value,
      sellingStatus: finalStatus,
      note: saleForm.value.note,
    }

    updateSale(payload)
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
    toast.error(errorMessage || 'จบการขายไม่สำเร็จ')
    isSubmitting.value = false
  }
}

// Check slip exists when dialog opens
watch(
  () => props.visible && props.saleData._id,
  async (shouldCheck) => {
    if (shouldCheck && props.saleData._id) {
      // Check slip exists
      const apiUrl = (import.meta as any).env.VITE_API_URL as string
      const slipUrl = `${apiUrl}/erp/download/slip?saleId=${props.saleData._id}`
      const img = new Image()
      img.onload = () => {
        hasSlip.value = true
      }
      img.onerror = () => {
        hasSlip.value = false
      }
      img.src = slipUrl

      // Check shipping slip exists using getShippingSlipUrl - ลองหา extension หลายแบบ
      const extensions = ['jpg', 'jpeg', 'png']
      let found = false

      for (const ext of extensions) {
        const shippingSlipUrl = getShippingSlipUrl(props.saleData._id, ext)
        const shippingImg = new Image()

        const checkPromise = new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => {
            resolve(false)
          }, 3000)

          shippingImg.onload = () => {
            clearTimeout(timeout)
            resolve(true)
          }

          shippingImg.onerror = () => {
            clearTimeout(timeout)
            resolve(false)
          }

          shippingImg.src = shippingSlipUrl
        })

        const exists = await checkPromise
        if (exists) {
          hasShippingSlip.value = true
          found = true
          break
        }
      }

      if (!found) {
        hasShippingSlip.value = false
      }
    }
  },
  { immediate: true }
)

const sellers = computed(() => {
  if (!props.admins) return []
  return props.admins
    ?.filter((admin) => admin.role === 1)
    .map((admin) => ({
      label: admin.name,
      value: admin._id,
    }))
})
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '99vw' }"
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
          <i class="pi pi-pencil text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">แก้ไขข้อมูลการขาย</h3>
          <p class="text-sm text-gray-600">แก้ไขข้อมูลการขาย {{ props.saleData.item }}</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Customer Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <!-- Selected Member Details -->
        <div
          v-if="selectedMemberDetails"
          class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div
              class="md:flex hidden w-14 h-14 bg-green-100 rounded-lg items-center justify-center"
            >
              <i class="pi pi-user text-green-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <h5 class="font-semibold text-gray-900">
                {{ selectedMemberDetails.name || selectedMemberDetails.displayName }}
              </h5>
              <p class="text-sm text-gray-600">
                รหัส: <span class="capitalize">{{ selectedMemberDetails.code }}</span> | ชื่อเล่น:
                {{ selectedMemberDetails.displayName || '-' }} | เบอร์:
                {{ selectedMemberDetails.phone || '-' }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                ที่อยู่: {{ selectedMemberDetails.address || '-' }},
                {{
                  selectedMemberDetails.province
                    ? memberStore.provinceOptions.find(
                        (option) => option.value === selectedMemberDetails?.province
                      )?.label
                    : '-'
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Status (Read-only) -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">สถานะรายการขาย</label>
            <Select
              :model-value="
                typeof saleForm.sellingStatus === 'number'
                  ? convertStatusNumberToString(saleForm.sellingStatus)
                  : saleForm.sellingStatus
              "
              :options="statusOptionsForSelect"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              disabled
              class="opacity-60"
            />
          </div>

          <!-- Seller (Read-only) -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ผู้ขาย</label>
            <Select
              :model-value="saleForm.seller"
              :options="sellers"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              disabled
              class="opacity-60"
            />
          </div>

          <!-- Payment Method (Read-only) -->
          <!-- <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">วิธีชำระเงิน</label>
            <Select
              :model-value="saleForm.paymentMethod"
              :options="salesStore.paymentMethods"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              disabled
              class="opacity-60"
            />
          </div> -->
        </div>
      </div>

      <!-- Custom Products (for order) -->
      <div
        v-if="showCustomProducts"
        class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <i class="pi pi-shopping-cart text-orange-600"></i>
            สินค้านอกเหนือรายการ
          </h4>
          <Button
            v-if="canEditProducts"
            label="เพิ่มสินค้า"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="addCustomProduct"
          />
        </div>
        <div class="space-y-3">
          <div
            v-for="(product, index) in customProducts"
            :key="index"
            class="p-3 bg-gray-50 rounded-lg space-y-3"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อสินค้า</label>
                <InputText
                  v-model="product.name"
                  placeholder="ชื่อสินค้า"
                  fluid
                  size="small"
                  :disabled="!canEditProducts"
                />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">จำนวน</label>
                <InputNumber
                  v-model="product.quantity"
                  :min="1"
                  placeholder="จำนวน"
                  fluid
                  size="small"
                  :disabled="!canEditProducts"
                />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">รายละเอียด</label>
              <Textarea
                v-model="product.description"
                placeholder="รายละเอียดสินค้า"
                rows="3"
                fluid
                size="small"
                :disabled="!canEditProducts"
              />
            </div>
            <div v-if="canEditProducts" class="flex justify-end">
              <Button
                icon="pi pi-trash"
                label="ลบ"
                severity="danger"
                size="small"
                outlined
                @click="removeCustomProduct(index)"
              />
            </div>
          </div>
          <p v-if="customProducts.length === 0" class="text-sm text-gray-500 text-center py-4">
            ไม่มีสินค้านอกเหนือรายการ (ไม่บังคับ)
          </p>
        </div>
      </div>

      <!-- Product Management -->
      <div
        v-if="showProductSelection"
        class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
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
            :can-remove="saleForm.products.length > 1 && canEditProducts"
            :is-read-only="!canEditProducts"
            @update:product="updateProductForIndex"
            @update:quantity="(idx, qty) => (saleForm.products[idx].quantity = qty)"
            @remove="removeProduct"
          />
        </div>
      </div>

      <!-- Payment Calculation -->
      <PaymentCalculationSection
        :total-amount="totalAmount"
        :deposit="saleForm.deposit"
        :discount="saleForm.discount"
        :delivery-no="saleForm.deliveryNo"
        :is-submitting="isSubmitting"
        :read-only="currentStatusString === 'wait_payment'"
        @update:deposit="updateDeposit"
        @update:discount="updateDiscount"
        @update:delivery-no="updateDeliveryNo"
      />

      <div
        v-if="showAdditionalInfo"
        class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      >
        <!-- Payment Due Date (for credit) -->
        <div class="flex items-center gap-2 mb-4">
          <i class="pi pi-info-circle text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลเพิ่มเติม</h4>
        </div>

        <div v-if="showPaymentDueDate" class="mt-4">
          <label class="text-sm font-medium text-gray-700 mb-1 block">กำหนดวันชำระเงิน</label>
          <DatePicker
            v-model="saleForm.paymentDueDate as Date"
            dateFormat="dd/mm/yy"
            showIcon
            iconDisplay="input"
            fluid
            size="small"
            :invalid="!saleForm.paymentDueDate && isSubmitting"
            :disabled="!canEditProducts"
          />
          <small v-if="!saleForm.paymentDueDate && isSubmitting" class="text-red-500"
            >กรุณาระบุวันชำระเงิน</small
          >
        </div>

        <!-- Delivery Status (for cash) -->
        <div v-if="showDeliveryStatus" class="mt-4">
          <label class="text-sm font-medium text-gray-700 mb-1 block">สถานะการส่ง</label>
          <Select
            v-model="saleForm.deliveryStatus"
            :options="[
              { label: 'ได้รับสินค้าแล้ว', value: 'received' },
              { label: 'แพ็ครอจัดส่ง', value: 'preparing' },
            ]"
            optionLabel="label"
            optionValue="value"
            fluid
            size="small"
            placeholder="เลือกสถานะการส่ง"
            :invalid="!saleForm.deliveryStatus && isSubmitting"
            :disabled="!canEditProducts"
          />
          <small v-if="!saleForm.deliveryStatus && isSubmitting" class="text-red-500"
            >กรุณาเลือกสถานะการส่ง</small
          >
        </div>

        <!-- Bank Selection (for transfer/card) -->
        <div v-if="showBankSelection" class="mt-4">
          <BankSelectionSection
            :selected-bank-code="saleForm.bankCode || ''"
            :is-submitting="isSubmitting"
            :is-current-bank="props.saleData.bankCode"
            :is-current-status="currentStatusString"
            :is-read-only="!canEditBankInfo"
            @update:selected-bank-code="updateBankCode"
          />
        </div>

        <!-- Shipping Address -->
        <div v-if="showShippingAddress" class="mt-4 space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">ที่อยู่จัดส่ง</label>
            <Button
              v-if="selectedMemberDetails && canEditProducts"
              label="ใช้ที่อยู่เดิม"
              icon="pi pi-refresh"
              severity="secondary"
              size="small"
              outlined
              @click="updateShippingAddressFromMember"
            />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <InputText
                v-model="saleForm.shippingAddress"
                placeholder="ที่อยู่"
                fluid
                size="small"
                :invalid="!saleForm.shippingAddress && isSubmitting && requiresShippingAddress"
                :disabled="!canEditProducts"
              />
              <small
                v-if="!saleForm.shippingAddress && isSubmitting && requiresShippingAddress"
                class="text-red-500"
                >กรุณากรอกที่อยู่จัดส่ง</small
              >
            </div>
            <div>
              <Select
                v-model="saleForm.shippingProvince"
                :options="memberStore.provinceOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="เลือกจังหวัด"
                fluid
                size="small"
                :invalid="!saleForm.shippingProvince && isSubmitting && requiresShippingAddress"
                :disabled="!canEditProducts"
              />
              <small
                v-if="!saleForm.shippingProvince && isSubmitting && requiresShippingAddress"
                class="text-red-500"
                >กรุณาเลือกจังหวัด</small
              >
            </div>
          </div>
        </div>

        <!-- Slip Upload Section (for order/transfer/card when status >= wait_payment) -->
        <SlipUploadSection
          v-if="showSlipUpload"
          :sale-id="props.saleData._id || ''"
          :selected-status="currentStatusString"
          :is-current-status="currentStatusString"
          :is-submitting="isSubmitting"
          @slip-status-changed="handleSlipStatusChanged"
          @slip-pending-upload="handleSlipPendingUpload"
          @slip-uploaded="handleSlipUploaded"
        />

        <!-- Shipping Slip Upload Section -->
        <ShippingSlipUploadSection
          v-if="showShippingSlipUpload"
          :sale-id="props.saleData._id || ''"
          :selected-status="currentStatusString"
          :is-current-status="currentStatusString"
          :is-submitting="isSubmitting"
          :skip-upload="skipShippingSlipUpload"
          :require-upload="requireShippingSlipUpload"
          :delivery="saleForm.delivery"
          :is-read-only="currentStatusString === 'received' || currentStatusString === 'damaged'"
          @shipping-slip-status-changed="handleShippingSlipStatusChanged"
          @shipping-slip-pending-upload="handleShippingSlipPendingUpload"
          @shipping-slip-uploaded="handleShippingSlipUploaded"
          @skip-upload-changed="handleSkipShippingSlipUploadChanged"
          @require-upload-changed="handleRequireShippingSlipUploadChanged"
          @delivery-changed="handleDeliveryChanged"
        />

        <!-- Complete Sale Section (for shipping status) -->
        <div
          v-if="
            currentStatusString === 'shipping' ||
            currentStatusString === 'received' ||
            currentStatusString === 'damaged'
          "
          class="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <i class="pi pi-check-circle text-white text-lg"></i>
            </div>
            <div>
              <h4 class="font-semibold text-green-900">จบการขาย</h4>
              <p class="text-sm text-green-700">เลือกสถานะการขายและอัพโหลดรูปจากขนส่ง (ถ้ามี)</p>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Final Status Selection -->
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">สถานะการขาย *</label>
              <Select
                v-model="finalSaleStatus"
                :options="[
                  { label: 'ได้รับสินค้าแล้ว', value: 'received' },
                  { label: 'สินค้าเสียหาย', value: 'damaged' },
                ]"
                optionLabel="label"
                optionValue="value"
                placeholder="เลือกสถานะการขาย"
                fluid
                size="small"
                :disabled="currentStatusString == 'received' || currentStatusString == 'damaged'"
                :invalid="!finalSaleStatus && isSubmitting"
              />
              <small v-if="!finalSaleStatus && isSubmitting" class="text-red-500"
                >กรุณาเลือกสถานะการขาย</small
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-file-edit text-purple-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">หมายเหตุ</h4>
        </div>

        <Textarea
          v-model="saleForm.note"
          placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
          rows="3"
          fluid
          size="small"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          v-if="currentStatusString !== 'received' && currentStatusString !== 'damaged'"
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
        <Button
          v-if="currentStatusString !== 'received' && currentStatusString !== 'damaged'"
          label="อัปเดตข้อมูล"
          icon="pi pi-check"
          @click="currentStatusString === 'shipping' ? handleCompleteSale() : handleSubmit()"
          :loading="isUpdatingSale"
          severity="success"
          size="small"
        />

        <Button
          v-if="currentStatusString == 'received' || currentStatusString == 'damaged'"
          label="ปิด"
          icon="pi pi-times"
          severity="danger"
          @click="handleClose"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
