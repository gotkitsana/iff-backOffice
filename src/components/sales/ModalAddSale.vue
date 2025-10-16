<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, InputText, Textarea, Select, InputNumber, Button } from 'primevue'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useMemberStore, type IMember } from '@/stores/member/member'
import { useQuery } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import formatCurrency from '@/utils/formatCurrency'
import { useSalesStore } from '@/stores/sales/sales'

// Props
defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// Stores
const productStore = useProductStore()
const memberStore = useMemberStore()
const salesStore = useSalesStore()

// Form data
const saleForm = ref({
  productId: '',
  customerCode: '',
  customerType: '',
  customerName: '',
  customerNickname: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  customerProvince: '',
  productCategory: '',
  productType: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  deposit: 0,
  discount: 0,
  netAmount: 0,
  paymentMethod: '',
  seller: '',
  sellingStatus: '',
  notes: '',
})

// Queries
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products_for_sale'],
  queryFn: () => productStore.onGetProducts(),
})
const { data: members, isLoading: membersLoading } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})

// Computed
const availableProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter((p) => !p.sold && p.auctionOnly === 0)
})

const productOptions = computed(() => {
  return availableProducts.value.map((product) => ({
    label: `${product.name} (${product.size} ซม.) - ${product.category || 'ไม่ระบุหมวดหมู่'}`,
    value: product._id,
    product: product,
  }))
})

const selectedProductDetails = computed(() => {
  if (!saleForm.value.productId || !availableProducts.value) return null
  return availableProducts.value.find((p) => p._id === saleForm.value.productId)
})

const memberOptions = computed(() => {
  if (!members.value) return []
  return members.value.map((member) => ({
    label: `${member.code} - ${member.name || member.displayName}`,
    value: member.code,
    member: member,
  }))
})

const selectedMemberDetails = computed(() => {
  if (!saleForm.value.customerCode || !members.value) return null
  return members.value.find((m) => m.code === saleForm.value.customerCode)
})

// Calculate totals
const subtotal = computed(() => saleForm.value.unitPrice * saleForm.value.quantity)
const discountAmount = computed(() => saleForm.value.discount)
const totalAmount = computed(() => subtotal.value - discountAmount.value)

// Watch for price changes
watch(
  [() => saleForm.value.unitPrice, () => saleForm.value.quantity, () => saleForm.value.discount],
  () => {
    saleForm.value.totalPrice = subtotal.value
    saleForm.value.netAmount = totalAmount.value
  }
)

// Watch for product selection
watch(
  () => saleForm.value.productId,
  (newProductId) => {
    if (newProductId && selectedProductDetails.value) {
      saleForm.value.unitPrice = selectedProductDetails.value.price || 0
    }
  }
)

// Watch for member selection
watch(
  () => saleForm.value.customerCode,
  (newCustomerCode) => {
    if (newCustomerCode && selectedMemberDetails.value) {
      const member = selectedMemberDetails.value
      saleForm.value.customerName = member.name || ''
      saleForm.value.customerNickname = member.displayName || ''
      saleForm.value.customerPhone = member.phone || ''
      saleForm.value.customerEmail = member.email || ''
      saleForm.value.customerAddress = member.address || ''
      saleForm.value.customerProvince = member.province || ''
    }
  }
)

// Handlers
const handleSubmit = () => {
  isSubmitting.value = true
  if (
    !saleForm.value.customerCode ||
    !saleForm.value.productId ||
    !saleForm.value.productType ||
    !saleForm.value.productCategory ||
    !saleForm.value.paymentMethod ||
    !saleForm.value.seller ||
    !saleForm.value.sellingStatus
  ) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  const newSale = {
    id: Date.now(),
    // วันที่ขาย
    saleDate: new Date(),
    // เลขรายการ
    orderNumber: `ORD-2024-${String(Date.now()).slice(-3)}`,
    // สถานะรายการขาย
    status: 'รอชำระเงิน',
    // รหัสลูกค้า
    customerCode: saleForm.value.customerCode,
    // ประเภทลูกค้า
    customerType: saleForm.value.customerType,
    // หมวดหมู่สินค้า
    productCategory: saleForm.value.productCategory,
    // ประเภทสินค้า
    productType: saleForm.value.productType,
    // รายการ
    productName: selectedProductDetails.value?.name || '',
    // จำนวน
    quantity: saleForm.value.quantity,
    // ราคาต่อหน่วย
    unitPrice: saleForm.value.unitPrice,
    // ราคารวม
    totalPrice: saleForm.value.totalPrice,
    // มัดจำ
    deposit: saleForm.value.deposit,
    // ส่วนลด (ถ้ามี)
    discount: saleForm.value.discount,
    // ยอดสุทธิหลังส่วนลด
    netAmount: saleForm.value.netAmount,
    // ช่องทางการชำระเงิน
    paymentMethod: saleForm.value.paymentMethod,
    // ผู้ขาย
    seller: saleForm.value.seller,
    // ชื่อเล่น
    customerNickname: saleForm.value.customerNickname,
    // ชื่อ/สกุล
    customerName: saleForm.value.customerName,
    // ที่อยู่
    customerAddress: saleForm.value.customerAddress,
    // จังหวัด
    customerProvince: saleForm.value.customerProvince,
    // เบอร์โทร
    customerPhone: saleForm.value.customerPhone,
    // สถานะการจัดส่ง
    sellingStatus: saleForm.value.sellingStatus,
    // หมายเหตุ
    notes: saleForm.value.notes,
    // Additional fields
    customerEmail: saleForm.value.customerEmail,
  }
  toast.success('เพิ่มข้อมูลการขายสำเร็จ')
}

const isSubmitting = ref(false)
const handleClose = () => {
  resetForm()
  isSubmitting.value = false
  emit('update:visible', false)
}

const resetForm = () => {
  saleForm.value = {
    productId: '',
    customerCode: '',
    customerType: '',
    customerName: '',
    customerNickname: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerProvince: '',
    productCategory: '',
    productType: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    deposit: 0,
    discount: 0,
    netAmount: 0,
    paymentMethod: '',
    seller: '',
    sellingStatus: '',
    notes: '',
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '70rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
        >
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
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-user text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลลูกค้า</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-hashtag mr-1.5 !text-sm"></i>
              รหัสลูกค้า *
            </label>
            <Select
              v-model="saleForm.customerCode"
              :options="memberOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกรหัสลูกค้า"
              fluid
              size="small"
              :loading="membersLoading"
              :invalid="!saleForm.customerCode && isSubmitting"
            />
            <small v-if="!saleForm.customerCode && isSubmitting" class="text-red-500"
              >กรุณาเลือกรหัสลูกค้า</small
            >
          </div>
        </div>

        <!-- Selected Member Details -->
        <div
          v-if="selectedMemberDetails"
          class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
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
                รหัส: {{ selectedMemberDetails.code }} | ชื่อเล่น:
                {{ selectedMemberDetails.displayName || '-' }} | เบอร์:
                {{ selectedMemberDetails.phone || '-' }} | ประเภทลูกค้า:
                {{
                  memberStore.memberTypeOptions.find(
                    (option) => option.value === selectedMemberDetails?.type
                  )?.label || '-'
                }}
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
      </div>

      <!-- Product Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-warehouse text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลสินค้า</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">


          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tags mr-1.5 !text-sm"></i>
              หมวดหมู่สินค้า
            </label>
            <Select
              v-model="saleForm.productType"
              :options="salesStore.productTypes"
              optionLabel="label"
              optionValue="value"
              fluid
              placeholder="เลือกหมวดหมู่สินค้า"
              size="small"
              :invalid="!saleForm.productType && isSubmitting"
            />
            <small v-if="!saleForm.productType && isSubmitting" class="text-red-500"
              >กรุณาเลือกหมวดหมู่สินค้า</small
            >
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tag mr-1.5 !text-sm"></i>
              เลือกสินค้า *
            </label>
            <Select
              v-model="saleForm.productId"
              :options="productOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกสินค้าที่ต้องการขาย"
              fluid
              size="small"
              :invalid="!saleForm.productId && isSubmitting"
            />
            <small v-if="!saleForm.productId && isSubmitting" class="text-red-500"
              >กรุณาเลือกสินค้า</small
            >
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-sort-numeric-up mr-1.5 !text-sm"></i>
              จำนวน *
            </label>
            <InputNumber
              v-model="saleForm.quantity"
              :min="1"
              :max="10"
              fluid
              size="small"
              placeholder="กรอกจำนวน"
            />
          </div>
        </div>

        <!-- Selected Product Details -->
        <div
          v-if="selectedProductDetails"
          class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-fish text-blue-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <h5 class="font-semibold text-gray-900">{{ selectedProductDetails.name }}</h5>
              <p class="text-sm text-gray-600">
                {{ selectedProductDetails.category || 'ไม่ระบุหมวดหมู่' }} -
                {{ selectedProductDetails.size }} ซม.
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ selectedProductDetails.detail }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-green-600">
                {{
                  selectedProductDetails.price
                    ? formatCurrency(selectedProductDetails.price)
                    : 'ไม่ระบุราคา'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-dollar text-yellow-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลราคา</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-money-bill mr-1.5 !text-sm"></i>
              ราคาต่อหน่วย (บาท) *
            </label>
            <InputNumber
              v-model="saleForm.unitPrice"
              :min="0"
              :max="999999999"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-wallet mr-1.5 !text-sm"></i>
              มัดจำ (บาท)
            </label>
            <InputNumber
              v-model="saleForm.deposit"
              :min="0"
              :max="saleForm.unitPrice * saleForm.quantity"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-percentage mr-1.5 !text-sm"></i>
              ส่วนลด (บาท)
            </label>
            <InputNumber
              v-model="saleForm.discount"
              :min="0"
              :max="saleForm.unitPrice * saleForm.quantity"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-credit-card mr-1.5 !text-sm"></i>
              วิธีการชำระเงิน *
            </label>
            <Select
              v-model="saleForm.paymentMethod"
              :options="salesStore.paymentMethods"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              placeholder="เลือกวิธีการชำระเงิน"
              :invalid="!saleForm.paymentMethod && isSubmitting"
            />
            <small v-if="!saleForm.paymentMethod && isSubmitting" class="text-red-500"
              >กรุณาเลือกวิธีการชำระเงิน</small
            >
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ผู้ขาย
            </label>
            <Select
              v-model="saleForm.seller"
              :options="salesStore.sellers"
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

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-truck mr-1.5 !text-sm"></i>
              สถานะการขาย
            </label>
            <Select
              v-model="saleForm.sellingStatus"
              :options="salesStore.sellingStatusOptions"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              placeholder="เลือกสถานะการขาย"
              :invalid="!saleForm.sellingStatus && isSubmitting"
            />
            <small v-if="!saleForm.sellingStatus && isSubmitting" class="text-red-500"
              >กรุณาเลือกสถานะการขาย</small
            >
          </div>
        </div>

        <!-- Price Summary -->
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-gray-600">ยอดรวมก่อนส่วนลด:</span>
            <span class="font-medium">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-gray-600">มัดจำ:</span>
            <span class="font-medium text-blue-600">{{ formatCurrency(saleForm.deposit) }}</span>
          </div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-gray-600">ส่วนลด:</span>
            <span class="font-medium text-red-600">-{{ formatCurrency(discountAmount) }}</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-gray-200">
            <span class="font-semibold! text-gray-900">ยอดสุทธิหลังส่วนลด:</span>
            <span class="font-semibold! text-green-600">{{ formatCurrency(totalAmount) }}</span>
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
          v-model="saleForm.notes"
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
          label="บันทึกข้อมูล"
          icon="pi pi-check"
          @click="handleSubmit"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
