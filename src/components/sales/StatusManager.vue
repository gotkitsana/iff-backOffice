<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { Dialog, Button, Tag, Textarea, Select } from 'primevue'
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
import PaymentCalculationSection from './PaymentCalculationSection.vue'
import ProductItemForm from './ProductItemForm.vue'
import SaleDetailSummary from './SaleDetailSummary.vue'
import SaleDataSummary from './SaleDataSummary.vue'
import { useMemberStore, type IMember, type UpdateMemberPayload } from '@/stores/member/member'
import {
  useProductStore,
  type IProduct,
  type IUpdateProductPayload,
} from '@/stores/product/product'
import { executeStockDeduction } from '@/utils/stockDeduction'
import formatCurrency from '@/utils/formatCurrency'
import jsPDF from 'jspdf'
// import { useAdminStore, type IAdmin } from '@/stores/admin/admin'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { useFoodSaleStore, type IFoodSale } from '@/stores/product/food_sale'
import BankData from '@/config/BankData'
import logoIcon from '@/assets/images/icon/icon.png'
import { useProductSelection } from '@/composables/useProductSelection'
import { useMemberStatusUpdate } from '@/composables/useMemberStatusUpdate'
import { validateStatusForStatusChange, getAvailableStatuses } from '@/utils/salesStatusValidation'

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
})

// Reactive data
const hasSlip = ref(false)
const hasShippingSlip = ref(false)
const totalAmount = ref(0)
const isSubmitting = ref(false)

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

const currentStatusInfo = computed(() => {
  const currentStatusString =
    typeof props.currentData.sellingStatus === 'number'
      ? convertStatusNumberToString(props.currentData.sellingStatus)
      : props.currentStatus
  return salesStore.statusWorkflow[currentStatusString as keyof StatusWorkflow]
})

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

// Available next status options based on current status
const availableNextStatusOptions = computed(() => {
  const currentStatusString =
    typeof props.currentData.sellingStatus === 'number'
      ? convertStatusNumberToString(props.currentData.sellingStatus)
      : props.currentStatus
  const availableStatuses = getAvailableStatuses(
    currentStatusString as SellingStatusString,
    'status-change'
  )
  return salesStore.sellingStatusOptions.filter((opt) =>
    availableStatuses.includes(opt.value as SellingStatusString)
  )
})

// Note: getTargetStatus logic is now handled in validateStatusForStatusChange
// This function is kept for backward compatibility but validation uses utility function

// Handlers
const handleSlipStatusChanged = (status: boolean) => {
  hasSlip.value = status
}

const handleShippingSlipStatusChanged = (status: boolean) => {
  hasShippingSlip.value = status
}

const handleSlipUploaded = (saleId: string) => {
  if (!saleId || saleId !== props.currentData._id) return
  // Auto-change logic is handled in getTargetStatus
}

const updateBankCode = (bankCode: string) => {
  saleForm.value.bankCode = bankCode
}

const updateProductForIndex = (index: number, value: string | Record<string, any>) => {
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
    saleForm.value.products[index] = {
      id: productData._id,
      category: productData.category || '',
      price: foodSale.customerPriceKilo,
      quantity: saleForm.value.products[index].quantity || 1,
    }
  } else {
    // กรณีสินค้าปกติ
    const product = productSelection.availableProducts.value?.find((p) => p._id === selectedId)

    if (!product) return

    // หาราคาตาม category
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
}

const addProduct = () => {
  if (saleForm.value.products.length < 10) {
    saleForm.value.products.push({
      id: '',
      quantity: 1,
      category: '',
      price: 0,
    })
  }
}

const removeProduct = (index: number) => {
  if (saleForm.value.products.length > 1) {
    saleForm.value.products.splice(index, 1)
  }
}

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

const updateDeposit = (deposit: number) => {
  saleForm.value.deposit = deposit
}

const updateDiscount = (discount: number) => {
  saleForm.value.discount = discount
}

const updateDeliveryNo = (deliveryNo: number) => {
  saleForm.value.deliveryNo = deliveryNo
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

// Submit handler
const handleSubmit = () => {
  isSubmitting.value = true

  const currentStatusString =
    typeof props.currentData.sellingStatus === 'number'
      ? convertStatusNumberToString(props.currentData.sellingStatus)
      : props.currentStatus
  const selectedStatusString =
    typeof saleForm.value.sellingStatus === 'number'
      ? convertStatusNumberToString(saleForm.value.sellingStatus)
      : (saleForm.value.sellingStatus as string) || currentStatusString

  // Check if all products are valid
  const hasValidProducts = saleForm.value.products?.some((p) => p.id && p.quantity > 0) || false

  // Use utility function for status validation
  const validationResult = validateStatusForStatusChange({
    selectedStatus: selectedStatusString as SellingStatusString,
    hasProducts: hasValidProducts,
    hasBankInfo: !!saleForm.value.bankCode,
    hasSlip: hasSlip.value,
    hasShippingSlip: hasShippingSlip.value,
    currentStatus: currentStatusString as SellingStatusString,
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

  // แปลง finalStatus จาก string เป็น number
  const finalStatusNumber = convertStatusStringToNumber(validationResult.finalStatus)

  // Use final status from validation result
  updateSalesStatus({
    ...saleForm.value,
    sellingStatus: finalStatusNumber,
  })
}

// Mutation
const queryClient = useQueryClient()
const { mutate: updateSalesStatus } = useMutation({
  mutationFn: (payload: IUpdateSalesPayload) => salesStore.onUpdateSales(payload),
  onSuccess: (data: { data: { modifiedCount: number } }, variables: IUpdateSalesPayload) => {
    if (data.data.modifiedCount > 0) {
      toast.success('บันทึกข้อมูลสำเร็จ')

      // Check if should update member status and deduct stock
      const statusString =
        typeof variables.sellingStatus === 'number'
          ? convertStatusNumberToString(variables.sellingStatus)
          : variables.sellingStatus
      const targetStepOrder =
        salesStore.statusWorkflow[statusString as keyof StatusWorkflow]?.stepOrder
      const preparingStepOrder = salesStore.statusWorkflow['preparing'].stepOrder

      if (targetStepOrder && targetStepOrder >= preparingStepOrder) {
        // A. Update member status
        memberStatusUpdate.updateMemberStatusIfNeeded(
          variables,
          members.value,
          allSales.value,
          productsData.value || [],
          preparingStepOrder
        )

        // B. Deduct stock using utility function (only if slip is confirmed)
        // ตัดสต็อกเมื่อยืนยันสลิปแล้วและ status >= preparing
        if (productsData.value && hasSlip.value) {
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
      toast.error('บันทึกข้อมูลไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
  onError: (error: unknown) => {
    console.error(error)
    const errorMessage =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'บันทึกข้อมูลไม่สำเร็จ'
    toast.error(errorMessage)
    isSubmitting.value = false
  },
})

const { mutate: updateProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
})

// PDF Generation for received/damaged
const formatDateForReport = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const generateReportHTML = () => {
  const currentDate = formatDateForReport(new Date())
  const logoPath = logoIcon

  const handleFindCategory = (id: string | null | undefined): ICategory | undefined => {
    if (!id) return undefined
    return categories.value?.find((category) => category._id === id)
  }

  const findMemberData = (id: string) => {
    if (!members.value) return null
    return members.value.find((member) => member._id === id)
  }

  const totalAmount = props.currentData.products
    ? props.currentData.products.reduce((total, product) => {
        return total + (product.price || 0) * (product.quantity || 1)
      }, 0)
    : 0

  const finalAmount = totalAmount - props.currentData.discount - props.currentData.deliveryNo

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>รายงานการขาย - ${props.currentData.item}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Sarabun', sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          font-size: 14px;
        }
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #007bff;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-img {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }
        .report-title {
          background: #e3f2fd;
          padding: 8px 16px;
          border-radius: 4px;
          text-align: center;
          font-weight: 600;
          color: #1976d2;
          font-size: 16px;
          margin: 0 auto;
        }
        .step-timeline {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-left: 3px solid #ddd;
          padding-left: 15px;
          margin-left: 10px;
        }
        .step-item.completed {
          border-left-color: #28a745;
        }
        .step-item.current {
          border-left-color: #007bff;
          font-weight: 600;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin: 20px 0;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .items-table th {
          background: #f8f9fa;
          font-weight: 600;
        }
        .summary-section {
          text-align: right;
          font-size: 14px;
          width: 240px;
          margin-left: auto;
          padding: 12px;
          background: #fff;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          padding: 0 5px;
        }
        .summary-total {
          font-weight: 600;
          font-size: 16px;
          border-top: 2px solid #333;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <div class="logo-section">
            <img src="${logoPath}" alt="Logo" class="logo-img" onerror="this.style.display='none'">
            <div>
              <div style="font-size: 16px; font-weight: 600;">INTER FISH FARM</div>
              <div style="font-size: 12px; color: #666;">อินเตอร์ ฟิชฟาร์ม</div>
            </div>
          </div>
          <div class="report-title">รายงานการขาย</div>
          <div style="text-align: right; font-size: 13px;">
            <div style="font-weight: 600;">ห้างหุ้นส่วนจำกัด อินเตอร์ ฟิช ฟาร์ม</div>
            <div style="font-size: 12px; color: #666;">Inter Fish Farm Part., Ltd</div>
            <div style="margin-top: 10px;">รหัสรายการ: <strong>${
              props.currentData.item
            }</strong></div>
            <div>วันที่: <strong>${currentDate}</strong></div>
          </div>
        </div>

        <div style="margin-bottom: 20px; background: #f8f9fa; padding: 12px 15px; border-radius: 4px;">
          <div style="font-weight: 600; margin-bottom: 8px;">ข้อมูลลูกค้า</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 15px; font-size: 13px;">
            <div><strong>ชื่อลูกค้า:</strong> ${
              findMemberData(props.currentData.user)?.name ||
              findMemberData(props.currentData.user)?.displayName ||
              '-'
            }</div>
            <div><strong>รหัส:</strong> ${findMemberData(props.currentData.user)?.code || '-'}</div>
            <div><strong>ที่อยู่:</strong> ${
              findMemberData(props.currentData.user)?.address || '-'
            }, ${
    memberStore.provinceOptions.find(
      (option) => option.value === findMemberData(props.currentData.user)?.province
    )?.label || '-'
  }</div>
          </div>
        </div>

        <div class="step-timeline">
          <div style="font-weight: 600; margin-bottom: 10px;">ขั้นตอนการขาย</div>
          ${allSteps.value
            .map((step, index) => {
              const isCompleted = isStepCompleted(index)
              const isCurrent = isStepCurrent(index)
              return `
            <div class="step-item ${isCompleted ? 'completed' : isCurrent ? 'current' : ''}">
              <i class="${step.icon}" style="color: ${
                isCompleted ? '#28a745' : isCurrent ? '#007bff' : '#999'
              }"></i>
              <span>${step.label}</span>
              ${
                isCurrent
                  ? '<span style="color: #007bff; font-weight: 600;">(ขั้นตอนปัจจุบัน)</span>'
                  : ''
              }
            </div>
          `
            })
            .join('')}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50px;">ลำดับ</th>
              <th>รายการ</th>
              <th class="text-center" style="width: 80px;">จำนวน</th>
              <th class="text-right" style="width: 120px;">ราคา/หน่วย</th>
              <th class="text-right" style="width: 120px;">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${props.currentData.products
              ?.map((product, index) => {
                const productData = productsData.value?.find((p) => p._id === product.id)
                const category = handleFindCategory(product.category)
                return `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <div style="font-weight: 600;">${product.name || productData?.name || '-'}</div>
                  <div style="font-size: 12px; color: #666;">หมวดหมู่: ${
                    category?.name || '-'
                  }</div>
                </td>
                <td class="text-center">${product.quantity || 1}</td>
                <td class="text-right">${formatCurrency(product.price || 0)}</td>
                <td class="text-right">${formatCurrency(
                  (product.price || 0) * (product.quantity || 1)
                )}</td>
              </tr>
            `
              })
              .join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-row">
            <span>ยอดรวม:</span>
            <span>${formatCurrency(totalAmount)}</span>
          </div>
          <div class="summary-row">
            <span>ค่าส่ง:</span>
            <span>${formatCurrency(props.currentData?.deliveryNo || 0)}</span>
          </div>
          <div class="summary-row">
            <span>ส่วนลด:</span>
            <span>${formatCurrency(props.currentData.discount || 0)}</span>
          </div>
          <div class="summary-row summary-total">
            <span>จำนวนเงินรวมทั้งสิ้น:</span>
            <span>${formatCurrency(finalAmount)}</span>
          </div>
        </div>

        <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
          <div style="font-weight: 600; margin-bottom: 10px;">ข้อมูลการชำระเงิน</div>
          <div style="font-size: 13px;">
            <div>วิธีการชำระเงิน: ${
              props.currentData.payment === 'transfer' ? 'โอนเงิน' : 'อื่นๆ'
            }</div>
            ${
              props.currentData.bankCode
                ? `<div>ธนาคาร: ${
                    BankData[props.currentData.bankCode]?.name || props.currentData.bankCode
                  }</div>`
                : ''
            }
            ${
              props.currentData.bankAccount
                ? `<div>เลขบัญชี: ${props.currentData.bankAccount}</div>`
                : ''
            }
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

const handleDownloadPDF = async () => {
  try {
    const reportContent = generateReportHTML()

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '800px'
    iframe.style.height = '1200px'
    iframe.style.border = 'none'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      throw new Error('Cannot access iframe document')
    }

    iframeDoc.open()
    iframeDoc.write(reportContent)
    iframeDoc.close()

    await new Promise((resolve) => {
      iframe.onload = resolve
      setTimeout(resolve, 1000)
    })

    const images = iframeDoc.querySelectorAll('img')
    const imagePromises = Array.from(images).map((img) => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true)
        } else {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(true)
          setTimeout(() => resolve(true), 2000)
        }
      })
    })
    await Promise.all(imagePromises)

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 800,
        height: iframeDoc.body.scrollHeight,
      })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`Report-${props.currentData.item}.pdf`)
      document.body.removeChild(iframe)
    } catch {
      const pdf = new jsPDF('p', 'mm', 'a4')
      await pdf.html(iframeDoc.body, {
        callback: (doc) => {
          doc.save(`Report-${props.currentData.item}.pdf`)
          document.body.removeChild(iframe)
        },
        x: 10,
        y: 10,
        width: 190,
        windowWidth: 800,
        html2canvas: {
          scale: 0.5,
          useCORS: true,
        },
      })
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    toast.error('เกิดข้อผิดพลาดในการสร้าง PDF')
  }
}

// Check if should show form based on current status
const showFormForCurrentStatus = computed(() => {
  const status = props.currentStatus
  return (
    status === 'order' ||
    status === 'wait_payment' ||
    status === 'preparing' ||
    status === 'shipping'
  )
})

// Check if should show report view
const showReportView = computed(() => {
  return props.currentStatus === 'received' || props.currentStatus === 'damaged'
})
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: showReportView ? '70rem' : '65rem' }"
    :breakpoints="{ '1199px': '95vw', '575px': '95vw' }"
    :pt="{
      header: 'px-6 py-5',
      footer: 'px-6 py-4',
      content: 'px-6 py-0',
    }"
    class="status-manager-dialog"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <i class="pi pi-sync text-white text-xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900">เปลี่ยนขั้นตอนการขาย</h3>
            <p class="text-sm text-gray-500 mt-0.5">
              รายการ: <span class="font-semibold text-gray-700">{{ orderNumber }}</span>
            </p>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showReportView" class="space-y-4">
      <!-- Report View for received/damaged -->
      <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">รายงานการขาย</h2>
          <p class="text-gray-600">รายการ: {{ currentData.item }}</p>
          <Tag
            :value="currentStatusInfo?.label"
            :severity="currentStatusInfo?.color"
            size="large"
            class="mt-3"
          />
        </div>

        <!-- Step Timeline -->
        <div class="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-4">ขั้นตอนการขาย</h4>
          <div class="space-y-2">
            <div
              v-for="(step, index) in allSteps"
              :key="step.key"
              :class="`flex items-center gap-3 p-3 rounded-lg ${
                isStepCompleted(index)
                  ? 'bg-green-50 border border-green-200'
                  : isStepCurrent(index)
                  ? 'bg-blue-50 border-2 border-blue-300'
                  : 'bg-gray-50 border border-gray-200'
              }`"
            >
              <i
                :class="`${step.icon} ${
                  isStepCompleted(index)
                    ? 'text-green-600'
                    : isStepCurrent(index)
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`"
              ></i>
              <span
                :class="`${
                  isStepCompleted(index)
                    ? 'text-green-700'
                    : isStepCurrent(index)
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-500'
                }`"
              >
                {{ step.label }}
              </span>
              <Tag
                v-if="isStepCompleted(index)"
                value="เสร็จสิ้น"
                severity="success"
                size="small"
                class="ml-auto"
              />
              <Tag
                v-else-if="isStepCurrent(index)"
                value="ขั้นตอนปัจจุบัน"
                severity="info"
                size="small"
                class="ml-auto"
              />
            </div>
          </div>
        </div>

        <!-- Products List -->
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-4">รายการสินค้า</h4>
          <div class="space-y-3">
            <div
              v-for="(product, index) in currentData.products"
              :key="product.id"
              class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              <div
                class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <i class="pi pi-box text-gray-400 text-2xl"></i>
              </div>
              <div class="flex-1">
                <div class="font-semibold text-gray-900">
                  {{ product.name || `สินค้า ${index + 1}` }}
                </div>
                <div class="text-sm text-gray-600">
                  จำนวน: {{ product.quantity || 1 }} | ราคา:
                  {{ formatCurrency(product.price || 0) }}
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold text-green-600">
                  {{ formatCurrency((product.price || 0) * (product.quantity || 1)) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <!-- Sale Detail Summary -->

      <SaleDetailSummary
        :sale-data="currentData"
        :member="members?.find((m) => m._id === currentData.user)"
      />

      <!-- Status Selection for order -->
      <div
        v-if="
          (typeof currentData.sellingStatus === 'number'
            ? convertStatusNumberToString(currentData.sellingStatus)
            : currentStatus) === 'order'
        "
        class="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden"
      >
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-blue-200">
          <h4 class="font-semibold text-gray-900 flex items-center gap-2">เลือกขั้นตอนถัดไป</h4>
        </div>
        <div class="p-5">
          <Select
            :model-value="
              typeof saleForm.sellingStatus === 'number'
                ? convertStatusNumberToString(saleForm.sellingStatus)
                : saleForm.sellingStatus
            "
            @update:model-value="
              (value) => (saleForm.sellingStatus = convertStatusStringToNumber(value))
            "
            :options="availableNextStatusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกขั้นตอนถัดไป"
            fluid
            size="small"
            :invalid="!saleForm.sellingStatus && isSubmitting"
            class="mt-2"
          />
          <small v-if="!saleForm.sellingStatus && isSubmitting" class="text-red-500 mt-2 block"
            >กรุณาเลือกขั้นตอนถัดไป</small
          >
        </div>
      </div>

      <!-- Form Section based on current status -->
      <div v-if="showFormForCurrentStatus" class="space-y-5">
        <!-- order: Product selection (optional) -->
        <div
          v-if="
            (typeof currentData.sellingStatus === 'number'
              ? convertStatusNumberToString(currentData.sellingStatus)
              : currentStatus) === 'order'
          "
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div
            class="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-gray-200"
          >
            <div class="flex items-center justify-between">
              <h4 class="font-semibold text-gray-900 flex items-center gap-2">
                <i class="pi pi-box text-blue-600"></i>
                รายการสินค้า
              </h4>
              <Button
                label="เพิ่มสินค้า"
                icon="pi pi-plus"
                severity="success"
                size="small"
                @click="addProduct"
                :disabled="saleForm.products.length >= 10"
              />
            </div>
          </div>
          <div class="p-5 space-y-4">
            <ProductItemForm
              v-for="(product, index) in saleForm.products"
              :key="index"
              :product="product"
              :index="index"
              :is-submitting="isSubmitting"
              :products-data="productsData"
              :is-read-only="false"
              :can-remove="saleForm.products.length > 1"
              @update:product="updateProductForIndex"
              @update:quantity="
                (idx, qty) => {
                  if (saleForm.products) saleForm.products[idx].quantity = qty
                }
              "
              @remove="removeProduct"
            />
          </div>
        </div>

        <!-- wait_payment: Bank selection + Slip upload (mandatory) + Shipping slip (optional) -->
        <div v-if="currentStatus === 'wait_payment'" class="space-y-5">
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div
              class="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-3 border-b border-gray-200"
            >
              <h4 class="font-semibold text-gray-900 flex items-center gap-2">
                <i class="pi pi-credit-card text-green-600"></i>
                ข้อมูลการชำระเงิน
              </h4>
            </div>
            <div class="p-5 space-y-5">
              <BankSelectionSection
                :selected-bank-code="saleForm.bankCode || currentData.bankCode"
                :is-submitting="isSubmitting"
                :is-current-bank="currentData.bankCode"
                :is-current-status="currentStatus"
                @update:selected-bank-code="updateBankCode"
              />

              <div class="border-t border-gray-200 pt-5">
                <SlipUploadSection
                  :sale-id="currentData._id"
                  :selected-status="
                    typeof currentData.sellingStatus === 'number'
                      ? convertStatusNumberToString(currentData.sellingStatus)
                      : currentStatus
                  "
                  :is-current-status="currentStatus"
                  :is-submitting="isSubmitting"
                  @slip-status-changed="handleSlipStatusChanged"
                  @slip-uploaded="handleSlipUploaded"
                />
              </div>

              <div class="border-t border-gray-200 pt-5">
                <ShippingSlipUploadSection
                  :sale-id="currentData._id"
                  :selected-status="
                    typeof currentData.sellingStatus === 'number'
                      ? convertStatusNumberToString(currentData.sellingStatus)
                      : currentStatus
                  "
                  :is-current-status="currentStatus"
                  :is-submitting="isSubmitting"
                  @shipping-slip-status-changed="handleShippingSlipStatusChanged"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- preparing: Shipping slip upload (mandatory) -->
        <div
          v-if="
            (typeof currentData.sellingStatus === 'number'
              ? convertStatusNumberToString(currentData.sellingStatus)
              : currentStatus) === 'preparing'
          "
          class="space-y-5"
        >
          <div
            class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <i class="pi pi-check-circle text-white text-lg"></i>
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-green-900 mb-1">สลิปการโอนเงินยืนยันแล้ว</h4>
                <p class="text-sm text-green-700">
                  กรุณาอัปโหลดใบเสร็จการขนส่งเพื่อดำเนินการจัดส่งสินค้า
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div
              class="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-gray-200"
            >
              <h4 class="font-semibold text-gray-900 flex items-center gap-2">
                <i class="pi pi-truck text-blue-600"></i>
                ใบเสร็จการขนส่ง
                <Tag value="บังคับ" severity="danger" size="small" class="ml-2" />
              </h4>
            </div>
            <div class="p-5">
              <ShippingSlipUploadSection
                :sale-id="currentData._id"
                :selected-status="currentStatus"
                :is-current-status="currentStatus"
                :is-submitting="isSubmitting"
                @shipping-slip-status-changed="handleShippingSlipStatusChanged"
              />
            </div>
          </div>
        </div>

        <!-- shipping: Select received or damaged -->
        <div
          v-if="
            (typeof currentData.sellingStatus === 'number'
              ? convertStatusNumberToString(currentData.sellingStatus)
              : currentStatus) === 'shipping'
          "
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div
            class="bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-3 border-b border-gray-200"
          >
            <h4 class="font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-send text-purple-600"></i>
              สถานะการจัดส่ง
            </h4>
          </div>
          <div class="p-5 space-y-3">
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
                (typeof saleForm.sellingStatus === 'number'
                  ? convertStatusNumberToString(saleForm.sellingStatus)
                  : saleForm.sellingStatus) === option.value
                  ? option.color === 'success'
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-red-500 bg-red-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`"
              @click="saleForm.sellingStatus = convertStatusStringToNumber(option.value)"
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
                  <div class="font-bold text-gray-900 text-lg">{{ option.label }}</div>
                  <div class="text-sm text-gray-600 mt-0.5">{{ option.description }}</div>
                </div>
                <div
                  v-if="
                    (typeof saleForm.sellingStatus === 'number'
                      ? convertStatusNumberToString(saleForm.sellingStatus)
                      : saleForm.sellingStatus) === option.value
                  "
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

        <!-- Payment Calculation (for order, wait_payment) -->
        <div
          v-if="
            (typeof currentData.sellingStatus === 'number'
              ? convertStatusNumberToString(currentData.sellingStatus)
              : currentStatus) === 'order' ||
            (typeof currentData.sellingStatus === 'number'
              ? convertStatusNumberToString(currentData.sellingStatus)
              : currentStatus) === 'wait_payment'
          "
          class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div
            class="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3 border-b border-gray-200"
          >
            <h4 class="font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-calculator text-amber-600"></i>
              การคำนวณราคา
            </h4>
          </div>
          <div class="p-5">
            <PaymentCalculationSection
              :total-amount="totalAmount"
              :deposit="saleForm.deposit"
              :discount="saleForm.discount"
              :delivery-no="saleForm.deliveryNo"
              :is-submitting="isSubmitting"
              :read-only="false"
              @update:deposit="updateDeposit"
              @update:discount="updateDiscount"
              @update:delivery-no="updateDeliveryNo"
            />
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
            <h4 class="font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-file-edit text-gray-600"></i>
              หมายเหตุ
            </h4>
          </div>
          <div class="p-5">
            <Textarea
              v-model="saleForm.note"
              placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
              rows="3"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center gap-3">
        <Button
          v-if="showReportView"
          label="ดาวน์โหลด PDF"
          icon="pi pi-file-pdf"
          @click="handleDownloadPDF"
          severity="info"
          size="small"
          class="font-semibold"
        />

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
            v-if="showFormForCurrentStatus"
            label="บันทึกการเปลี่ยนแปลง"
            icon="pi pi-check"
            severity="success"
            @click="handleSubmit"
            size="small"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            class="font-semibold shadow-md"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>
