<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { Dialog, Textarea, Select, Button, InputText, InputNumber, DatePicker } from 'primevue'
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
  return currentStatusString.value === 'preparing' || currentStatusString.value === 'shipping'
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
    deliveryStatus: saleData.deliveryStatusForCash,
    paymentDueDate: saleData.paymentDueDate,
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
    isSubmitting.value = false
    return
  }

  if (!saleForm.value.paymentMethod) {
    toast.error('กรุณาเลือกวิธีชำระเงิน')
    isSubmitting.value = false
    return
  }

  if (!saleForm.value.seller) {
    toast.error('กรุณาเลือกผู้ขาย')
    isSubmitting.value = false
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
  })

  // Show validation errors
  if (!paymentValidation.isValid) {
    paymentValidation.errors.forEach((error) => {
      toast.error(error)
    })
    isSubmitting.value = false
    return
  }

  // คำนวณ finalStatus จาก paymentMethod และ currentStatus
  const currentStatusString =
    typeof props.saleData.sellingStatus === 'number'
      ? convertStatusNumberToString(props.saleData.sellingStatus)
      : props.saleData.sellingStatus

  let finalStatus: SellingStatus

  // Logic สำหรับคำนวณ finalStatus ตาม paymentMethod และ currentStatus
  if (saleForm.value.paymentMethod === 'order') {
    // Order: ถ้ามีสินค้า (products หรือ customProducts) + bankCode + shippingAddress → wait_payment
    const hasAnyProducts = hasValidProducts || hasCustomProducts
    if (hasAnyProducts && saleForm.value.bankCode && saleForm.value.shippingAddress) {
      finalStatus = SellingStatus.wait_payment
    } else {
      // ถ้ายังไม่มีข้อมูลครบ → ยังคงเป็น order
      finalStatus = SellingStatus.order
    }
  } else if (saleForm.value.paymentMethod === 'cash') {
    // Cash: ตาม deliveryStatus
    if (saleForm.value.deliveryStatus === 'received') {
      finalStatus = SellingStatus.received
    } else {
      finalStatus = SellingStatus.preparing
    }
  } else if (saleForm.value.paymentMethod === 'credit') {
    // Credit: preparing (ตัดสต็อก)
    finalStatus = SellingStatus.preparing
  } else if (
    saleForm.value.paymentMethod === 'transfer' ||
    saleForm.value.paymentMethod === 'card'
  ) {
    // Transfer/Card: ถ้ามี slip → preparing, ถ้าไม่มี → wait_payment
    if (hasSlip.value) {
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
    // COD: preparing (ตัดสต็อก)
    finalStatus = SellingStatus.preparing
  } else {
    // Default: ใช้ currentStatus
    finalStatus =
      typeof props.saleData.sellingStatus === 'number'
        ? props.saleData.sellingStatus
        : convertStatusStringToNumber(currentStatusString)
  }

  // ถ้า currentStatus เป็น preparing และมี shipping slip → shipping
  if (currentStatusString === 'preparing' && hasShippingSlip.value) {
    finalStatus = SellingStatus.shipping
  }

  // ถ้า currentStatus เป็น shipping → ยังคงเป็น shipping (ไม่เปลี่ยน)
  if (currentStatusString === 'shipping') {
    finalStatus = SellingStatus.shipping
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
    if ((data as { data: { modifiedCount: number } }).data.modifiedCount > 0) {
      toast.success('แก้ไขข้อมูลการขายสำเร็จ')

      const statusString =
        typeof variables.sellingStatus === 'number'
          ? convertStatusNumberToString(variables.sellingStatus)
          : variables.sellingStatus

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

        // B. ตัดสต็อกสินค้า - ใช้ utility function
        if (productsData.value) {
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
}

const hasSlip = ref(false)
const hasShippingSlip = ref(false)

const handleSlipStatusChanged = (status: boolean) => {
  hasSlip.value = status
}

const handleShippingSlipStatusChanged = (status: boolean) => {
  hasShippingSlip.value = status
}

// Check slip exists when dialog opens
watch(
  () => props.visible && props.saleData._id,
  (shouldCheck) => {
    if (shouldCheck && props.saleData._id) {
      // Check slip exists
      const apiUrl = import.meta.env.VITE_API_URL as string
      const slipUrl = `${apiUrl}/erp/download/slip?saleId=${props.saleData._id}`
      const img = new Image()
      img.onload = () => {
        hasSlip.value = true
      }
      img.onerror = () => {
        hasSlip.value = false
      }
      img.src = slipUrl

      // Check shipping slip exists
      const shippingSlipUrl = `${apiUrl}/erp/download/shipping-slip?saleId=${props.saleData._id}`
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

// Auto-update status to preparing when slip is uploaded and current status < preparing
const handleSlipUploaded = async (saleId: string) => {
  if (!saleId || !props.saleData._id || saleId !== props.saleData._id) return

  const currentStatusString =
    typeof props.saleData.sellingStatus === 'number'
      ? convertStatusNumberToString(props.saleData.sellingStatus)
      : props.saleData.sellingStatus
  const currentStepIndex = getStatusStepIndex(currentStatusString)
  const preparingStepIndex = getStatusStepIndex('preparing')

  // Only auto-change if current status < preparing
  if (currentStepIndex < preparingStepIndex) {
    // Update status to preparing
    const updatedPayload: IUpdateSalesPayload = {
      _id: props.saleData._id,
      sellingStatus: SellingStatus.preparing,
      bankCode: saleForm.value.bankCode || props.saleData.bankCode,
      bankAccount: props.saleData.bankAccount,
      item: props.saleData.item,
      user: props.saleData.user,
      products:
        props.saleData.products?.map((p) => ({
          id: p.id || '',
          category: p.category || '',
          price: p.price || 0,
          quantity: p.quantity || 1,
        })) || [],
      deposit: props.saleData.deposit,
      discount: props.saleData.discount,
      seller: props.saleData.seller,
      note: props.saleData.note,
      payment: props.saleData.payment,
      cat: props.saleData.cat,
      deliveryNo: props.saleData.deliveryNo,
      delivery: props.saleData.delivery,
    }

    updateSale(updatedPayload)
  }
}

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

      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <!-- Payment Due Date (for credit) -->
        <div class="flex items-center gap-2 mb-4">
          <i class="pi pi-info-circle text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลเพิ่มเติม</h4>
        </div>

        <div v-if="showPaymentDueDate" class="mt-4">
          <label class="text-sm font-medium text-gray-700 mb-1 block">กำหนดวันชำระเงิน</label>
          <DatePicker
            v-model="saleForm.paymentDueDate as Date | undefined"
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
        <div v-if="showBankSelection && canEditBankInfo" class="mt-4">
          <BankSelectionSection
            :selected-bank-code="saleForm.bankCode || ''"
            :is-submitting="isSubmitting"
            :is-current-bank="props.saleData.bankCode"
            :is-current-status="currentStatusString"
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
          v-if="showSlipUpload && canEditSlip"
          :sale-id="props.saleData._id || ''"
          :selected-status="currentStatusString"
          :is-current-status="currentStatusString"
          :is-submitting="isSubmitting"
          @slip-status-changed="handleSlipStatusChanged"
          @slip-uploaded="handleSlipUploaded"
        />

        <!-- Shipping Slip Upload Section -->
        <ShippingSlipUploadSection
          v-if="showShippingSlipUpload && canEditShippingSlip"
          :sale-id="props.saleData._id || ''"
          :selected-status="currentStatusString"
          :is-current-status="currentStatusString"
          :is-submitting="isSubmitting"
          @shipping-slip-status-changed="handleShippingSlipStatusChanged"
        />
      </div>

      <!-- Payment Calculation -->
      <PaymentCalculationSection
        :total-amount="totalAmount"
        :deposit="saleForm.deposit"
        :discount="saleForm.discount"
        :delivery-no="saleForm.deliveryNo"
        :is-submitting="isSubmitting"
        :read-only="!canEditProducts"
        @update:deposit="updateDeposit"
        @update:discount="updateDiscount"
        @update:delivery-no="updateDeliveryNo"
      />

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
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
        <Button
          label="อัปเดตข้อมูล"
          icon="pi pi-check"
          @click="handleSubmit"
          :loading="isUpdatingSale"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
