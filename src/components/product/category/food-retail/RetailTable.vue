<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { DataTable, Column, Tag, Button, Dialog, Galleria } from 'primevue'
import type { IProduct, IProductImage } from '@/stores/product/product'
import formatCurrency from '@/utils/formatCurrency'
import type { ICategory } from '@/stores/product/category'
import dayjs from 'dayjs'
import { getProductImageUrl } from '@/utils/imageUrl'
import type { IFoodSale } from '@/stores/product/food_sale'
import { useQuery } from '@tanstack/vue-query'
import { useLotNumberStore, type ILotNumber } from '@/stores/product/lot_number'
import { useFoodBrandStore, type IFoodBrand } from '@/stores/product/food_brand'
import { useFoodTypeStore, type IFoodType } from '@/stores/product/food_type'
import { useSeedSizeStore, type ISeedSize } from '@/stores/product/seed_size'

// Props
const props = defineProps<{
  filteredProducts: IFoodSale[]
  isLoadingProducts: boolean
  selectedCategory: ICategory | null
}>()

// Emits
defineEmits<{
  'open-detail-modal': [product: IFoodSale]
  'open-edit-modal': [product: IFoodSale]
  'open-delete-modal': [product: IFoodSale]
}>()

const getImageUrl = (image: IProductImage | undefined) => {
  if (!image) return ''
  return getProductImageUrl(image?.filename)
}

const getImageBrand = (image: string) => {
  return getProductImageUrl(image)
}

const getCertificateUrl = (image: string | undefined) => {
  if (!image) return ''
  return getProductImageUrl(image)
}

const getSeedTypeLabel = (seedType: string) => {
  switch (seedType) {
    case 'ลอย':
      return { label: 'ลอย', severity: 'info' }
    case 'จม':
      return { label: 'จม', severity: 'success' }
    default:
      return { label: '-', severity: 'secondary' }
  }
}

const getSeedSizeLabel = (seedSize: any) => {
  if (!seedSize?.name) {
    return { label: '-', severity: 'secondary' }
  }

  // กำหนดสีตายตัวตามชื่อขนาด
  const colorMap: Record<string, string> = {
    S: 'info', // ฟ้า
    M: 'success', // เขียว
    L: 'warn', // ส้ม
    XL: 'danger', // แดง
    XXL: 'contrast', // ดำ/ขาว
    // เพิ่มขนาดอื่นๆ ตามที่มีจริง
  }

  const severity = colorMap[seedSize.name] || 'secondary'
  return { label: seedSize.name, severity }
}

const showMediaGalleryModal = ref(false)
const selectedMediaItems = ref<
  Array<{ url: string; type: 'image' | 'certificate' | 'video'; filename: string }>
>([])
const activeMediaIndex = ref(0)
const selectedProduct = ref<IProduct | null>(null)

const openMediaGalleryModal = (
  product: IProduct,
  startType: 'image' | 'certificate' | 'video' = 'image',
  imageIndex: number = 0
) => {
  const mediaItems: Array<{
    url: string
    type: 'image' | 'certificate' | 'video'
    filename: string
  }> = []

  // Add images
  if (product.images && product.images.length > 0) {
    product.images.forEach((img, idx) => {
      mediaItems.push({
        url: getImageUrl(img),
        type: 'image',
        filename: img.filename || `image-${idx + 1}.jpg`,
      })
    })
  }

  // Add certificate
  if (product.certificate) {
    mediaItems.push({
      url: getCertificateUrl(product.certificate),
      type: 'certificate',
      filename: product.certificate,
    })
  }

  // Add video
  if (product.youtube) {
    mediaItems.push({
      url: product.youtube,
      type: 'video',
      filename: product.youtube,
    })
  }

  if (mediaItems.length > 0) {
    selectedMediaItems.value = mediaItems
    selectedProduct.value = product

    // Set active index based on type
    if (startType === 'image') {
      activeMediaIndex.value = imageIndex
    } else if (startType === 'certificate') {
      activeMediaIndex.value = product.images?.length || 0
    } else if (startType === 'video') {
      activeMediaIndex.value = (product.images?.length || 0) + (product.certificate ? 1 : 0)
    }

    showMediaGalleryModal.value = true
  }
}

const closeMediaGalleryModal = () => {
  showMediaGalleryModal.value = false
  selectedMediaItems.value = []
  activeMediaIndex.value = 0
  selectedProduct.value = null
}

const lotNumberStore = useLotNumberStore()
const { data: lotNumberData } = useQuery<ILotNumber[]>({
  queryKey: ['get_lot_numbers'],
  queryFn: () => lotNumberStore.onGetLotNumbers(),
})

const foodBrandStore = useFoodBrandStore()
const { data: foodBrandData } = useQuery<IFoodBrand[]>({
  queryKey: ['get_food_brands'],
  queryFn: () => foodBrandStore.onGetFoodBrands(),
})
const findFoodBrand = (id: string) => {
  return foodBrandData.value?.find((p) => p._id === id)
}

const foodTypeStore = useFoodTypeStore()
const { data: foodTypeData } = useQuery<IFoodType[]>({
  queryKey: ['get_food_types'],
  queryFn: () => foodTypeStore.onGetFoodTypes(),
})
const findFoodType = (id: string) => {
  return foodTypeData.value?.find((p) => p._id === id)
}

const seedSizeStore = useSeedSizeStore()
const { data: seedSizeData } = useQuery<ISeedSize[]>({
  queryKey: ['get_seed_sizes'],
  queryFn: () => seedSizeStore.onGetSeedSizes(),
})
const findSeedSize = (id: string) => {
  return seedSizeData.value?.find((p) => p._id === id)
}

// Computed for Galleria
const galleriaMediaItems = computed(() => {
  return selectedMediaItems.value.map((item) => ({
    itemSrc: item.url,
    thumbnailSrc: item.url,
    type: item.type,
    alt: `${item.type} - ${item.filename}`,
  }))
})

const foodColumns = ref([
  {
    field: 'images',
    header: 'รูป',
    headCell: '!min-w-[3rem] justify-center',
    bodyCell: ' text-center',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center justify-center relative group'],
        },
        [
          slotProps.data.product.images && slotProps.data.product.images.length > 0
            ? h('div', { class: 'relative' }, [
                h('img', {
                  src: getImageUrl(slotProps.data.product.images[0]),
                  alt: 'product image',
                  class: [
                    'w-auto h-14 object-contain rounded cursor-pointer',
                    'hover:ring hover:ring-blue-500/75 duration-150 transition-all',
                    'hover:scale-110 transform',
                  ].join(' '),
                  onClick: () => openMediaGalleryModal(slotProps.data.product, 'image', 0),
                  loading: 'lazy',
                  fetchpriority: 'low',
                  crossorigin: 'anonymous',
                }),
                // Badge แสดงจำนวนรูป
                slotProps.data.product.images.length > 1
                  ? h(
                      'span',
                      {
                        class: [
                          'absolute -top-1 -right-1 bg-blue-600 text-white',
                          'text-[9px] font-semibold rounded-full',
                          'w-3.5 h-3.5 flex items-center justify-center',
                        ].join(' '),
                      },
                      slotProps.data.product.images.length
                    )
                  : null,
              ])
            : h('i', { class: 'pi pi-image text-gray-500 !text-lg' }),
        ]
      ),
  },
  {
    field: 'brand',
    header: 'ยี่ห้อ',
    render: (slotProps: any) =>
      h('div', { class: 'flex items-center gap-1.5' }, [
        findFoodBrand(slotProps.data?.product.brand)?.image
          ? h('img', {
              src: getImageBrand(findFoodBrand(slotProps.data?.product.brand)?.image || ''),
              alt: 'brand',
              class: 'w-auto h-6 object-contain rounded',
              loading: 'lazy',
              fetchpriority: 'low',
              crossorigin: 'anonymous',
            })
          : null,
        h(
          'span',
          { class: 'text-gray-700' },
          findFoodBrand(slotProps.data?.product.brand)?.name || '-'
        ),
      ]),
  },
  {
    field: 'productInfo',
    header: 'ข้อมูลสินค้า',
    headCell: '!min-w-[12rem]',
    render: (slotProps: any) =>
      h('div', { class: 'flex flex-col gap-0.5' }, [
        // SKU
        h('div', { class: 'flex items-center gap-1.5' }, [
          h('span', { class: 'text-xs text-gray-600' }, 'รหัสสินค้า:'),
          h(
            'span',
            { class: 'text-xs font-medium text-gray-900' },
            slotProps.data.product.sku || '-'
          ),
        ]),

        // Lot Number
        h('div', { class: 'flex items-center gap-1.5' }, [
          h('span', { class: 'text-xs text-gray-600' }, 'เลขล็อต:'),
          h(
            'span',
            { class: 'text-xs font-medium text-gray-900' },
            lotNumberData.value?.find((p) => p._id === slotProps.data?.product.lotNumber)?.name ||
              '-'
          ),
        ]),

        // Food Type
        h('div', { class: 'flex items-center gap-1.5' }, [
          h('span', { class: 'text-xs text-gray-600' }, 'ประเภทอาหาร:'),
          h(
            'span',
            { class: 'text-xs font-medium text-gray-900' },
            findFoodType(slotProps.data?.product.foodtype)?.name || '-'
          ),
        ]),
      ]),
  },
  {
    field: 'lotAndStock',
    header: 'คงเหลือ/ข้อมูลเม็ด',
    headCell: '!min-w-[7rem]',
    render: (slotProps: any) =>
      h('div', { class: 'flex flex-col gap-0.5' }, [
        h('div', { class: 'flex items-center gap-1.5' }, [
          h('span', { class: 'text-xs text-gray-600' }, 'คงเหลือ:'),
          slotProps.data.kilo
            ? h(
                'span',
                { class: 'text-xs font-medium text-gray-900' },
                slotProps.data.kilo + ' กก.'
              )
            : h('span', { class: 'text-xs text-red-600 font-medium' }, 'หมด'),
        ]),

        h('div', { class: 'flex items-center gap-1.5' }, [
          h('span', { class: 'text-xs text-gray-600' }, 'ประเภทเม็ด:'),
          h(Tag, {
            value: getSeedTypeLabel(slotProps.data.product.seedType).label,
            severity: getSeedTypeLabel(slotProps.data.product.seedType)?.severity,
            size: 'small',
            class: 'text-xs px-1.5 py-0.5',
          }),
        ]),

        h('div', { class: 'flex items-center gap-1.5' }, [
          h('span', { class: 'text-xs text-gray-600' }, 'ขนาดเม็ด:'),
          h(Tag, {
            value: getSeedSizeLabel(findSeedSize(slotProps.data?.product?.seedSize))?.label,
            severity: getSeedSizeLabel(findSeedSize(slotProps.data?.product?.seedSize))?.severity,
            size: 'small',
            class: 'text-xs px-1.5 py-0.5',
          }),
        ]),
      ]),
  },

  {
    field: 'dates',
    header: 'วันที่',
    headCell: '!min-w-[7rem]',
    render: (slotProps: any) =>
      h('div', { class: 'flex flex-col gap-0.5' }, [
        slotProps.data?.product?.food?.produceDate
          ? h('div', { class: 'flex items-center gap-1' }, [
              h('span', { class: 'text-xs text-gray-600' }, 'ผลิต:'),
              h(
                'span',
                { class: 'text-xs text-gray-900' },
                dayjs(slotProps.data?.product?.food?.produceDate).format('DD/MM/YY')
              ),
            ])
          : null,
        slotProps.data?.product?.food?.expireDate
          ? h('div', { class: 'flex items-center gap-1' }, [
              h('span', { class: 'text-xs text-gray-600' }, 'หมดอายุ:'),
              h(
                'span',
                { class: 'text-xs text-gray-900' },
                dayjs(slotProps.data?.product?.food?.expireDate).format('DD/MM/YY')
              ),
            ])
          : null,
      ]),
  },

  {
    field: 'prices',
    header: 'ราคาทุน/ตลาด',
    headCell: '!min-w-[10rem]',
    render: (slotProps: any) =>
      h('div', { class: 'flex flex-col gap-0.5 text-sm' }, [
        slotProps.data?.costPriceKilo
          ? h('div', { class: 'flex items-center gap-1.5' }, [
              h('span', { class: 'text-gray-600' }, 'ราคาทุน:'),
              h(
                'span',
                { class: 'text-gray-900 font-medium' },
                formatCurrency(slotProps.data?.costPriceKilo)
              ),
            ])
          : null,
        slotProps.data?.priceKilo
          ? h('div', { class: 'flex items-center gap-1.5' }, [
              h('span', { class: 'text-gray-600' }, 'ราคาตลาด:'),
              h(
                'span',
                { class: 'text-gray-900 font-medium' },
                formatCurrency(slotProps.data?.priceKilo)
              ),
            ])
          : null,
      ]),
  },

  {
    field: 'prices-sell',
    header: 'ราคาลูกค้า/พ่อค้า',
    headCell: '!min-w-[10rem]',
    render: (slotProps: any) =>
      h('div', { class: 'flex flex-col gap-0.5 text-sm' }, [
        slotProps.data?.customerPriceKilo
          ? h('div', { class: 'flex items-center gap-1.5' }, [
              h('span', { class: 'text-gray-500' }, 'ลูกค้า:'),
              h(
                'span',
                { class: 'text-gray-900 font-medium' },
                formatCurrency(slotProps.data?.customerPriceKilo)
              ),
            ])
          : null,
        slotProps.data?.dealerPriceKilo
          ? h('div', { class: 'flex items-center gap-1.5' }, [
              h('span', { class: 'text-gray-500' }, 'พ่อค้า:'),
              h(
                'span',
                { class: 'text-gray-900 font-medium' },
                formatCurrency(slotProps.data?.dealerPriceKilo)
              ),
            ])
          : null,
      ]),
  },
])
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl px-4 shadow-sm">
    <div class="py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            v-if="props.selectedCategory"
            :class="`w-10 h-10 rounded-lg flex items-center justify-center ${props.selectedCategory?.bgColor}`"
          >
            <i :class="`${props.selectedCategory?.icon} ${props.selectedCategory?.iconColor}`"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">
              {{ props.selectedCategory?.name || 'ไม่ระบุหมวดหมู่' }}
            </h3>
            <p class="text-sm text-gray-600">แสดง {{ filteredProducts.length }} รายการ</p>
          </div>
        </div>
      </div>
    </div>

    <DataTable
      :value="filteredProducts"
      :loading="isLoadingProducts"
      :paginator="true"
      :rows="50"
      :rowsPerPageOptions="[20, 50, 100]"
      scrollHeight="600px"
      scrollable
      :pt="{
        table: 'text-sm',
        header: 'py-2',
        body: 'py-1',
        row: 'py-1',
        cell: 'py-1 px-2',
        columnHeader: 'py-2 px-2',
      }"
    >
      <Column
        v-for="(item, index) in foodColumns"
        :key="index"
        :field="item.field"
        :header="item.header"
        :frozen="index === 0"
        :pt="{
          columnHeaderContent: { class: ['min-w-[4.5rem]', item.headCell] },
          bodyCell: { class: [item?.bodyCell || ''] },
        }"
      >
        <template #body="slotProps">
          <component :is="item.render?.(slotProps)" v-if="item.render" />
          <span v-else>
            {{ slotProps.data[item.field] }}
          </span>
        </template>
      </Column>

      <Column
        field="action"
        header="จัดการ"
        headCell="!min-w-[6rem]"
        :pt="{ columnHeaderContent: 'justify-end' }"
      >
        <template #body="{ data }">
          <div class="flex items-center gap-2 justify-end">
            <Button
              v-tooltip.top="'ดูรายละเอียด'"
              icon="pi pi-eye"
              severity="info"
              size="small"
              @click="$emit('open-detail-modal', data)"
            />
            <Button
              v-tooltip.top="'แก้ไขข้อมูล'"
              icon="pi pi-pencil"
              severity="success"
              size="small"
              @click="$emit('open-edit-modal', data)"
            />
            <Button
              v-tooltip.top="'ลบข้อมูล'"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              @click="$emit('open-delete-modal', data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- Image Gallery Modal with Carousel -->
  <Dialog
    v-model:visible="showMediaGalleryModal"
    modal
    :dismissableMask="true"
    :draggable="false"
    :pt="{
      root: { class: 'w-[90vw] max-w-5xl' },
      content: { class: 'p-0' },
    }"
    @hide="closeMediaGalleryModal"
  >
    <template #header>
      <div class="flex items-center justify-between w-full pr-8">
        <div class="flex items-center gap-2">
          <i
            :class="[
              'pi',
              galleriaMediaItems[activeMediaIndex]?.type === 'video'
                ? 'pi-video text-green-600'
                : galleriaMediaItems[activeMediaIndex]?.type === 'certificate'
                ? 'pi-file-pdf text-purple-600'
                : 'pi-images text-blue-600',
            ]"
          ></i>
          <h3 class="text-lg font-semibold text-gray-800">
            <span v-if="galleriaMediaItems[activeMediaIndex]?.type === 'image'">รูปภาพสินค้า</span>
            <span v-else-if="galleriaMediaItems[activeMediaIndex]?.type === 'certificate'"
              >ใบรับรอง</span
            >
            <span v-else>วิดีโอสินค้า</span>
            <span class="text-sm font-normal text-gray-500 ml-2">
              ({{ activeMediaIndex + 1 }}/{{ selectedMediaItems.length }})
            </span>
          </h3>
        </div>
      </div>
    </template>
    <div class="px-4 pb-4">
      <Galleria
        v-model:activeIndex="activeMediaIndex"
        :value="galleriaMediaItems"
        :numVisible="5"
        :circular="true"
        :showItemNavigators="true"
        :showThumbnails="true"
        :showItemNavigatorsOnHover="false"
        :transitionInterval="0"
        :pt="{
          root: { class: 'max-w-full' },
          itemsContainer: { class: 'relative' },
          items: { class: 'flex items-center justify-center' },
          item: { class: 'w-full flex items-center justify-center' },
          content: { class: 'bg-gray-900 rounded-lg overflow-hidden' },
          thumbnailsContent: { class: 'bg-gray-100 rounded-lg mt-3' },
          thumbnailItems: { class: 'flex items-center justify-center !gap-1' },
          thumbnailItem: { class: '!flex-none !flex-shrink-0 !flex-grow-0' },
        }"
      >
        <template #item="{ item }">
          <div
            class="flex justify-center items-center w-full h-full min-h-[400px] transition-all duration-300 ease-in-out"
          >
            <!-- Image -->
            <img
              v-if="item.type === 'image' || item.type === 'certificate'"
              :src="item.itemSrc"
              :alt="item.alt"
              class="max-w-full min-h-[55vh] max-h-[55vh] object-contain transition-transform duration-300 ease-in-out"
              loading="lazy"
              fetchpriority="low"
              crossorigin="anonymous"
            />

            <!-- Video -->
            <div v-else-if="item.type === 'video'" class="w-full max-w-4xl mx-auto">
              <video
                :src="item.itemSrc"
                class="w-full h-auto min-h-[55vh] max-h-[55vh] rounded-lg"
                controls
                :key="item.itemSrc"
              >
                <p class="text-white p-4">เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ</p>
              </video>
            </div>
          </div>
        </template>

        <template #thumbnail="{ item }">
          <div class="p-1 relative flex">
            <!-- Image/Certificate Thumbnail -->
            <img
              v-if="item.type === 'image' || item.type === 'certificate'"
              :src="item.thumbnailSrc"
              :alt="item.alt"
              class="w-auto h-20 object-contain rounded-lg cursor-pointer hover:ring hover:ring-blue-500 duration-150 transition-all"
              loading="lazy"
              fetchpriority="low"
              crossorigin="anonymous"
            />

            <!-- Video Thumbnail -->
            <div
              v-if="item.type === 'video'"
              class="w-20 h-20 bg-gradient-to-br from-gray-800 to-black rounded-lg cursor-pointer hover:ring hover:ring-blue-500 duration-150 transition-all flex items-center justify-center relative overflow-hidden"
            >
              <div class="absolute inset-0 bg-black/30"></div>
              <i class="pi pi-play-circle text-white text-3xl relative z-10 drop-shadow-lg"></i>
            </div>
          </div>
        </template>
      </Galleria>
    </div>

    <template #footer>
      <div class="flex justify-end items-center gap-2">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="closeMediaGalleryModal"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>



