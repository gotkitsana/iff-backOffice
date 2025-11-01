<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Tag } from 'primevue'
import { type IProduct, type ICategoryOption, useProductStore } from '../../../stores/product/product'
import formatCurrency from '../../../utils/formatCurrency'
import dayjs from 'dayjs'
import type { ICategory } from '../../../stores/product/category'
import { useGreenhouseStore, type IGreenhouse } from '@/stores/product/greenhouse'
import { useQuery } from '@tanstack/vue-query'

// Props
const props = defineProps<{
  visible: boolean
  productData: IProduct | null
  selectedCategory: ICategory | null
  categoryOptionsUI: ICategoryOption[]
}>()

// Emits
const emit = defineEmits<{
  'close-detail-modal': []
}>()

// Stores

// Computed
const selectedCategoryInfo = computed(() => {
  return props.categoryOptionsUI.find((cat) => cat._id === props.selectedCategory?._id)
})

const getGenderTag = (gender: string) => {
  switch (gender) {
    case 'male':
      return { label: 'ตัวผู้', severity: 'info' }
    case 'female':
      return { label: 'ตัวเมีย', severity: 'warning' }
    default:
      return { label: 'ไม่ระบุ', severity: 'secondary' }
  }
}

const productStore = useProductStore()
const greenhouseStore = useGreenhouseStore()
const { data: greenhouseData } = useQuery<IGreenhouse[]>({
  queryKey: ['get_greenhouses'],
  queryFn: () => greenhouseStore.onGetGreenhouses(),
})

const formatBirthDate = (birth: string | number) => {
  if (!birth || birth === '-' || birth === 0) return '-'
  return dayjs(birth).format('DD/MM/YYYY')
}
// Helper function to get field value from productData
const getFieldValue = (fieldKey: string) => {
  if (!props.productData) return null

  // Handle nested fields
  if (fieldKey === 'species' && props.productData.species) {
    return props.productData.species.name || '-'
  }
  if (fieldKey === 'quality' && props.productData.quality) {
    return props.productData.quality.name || '-'
  }
  if (fieldKey === 'lotNumber' && props.productData.lotNumber) {
    return props.productData.lotNumber.name || '-'
  }
  if (fieldKey === 'greenhouse' && props.productData.fishpond) {
    return greenhouseData.value?.find((greenhouse) => greenhouse._id === props.productData?.fishpond?.greenhouse)?.name || '-'
  }
  if (fieldKey === 'fishpond' && props.productData.fishpond) {
    return props.productData.fishpond.code || '-'
  }
  // Handle food fields
  if (fieldKey === 'foodType' && props.productData.food) {
    return props.productData.food.type || '-'
  }
  if (fieldKey === 'produceDate' && props.productData.food) {
    return props.productData.food.produceDate || '-'
  }
  if (fieldKey === 'expireDate' && props.productData.food) {
    return props.productData.food.expireDate || '-'
  }
  if (fieldKey === 'marketPrice' && props.productData.food) {
    return props.productData.food.marketPrice || '-'
  }
  if (fieldKey === 'costPrice' && props.productData.food) {
    return props.productData.food.costPrice || '-'
  }
  if (fieldKey === 'customerPrice' && props.productData.food) {
    return props.productData.food.customerPrice || '-'
  }
  if (fieldKey === 'dealerPrice' && props.productData.food) {
    return props.productData.food.dealerPrice || '-'
  }

  if (fieldKey === 'farm' && props.productData.farm) {
    return props.productData.farm.name || '-'
  }

  // Handle direct fields
  const value = props.productData[fieldKey as keyof IProduct]

  // Add units for specific fields
  if (fieldKey === 'size' && value) {
    return `${value} ซม.`
  }
  if (fieldKey === 'weight' && value) {
    return `${value} กรัม`
  }

  return value || null
}

const formatFieldValue = (fieldKey: string) => {
  const value = getFieldValue(fieldKey)
  if (fieldKey === 'birth' || fieldKey === 'produceDate' || fieldKey === 'expireDate') {
    return formatBirthDate((value as string | number) || '')
  }
  if (
    fieldKey === 'marketPrice' ||
    fieldKey === 'costPrice' ||
    fieldKey === 'customerPrice' ||
    fieldKey === 'dealerPrice' ||
    fieldKey === 'price'
  ) {
    return formatCurrency((value as number) || 0)
  }
  return value
}

const getCertificateUrl = (filename: string) => {
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${filename}`
}

const getImageUrl = (filename: string) => {
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${filename}`
}

const handleClose = () => {
  emit('close-detail-modal')
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '75rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-6',
      footer: 'p-6',
    }"
  >
    <template #header>
      <div class="flex items-center gap-4">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
        >
          <i class="pi pi-eye text-white text-xl"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900">รายละเอียดสินค้า</h3>
          <p class="text-sm text-gray-500">{{ productData?.name }}</p>
        </div>
      </div>
    </template>

    <div v-if="productData" class="space-y-8">
      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Left Column - Product Information -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Dynamic Form Fields Display -->
          <div
            v-if="selectedCategoryInfo"
            class="bg-gray-50/30 rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h5 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-info-circle text-blue-600"></i>
              </div>
              ข้อมูลสินค้า
            </h5>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <template v-for="field in selectedCategoryInfo.fields" :key="field.key">
                <div v-if="getFieldValue(field.key)" class="flex items-center gap-2">
                  <label class="text-sm font-semibold! text-gray-700 uppercase tracking-wide">
                    {{ field.label }}:
                  </label>

                  <div>
                    <!-- Special handling for different field types -->
                    <Tag
                      v-if="field.key === 'gender'"
                      :value="getGenderTag(productData.gender || '').label"
                      :severity="getGenderTag(productData.gender || '').severity"
                      class="px-3 py-1"
                    />
                    <p
                      v-else-if="
                        field.key === 'birth' ||
                        field.key === 'produceDate' ||
                        field.key === 'expireDate'
                      "
                      class="text-base text-gray-900 font-medium"
                    >
                      {{ formatFieldValue(field.key) }}
                    </p>
                    <p
                      v-else-if="
                        field.key === 'marketPrice' ||
                        field.key === 'costPrice' ||
                        field.key === 'customerPrice' ||
                        field.key === 'dealerPrice' ||
                        field.key === 'price'
                      "
                      class="text-base text-gray-900 font-medium"
                    >
                      {{ formatFieldValue(field.key) }}
                    </p>
                    <p v-else-if="field.key === 'seedSize'" class="text-base text-gray-900 font-medium">
                      {{  productData?.seedSize?.name || '-' }}
                    </p>
                    <p v-else-if="field.key === 'brand'" class="text-base text-gray-900 font-medium">
                      {{ productData?.brand?.name || '-' }}
                    </p>
                    <p v-else-if="field.key === 'foodtype'" class="text-base text-gray-900 font-medium">
                      {{ productData?.foodtype?.name || '-' }}
                    </p>
                    

                    <p v-else class="text-base text-gray-900 font-medium">
                      {{ getFieldValue(field.key) }}
                    </p>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Additional Information -->
          <div
            v-if="productData.detail || productData.youtube"
            class="bg-gray-50/30 rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h5 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-file-edit text-gray-600"></i>
              </div>
              รายละเอียดเพิ่มเติม
            </h5>
            <div class="space-y-4">
              <div v-if="productData.detail">
                <label class="text-sm font-semibold text-gray-700 uppercase tracking-wide"
                  >รายละเอียด</label
                >
                <p class="text-base text-gray-900 whitespace-pre-wrap mt-2 leading-relaxed">
                  {{ productData.detail }}
                </p>
              </div>
              <div v-if="productData.youtube">
                <label class="text-sm font-semibold text-gray-700 uppercase tracking-wide"
                  >YouTube</label
                >
                <a
                  :href="productData.youtube"
                  target="_blank"
                  class="text-blue-600 hover:text-blue-800 hover:underline block mt-2 text-base font-medium"
                >
                  {{ productData.youtube }}
                </a>
              </div>
            </div>
          </div>

          <div
            v-if="productData.images.length > 0"
            class="bg-gray-50/30 rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h5 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-image text-gray-600"></i>
              </div>
              รูปภาพสินค้า
            </h5>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <img
                v-for="image in productData.images"
                :key="image.filename"
                :src="getImageUrl(image.filename)"
                alt="Certificate"
                class="w-full h-40 object-contain rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>

        <!-- Right Column - Price & Certificate -->
        <div class="space-y-4">
          <!-- Certificate -->
          <div
            v-if="productData.certificate"
            class="bg-gray-50/30 rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h5 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-file text-purple-600"></i>
              </div>
              ใบรับรอง
            </h5>
            <div class="text-center">
              <img
                :src="getCertificateUrl(productData.certificate)"
                alt="Certificate"
                class="w-full h-60 object-contain rounded-lg border border-gray-200 mb-3"
              />
            </div>
          </div>

          <!-- System Information -->
          <div class="bg-gray-50/30 rounded-2xl p-6 shadow-sm border border-gray-100">
            <h5 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-cog text-gray-600"></i>
              </div>
              ข้อมูลระบบ
            </h5>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-semibold text-gray-700 uppercase tracking-wide"
                  >อัปเดตล่าสุด</label
                >
                <p class="text-sm text-gray-900 mt-1">
                  {{ dayjs(productData.uat).format('DD/MM/YYYY HH:mm') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
          class="px-6 py-2"
        />
      </div>
    </template>
  </Dialog>
</template>
