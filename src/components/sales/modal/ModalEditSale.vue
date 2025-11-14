<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { Dialog, Textarea, Select, Button } from 'primevue'
import { useMemberStore, type IMember, type UpdateMemberPayload } from '@/stores/member/member'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import { useSalesStore } from '@/stores/sales/sales'
import type { ISales, IUpdateSalesPayload, SellingStatus, StatusWorkflow } from '@/types/sales'
import BankSelectionSection from '../BankSelectionSection.vue'
import SlipUploadSection from '../SlipUploadSection.vue'
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
import {
  validateStatusForEdit,
  getAvailableStatuses,
  canEditField,
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
  bankCode: '',
  bankAccount: '',
  cat: 0,
  item: '',
  status: '',
  user: '',
  products: [{ id: '', quantity: 1, category: '', price: 0 }],
  deposit: 0,
  discount: 0,
  seller: '',
  note: '',
  deliveryNo: 0,
  delivery: '',
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

// Computed
const totalAmount = ref(0)

const selectedMemberDetails = computed(() => {
  if (!saleForm.value.user || !members.value) return null
  return members.value.find((m) => m._id === saleForm.value.user)
})

// Status step checking
const getStatusStepIndex = (status: string) => {
  return salesStore.sellingStatusOptions.findIndex((option) => option.value === status)
}

const requiresBankSelection = computed(() => {
  const currentStepIndex = getStatusStepIndex(saleForm.value.status)
  const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
  return currentStepIndex >= waitPaymentStepIndex
})

const requiresSlipUpload = computed(() => {
  const currentStepIndex = getStatusStepIndex(saleForm.value.status)
  const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
  return currentStepIndex > waitPaymentStepIndex
})

// Disable selecting steps that are earlier than current persisted status
const statusOptionsForSelect = computed(() => {
  const availableStatuses = getAvailableStatuses(props.saleData.status as SellingStatus, 'edit')
  return salesStore.sellingStatusOptions.map((opt) => ({
    ...opt,
    disabled: !availableStatuses.includes(opt.value as SellingStatus),
  }))
})

// Check if can edit fields based on current status
const canEditProducts = computed(() => {
  return canEditField('products', props.saleData.status as SellingStatus)
})

const canEditBankInfo = computed(() => {
  return canEditField('bankInfo', props.saleData.status as SellingStatus)
})

const canEditSlip = computed(() => {
  return canEditField('slip', props.saleData.status as SellingStatus)
})

const canEditShippingSlip = computed(() => {
  return canEditField('shippingSlip', props.saleData.status as SellingStatus)
})

// Product management functions
const addProduct = () => {
  if (saleForm.value.products.length < 10) {
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

const updateProductForIndex = (index: number, value: string | Record<string, any>) => {
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

// Handlers
const populateForm = (saleData: ISales) => {
  if (!saleData) return

  // แปลงข้อมูลจาก ISales เป็น ICreateSalesPayload
  saleForm.value = {
    _id: saleData._id || '',
    payment: saleData.payment || 'cash',
    bankCode: saleData.bankCode || '',
    bankAccount: saleData.bankAccount || '',
    cat: saleData.cat || 0,
    item: saleData.item || '',
    status: saleData.status || '',
    user: saleData.user?._id || '',
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

  // Check if all products are valid
  const hasValidProducts = saleForm.value.products.some((p) => p.id && p.quantity > 0)

  // Use utility function for status validation
  const validationResult = validateStatusForEdit({
    selectedStatus: saleForm.value.status as SellingStatus,
    hasProducts: hasValidProducts,
    hasBankInfo: !!saleForm.value.bankCode,
    hasSlip: hasSlip.value,
    hasShippingSlip: false, // Edit mode doesn't have shipping slip check
    currentStatus: props.saleData.status as SellingStatus,
    mode: 'edit',
  })

  // Show validation errors
  if (!validationResult.isValid) {
    validationResult.errors.forEach((error) => {
      toast.error(error)
    })
    isSubmitting.value = false
    return
  }

  // Use final status from validation result
  updateSale({
    ...saleForm.value,
    status: validationResult.finalStatus,
  })
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

      if (
        salesStore.statusWorkflow[variables.status as keyof StatusWorkflow]?.stepOrder >=
        salesStore.statusWorkflow['preparing'].stepOrder
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
                    salesStore.statusWorkflow['preparing'].stepOrder &&
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

const { mutate: mutateUpdate } = useMutation({
  mutationFn: (payload: UpdateMemberPayload) => memberStore.onUpdateMember(payload),
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
    bankCode: '',
    bankAccount: '',
    cat: 0,
    item: '',
    status: '',
    user: '',
    products: [{ id: '', quantity: 1, category: '', price: 0 }],
    deposit: 0,
    discount: 0,
    seller: '',
    note: '',
    deliveryNo: 0,
    delivery: '',
  }
}

const hasSlip = ref(false)

const handleSlipStatusChanged = (status: boolean) => {
  hasSlip.value = status
}

// Auto-update status to preparing when slip is uploaded and current status < preparing
const handleSlipUploaded = async (saleId: string) => {
  if (!saleId || !props.saleData._id || saleId !== props.saleData._id) return

  const currentStepIndex = getStatusStepIndex(props.saleData.status)
  const preparingStepIndex = getStatusStepIndex('preparing')

  // Only auto-change if current status < preparing
  if (currentStepIndex < preparingStepIndex) {
    // Update status to preparing
    const updatedPayload: IUpdateSalesPayload = {
      _id: props.saleData._id,
      status: 'preparing',
      bankCode: saleForm.value.bankCode || props.saleData.bankCode,
      bankAccount: props.saleData.bankAccount,
      item: props.saleData.item,
      user: props.saleData.user._id,
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
          <div>
            <Select
              v-model="saleForm.status"
              :options="statusOptionsForSelect"
              optionLabel="label"
              optionValue="value"
              optionDisabled="disabled"
              fluid
              size="small"
              placeholder="เลือกสถานะรายการขาย"
              :invalid="!saleForm.status && isSubmitting"
            />
            <small v-if="!saleForm.status && isSubmitting" class="text-red-500"
              >กรุณาเลือกสถานะรายการขาย</small
            >
          </div>

          <div>
            <Select
              v-model="saleForm.seller"
              :options="sellers"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              placeholder="เลือกผู้ขาย"
              :invalid="!saleForm.seller && isSubmitting"
            />
            <small v-if="!saleForm.seller && isSubmitting" class="text-red-500"
              >กรุณาเลือกผู้ขาย</small
            >
          </div>
        </div>

        <!-- Bank Selection (if required) -->
        <BankSelectionSection
          v-if="requiresBankSelection && canEditBankInfo"
          :selected-bank-code="saleForm.bankCode || ''"
          :is-submitting="isSubmitting"
          :is-current-bank="props.saleData.bankCode"
          :is-current-status="props.saleData.status"
          @update:selected-bank-code="updateBankCode"
        />

        <!-- Slip Upload Section -->
        <SlipUploadSection
          v-if="requiresSlipUpload && canEditSlip"
          :sale-id="props.saleData._id || ''"
          :selected-status="saleForm.status"
          :is-current-status="props.saleData.status"
          :is-submitting="isSubmitting"
          @slip-status-changed="handleSlipStatusChanged"
          @slip-uploaded="handleSlipUploaded"
        />
      </div>

      <!-- Product Management -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
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
