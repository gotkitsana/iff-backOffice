<script setup lang="ts">
import type { ICategory } from '@/stores/product/category'
import type { IFieldsKeyRetail, IFieldsRetail } from '@/stores/product/food_sale'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useSalePercentStore, type ISalePercent } from '@/stores/product/sale_percent'
import { getProductImageUrl } from '@/utils/imageUrl'
import dayjs from 'dayjs'

import { useQuery } from '@tanstack/vue-query'
import {
  InputText,
  InputNumber,
  Select,
  Textarea,
  DatePicker,
  Checkbox,
  Message,
  Card,
} from 'primevue'
import { computed, watch } from 'vue'

const props = defineProps<{
  fields: IFieldsRetail[]
  formData: Record<IFieldsKeyRetail, string | number | Date | null>
  isSubmitting: boolean
  categoryId: ICategory | null
}>()

const emit = defineEmits<{
  'update-field': [key: IFieldsKeyRetail, value: string | number | Date | null]
}>()

const updateField = (key: IFieldsKeyRetail, value: string | number | Date | null) => {
  emit('update-field', key, value)
}

const productStore = useProductStore()

const salePercentStore = useSalePercentStore()
const { data: salePercents } = useQuery<ISalePercent[]>({
  queryKey: ['get_sale_percents'],
  queryFn: () => salePercentStore.onGetSalePercents(),
})
const customerKiloPricePercent = computed(() => {
  if (!salePercents.value || !props.categoryId) return null
  return salePercents.value.find(
    (sp) => sp.name === 'customerPriceKilo' && sp.category._id === props.categoryId?._id
  )
})
const dealerKiloPricePercent = computed(() => {
  if (!salePercents.value || !props.categoryId) return null
  return salePercents.value.find(
    (sp) => sp.name === 'dealerPriceKilo' && sp.category._id === props.categoryId?._id
  )
})
const hasMissingPercent = computed(() => {
  if (!props.categoryId) return false
  const hasCustomerPercent = !!customerKiloPricePercent.value
  const hasDealerPercent = !!dealerKiloPricePercent.value
  return !hasCustomerPercent || !hasDealerPercent
})

const missingPercentMessage = computed(() => {
  const missing: string[] = []
  if (!customerKiloPricePercent.value) missing.push('ราคาลูกค้า')
  if (!dealerKiloPricePercent.value) missing.push('ราคาพ่อค้า')

  if (missing.length > 0) {
    return `กรุณาตั้งค่าเปอร์เซ็นต์กำไรสำหรับ: ${missing.join(', ')}`
  }
  return ''
})

watch(
  () => props.formData.costPriceKilo,
  (newCostPriceKilo) => {
    if (typeof newCostPriceKilo === 'number' && newCostPriceKilo > 0) {
      // คำนวณ customerPrice
      if (customerKiloPricePercent.value) {
        const customerPriceKilo =
          newCostPriceKilo * (1 + customerKiloPricePercent.value.percent / 100)
        emit('update-field', 'customerPriceKilo', Math.round(customerPriceKilo * 100) / 100)
      }

      // คำนวณ dealerPrice
      if (dealerKiloPricePercent.value) {
        const dealerPriceKilo = newCostPriceKilo * (1 + dealerKiloPricePercent.value.percent / 100)
        emit('update-field', 'dealerPriceKilo', Math.round(dealerPriceKilo * 100) / 100)
      }
    }
  }
)

const getProfitPercentage = (price: number | null, costPrice: number | null): string => {
  if (!price || !costPrice || costPrice === 0) return '-'
  const profit = ((price - costPrice) / costPrice) * 100
  return `${Math.round(profit * 100) / 100}%`
}

const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const productOptions = computed(() => {
  if (!products.value) return []
  return products.value
    .filter((product) => product.category?._id === props.categoryId?._id)
    .map((product) => ({
      label: product.name,
      value: product._id,
      image: product.images[0]?.filename,
    }))
})

const getImageUrl = (image: string) => {
  return getProductImageUrl(image)
}

const productDetail = computed(() => {
  if (!products.value) return null
  return products.value.find((product) => product._id === (props.formData.product as string))
})

const formatCurrency = (amount: number | null) => {
  if (amount === null) return '-'
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <Message
      v-if="
        hasMissingPercent && (categoryId?.value === 'food' || categoryId?.value === 'microorganism')
      "
      severity="warn"
      :closable="false"
      class="mb-4"
    >
      {{ missingPercentMessage }}
      <br />
      <small>กรุณาไปที่ ตั้งค่าเปอร์เซ็นต์กำไร เพื่อตั้งค่า</small>
    </Message>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div
        v-for="field in fields"
        :key="field.key"
        :class="field.key === 'product' ? 'md:col-span-2' : ''"
      >
        <label class="text-sm font-medium text-gray-700 mb-1 block">
          {{ field.label }}
          <span v-if="field.required" class="text-red-500 ml-1">*</span>

          <!-- แสดง % กำไร สำหรับ customerPrice และ dealerPrice -->
          <span
            v-if="field.key === 'customerPriceKilo' && customerKiloPricePercent"
            class="ml-2 text-xs text-green-600 font-semibold"
          >
            (กำไร {{ customerKiloPricePercent.percent }}%)
          </span>
          <span
            v-if="field.key === 'dealerPriceKilo' && dealerKiloPricePercent"
            class="ml-2 text-xs text-green-600 font-semibold"
          >
            (กำไร {{ dealerKiloPricePercent.percent }}%)
          </span>
        </label>

        <Select
          v-if="field.key === 'product' && field.type === 'select'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :options="productOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="เลือกสินค้า"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
          filter
        >
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <img
                v-if="slotProps.option.image"
                :src="getImageUrl(slotProps.option.image)"
                alt="Brand Image"
                class="w-auto h-8 rounded"
              />
              <i v-else class="pi pi-image text-gray-400 text-lg"></i>
              <span>{{ slotProps.option.label }}</span>
            </div>
          </template>
        </Select>

        <!-- Text Input -->
        <InputText
          v-else-if="field.type === 'text'"
          :model-value="(formData[field.key] as string | null)"
          @update:model-value="updateField(field.key, $event as string | number | Date | null)"
          :placeholder="`กรอก${field.label}`"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <div v-else-if="field.type === 'number'">
          <InputNumber
            :model-value="(formData[field.key] as number | null)"
            @update:model-value="updateField(field.key, $event)"
            :placeholder="`กรอก${field.label}`"
            :min="field.key === 'costPriceKilo' ? 0 : 1"
            :minFractionDigits="1"
            :maxFractionDigits="5"
            :disabled="
              (field.key === 'customerPriceKilo' || field.key === 'dealerPriceKilo') &&
              !!formData.costPriceKilo
            "
            fluid
            size="small"
            :invalid="field.required && formData[field.key] == null && isSubmitting"
          />

          <!-- แสดงกำไรที่คำนวณได้ -->
          <small
            v-if="
              field.key === 'customerPriceKilo' &&
              formData.customerPriceKilo &&
              formData.costPriceKilo
            "
            class="text-green-600 text-xs mt-1"
          >
            กำไร:
            {{ getProfitPercentage(formData.customerPriceKilo as number, formData.costPriceKilo as number) }}
          </small>
          <small
            v-if="
              field.key === 'dealerPriceKilo' && formData.dealerPriceKilo && formData.costPriceKilo
            "
            class="text-green-600 text-xs mt-1"
          >
            กำไร:
            {{ getProfitPercentage(formData.dealerPriceKilo as number, formData.costPriceKilo as number) }}
          </small>
        </div>

        <Checkbox
          v-else-if="field.type === 'boolean'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`เลือก${field.label}`"
          fluid
          binary
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <!-- Textarea -->
        <Textarea
          v-else-if="field.type === 'textarea'"
          :model-value="(formData[field.key] as string | null)"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`กรอก${field.label}`"
          rows="3"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <!-- Date Input -->
        <DatePicker
          v-else-if="field.type === 'date'"
          :model-value="(formData[field.key] as Date | null)"
          @update:model-value="updateField(field.key, $event as string | number | Date | null)"
          showIcon
          iconDisplay="input"
          placeholder="เลือกวันที่"
          dateFormat="dd/mm/yy"
          size="small"
          fluid
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <small
          v-if="field.required && !formData[field.key] && isSubmitting"
          class="text-red-500 text-xs mt-1"
        >
          กรุณากรอก{{ field.label }}
        </small>
      </div>
    </div>

    <Card v-if="productDetail" class="mt-6" :pt="{ padding: '0' }">
      <template #content>
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Product Image Section -->
          <div class="flex-shrink-0">
            <div class="relative w-full md:w-auto h-40">
              <img
                v-if="productDetail.images && productDetail.images[0]"
                :src="getImageUrl(productDetail.images[0].filename)"
                :alt="productDetail.name"
                class="w-full h-full object-contain"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gray-50">
                <i class="pi pi-image text-gray-300 text-4xl"></i>
              </div>
            </div>
          </div>

          <!-- Product Details Section -->
          <div class="flex-1 space-y-4">
            <!-- Product Name -->
            <div>
              <h3 class="font-[600]! text-gray-800 mb-2 flex items-baseline gap-2">
                <i class="pi pi-box text-blue-500"></i>
                {{ productDetail.name }}
                <span class="text-xs text-gray-500">รหัส ({{ productDetail.sku }})</span>
              </h3>
              <div class="h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
            </div>

            <!-- Product Info Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <!-- Category -->
              <div v-if="productDetail.lotNumber" class="flex items-start gap-2">
                <div
                  class="flex-shrink-0 w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center"
                >
                  <i class="pi pi-barcode text-gray-500"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">เลขล็อต</p>
                  <p class="text-sm font-medium text-gray-700">
                    {{ productDetail.lotNumber.name }}
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div
                  class="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"
                >
                  <i class="pi pi-box text-blue-500"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">สินค้าคงเหลือ</p>
                  <p class="text-sm font-medium text-gray-700">
                    {{ productDetail.balance }} กระสอบ
                  </p>
                </div>
              </div>

              <div v-if="productDetail.foodtype" class="flex items-start gap-3">
                <div
                  class="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"
                >
                  <i class="pi pi-tag text-purple-500"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">ประเภทอาหาร</p>
                  <p class="text-sm font-medium text-gray-700">
                    {{ productDetail.foodtype?.name }}
                  </p>
                </div>
              </div>

              <div v-if="productDetail.seedType" class="flex items-start gap-3">
                <div
                  class="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"
                >
                  <i class="pi pi-star text-green-500"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">ชนิดเม็ด</p>
                  <p class="text-sm font-medium text-gray-700">{{ productDetail.seedType }}</p>
                </div>
              </div>

              <div v-if="productDetail.seedSize" class="flex items-start gap-3">
                <div
                  class="flex-shrink-0 w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"
                >
                  <i class="pi pi-circle text-amber-500"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">ขนาดเม็ด</p>
                  <p class="text-sm font-medium text-gray-700">
                    {{ productDetail.seedSize?.name }}
                  </p>
                </div>
              </div>

              <div v-if="productDetail.weight" class="flex items-start gap-3">
                <div
                  class="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center"
                >
                  <i class="pi pi-calculator text-red-500"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">น้ำหนักต่อกระสอบ</p>
                  <p class="text-sm font-medium text-gray-700">{{ productDetail.weight }} กก.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Description (if available) -->
        <div
          class="mt-4 w-full bg-gray-50 rounded-lg border border-gray-100 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div>
            <p class="text-xs text-gray-500">
              วันผลิต
            </p>
            <p class="text-gray-800 text-sm">
              {{
                productDetail.food?.produceDate
                  ? dayjs(productDetail.food?.produceDate).format('DD/MM/YYYY')
                  : '-'
              }}
            </p>
          </div>

          <div>
            <p class="text-xs text-gray-500">
              วันหมดอายุ:
            </p>
            <p class="text-gray-800 text-sm">
              {{
                productDetail.food?.expireDate
                  ? dayjs(productDetail.food?.expireDate).format('DD/MM/YYYY')
                  : '-'
              }}
            </p>
          </div>

          <div>
            <p class="text-xs text-gray-500">
              ราคาท้องตลาด
            </p>
            <p class="text-gray-800 text-sm">
              {{
                productDetail.food?.marketPrice
                  ? formatCurrency(productDetail.food?.marketPrice)
                  : '-'
              }}
            </p>
          </div>

          <div>
            <p class="text-xs text-gray-500">
              ราคาทุน
            </p>
            <p class="text-gray-800 text-sm">
              {{
                productDetail.food?.costPrice ? formatCurrency(productDetail.food?.costPrice) : '-'
              }}
            </p>
          </div>

          <div>
            <p class="text-xs text-gray-500">ราคาลูกค้า</p>
            <p class="text-gray-800 text-sm">
              {{
                productDetail.food?.customerPrice
                  ? formatCurrency(productDetail.food?.customerPrice)
                  : '-'
              }}
            </p>
          </div>

          <div>
            <p class="text-xs text-gray-500">ราคาพ่อค้า</p>
            <p class="text-gray-800 text-sm">
              {{
                productDetail.food?.dealerPrice
                  ? formatCurrency(productDetail.food?.dealerPrice)
                  : '-'
              }}
            </p>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>


