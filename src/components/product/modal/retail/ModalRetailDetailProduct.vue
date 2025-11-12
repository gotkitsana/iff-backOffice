<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Tag, Galleria } from 'primevue'
import {
  type IFoodSale,
  type IFieldsRetailUI,
  type IFieldsKeyRetail,
} from '@/stores/product/food_sale'
import formatCurrency from '@/utils/formatCurrency'
import dayjs from 'dayjs'
import type { ICategory } from '@/stores/product/category'
import { useQuery } from '@tanstack/vue-query'
import { getProductImageUrl } from '@/utils/imageUrl'
import { useSupplierStore, type ISupplier } from '@/stores/product/supplier'
import { useFoodBrandStore, type IFoodBrand } from '@/stores/product/food_brand'
import { useFoodTypeStore, type IFoodType } from '@/stores/product/food_type'
import { useSeedSizeStore, type ISeedSize } from '@/stores/product/seed_size'
import { useLotNumberStore, type ILotNumber } from '@/stores/product/lot_number'
// Props
const props = defineProps<{
  visible: boolean
  productData: IFoodSale | null
  selectedCategory: ICategory | null
  fieldsRetailUI: IFieldsRetailUI
}>()

// Emits
const emit = defineEmits<{
  'close-detail-modal': []
}>()

// Stores
const supplierStore = useSupplierStore()
const foodBrandStore = useFoodBrandStore()
const foodTypeStore = useFoodTypeStore()
const seedSizeStore = useSeedSizeStore()
const lotNumberStore = useLotNumberStore()

// Queries
const { data: suppliers } = useQuery<ISupplier[]>({
  queryKey: ['get_suppliers'],
  queryFn: () => supplierStore.onGetSuppliers(),
})

const { data: foodBrands } = useQuery<IFoodBrand[]>({
  queryKey: ['get_food_brands'],
  queryFn: () => foodBrandStore.onGetFoodBrands(),
})

const { data: foodTypes } = useQuery<IFoodType[]>({
  queryKey: ['get_food_types'],
  queryFn: () => foodTypeStore.onGetFoodTypes(),
})

const { data: seedSizes } = useQuery<ISeedSize[]>({
  queryKey: ['get_seed_sizes'],
  queryFn: () => seedSizeStore.onGetSeedSizes(),
})

const { data: lotNumbers } = useQuery<ILotNumber[]>({
  queryKey: ['get_lot_numbers'],
  queryFn: () => lotNumberStore.onGetLotNumbers(),
})

// Helper functions
const findFoodBrand = (id: string | undefined) => {
  if (!id) return null
  return foodBrands.value?.find((brand) => brand._id === id)
}

const findFoodType = (id: string | undefined) => {
  if (!id) return null
  return foodTypes.value?.find((type) => type._id === id)
}

const findSeedSize = (id: string | undefined) => {
  if (!id) return null
  return seedSizes.value?.find((size) => size._id === id)
}

const findLotNumber = (id: string | undefined) => {
  if (!id) return null
  return lotNumbers.value?.find((lot) => lot._id === id)
}

// Computed
const selectedCategoryInfo = computed(() => {
  return props.fieldsRetailUI
})

const selectedSupplier = computed(() => {
  return suppliers.value?.find(
    (supplier) => supplier.brand._id === props.productData?.product?.brand
  )
})

// Group fields by type for better UI organization
const groupedFields = computed(() => {
  if (!selectedCategoryInfo.value) return { prices: [], others: [] }

  const prices: typeof selectedCategoryInfo.value.fields = []
  const others: typeof selectedCategoryInfo.value.fields = []

  selectedCategoryInfo.value.fields.forEach((field) => {
    if (
      field.key === 'priceKilo' ||
      field.key === 'costPriceKilo' ||
      field.key === 'customerPriceKilo' ||
      field.key === 'dealerPriceKilo'
    ) {
      prices.push(field)
    } else {
      others.push(field)
    }
  })

  return { prices, others }
})

// Helper function to get field value from productData
const getFieldValue = (fieldKey: IFieldsKeyRetail) => {
  if (!props.productData) return null

  switch (fieldKey) {
    case 'product':
      return props.productData.product
    case 'priceKilo':
      return props.productData.priceKilo
    case 'costPriceKilo':
      return props.productData.costPriceKilo
    case 'customerPriceKilo':
      return props.productData.customerPriceKilo
    case 'dealerPriceKilo':
      return props.productData.dealerPriceKilo
    case 'kilo':
      return props.productData.kilo
    default:
      return null
  }
}

const formatFieldValue = (
  fieldKey: IFieldsKeyRetail,
  value: string | number | null | undefined | IFoodSale['product']
) => {
  if (
    fieldKey === 'priceKilo' ||
    fieldKey === 'costPriceKilo' ||
    fieldKey === 'customerPriceKilo' ||
    fieldKey === 'dealerPriceKilo'
  ) {
    return formatCurrency((value as number) || 0)
  }
  if (fieldKey === 'kilo') {
    return `${value || 0} กก.`
  }
  if (fieldKey === 'product') {
    return value
  }
  return value
}

const getImageUrl = (filename: string) => {
  return getProductImageUrl(filename)
}

const getCertificateUrl = (filename: string | undefined) => {
  if (!filename) return ''
  return getProductImageUrl(filename)
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
          <p class="text-sm text-gray-500">{{ productData?.product?.name }}</p>
        </div>
      </div>
    </template>

    <div v-if="productData" class="space-y-6">
      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Product Information -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Product Basic Info -->
          <div
            v-if="selectedCategoryInfo && groupedFields.others.length > 0"
            class=" bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <h5 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-info-circle text-blue-600"></i>
              </div>
              ข้อมูลสินค้า
            </h5>

            <template v-for="field in groupedFields.others" :key="field.key">
              <div v-if="field.key === 'product' && productData.product" class="space-y-3">
                <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <!-- SKU -->
                  <div>
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                    >
                      รหัสสินค้า
                    </label>
                    <p class="text-sm font-medium text-gray-900">
                      {{ productData.product.sku || '-' }}
                    </p>
                  </div>

                  <!-- Lot Number -->
                  <div>
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                    >
                      เลขล็อต
                    </label>
                    <p class="text-sm font-medium text-gray-900">
                      {{ findLotNumber(productData.product.lotNumber)?.name || '-' }}
                    </p>
                  </div>

                  <!-- Brand -->
                  <div>
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                    >
                      แบรนด์/ยี่ห้อ
                    </label>
                    <div class="flex items-center gap-2">
                      <img
                        v-if="findFoodBrand(productData.product.brand)?.image"
                        :src="getImageUrl(findFoodBrand(productData.product.brand)?.image || '')"
                        :alt="findFoodBrand(productData.product.brand)?.name"
                        class="w-6 h-6 object-contain rounded"
                      />
                      <p class="text-sm font-medium text-gray-900">
                        {{ findFoodBrand(productData.product.brand)?.name || '-' }}
                      </p>
                    </div>
                  </div>

                  <!-- Food Type -->
                  <div>
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                    >
                      ประเภทอาหาร
                    </label>
                    <p class="text-sm font-medium text-gray-900">
                      {{ findFoodType(productData.product.foodtype)?.name || '-' }}
                    </p>
                  </div>

                  <!-- Seed Type -->
                  <div>
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                    >
                      ชนิดเม็ด
                    </label>
                    <Tag
                      :value="productData.product.seedType || '-'"
                      :severity="productData.product.seedType === 'ลอย' ? 'info' : 'success'"
                      size="small"
                    />
                  </div>

                  <!-- Seed Size -->
                  <div>
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                    >
                      ขนาดเม็ด
                    </label>
                    <Tag
                      :value="findSeedSize(productData.product.seedSize)?.name || '-'"
                      severity="info"
                      size="small"
                    />
                  </div>

                  <!-- kilo -->
                  <div>
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                    >
                      จำนวนคงเหลือ
                    </label>
                    <p class="text-sm font-medium text-gray-900">
                      {{ productData.kilo ? `${productData.kilo} กก.` : 'หมด' }}
                    </p>
                  </div>

                  <!-- Produce Date -->
                  <div v-if="productData.product.food?.produceDate">
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                    >
                      วันผลิต
                    </label>
                    <p class="text-sm font-medium text-gray-900">
                      {{ dayjs(productData.product.food.produceDate).format('DD/MM/YYYY') }}
                    </p>
                  </div>

                  <!-- Expire Date -->
                  <div v-if="productData.product.food?.expireDate">
                    <label
                      class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                    >
                      วันหมดอายุ
                    </label>
                    <p class="text-sm font-medium text-gray-900">
                      {{ dayjs(productData.product.food.expireDate).format('DD/MM/YYYY') }}
                    </p>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Price Information -->
          <div
            v-if="selectedCategoryInfo && groupedFields.prices.length > 0"
            class=" bg-white rounded-2xl p-4 shadow-sm border border-green-100"
          >
            <h5 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-dollar text-green-600"></i>
              </div>
              ข้อมูลราคา
            </h5>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <template v-for="field in groupedFields.prices" :key="field.key">
                <div
                  class="bg-white rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <label
                    class="text-sm font-semibold text-gray-500 uppercase tracking-wide block mb-1"
                  >
                    {{ field.label }}
                  </label>
                  <p class="text-xl font-bold text-green-600">
                    {{ formatFieldValue(field.key, getFieldValue(field.key)) }}
                  </p>
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
        </div>

        <!-- Right Column - Images & Certificate -->
        <div class="space-y-4">
          <!-- Images -->
          <div
            v-if="productData.product?.images && productData.product.images.length > 0"
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
                productData.product.images.map((image) => ({
                  itemImageSrc: getImageUrl(image.filename),
                  thumbnailImageSrc: getImageUrl(image.filename),
                  alt: 'product image',
                }))
              "
              :numVisible="productData.product.images.length"
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
