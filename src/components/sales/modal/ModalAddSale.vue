<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { Dialog, Textarea, Select, InputNumber, Button, FileUpload } from 'primevue'
import {
  useProductStore,
  type IProduct,
  type IUpdateProductPayload,
  type IUploadImageResponse,
} from '@/stores/product/product'
import { useMemberStore, type IMember } from '@/stores/member/member'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import formatCurrency from '@/utils/formatCurrency'
import { useSalesStore } from '@/stores/sales/sales'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import type { ICreateSalesPayload, ISales, IUpdateSalesPayload, PaymentMethod } from '@/types/sales'
import { SellingStatus } from '@/types/sales'
import ProductItemForm from '../forms/ProductItemForm.vue'
import { type IAdmin } from '@/stores/admin/admin'
import BankSelectionSection from '../forms/BankSelectionSection.vue'
import { useFoodSaleStore, type IFoodSale } from '@/stores/product/food_sale'
import { executeStockDeduction } from '@/utils/stockDeduction'
import { validatePaymentMethod } from '@/utils/salesStatusValidation'
import { calculateInitialStatus } from '@/utils/salesStatusCalculation'
import { useMemberStatusUpdate } from '@/composables/useMemberStatusUpdate'
import { DatePicker } from 'primevue'
import InputText from 'primevue/inputtext'
import { watch } from 'vue'
import { useProductManagement } from '@/composables/useProductManagement'
import { useFormFieldUpdates } from '@/composables/useFormFieldUpdates'
import { useSalesVisibility } from '@/composables/useSalesVisibility'
import { useStatusHelpers } from '@/composables/useStatusHelpers'
import { useUploadFileStore } from '@/stores/product/upload_file'
import {
  validateFileName,
  ALLOWED_IMAGE_EXTENSIONS,
} from '@/utils/fileNameGenerator'
import { getProductImageUrl } from '@/utils/imageUrl'

// Props
const props = defineProps<{
  visible: boolean
  admins: IAdmin[]
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// Stores
const productStore = useProductStore()
const memberStore = useMemberStore()
const salesStore = useSalesStore()
const categoryStore = useCategoryStore()

// Form data
const saleForm = ref<ICreateSalesPayload>({
  item: '',
  user: '',
  paymentMethod: null,
  products: [{ id: '', category: '', price: 0, quantity: 1 }],
  deposit: 0,
  discount: 0,
  seller: '',
  note: '',
  sellingStatus: SellingStatus.order,
  deliveryNo: 0,
  delivery: '',
  deliveryStatus: undefined,
  paymentDueDate: undefined,
  shippingAddress: undefined,
  shippingProvince: undefined,
  customProducts: undefined,
})

// Queries
const { data: products, refetch: refetchProducts } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: members, isLoading: membersLoading } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})

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
const { getStatusStepIndex } = useStatusHelpers({
  sellingStatus: computed(() => saleForm.value.sellingStatus),
})

// Use product management
const customProducts = ref<Array<{ name: string; quantity: number; description: string; image?: string }>>([])
const productManagement = useProductManagement({
  products: computed(() => saleForm.value.products || []),
  productsData: products,
  foodSales: foodSales,
  categories: categories,
  customProducts,
  maxProducts: 20,
  minProducts: 1,
})

// Provide composable to child components
provide(Symbol.for('productSelection'), productManagement.productSelection)

// Use sales visibility
const visibility = useSalesVisibility({
  paymentMethod: computed(() => saleForm.value.paymentMethod as string | undefined),
  deliveryStatus: computed(() => saleForm.value.deliveryStatus as string | undefined),
  currentStatusString: computed(() => 'order'), // ModalAddSale always starts with 'order'
  products: computed(() => saleForm.value.products || []),
  getStatusStepIndex,
})

// Use form field updates
const formFieldUpdates = useFormFieldUpdates({
  saleForm: saleForm as any, // Type assertion needed for ICreateSalesPayload
  selectedMemberDetails: computed(() => selectedMemberDetails.value || null),
})

const netAmount = computed(() => {
  const netAmount =
    (productManagement.totalAmount.value || 0) -
    (saleForm.value.deliveryNo || 0) -
    (saleForm.value.discount || 0)
  return netAmount < 0 ? 0 : netAmount
})

const memberOptions = computed(() => {
  if (!members.value) return []
  return members.value.map((member) => {
    const code = member.code.charAt(0).toUpperCase() + member.code.slice(1)
    return {
      label: `${code} - ${member.displayName}`,
      value: member._id,
    }
  })
})

const selectedMemberDetails = computed(() => {
  if (!saleForm.value.user || !members.value) return null
  return members.value.find((m) => m._id === saleForm.value.user)
})

// Product validation helper
const isProductValid = (product: { id: string; quantity: number }) => {
  return product.id && product.quantity > 0
}

// Handlers
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
  const hasValidProducts = saleForm.value.products?.some((p) => isProductValid(p)) || false
  const hasCustomProducts = customProducts.value.some((p) => p.name && p.quantity > 0)

  // Note: ModalAddSale doesn't use slip management in the same way as ModalEditSale
  // Slips are handled after creation, so we set hasSlip and hasShippingSlip to false
  const hasSlip = ref(false)
  const hasShippingSlip = ref(false)

  // Validate payment method
  const paymentValidation = validatePaymentMethod({
    paymentMethod: saleForm.value.paymentMethod,
    hasProducts: hasValidProducts,
    hasBankInfo: !!bankForm.value.bankCode,
    hasSlip: hasSlip.value,
    hasShippingSlip: hasShippingSlip.value,
    hasShippingAddress: !!(saleForm.value.shippingAddress && saleForm.value.shippingProvince),
    deliveryStatus: saleForm.value.deliveryStatus,
    hasPaymentDueDate: !!saleForm.value.paymentDueDate,
    hasCustomProducts: hasCustomProducts,
    mode: 'add',
  })

  // Show validation errors
  if (!paymentValidation.isValid) {
    paymentValidation.errors.forEach((error) => {
      toast.error(error)
    })
    return
  }

  // Calculate initial status from payment method
  const initialStatus = calculateInitialStatus(
    saleForm.value.paymentMethod,
    saleForm.value.deliveryStatus,
    hasValidProducts
  )

  // Format products
  let formattedProducts:
    | {
      id: string
      category: string
      price: number
      quantity: number
      retailID?: string
      name?: string
      unit?: string
    }[]
    | null = null

  if (saleForm.value.paymentMethod !== 'order' && saleForm.value.products) {
    formattedProducts = saleForm.value.products.map((product) => {
      if (product.retailID) {
        return {
          id: product.id,
          category: product.category || '',
          price: product.price,
          quantity: product.quantity || 1,
          retailID: product.retailID,
          name: product.name,
          unit: 'kilo',
        }
      } else {
        return {
          id: product.id,
          category: product.category,
          price: product.price,
          quantity: product.quantity || 1,
          name: product.name || '',
          unit: 'piece',
        }
      }
    })
  }

  // Prepare payload
  const payload: ICreateSalesPayload = {
    ...saleForm.value,
    products: formattedProducts,
    customProducts: saleForm.value.paymentMethod === 'order' ? customProducts.value : undefined,
    item: `SALE-${Date.now().toString().slice(-8)}`,
    sellingStatus: initialStatus,
    payment:
      saleForm.value.paymentMethod === 'cash'
        ? 'cash'
        : saleForm.value.paymentMethod === 'transfer'
          ? 'transfer'
          : saleForm.value.paymentMethod === 'card'
            ? 'credit'
            : saleForm.value.paymentMethod === 'credit'
              ? 'credit'
              : 'other',
    bankCode: bankForm.value.bankCode || undefined,
    bankAccount: bankForm.value.bankAccount || undefined,
  }

  createSale(payload)
}

const queryClient = useQueryClient()
const { mutate: createSale, isPending: isCreatingSale } = useMutation({
  mutationFn: (sale: ICreateSalesPayload) => salesStore.onCreateSales(sale),
  onSuccess: async (data: any, variables: ICreateSalesPayload) => {
    if (data.data) {
      toast.success('เพิ่มข้อมูลการขายสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_sales'] })

      const createdSale = data.data
      const initialStatus = calculateInitialStatus(
        variables.paymentMethod!,
        variables.deliveryStatus,
        !!variables.products && variables.products.length > 0
      )

      // Check if should deduct stock (status = preparing or received)
      if (initialStatus === SellingStatus.preparing || initialStatus === SellingStatus.received) {
        // Update member status, purchaseHistory และ customerLevel ในครั้งเดียว
        // ใช้ฟังก์ชันรวมเพื่อป้องกัน race condition
        if (variables.products) {
          const preparingStepOrder = salesStore.statusWorkflow['preparing'].stepOrder
          const updatePayload = {
            ...variables,
            _id: createdSale._id,
            sellingStatus: initialStatus,
          } as IUpdateSalesPayload

          // Update member status, purchaseHistory และ customerLevel เมื่อ status >= preparing
          memberStatusUpdate.updateMemberStatusAndPurchaseHistory(
            updatePayload,
            members.value,
            preparingStepOrder,
            {
              allSales: allSales.value,
              allProducts: products.value || [],
            }
          )
        }

        // Deduct stock
        if (variables.products && products.value) {
          executeStockDeduction(
            {
              ...variables,
              _id: createdSale._id,
              sellingStatus: initialStatus,
            } as IUpdateSalesPayload,
            products.value,
            updateProduct,
            (warning) => toast.warning(warning)
          )
        }
      }

      refetchProducts()
      handleClose()
    } else {
      toast.error('เพิ่มข้อมูลการขายไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
  onError: () => {
    toast.error('เพิ่มข้อมูลการขายไม่สำเร็จ')
    isSubmitting.value = false
  },
})

const { data: allSales } = useQuery<ISales[]>({
  queryKey: ['get_sales'],
  queryFn: () => salesStore.onGetSales(),
})

const { mutate: updateProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
})

// Upload file store
const uploadFileStore = useUploadFileStore()

// Generate custom product image filename
const generateCustomProductImageName = (originalFilename: string): string => {
  const extension = originalFilename.substring(originalFilename.lastIndexOf('.'))
  const timestamp = Date.now().toString()
  return `custom_product_${timestamp}${extension}`
}

// Validate file upload
const validateFileUpload = (file: File, maxSize: number = 2000000) => {
  if (file.size > maxSize) {
    toast.error(`ขนาดไฟล์ใหญ่เกินไป (สูงสุด ${maxSize / 1000000}MB)`)
    return false
  }

  if (!file.type.startsWith('image/')) {
    toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
    return false
  }

  return true
}

// Handle custom product image upload
const onCustomProductImageSelect = (event: { files: File[] }, productIndex: number) => {
  const file = event.files[0]
  if (!file) return

  const product = customProducts.value[productIndex]

  // Validate product name exists
  if (!product.name || product.name.trim() === '') {
    toast.error('กรุณากรอกชื่อสินค้าก่อนอัพโหลดรูปภาพ')
    return
  }

  // Validate file type
  if (!validateFileName(file.name, ALLOWED_IMAGE_EXTENSIONS)) {
    toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`)
    return
  }

  // Validate file size
  if (!validateFileUpload(file)) {
    return
  }

  // Generate new filename
  const newFileName = generateCustomProductImageName(file.name)
  const renamedFile = new File([file], newFileName, { type: file.type })

  // Upload file
  uploadCustomProductImageWithIndex(renamedFile, productIndex)
}

// Upload mutation for custom product images
const { mutate: uploadCustomProductImage, isPending: isUploadingCustomProductImage } = useMutation({
  mutationFn: (file: File) => uploadFileStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    // Find the product index by matching the filename pattern
    // We need to track which product this upload is for
    const filename = data.filename
    // We'll use a ref to track the current uploading index
    if (currentUploadingIndex.value !== null) {
      customProducts.value[currentUploadingIndex.value].image = filename
      toast.success('อัปโหลดรูปภาพสำเร็จ')
      currentUploadingIndex.value = null
    }
  },
  onError: (error: unknown) => {
    console.error('Upload error:', error)
    const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'อัปโหลดรูปภาพไม่สำเร็จ'
    toast.error(errorMessage)
    currentUploadingIndex.value = null
  },
})

// Track which product is currently uploading
const currentUploadingIndex = ref<number | null>(null)

// Wrapper function to upload with index tracking
const uploadCustomProductImageWithIndex = (file: File, productIndex: number) => {
  currentUploadingIndex.value = productIndex
  uploadCustomProductImage(file)
}

// Remove custom product image
const removeCustomProductImage = (productIndex: number) => {
  customProducts.value[productIndex].image = undefined
}

const isSubmitting = ref(false)
const handleClose = () => {
  resetForm()
  isSubmitting.value = false
  emit('update:visible', false)
}

const resetForm = () => {
  saleForm.value = {
    item: '',
    user: '',
    paymentMethod: 'order' as PaymentMethod,
    products: [{ id: '', category: '', price: 0, quantity: 1 }],
    deposit: 0,
    discount: 0,
    seller: '',
    note: '',
    sellingStatus: SellingStatus.order,
    deliveryNo: 0,
    delivery: '',
    deliveryStatus: undefined,
    paymentDueDate: undefined,
    shippingAddress: undefined,
    shippingProvince: undefined,
    customProducts: undefined,
  }
  customProducts.value = []
  saleData.value = {
    _id: '',
    submit: false,
  }
  shippingSlipData.value = {
    _id: '',
    submit: false,
  }
  bankForm.value = {
    bankCode: '',
    bankAccount: '',
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

// Watch member change to auto-fill shipping address
watch(
  () => saleForm.value.user,
  () => {
    if (saleForm.value.user && !saleForm.value.shippingAddress) {
      formFieldUpdates.updateShippingAddressFromMember()
    }
  }
)

const bankForm = ref({
  bankCode: '',
  bankAccount: '',
})
const saleData = ref({
  _id: '',
  submit: false,
})
const shippingSlipData = ref({
  _id: '',
  submit: false,
})

// Update products handler - ModalAddSale has special logic for foodSales
const updateProducts = (index: number, value: string | Record<string, any>) => {
  // TreeSelect ส่ง value เป็น string หรือ object
  let selectedId: string
  if (typeof value === 'string') {
    selectedId = value
  } else if (value && typeof value === 'object') {
    selectedId = Object.keys(value)[0] || ''
  } else {
    return
  }

  if (!selectedId) return

  // ตรวจสอบว่าเป็น foodSale หรือ product ปกติ
  const foodSale = foodSales.value?.find((fs) => fs._id === selectedId)

  if (foodSale) {
    // กรณีอาหารแบ่งขาย
    const productData = foodSale.product
    saleForm.value.products![index] = {
      id: productData._id, // เก็บ product._id
      category: productData.category || '',
      price: foodSale.customerPriceKilo, // ราคาต่อกก.
      quantity: saleForm.value.products![index].quantity || 1, // คงค่า quantity เดิม
      retailID: foodSale._id, // เก็บ foodSale._id
      name: foodSale.name || productData.name || '',
      unit: 'kilo',
    }
  } else {
    // กรณีสินค้าปกติ - ใช้ productManagement
    productManagement.updateProductForIndex(index, selectedId)

    // Update additional fields for ModalAddSale
    const product = productManagement.productSelection.availableProducts.value?.find(
      (p) => p._id === selectedId
    )
    if (product && saleForm.value.products) {
      saleForm.value.products[index] = {
        ...saleForm.value.products[index],
        name: product.name || '',
        unit: 'piece',
      }
    }
  }
}
</script>

<template>
  <Dialog :visible="visible" @update:visible="handleClose" modal :style="{ width: '70rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }" :pt="{
      header: 'p-4',
      footer: 'p-4',
    }">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มข้อมูลการขาย</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลการขายให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Customer Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">เลือกลูกค้า</label>
            <Select v-model="saleForm.user" :options="memberOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกลูกค้า" fluid size="small" :loading="membersLoading"
              :invalid="!saleForm.user && isSubmitting" filter />
            <small v-if="!saleForm.user && isSubmitting" class="text-red-500">กรุณาเลือกลูกค้า</small>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">วิธีชำระเงิน</label>
            <Select v-model="saleForm.paymentMethod" :options="salesStore.paymentMethods" optionLabel="label"
              optionValue="value" fluid size="small" placeholder="เลือกวิธีชำระเงิน"
              :invalid="!saleForm.paymentMethod && isSubmitting" />
            <small v-if="!saleForm.paymentMethod && isSubmitting" class="text-red-500">กรุณาเลือกวิธีชำระเงิน</small>
          </div>

          <!-- Delivery Status (for cash) -->
          <div v-if="visibility.showDeliveryStatus.value">
            <label class="text-sm font-medium text-gray-700 mb-1 block">สถานะการส่ง</label>
            <Select v-model="saleForm.deliveryStatus" :options="[
              { label: 'ได้รับสินค้าแล้ว', value: 'received' },
              { label: 'แพ็ครอจัดส่ง', value: 'preparing' },
            ]" optionLabel="label" optionValue="value" fluid size="small" placeholder="เลือกสถานะการส่ง"
              :invalid="!saleForm.deliveryStatus && isSubmitting" />
            <small v-if="!saleForm.deliveryStatus && isSubmitting" class="text-red-500">กรุณาเลือกสถานะการส่ง</small>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ผู้ขาย</label>
            <Select v-model="saleForm.seller" :options="sellers" optionLabel="label" optionValue="value" fluid
              size="small" placeholder="เลือกผู้ขาย" :invalid="!saleForm.seller && isSubmitting" />
            <small v-if="!saleForm.seller && isSubmitting" class="text-red-500">กรุณาเลือกผู้ขาย</small>
          </div>
        </div>

        <!-- Selected Member Details -->
        <div v-if="selectedMemberDetails" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center gap-3">
            <div class="md:flex hidden w-14 h-14 bg-green-100 rounded-lg items-center justify-center">
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

        <!-- Payment Due Date (for credit) -->
        <div v-if="visibility.showPaymentDueDate.value" class="mt-4">
          <label class="text-sm font-medium text-gray-700 mb-1 block">กำหนดวันชำระเงิน</label>
          <DatePicker v-model="saleForm.paymentDueDate as Date | undefined" dateFormat="dd/mm/yy" showIcon
            iconDisplay="input" fluid size="small" :invalid="!saleForm.paymentDueDate && isSubmitting" />
          <small v-if="!saleForm.paymentDueDate && isSubmitting" class="text-red-500">กรุณาระบุวันชำระเงิน</small>
        </div>

        <!-- Bank Selection (for transfer/card) -->
        <div v-if="visibility.showBankSelection.value" class="mt-4">
          <BankSelectionSection :selected-bank-code="bankForm.bankCode || ''" :is-submitting="isSubmitting"
            :is-current-bank="''" :is-current-status="''"
            @update:selected-bank-code="(bankCode) => bankForm.bankCode = bankCode" />
        </div>

        <!-- Shipping Address -->
        <div v-if="visibility.showShippingAddress.value" class="mt-4 space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">ที่อยู่จัดส่ง</label>
            <Button v-if="selectedMemberDetails" label="ใช้ที่อยู่เดิม" icon="pi pi-refresh" severity="secondary"
              size="small" outlined @click="formFieldUpdates.updateShippingAddressFromMember" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <InputText v-model="saleForm.shippingAddress" placeholder="ที่อยู่" fluid size="small" :invalid="!saleForm.shippingAddress &&
                isSubmitting &&
                visibility.requiresShippingAddress.value
                " />
              <small v-if="
                !saleForm.shippingAddress &&
                isSubmitting &&
                visibility.requiresShippingAddress.value
              " class="text-red-500">กรุณากรอกที่อยู่จัดส่ง</small>
            </div>
            <div>
              <Select v-model="saleForm.shippingProvince" :options="memberStore.provinceOptions" optionLabel="label"
                optionValue="value" placeholder="เลือกจังหวัด" fluid size="small" :invalid="!saleForm.shippingProvince &&
                  isSubmitting &&
                  visibility.requiresShippingAddress.value
                  " />
              <small v-if="
                !saleForm.shippingProvince &&
                isSubmitting &&
                visibility.requiresShippingAddress.value
              " class="text-red-500">กรุณาเลือกจังหวัด</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Products (for order) -->
      <div v-if="visibility.showCustomProducts.value" class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <i class="pi pi-shopping-cart text-orange-600"></i>
            สินค้านอกเหนือรายการ
          </h4>
          <Button label="เพิ่มสินค้า" icon="pi pi-plus" severity="success" size="small"
            @click="() => customProducts.push({ name: '', quantity: 1, description: '', image: undefined })" />
        </div>
        <div class="space-y-3">
          <div v-for="(product, index) in customProducts" :key="index" class="p-3 bg-gray-50 rounded-lg space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อสินค้า</label>
                <InputText v-model="product.name" placeholder="ชื่อสินค้า" fluid size="small" />
                <small v-if="!product.name" class="text-red-500">กรุณากรอกชื่อสินค้า</small>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">จำนวน</label>
                <InputNumber v-model="product.quantity" :min="1" placeholder="จำนวน" fluid size="small" />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">รายละเอียด</label>
              <Textarea v-model="product.description" placeholder="รายละเอียดสินค้า" rows="3" fluid size="small" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">รูปภาพสินค้า</label>
              <div v-if="product.image" class="mb-3">
                <div class="relative inline-block">
                  <img :src="getProductImageUrl(product.image)" :alt="product.name || 'Product image'"
                    class="w-full max-w-xs h-48 object-contain rounded-lg border border-gray-200" loading="lazy" />
                  <Button icon="pi pi-times" severity="danger" size="small" text rounded class="absolute top-1 right-1"
                    @click="removeCustomProductImage(index)" />
                </div>
              </div>
              <FileUpload mode="basic" name="customProductImage" accept="image/*" :maxFileSize="2000000"
                :disabled="!product.name || product.name.trim() === '' || isUploadingCustomProductImage"
                :chooseLabel="isUploadingCustomProductImage ? 'กำลังอัปโหลด...' : 'อัพโหลดรูปภาพ'" size="small"
                @select="(event) => onCustomProductImageSelect(event, index)" />
              <small v-if="!product.name || product.name.trim() === ''" class="text-gray-500 block mt-1">
                กรุณากรอกชื่อสินค้าก่อนอัพโหลดรูปภาพ
              </small>
            </div>
            <div class="flex justify-end">
              <Button icon="pi pi-trash" label="ลบ" severity="danger" size="small" outlined
                @click="() => customProducts.splice(index, 1)" />
            </div>
          </div>
          <p v-if="customProducts.length === 0" class="text-sm text-gray-500 text-center py-4">
            ไม่มีสินค้านอกเหนือรายการ (ไม่บังคับ)
          </p>
        </div>
      </div>

      <!-- Product Information -->
      <div v-if="visibility.showProductSelection.value"
        class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <i class="pi pi-box text-blue-600"></i>
            รายการสินค้า
          </h4>
          <Button label="เพิ่มสินค้า" icon="pi pi-plus" severity="success" size="small"
            @click="productManagement.addProduct" />
        </div>

        <div class="space-y-4">
          <ProductItemForm v-for="(product, index) in saleForm.products" :key="index" :product="product" :index="index"
            :is-submitting="isSubmitting" :products-data="products"
            :can-remove="!!saleForm.products && saleForm.products.length > 1"
            @update:product="(idx, value) => updateProducts(idx, value)" @update:quantity="
              (idx, qty) => (saleForm.products ? (saleForm.products[idx].quantity = qty) : 1)
            " @remove="productManagement.removeProduct" />
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 md:col-span-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              มัดจำ (บาท)
            </label>
            <InputNumber v-model="saleForm.deposit" :min="0" mode="currency" currency="THB" locale="th-TH" fluid
              size="small" placeholder="ระบุยอดมัดจำ" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              ส่วนลด (บาท)
            </label>
            <InputNumber v-model="saleForm.discount" :min="0" mode="currency" currency="THB" locale="th-TH" fluid
              size="small" placeholder="ระบุส่วนลด" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              ค่าจัดส่ง (บาท)
            </label>
            <InputNumber v-model="saleForm.deliveryNo" :min="0" mode="currency" currency="THB" locale="th-TH" fluid
              size="small" placeholder="ระบุค่าจัดส่ง" />
          </div>
        </div>

        <!-- Summary -->
        <div class="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">มูลค่าสินค้า:</span>
              <span class="text-sm font-medium text-gray-800">{{
                formatCurrency(productManagement.totalAmount.value || 0)
              }}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-red-600">ส่วนลด:</span>
              <span class="text-sm font-medium text-red-600">{{
                formatCurrency(saleForm.discount || 0)
              }}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-blue-600">ค่าจัดส่ง:</span>
              <span class="text-sm font-medium text-blue-600">{{
                formatCurrency(saleForm.deliveryNo || 0)
              }}</span>
            </div>

            <div v-if="saleForm.deposit > 0" class="flex items-center justify-between">
              <span class="text-sm text-blue-600">มัดจำ:</span>
              <span class="text-sm font-medium text-blue-600">{{
                formatCurrency(saleForm.deposit || 0)
              }}</span>
            </div>

            <div class="border-t border-green-300 pt-2">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-green-600">ยอดสุทธิ:</span>
                <span class="font-bold text-lg text-green-600">{{
                  formatCurrency(netAmount)
                }}</span>
              </div>
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

        <Textarea v-model="saleForm.note" placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)" rows="3" fluid size="small" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="handleClose" size="small" />
        <Button label="บันทึกข้อมูล" icon="pi pi-check" @click="handleSubmit" :loading="isCreatingSale"
          severity="success" size="small" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
:deep(.p-select-option[aria-disabled='true']) {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

:deep(.p-treeselect-option[aria-disabled='true']) {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

:deep(.p-tree-node-content[aria-disabled='true']) {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>

<style>
.p-tree-node-toggle-button[data-p-leaf='true'] {
  display: none !important;
  visibility: hidden !important;
}
</style>
