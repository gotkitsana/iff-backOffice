<script setup lang="ts">
import { computed } from 'vue'
import { Image as PrimeImage } from 'primevue'
import ProductHistorySection from '../shared/ProductHistorySection.vue'
import PaymentCalculationSection from '../forms/PaymentCalculationSection.vue'
import { useMemberStore } from '@/stores/member/member'
import type { IProduct } from '@/stores/product/product'
import type { ISales } from '@/types/sales'
import { getSlipUrl, getShippingSlipUrl } from '@/utils/imageUrl'

// Props
const props = defineProps<{
  currentData: ISales
  productsData?: IProduct[]
  hasSlip: boolean
  hasShippingSlip: boolean
  totalAmount?: number
}>()

const memberStore = useMemberStore()

const findProvinceData = (id: string) => {
  if (!id) return null
  return memberStore.provinceOptions.find((province) => province.value === id)
}

const slipUrl = computed(() => {
  if (!props.currentData._id || !props.hasSlip) return ''
  return getSlipUrl(props.currentData._id)
})

const shippingSlipUrl = computed(() => {
  if (!props.currentData._id || !props.hasShippingSlip) return ''
  return getShippingSlipUrl(props.currentData._id, 'jpg')
})

// Calculate total amount from products
const totalAmount = computed(() => {
  if (props.totalAmount !== undefined) {
    return props.totalAmount
  }

  // Calculate from products if totalAmount not provided
  if (!props.currentData.products || props.currentData.products.length === 0) {
    return 0
  }

  return props.currentData.products.reduce((sum, product) => {
    return sum + (product.price || 0) * (product.quantity || 1)
  }, 0)
})

// Note: netAmount is calculated inside PaymentCalculationSection component
</script>

<template>
  <div class="space-y-4">
    <!-- สินค้า -->
    <ProductHistorySection
      :products="
        (currentData.products || []).map((p) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          unit: p.unit,
          price: p.price,
          category: p.category || undefined,
        }))
      "
      :custom-products="currentData.customProducts"
      :products-data="productsData"
    />

    <!-- การคำนวณยอดเงิน -->
    <PaymentCalculationSection
      :total-amount="totalAmount"
      :deposit="currentData.deposit || 0"
      :discount="currentData.discount || 0"
      :delivery-no="currentData.deliveryNo || 0"
      :is-submitting="false"
      :read-only="true"
    />

    <!-- ที่อยู่จัดส่ง -->
    <div
      v-if="currentData.shippingAddress || currentData.shippingProvince"
      class="bg-white border border-gray-200 rounded-xl p-4"
    >
      <h4 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
        <i class="pi pi-map-marker text-green-600"></i>
        ที่อยู่จัดส่ง
      </h4>
      <div class="text-sm text-gray-700">
        {{ currentData.shippingAddress }}
        <span v-if="currentData.shippingProvince">
          , {{ findProvinceData(currentData.shippingProvince)?.label }}
        </span>
      </div>
    </div>

    <!-- ข้อมูลธนาคาร -->
    <div v-if="currentData.bankCode" class="bg-white border border-gray-200 rounded-xl p-4">
      <h4 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
        <i class="pi pi-building text-purple-600"></i>
        ข้อมูลธนาคาร
      </h4>
      <div class="space-y-2">
        <div class="text-sm text-gray-700">
          <span class="font-medium">ธนาคาร:</span> {{ currentData.bankCode }}
        </div>
        <div v-if="currentData.bankAccount" class="text-sm text-gray-700">
          <span class="font-medium">เลขบัญชี:</span> {{ currentData.bankAccount }}
        </div>
      </div>
    </div>

    <!-- สลิปการโอนเงิน -->
    <div v-if="hasSlip" class="bg-white border border-gray-200 rounded-xl p-4">
      <h4 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
        <i class="pi pi-file text-blue-600"></i>
        สลิปการโอนเงิน
      </h4>
      <div class="relative">
        <PrimeImage
          :src="slipUrl"
          :alt="'สลิปการโอนเงิน'"
          :preview="true"
          class="max-w-[120px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
        />
      </div>
    </div>

    <!-- ใบเสร็จการขนส่ง -->
    <div v-if="hasShippingSlip" class="bg-white border border-gray-200 rounded-xl p-4">
      <h4 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
        <i class="pi pi-truck text-orange-600"></i>
        ใบเสร็จการขนส่ง
      </h4>
      <div class="relative">
        <PrimeImage
          :src="shippingSlipUrl"
          :alt="'ใบเสร็จการขนส่ง'"
          :preview="true"
          class="max-w-[120px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
        />
      </div>
    </div>

    <!-- ข้อความเมื่อไม่มีข้อมูล -->
    <div
      v-if="
        (!currentData.products || currentData.products.length === 0) &&
        (!currentData.customProducts || currentData.customProducts.length === 0) &&
        !currentData.shippingAddress &&
        !currentData.bankCode &&
        !hasSlip &&
        !hasShippingSlip
      "
      class="bg-white border border-gray-200 rounded-lg p-4 text-center"
    >
      <div class="text-sm text-gray-500 italic">ยังไม่มีข้อมูลประวัติการอัพเดท</div>
    </div>
  </div>
</template>

