<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Textarea, Select, Button } from 'primevue'
import { useMemberStore, type IMember, type UpdateMemberPayload } from '@/stores/member/member'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import { useSalesStore } from '@/stores/sales/sales'
import type { ISales, IUpdateSalesPayload, StatusWorkflow } from '@/types/sales'
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
import { getProductImageUrl } from '@/utils/imageUrl'
import { executeStockDeduction } from '@/utils/stockDeduction'
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
  const baseIndex = getStatusStepIndex(props.saleData.status)
  return salesStore.sellingStatusOptions.map((opt) => ({
    ...opt,
    disabled: getStatusStepIndex(opt.value) < baseIndex,
  }))
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

const updateProducts = (
  products: Array<{ id: string; quantity: number; category: string; price: number }>
) => {
  saleForm.value.products = products
}

// Helper functions for ProductItemForm
const handleFindCategory = (id: string | null | undefined): ICategory | undefined => {
  if (!id) return undefined
  return categories.value?.find((category) => category._id === id)
}

const imageUrlCache = new Map<string, string>()
const getImageUrl = (filename: string): string => {
  if (imageUrlCache.has(filename)) {
    return imageUrlCache.get(filename)!
  }
  const url = getProductImageUrl(filename)
  imageUrlCache.set(filename, url)
  return url
}

const availableProducts = computed(() => {
  if (!productsData.value) return []
  return productsData.value.filter((p) => p.auctionOnly === 0)
})

const getProductOptionsForIndex = (currentIndex: number) => {
  if (!availableProducts.value) return []

  const selectedProductIds = saleForm.value.products
    ?.map((p, index) => (index !== currentIndex ? p.id : ''))
    .filter((id) => id !== '')

  const unselectedProducts = availableProducts.value.filter(
    (product) => !selectedProductIds?.includes(product._id)
  )

  const groupsMap = new Map<
    string,
    {
      label: string
      children: Array<{
        label: string
        value: string
        image?: string
        disabled?: boolean
        sold?: boolean
        balance?: number
        isFish?: boolean
        sku?: string
      }>
    }
  >()

  unselectedProducts.forEach((product) => {
    const catId = product.category?._id || 'unknown'
    const cat = handleFindCategory(product.category?._id)
    const isFish = cat?.value === 'fish'
    const isFood = cat?.value === 'food'

    const groupLabel = isFood ? 'อาหาร (กระสอบ)' : cat?.name || 'ไม่ระบุหมวดหมู่'
    const group = groupsMap.get(catId) || {
      label: groupLabel,
      children: [],
    }

    const imageUrl =
      product.images && product.images.length > 0
        ? getImageUrl(product.images[0].filename)
        : undefined

    const isSold = isFish ? product.sold : product.sold || (product.balance || 0) === 0

    group.children.push({
      label: `${product.name || `${product.species?.name}`}`,
      sku: product.sku || '',
      value: product._id,
      image: imageUrl,
      disabled: isSold,
      sold: product.sold,
      balance: product.balance,
      isFish: isFish,
    })

    groupsMap.set(catId, group)
  })

  const treeNodes = Array.from(groupsMap.values()).map((group, groupIndex) => ({
    key: `group-${groupIndex}`,
    label: group.label,
    selectable: false,
    children: group.children
      .sort((a, b) => {
        if (a.disabled && !b.disabled) return 1
        if (!a.disabled && b.disabled) return -1
        return a.label.localeCompare(b.label)
      })
      .map((item) => ({
        key: item.value,
        label: item.label,
        value: item.value,
        data: item,
        selectable: !item.disabled,
        disabled: item.disabled,
        sku: item.sku,
        image: item.image,
        sold: item.sold,
        balance: item.balance,
        isFish: item.isFish,
      })),
  }))

  return treeNodes
}

const selectedProductDetails = computed(() => {
  return saleForm.value.products?.map(
    (product: { id: string; quantity: number; category: string; price: number }) => {
      if (!product.id) return null

      if (!availableProducts.value) return null
      const productDetail = availableProducts.value?.find((p) => p._id === product.id)

      const category = handleFindCategory(productDetail?.category?._id)
      const imageUrl =
        productDetail?.images && productDetail?.images.length > 0
          ? getProductImageUrl(productDetail?.images[0].filename)
          : undefined

      if (!productDetail) {
        return {
          name: '',
          price: 0,
          quantity: product.quantity,
          isMissing: true,
          category: undefined,
          image: undefined,
          sku: '',
          balance: 0,
        }
      }

      return {
        ...productDetail,
        quantity: product.quantity,
        isMissing: false,
        category: category,
        image: imageUrl,
      }
    }
  )
})

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

  const product = availableProducts.value?.find((p) => p._id === selectedId)
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

const getSelectedProduct = (id: string) => {
  return availableProducts.value?.find((p) => p._id === id)
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

const updateTotalAmount = (amount: number) => {
  totalAmount.value = amount
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
  const invalidProducts = saleForm.value.products.filter((p) => !(p.id && p.quantity > 0))
  if (invalidProducts.length > 0) {
    toast.error('กรุณาเลือกสินค้าและระบุจำนวนให้ครบถ้วน')
    return
  }

  // Check bank selection requirement
  if (requiresBankSelection.value && !saleForm.value.bankCode) {
    toast.error('กรุณาเลือกบัญชีธนาคารสำหรับการชำระเงิน')
    return
  }

  // Check slip upload requirement
  if (requiresSlipUpload.value && !hasSlip.value) {
    toast.error('กรุณาอัปโหลดสลิปการโอนเงิน')
    return
  }

  updateSale(saleForm.value)
}

const { data: productsData, refetch: refetchProducts } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

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
          v-if="requiresBankSelection"
          :selected-bank-code="saleForm.bankCode || ''"
          :is-submitting="isSubmitting"
          :is-current-bank="props.saleData.bankCode"
          :is-current-status="props.saleData.status"
          @update:selected-bank-code="updateBankCode"
        />

        <!-- Slip Upload Section -->
        <SlipUploadSection
          v-if="requiresSlipUpload"
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
            v-if="getStatusStepIndex(props.saleData.status) < getStatusStepIndex('preparing')"
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
            :product-options="getProductOptionsForIndex(index)"
            :selected-product-details="selectedProductDetails?.[index]"
            :available-products="availableProducts"
            :products-data="productsData"
            :categories="categories"
            :can-remove="saleForm.products.length > 1 && getStatusStepIndex(props.saleData.status) < getStatusStepIndex('preparing')"
            :handle-find-category="handleFindCategory"
            :get-image-url="getImageUrl"
            :get-selected-product="getSelectedProduct"
            :is-read-only="getStatusStepIndex(props.saleData.status) >= getStatusStepIndex('preparing')"
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
        :read-only="getStatusStepIndex(props.saleData.status) >= getStatusStepIndex('preparing')"
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
