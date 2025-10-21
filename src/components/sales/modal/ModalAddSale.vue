<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, Textarea, Select, InputNumber, Button, Card, Tag } from 'primevue'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useMemberStore, type IMember } from '@/stores/member/member'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import formatCurrency from '@/utils/formatCurrency'
import { useSalesStore } from '@/stores/sales/sales'
import { useCategoryStore, type ICategory } from '@/stores/auction/category'
import type { ICreateSalesPayload } from '@/types/sales'
import CardProductList from '../CardProductList.vue'

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
const categoryStore = useCategoryStore()

// Form data
const saleForm = ref<ICreateSalesPayload>({
  item: '',
  status: '',
  user: '',
  products: [{ id: '', quantity: 1 }],
  deposit: 0,
  discount: 0,
  seller: '',
  note: '',
})

// Queries
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: members, isLoading: membersLoading } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})

const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(),
})

const handleFindCategory = (id: string | null | undefined) => {
  if (!id) return ''
  return categories.value?.find((category) => category._id === id)?.name
}

// Computed
const availableProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter((p) => !p.sold && p.auctionOnly === 0)
})

const productOptions = computed(() => {
  return availableProducts.value.map((product) => ({
    label: `${product.name} (รหัส: ${product.sku})`,
    value: product._id,
  }))
})

const getProductOptionsForIndex = (currentIndex: number) => {
  if (!availableProducts.value) return []

  // ดึงรายการ ID ของสินค้าที่เลือกแล้ว (ยกเว้น index ปัจจุบัน)
  const selectedProductIds = saleForm.value.products
    .map((p, index) => index !== currentIndex ? p.id : '')
    .filter(id => id !== '')

  // กรองสินค้าที่ยังไม่ได้เลือก
  const unselectedProducts = availableProducts.value.filter(
    product => !selectedProductIds.includes(product._id)
  )

  return unselectedProducts.map((product) => ({
    label: `${product.name} (รหัส: ${product.sku})`,
    value: product._id,
  }))
}

const selectedProductDetails = computed(() => {
  return saleForm.value.products.map((product: { id: string; quantity: number }) => {
    if (!product.id || !availableProducts.value) return null
    return {
      ...availableProducts.value.find((p) => p._id === product.id),
      quantity: product.quantity,
    }
  })
})

const totalAmount = computed(() => {
  return saleForm.value.products.reduce((sum, product) => {
    const productDetail = availableProducts.value?.find((p) => p._id === product.id)
    if (productDetail && productDetail.price) {
      return sum + productDetail.price * product.quantity
    }
    return sum
  }, 0)
})

const netAmount = computed(() => {
  const netAmount = totalAmount.value - saleForm.value.discount
  return netAmount < 0 ? 0 : netAmount
})

const memberOptions = computed(() => {
  if (!members.value) return []
  return members.value.map((member) => {
    const code = member.code.charAt(0).toUpperCase() + member.code.slice(1)
    return {
      label: `${code} - ${member.name || member.displayName}`,
      value: member._id,
    }
  })
})

const selectedMemberDetails = computed(() => {
  if (!saleForm.value.user || !members.value) return null
  return members.value.find((m) => m._id === saleForm.value.user)
})

// Product management functions
const addProduct = () => {
  if (saleForm.value.products.length < 10) {
    saleForm.value.products.push({ id: '', quantity: 1 })
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

const isProductValid = (product: { id: string; quantity: number }) => {
  return product.id && product.quantity > 0
}

// Handlers
const handleSubmit = () => {
  isSubmitting.value = true

  // Validation
  if (!saleForm.value.user) {
    toast.error('กรุณาเลือกลูกค้า')
    return
  }

  if (!saleForm.value.status) {
    toast.error('กรุณาเลือกสถานะรายการขาย')
    return
  }

  if (!saleForm.value.seller) {
    toast.error('กรุณาเลือกผู้ขาย')
    return
  }

  // Check if all products are valid
  const invalidProducts = saleForm.value.products.filter((p) => !isProductValid(p))
  if (invalidProducts.length > 0) {
    toast.error('กรุณาเลือกสินค้าและระบุจำนวนให้ครบถ้วน')
    return
  }

  createSale({
    ...saleForm.value,
    item: `SALE-${Date.now().toString().slice(-8)}`,
  })
}

const queryClient = useQueryClient()
const { mutate: createSale, isPending: isCreatingSale } = useMutation({
  mutationFn: (sale: ICreateSalesPayload) => salesStore.onCreateSales(sale),
  onSuccess: (data: any) => {
    if(data.data) {
      toast.success('เพิ่มข้อมูลการขายสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_sales'] })
      handleClose()
    } else {
      toast.error('เพิ่มข้อมูลการขายไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('เพิ่มข้อมูลการขายไม่สำเร็จ')
  },
})

const isSubmitting = ref(false)
const handleClose = () => {
  resetForm()
  isSubmitting.value = false
  emit('update:visible', false)
}

const resetForm = () => {
  saleForm.value = {
    item: '',
    status: '',
    user: '',
    products: [{ id: '', quantity: 1 }],
    deposit: 0,
    discount: 0,
    seller: '',
    note: '',
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              v-model="saleForm.user"
              :options="memberOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกลูกค้า"
              fluid
              size="small"
              :loading="membersLoading"
              :invalid="!saleForm.user && isSubmitting"
              filter
            />
            <small v-if="!saleForm.user && isSubmitting" class="text-red-500"
              >กรุณาเลือกลูกค้า</small
            >
          </div>

          <div>
            <Select
              v-model="saleForm.status"
              :options="salesStore.sellingStatusOptions"
              optionLabel="label"
              optionValue="value"
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
      </div>

      <!-- Product Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
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

        <div class="space-y-4">
          <div
            v-for="(product, index) in saleForm.products"
            :key="index"
            class="p-3 bg-gray-50 border border-gray-200 rounded-xl"
          >
            <div class="flex items-center justify-between mb-2">
              <h5 class="text-sm font-semibold text-gray-700">สินค้า {{ index + 1 }}</h5>
              <Button
                v-if="saleForm.products.length > 1"
                icon="pi pi-trash"
                severity="danger"
                size="small"
                text
                rounded
                @click="removeProduct(index)"
                v-tooltip.top="'ลบสินค้านี้'"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Select
                  v-model="product.id"
                  :options="getProductOptionsForIndex(index)"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือกสินค้าที่ต้องการขาย"
                  fluid
                  size="small"
                  :invalid="!product.id && isSubmitting"
                  showClear
                />
                <small v-if="!product.id && isSubmitting" class="text-red-500"
                  >กรุณาเลือกสินค้า</small
                >
              </div>

              <div>
                <InputNumber
                  v-model="product.quantity"
                  :min="1"
                  :max="100"
                  fluid
                  size="small"
                  placeholder="ระบุจำนวนสินค้า"
                  :invalid="!product.quantity && isSubmitting"
                />
                <small v-if="!product.quantity && isSubmitting" class="text-red-500"
                  >กรุณากรอกจำนวนสินค้า</small
                >
              </div>
            </div>

            <CardProductList
              v-if="selectedProductDetails[index]"
              :name="selectedProductDetails[index]?.name || ''"
              :quantity="selectedProductDetails[index]?.quantity || 0"
              :price="selectedProductDetails[index]?.price || 0"
              :detail="selectedProductDetails[index]?.detail || ''"
              :category="handleFindCategory(selectedProductDetails[index]?.category) || ''"
            />
          </div>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              มัดจำ (บาท)
            </label>
            <InputNumber
              v-model="saleForm.deposit"
              :min="0"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
              placeholder="ระบุยอดมัดจำ"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              ส่วนลด (บาท)
            </label>
            <InputNumber
              v-model="saleForm.discount"
              :min="0"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
              placeholder="ระบุส่วนลด"
            />
          </div>
        </div>

        <!-- Summary -->
        <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-calculator text-green-600"></i>
              <span class="font-semibold text-gray-800">สรุปยอดเงิน</span>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-600">
                มูลค่าสินค้า: {{ formatCurrency(totalAmount) }}
              </div>
              <div v-if="saleForm.discount > 0" class="text-sm text-red-600 my-0.5">
                ส่วนลด: {{ formatCurrency(saleForm.discount) }}
              </div>
              <div v-if="saleForm.deposit > 0" class="text-sm text-blue-600">
                มัดจำ: {{ formatCurrency(saleForm.deposit) }}
              </div>
              <div class="font-[500]! text-green-600 border-t border-green-300 pt-1 mt-1">
                ยอดสุทธิ: {{ formatCurrency(netAmount)}}
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
          label="บันทึกข้อมูล"
          icon="pi pi-check"
          @click="handleSubmit"
          :loading="isCreatingSale"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
