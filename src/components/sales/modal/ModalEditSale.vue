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
import { useSlipManagement } from '@/composables/useSlipManagement'
import { useProductManagement } from '@/composables/useProductManagement'
import { useFormFieldUpdates } from '@/composables/useFormFieldUpdates'
import { useSalesVisibility } from '@/composables/useSalesVisibility'
import { useStatusHelpers } from '@/composables/useStatusHelpers'
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

// Use composable for member status update
const memberStatusUpdate = useMemberStatusUpdate()

// Use status helpers
const { getStatusStepIndex, currentStatusString } = useStatusHelpers({
  sellingStatus: computed(() => props.saleData.sellingStatus),
})

// Selected member details
const selectedMemberDetails = computed(() => {
  if (!saleForm.value.user || !members.value) return null
  return members.value.find((m) => m._id === saleForm.value.user)
})

// Use product management
const customProducts = ref<Array<{ name: string; quantity: number; description: string }>>([])
const productManagement = useProductManagement({
  products: computed(() => saleForm.value.products || []),
  productsData,
  foodSales: ref(undefined),
  categories,
  customProducts,
  maxProducts: 10,
  minProducts: 1,
})

// Provide composable to child components
provide(Symbol.for('productSelection'), productManagement.productSelection)

// Use sales visibility
const visibility = useSalesVisibility({
  paymentMethod: computed(() => saleForm.value.paymentMethod as string | undefined),
  deliveryStatus: computed(() => saleForm.value.deliveryStatus as string | undefined),
  currentStatusString: computed(() => currentStatusString.value),
  products: computed(() => saleForm.value.products || []),
  getStatusStepIndex,
})

// Note: requiresBankSelection removed - using showBankSelection instead

const requiresSlipUpload = computed(() => {
  // ใช้ currentStatusString จาก props.saleData แทน saleForm.value.sellingStatus
  const statusStr = currentStatusString.value
  const currentStepIndex = getStatusStepIndex(statusStr)
  const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
  // แสดงเมื่อ status >= wait_payment (รวม wait_payment ด้วย)
  return currentStepIndex >= waitPaymentStepIndex
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

// Custom products management
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

// Use form field updates
const formFieldUpdates = useFormFieldUpdates({
  saleForm,
  selectedMemberDetails: computed(() => selectedMemberDetails.value || null),
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
      name: p.name || '',
      retailID: p.retailID || undefined,
      unit: p.unit || undefined,
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
    hasSlip: slipManagement.hasSlip.value,
    hasShippingSlip: slipManagement.hasShippingSlip.value,
    hasShippingAddress: !!(saleForm.value.shippingAddress && saleForm.value.shippingProvince),
    deliveryStatus: saleForm.value.deliveryStatus,
    hasPaymentDueDate: !!saleForm.value.paymentDueDate,
    hasCustomProducts: hasCustomProducts,
    mode: 'edit',
    currentStatus: currentStatusString.value as SellingStatusString, // ส่ง currentStatus เพื่อตรวจสอบเงื่อนไข
    skipShippingSlipUpload: slipManagement.skipShippingSlipUpload.value, // ส่ง skipShippingSlipUpload เพื่อรองรับการข้ามการอัพโหลด
  })

  // Show validation errors
  if (!paymentValidation.isValid) {
    paymentValidation.errors.forEach((error) => {
      toast.error(error)
    })
    return
  }

  // ตรวจสอบว่ามี pending upload หรือไม่
  if (slipManagement.hasPendingSlipUpload.value) {
    toast.error('กรุณากด ยืนยันการอัปโหลด')
    return
  }

  if (slipManagement.hasPendingShippingSlipUpload.value) {
    toast.error('กรุณากด ยืนยันการอัปโหลด')
    return
  }

  // คำนวณ finalStatus จาก paymentMethod และ currentStatus
  // ใช้ computed property currentStatusString ที่ประกาศไว้แล้ว
  const currentStatusStr = currentStatusString.value

  // ตรวจสอบ shipping slip validation
  // ถ้า requireShippingSlipUpload = true และ skipShippingSlipUpload = false และไม่มี shipping slip → แสดง error
  if (
    slipManagement.requireShippingSlipUpload.value &&
    !slipManagement.skipShippingSlipUpload.value &&
    !slipManagement.hasShippingSlip.value &&
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
    } else if (slipManagement.hasSlip.value) {
      // ถ้ามี shipping slip → shipping
      if (slipManagement.hasShippingSlip.value) {
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
  if (
    currentStatusStr === 'preparing' &&
    (slipManagement.hasShippingSlip.value || slipManagement.skipShippingSlipUpload.value)
  ) {
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
const { mutate: updateProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
})

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

      refetchProducts()
      queryClient.invalidateQueries({ queryKey: ['get_sales'] })
      handleClose()
    } else {
      toast.error('แก้ไขข้อมูลการขายไม่สำเร็จ')
    }
  },
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
  slipManagement.resetSlipStates()
}

// สำหรับจบการขายเมื่อ status = shipping
const finalSaleStatus = ref<'received' | 'damaged' | null>(null)
const deliveryPhoto = ref<File | null>(null)
const deliveryPhotoPreview = ref<string>('')

// Use slip management
const slipManagement = useSlipManagement({
  saleId: props.saleData._id || '',
  currentStatusString: computed(() => currentStatusString.value),
  onStatusUpdate: (payload: IUpdateSalesPayload) => {
    updateSale(payload)
  },
})

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
        slipManagement.hasSlip.value = true
      }
      img.onerror = () => {
        slipManagement.hasSlip.value = false
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
          slipManagement.hasShippingSlip.value = true
          found = true
          break
        }
      }

      if (!found) {
        slipManagement.hasShippingSlip.value = false
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

const readOnly = computed(() => {
  return (
    currentStatusString.value === 'preparing' ||
    currentStatusString.value === 'received' ||
    currentStatusString.value === 'shipping' ||
    currentStatusString.value === 'damaged'
  )
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
        v-if="visibility.showCustomProducts.value"
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
            @click="productManagement.addProduct"
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
            @update:product="productManagement.updateProductForIndex"
            @update:quantity="(idx, qty) => (saleForm.products[idx].quantity = qty)"
            @remove="productManagement.removeProduct"
          />
        </div>
      </div>

      <!-- Payment Calculation -->
      <PaymentCalculationSection
        :total-amount="productManagement.totalAmount.value"
        :deposit="saleForm.deposit"
        :discount="saleForm.discount"
        :delivery-no="saleForm.deliveryNo"
        :is-submitting="isSubmitting"
        :read-only="readOnly"
        @update:deposit="formFieldUpdates.updateDeposit"
        @update:discount="formFieldUpdates.updateDiscount"
        @update:delivery-no="formFieldUpdates.updateDeliveryNo"
      />

      <div
        v-if="visibility.showAdditionalInfo.value"
        class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      >
        <!-- Payment Due Date (for credit) -->
        <div class="flex items-center gap-2 mb-4">
          <i class="pi pi-info-circle text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลเพิ่มเติม</h4>
        </div>

        <div v-if="visibility.showPaymentDueDate.value" class="mt-4">
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
        <div v-if="visibility.showDeliveryStatus.value" class="mt-4">
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
        <div v-if="visibility.showBankSelection.value" class="mt-4">
          <BankSelectionSection
            :selected-bank-code="saleForm.bankCode || ''"
            :is-submitting="isSubmitting"
            :is-current-bank="props.saleData.bankCode"
            :is-current-status="currentStatusString"
            :is-read-only="!canEditBankInfo"
            @update:selected-bank-code="formFieldUpdates.updateBankCode"
          />
        </div>

        <!-- Shipping Address -->
        <div v-if="visibility.showShippingAddress.value" class="mt-4 space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">ที่อยู่จัดส่ง</label>
            <Button
              v-if="selectedMemberDetails && canEditProducts"
              label="ใช้ที่อยู่เดิม"
              icon="pi pi-refresh"
              severity="secondary"
              size="small"
              outlined
              @click="formFieldUpdates.updateShippingAddressFromMember"
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
          v-if="visibility.showSlipUpload.value"
          :sale-id="props.saleData._id || ''"
          :selected-status="currentStatusString"
          :is-current-status="currentStatusString"
          :is-submitting="isSubmitting"
          @slip-status-changed="slipManagement.handleSlipStatusChanged"
          @slip-pending-upload="slipManagement.handleSlipPendingUpload"
          @slip-uploaded="(saleId) => slipManagement.handleSlipUploaded(saleId, saleForm)"
        />

        <!-- Shipping Slip Upload Section -->
        <ShippingSlipUploadSection
          v-if="visibility.showShippingSlipUpload.value"
          :sale-id="props.saleData._id || ''"
          :selected-status="currentStatusString"
          :is-current-status="currentStatusString"
          :is-submitting="isSubmitting"
          :skip-upload="slipManagement.skipShippingSlipUpload.value"
          :require-upload="slipManagement.requireShippingSlipUpload.value"
          :delivery="saleForm.delivery"
          :is-read-only="currentStatusString === 'received' || currentStatusString === 'damaged'"
          @shipping-slip-status-changed="slipManagement.handleShippingSlipStatusChanged"
          @shipping-slip-pending-upload="slipManagement.handleShippingSlipPendingUpload"
          @shipping-slip-uploaded="
            (saleId) => slipManagement.handleShippingSlipUploaded(saleId, saleForm)
          "
          @skip-upload-changed="slipManagement.handleSkipShippingSlipUploadChanged"
          @require-upload-changed="slipManagement.handleRequireShippingSlipUploadChanged"
          @delivery-changed="formFieldUpdates.handleDeliveryChanged"
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
