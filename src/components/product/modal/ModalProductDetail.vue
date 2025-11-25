<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Tag, Galleria, Panel, VirtualScroller } from 'primevue'
import {
  type IProduct,
  type ICategoryOption,
  useProductStore,
} from '../../../stores/product/product'
import formatCurrency from '../../../utils/formatCurrency'
import dayjs from 'dayjs'
import type { ICategory } from '../../../stores/product/category'
import { useGreenhouseStore, type IGreenhouse } from '@/stores/product/greenhouse'
import { useQuery } from '@tanstack/vue-query'
import { getProductImageUrl } from '@/utils/imageUrl'
import { useSupplierStore, type ISupplier } from '@/stores/product/supplier'
import DownloadZipButton from '../DownloadZipButton.vue'
import ModalUpdateFishData from './ModalUpdateFishData.vue'
import type { IFishGrowthHistory } from '@/stores/product/product'
import { ref, watch } from 'vue'

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
    return (
      greenhouseData.value?.find(
        (greenhouse) => greenhouse._id === props.productData?.fishpond?.greenhouse
      )?.name || '-'
    )
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
    return `${value}`
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
  return getProductImageUrl(filename)
}

const getImageUrl = (filename: string) => {
  return getProductImageUrl(filename)
}

const handleClose = () => {
  emit('close-detail-modal')
}

const supplierStore = useSupplierStore()
const { data: suppliers } = useQuery<ISupplier[]>({
  queryKey: ['get_suppliers'],
  queryFn: () => supplierStore.onGetSuppliers(),
})
const selectedSupplier = computed(() => {
  return suppliers.value?.find((supplier) => supplier.brand._id === props.productData?.brand?._id)
})

// Computed property for download media items
const selectedMediaItems = computed(() => {
  if (!props.productData) return []

  const mediaItems: Array<{
    url: string
    type: 'image' | 'certificate' | 'video'
    filename: string
  }> = []

  // Add images
  if (props.productData.images && props.productData.images.length > 0) {
    props.productData.images.forEach((img, idx) => {
      mediaItems.push({
        url: getImageUrl(img.filename),
        type: 'image',
        filename: img.filename || `image-${idx + 1}.jpg`,
      })
    })
  }

  // Add certificate
  if (props.productData.certificate) {
    mediaItems.push({
      url: getCertificateUrl(props.productData.certificate),
      type: 'certificate',
      filename: props.productData.certificate,
    })
  }

  // Add video
  if (props.productData.youtube) {
    mediaItems.push({
      url: props.productData.youtube,
      type: 'video',
      filename: props.productData.youtube,
    })
  }

  return mediaItems
})

// Fish Growth History Logic
const showUpdateModal = ref(false)
const selectedHistoryRecord = ref<IFishGrowthHistory | undefined>(undefined)

const productStore = useProductStore()
const { data: growthHistoryData } = useQuery<IFishGrowthHistory[]>({
  queryKey: ['get_fish_growth_history', props.productData?._id],
  queryFn: () => productStore.onGetFishGrowthHistoryProduct(props.productData?._id || ''),
  enabled: computed(() => !!props.productData?._id && props.selectedCategory?.value === 'fish')
})

const historyRecords = computed(() => {
  if (!growthHistoryData.value) return []

  // Sort ascending (Oldest to Newest)
  return [...growthHistoryData.value].sort((a, b) => a.date - b.date)
})

// Select the latest record by default when history data changes
watch(historyRecords, (records) => {
  if (records.length > 0) {
    selectedHistoryRecord.value = records[records.length - 1]
  }
}, { immediate: true })


const handleUpdateHistory = (item: IFishGrowthHistory) => {
  selectedHistoryRecord.value = item
  showUpdateModal.value = true
}

const handleAddHistory = () => {
  const isLatestRecord = historyRecords.value[historyRecords.value.length - 1]
  selectedHistoryRecord.value = {...isLatestRecord, _id: ''}
  showUpdateModal.value = true
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

    <div v-if="productData" class="space-y-4">
      <!-- Fish Product Layout -->
      <template v-if="selectedCategory?.value === 'fish'">
        <!-- 1. ข้อมูล (3 sections) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- ข้อมูลสายพันธุ์ (Breed Information) -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <h5
              class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200"
            >
              <div class="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-star text-blue-600 text-sm"></i>
              </div>
              ข้อมูลสายพันธุ์
            </h5>
            <div class="space-y-3">
              <div v-if="getFieldValue('species')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  สายพันธุ์
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ getFieldValue('species') }}
                </p>
              </div>
              <div v-if="getFieldValue('breeders')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  แม่พันธุ์
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ getFieldValue('breeders') }}
                </p>
              </div>
              <div v-if="getFieldValue('birth')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  วันเกิด
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ formatFieldValue('birth') }}
                </p>
              </div>
              <div v-if="getFieldValue('age')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  อายุ
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ getFieldValue('age') }}
                </p>
              </div>
              <div v-if="getFieldValue('farm')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  ฟาร์ม
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ getFieldValue('farm') }}
                </p>
              </div>
              <div v-if="getFieldValue('quality')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  คุณภาพเกรด
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ getFieldValue('quality') }}
                </p>
              </div>
            </div>
          </div>

          <!-- ข้อมูลตัวปลา (Fish Information) -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <div
              class="text-base font-bold text-gray-900 mb-4 flex items-center justify-between pb-2 border-b border-gray-200"
            >
              <h5 class="flex items-center gap-2">
                <div class="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="pi pi-tag text-green-600 text-sm"></i>
                </div>
                ข้อมูลตัวปลา
              </h5>
              <Button
                text
                severity="success"
                size="small"
                label="อัปเดตข้อมูล"
                @click="handleAddHistory"
              />
            </div>

            <VirtualScroller :items="historyRecords" :item-size="25" class="space-y-2" style="max-height: 300px;">
              <template v-slot:item="{ item, options }">
              <!-- Selected Record Details -->
              <Panel
                toggleable
                collapsed
                class="mb-2"
                :pt="{
                  root: '!rounded-lg',
                  header: 'px-2 py-1.5 min-h-[2.5rem]',
                  title: 'text-sm',
                  content: 'p-2 pt-0',
                }"
                :toggleButtonProps="{
                  size: 'small',
                  rounded: true,
                  text: true,
                  severity: 'secondary'
                }"

              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-gray-900">
                      บันทึกเมื่อ {{ dayjs(item.date).format('DD/MM/YYYY HH:mm:ss') }}
                    </span>
                  </div>
                </template>
                <template #icons>
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    severity="warn"
                    size="small"
                    @click="handleUpdateHistory(item)"
                    v-tooltip.top="'แก้ไขข้อมูล'"
                  />
                </template>
                <div class="grid grid-cols-2 gap-2">
                   <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                      ไซต์
                    </label>
                    <p class="text-sm text-gray-900 font-medium">
                      {{ item.size ? `${item.size} ซม.` : '-' }}
                    </p>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                      น้ำหนัก
                    </label>
                    <p class="text-sm text-gray-900 font-medium">
                      {{ item.weight ? `${item.weight} กก.` : '-' }}
                    </p>
                  </div>
                   <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                      เพศ
                    </label>
                    <Tag
                      v-if="item.gender"
                      :value="getGenderTag(item.gender).label"
                      :severity="getGenderTag(item.gender).severity"
                      class="px-2 py-1 text-xs"
                    />
                    <span v-else>-</span>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                      ราคา
                    </label>
                    <p class="text-sm text-gray-900 font-medium">
                      {{ item.price ? formatCurrency(item.price) : '-' }}
                    </p>
                  </div>
                </div>
              </Panel>
              </template>
            </VirtualScroller>
          </div>

          <!-- ข้อมูลการจัดเก็บ (Stock Information) -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <h5
              class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200"
            >
              <div class="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-inbox text-purple-600 text-sm"></i>
              </div>
              ข้อมูลการจัดเก็บ
            </h5>
            <div class="space-y-3">
              <div v-if="getFieldValue('lotNumber')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  ล็อต
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ getFieldValue('lotNumber') }}
                </p>
              </div>
              <div v-if="getFieldValue('sku')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  รหัสปลา
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ getFieldValue('sku') }}
                </p>
              </div>
              <div v-if="getFieldValue('greenhouse')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  กรีนเฮ้า
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ getFieldValue('greenhouse') }}
                </p>
              </div>
              <div v-if="getFieldValue('fishpond')">
                <label
                  class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                >
                  บ่อ
                </label>
                <p class="text-sm text-gray-900 font-medium">
                  {{ getFieldValue('fishpond') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. รูปภาพ + ใบรับรอง -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Images -->
          <div
            v-if="productData.images.length > 0"
            class="bg-gray-50/30 rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <h5
              class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200"
            >
              <div class="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-image text-gray-600 text-sm"></i>
              </div>
              รูปภาพปลา
            </h5>

            <Galleria
              :value="
                productData.images.map((image) => ({
                  itemImageSrc: getImageUrl(image.filename),
                  thumbnailImageSrc: getImageUrl(image.filename),
                  alt: 'product image',
                }))
              "
              :numVisible="productData.images.length"
              :circular="true"
              :showItemNavigators="true"
              :showThumbnails="true"
              :showItemNavigatorsOnHover="true"
              :pt="{
                root: { class: 'max-w-full' },
                content: { class: 'bg-gray-50 rounded-lg' },
                thumbnailsContent: { class: 'bg-gray-100 rounded-lg mt-1' },
              }"
            >
              <template #item="{ item }">
                <div class="flex justify-center items-center overflow-hidden">
                  <img
                    :src="item.itemImageSrc"
                    :alt="item.alt"
                    class="w-full h-auto max-h-[40vh] object-contain"
                    loading="lazy"
                    fetchpriority="low"
                    crossorigin="anonymous"
                  />
                </div>
              </template>

              <template #thumbnail="{ item }">
                <div class="p-1">
                  <img
                    :src="item.thumbnailImageSrc"
                    :alt="item.alt"
                    class="w-full h-16 object-contain rounded cursor-pointer hover:ring-2 hover:ring-blue-500/50 duration-150 transition-all"
                    loading="lazy"
                    fetchpriority="low"
                    crossorigin="anonymous"
                  />
                </div>
              </template>
            </Galleria>
          </div>

          <!-- Certificate -->
          <div
            v-if="productData.certificate"
            class="bg-gray-50/30 rounded-2xl p-4 shadow-sm border border-gray-100"
          >
             <h5
              class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200"
            >
              <div class="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-file text-purple-600 text-sm"></i>
              </div>
              ใบรับรอง
            </h5>
            <div class="text-center">
              <img
                :src="getCertificateUrl(productData.certificate)"
                alt="Certificate"
                class="w-full h-auto max-h-[35vh] object-contain rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>

        <!-- 3. วิดีโอ -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-if="productData.detail || productData.youtube"
          class="bg-gray-50/30 rounded-2xl p-4 shadow-sm border border-gray-100 md:col-span-2"
        >
          <h5 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
            <div class="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-video text-gray-600 text-sm"></i>
            </div>
            วิดีโอสินค้า
          </h5>
          <div v-if="productData.youtube">
            <div class="bg-black rounded-lg py-0">
              <video :src="productData.youtube" class="w-full h-auto max-h-[55vh]" controls>
                <p class="text-white p-4">เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ</p>
              </video>
            </div>
          </div>
        </div>

        <!-- 4. อื่นๆ (Supplier Info, System Info) -->
          <div class="bg-gray-50/30 rounded-2xl p-4 shadow-sm border border-gray-100">
            <h5 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
              <div class="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-cog text-gray-600 text-sm"></i>
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
      </template>

      <!-- Default Layout for Other Categories -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Left Column - Product Information -->
        <div class="lg:col-span-2 space-y-4">
          <div
            v-if="selectedCategoryInfo"
            class="bg-gray-50/30 rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <h5 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-info-circle text-blue-600"></i>
              </div>
              ข้อมูลสินค้า
            </h5>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-2">
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
                    <p
                      v-else-if="field.key === 'seedSize'"
                      class="text-base text-gray-900 font-medium"
                    >
                      {{ productData?.seedSize?.name || '-' }}
                    </p>
                    <p
                      v-else-if="field.key === 'brand'"
                      class="text-base text-gray-900 font-medium"
                    >
                      {{ productData?.brand?.name || '-' }}
                    </p>
                    <p
                      v-else-if="field.key === 'foodtype'"
                      class="text-base text-gray-900 font-medium"
                    >
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

          <div
            v-if="!!selectedSupplier"
            class="bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 rounded-2xl p-6 shadow-sm border border-blue-100/50 backdrop-blur-sm"
          >
            <!-- Header Section -->
            <div class="flex items-center justify-between mb-6">
              <h5 class="font-bold text-gray-900 flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30"
                >
                  <i class="pi pi-truck text-white"></i>
                </div>
                <span
                  class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  ข้อมูลซัพพลายเออร์
                </span>
              </h5>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- Left Column: Supplier Info -->

              <!-- Brand Card -->
              <div
                class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex items-start gap-4">
                  <div class="flex-1 min-w-0">
                    <div v-if="selectedSupplier.brand" class="flex items-center gap-3">
                      <!-- Brand Image -->
                      <div
                        class="w-auto h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0"
                      >
                        <img
                          v-if="selectedSupplier.brand.image"
                          :src="getProductImageUrl(selectedSupplier.brand.image)"
                          :alt="selectedSupplier.brand.name"
                          class="w-full h-full object-contain"
                          loading="lazy"
                        />
                        <i v-else class="pi pi-image text-gray-400 text-2xl"></i>
                      </div>

                      <!-- Brand Info -->
                      <div class="flex-1 min-w-0">
                        <label
                          class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 block"
                        >
                          แบรนด์/ยี่ห้อ
                        </label>
                        <p class="text-base font-bold text-gray-900 truncate mb-0.5">
                          {{ selectedSupplier.brand.name }}
                        </p>
                      </div>
                    </div>

                    <p v-else class="text-sm text-gray-500 italic">ไม่ระบุแบรนด์</p>
                  </div>
                </div>
              </div>

              <!-- Supplier Name Card -->
              <div
                class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"
                  >
                    <i class="pi pi-building text-blue-600 text-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 block"
                    >
                      ชื่อซัพพลายเออร์
                    </label>
                    <p class="text-base font-bold text-gray-900 truncate">
                      {{ selectedSupplier.name || '-' }}
                    </p>
                    <p v-if="selectedSupplier.company" class="text-sm text-gray-600 mt-1 truncate">
                      {{ selectedSupplier.company }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Phone Number Card -->
              <div
                class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"
                  >
                    <i class="pi pi-phone text-green-600 text-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 block"
                    >
                      เบอร์โทรศัพท์
                    </label>
                    <a
                      :href="`tel:${selectedSupplier.phoneNo}`"
                      class="text-base font-semibold text-green-600 hover:text-green-700 transition-colors inline-flex items-center gap-2 group"
                    >
                      {{ selectedSupplier.phoneNo || '-' }}
                      <i
                        class="pi pi-external-link text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      ></i>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Contact Method Card -->
              <div
                class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0"
                  >
                    <i
                      :class="[
                        'text-purple-600 text-lg',
                        selectedSupplier.contact === 'facebook'
                          ? 'pi pi-facebook'
                          : selectedSupplier.contact === 'line'
                          ? 'pi pi-comments'
                          : selectedSupplier.contact === 'tiktok'
                          ? 'pi pi-video'
                          : selectedSupplier.contact === 'email'
                          ? 'pi pi-envelope'
                          : selectedSupplier.contact === 'phone'
                          ? 'pi pi-phone'
                          : 'pi pi-at',
                      ]"
                    ></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 block"
                    >
                      ช่องทางติดต่อ
                    </label>
                    <p class="text-base font-semibold text-gray-900">
                      {{
                        supplierStore.supplierContactOptions.find(
                          (opt) => opt.value === selectedSupplier?.contact
                        )?.label || '-'
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Notes Card -->
              <div
                class="lg:col-span-2 bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0"
                  >
                    <i class="pi pi-file-edit text-amber-600 text-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block"
                    >
                      หมายเหตุ
                    </label>
                    <p
                      v-if="selectedSupplier.note"
                      class="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                    >
                      {{ selectedSupplier.note }}
                    </p>
                    <p v-else class="text-sm text-gray-400 italic">ไม่มีหมายเหตุ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div
            v-if="productData.detail || productData.youtube"
            class="bg-gray-50/30 rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <h5 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-video text-gray-600"></i>
              </div>
              วิดีโอสินค้า
            </h5>
            <div v-if="productData.youtube">
              <div class="bg-black rounded-lg py-0">
                <video :src="productData.youtube" class="w-full h-auto max-h-[55vh]" controls>
                  <p class="text-white p-4">เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ</p>
                </video>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Price & Certificate -->
        <div class="space-y-4">
          <!-- Images -->
          <div
            v-if="productData.images.length > 0"
            class="bg-gray-50/30 rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <h5 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-image text-gray-600"></i>
              </div>
              รูปภาพสินค้า
            </h5>

            <Galleria
              :value="
                productData.images.map((image) => ({
                  itemImageSrc: getImageUrl(image.filename),
                  thumbnailImageSrc: getImageUrl(image.filename),
                  alt: 'product image',
                }))
              "
              :numVisible="productData.images.length"
              :circular="true"
              :showItemNavigators="true"
              :showThumbnails="true"
              :showItemNavigatorsOnHover="true"
              :pt="{
                root: { class: 'max-w-full' },
                content: { class: 'bg-gray-50 rounded-lg' },
                thumbnailsContent: { class: 'bg-gray-100 rounded-lg mt-1' },
              }"
            >
              <template #item="{ item }">
                <div class="flex justify-center items-center overflow-hidden">
                  <img
                    :src="item.itemImageSrc"
                    :alt="item.alt"
                    class="w-full h-auto max-h-[40vh] object-contain"
                    loading="lazy"
                    fetchpriority="low"
                    crossorigin="anonymous"
                  />
                </div>
              </template>

              <template #thumbnail="{ item }">
                <div class="p-1">
                  <img
                    :src="item.thumbnailImageSrc"
                    :alt="item.alt"
                    class="w-full h-16 object-contain rounded cursor-pointer hover:ring-2 hover:ring-blue-500/50 duration-150 transition-all"
                    loading="lazy"
                    fetchpriority="low"
                    crossorigin="anonymous"
                  />
                </div>
              </template>
            </Galleria>
          </div>

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
                class="w-full h-auto max-h-[35vh] object-contain rounded-lg border border-gray-200"
              />
            </div>
          </div>

          <!-- System Information -->
          <div class="bg-gray-50/30 rounded-2xl p-4 shadow-sm border border-gray-100">
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
        <DownloadZipButton
          :selected-media-items="selectedMediaItems"
          :selected-product="productData"
        />

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

    <ModalUpdateFishData
      v-if="productData"
      v-model:visible="showUpdateModal"
      :existing-record="selectedHistoryRecord"
      :product-id="productData._id"
    />
</template>
