<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { DataTable, Column, Tag, Button, Dialog, Galleria } from 'primevue'
import type { IProduct, IProductImage } from '../../stores/product/product'
import formatCurrency from '../../utils/formatCurrency'
import type { ICategory } from '@/stores/product/category'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/vue-query'
import { useGreenhouseStore, type IGreenhouse } from '@/stores/product/greenhouse'

// Props
const props = defineProps<{
  filteredProducts: IProduct[]
  isLoadingProducts: boolean
  selectedCategory: ICategory | null
}>()

// Emits
defineEmits<{
  'open-detail-modal': [product: IProduct]
  'open-edit-modal': [product: IProduct]
  'open-delete-modal': [product: IProduct]
}>()

// Utility functions
const getGenderTag = (gender: string) => {
  switch (gender) {
    case 'ตัวผู้':
      return { label: 'ตัวผู้', severity: 'info' }
    case 'ตัวเมีย':
      return { label: 'ตัวเมีย', severity: 'warning' }
    case 'ไม่ระบุ':
      return { label: 'ไม่ระบุ', severity: 'secondary' }
  }
}

const getImageUrl = (image: IProductImage | undefined) => {
  if (!image) return ''
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${image?.filename}`
}

const getImageBrand = (image: string) => {
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${image}`
}

const getCertificateUrl = (image: string | undefined) => {
  if (!image) return ''
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${image}`
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
    'S': 'info',      // ฟ้า
    'M': 'success',   // เขียว
    'L': 'warn',      // ส้ม
    'XL': 'danger',   // แดง
    'XXL': 'contrast', // ดำ/ขาว
    // เพิ่มขนาดอื่นๆ ตามที่มีจริง
  }

  const severity = colorMap[seedSize.name] || 'secondary'
  return { label: seedSize.name, severity }
}

const greenhouseStore = useGreenhouseStore()
const { data: greenhouseData } = useQuery<IGreenhouse[]>({
  queryKey: ['get_greenhouses'],
  queryFn: () => greenhouseStore.onGetGreenhouses(),
})

const showVideoModal = ref(false)
const selectedVideoUrl = ref<string | null>(null)

// Video functions
const openVideoModal = (videoFilename: string) => {
  selectedVideoUrl.value = getVideoUrl(videoFilename)
  showVideoModal.value = true
}

const closeVideoModal = () => {
  showVideoModal.value = false
  selectedVideoUrl.value = null
}

const getVideoUrl = (filename: string) => {
  if (!filename) return ''
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${filename}`
}

// Image gallery modal states
const showImageGalleryModal = ref(false)
const selectedImages = ref<IProductImage[]>([])
const activeImageIndex = ref(0)

// Image gallery functions
const openImageGalleryModal = (images: IProductImage[], startIndex: number = 0) => {
  if (images && images.length > 0) {
    selectedImages.value = images
    activeImageIndex.value = startIndex
    showImageGalleryModal.value = true
  }
}

const closeImageGalleryModal = () => {
  showImageGalleryModal.value = false
  selectedImages.value = []
  activeImageIndex.value = 0
}

// Certificate modal states
const showCertificateModal = ref(false)
const selectedCertificateUrl = ref<string | null>(null)

// Certificate functions
const openCertificateModal = (certificateFilename: string) => {
  selectedCertificateUrl.value = getCertificateUrl(certificateFilename)
  showCertificateModal.value = true
}

const closeCertificateModal = () => {
  showCertificateModal.value = false
  selectedCertificateUrl.value = null
}

// Computed for Galleria
const galleriaImages = computed(() => {
  return selectedImages.value.map((img) => ({
    itemImageSrc: getImageUrl(img),
    thumbnailImageSrc: getImageUrl(img),
    alt: 'Product image',
  }))
})

const foodColumns = ref([
  {
    field: 'images',
    header: 'รูปสินค้า',
    headCell: '!min-w-[3rem] justify-center',
    bodyCell: ' text-center',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center justify-center relative group'],
        },
        [
          slotProps.data.images && slotProps.data.images.length > 0
            ? h('div', { class: 'relative' }, [
                h('img', {
                  src: getImageUrl(slotProps.data.images[0]),
                  alt: 'product image',
                  class: [
                    'w-auto h-10 object-contain rounded cursor-pointer',
                    'hover:ring hover:ring-blue-500/75 duration-150 transition-all',
                    'hover:scale-110 transform',
                  ].join(' '),
                  onClick: () => openImageGalleryModal(slotProps.data.images, 0),
                }),
                // Badge แสดงจำนวนรูป
                slotProps.data.images.length > 1
                  ? h(
                      'span',
                      {
                        class: [
                          'absolute -top-1 -right-1 bg-blue-600 text-white',
                          'text-[10px] font-semibold rounded-full',
                          'w-4 h-4 flex items-center justify-center',
                        ].join(' '),
                      },
                      slotProps.data.images.length
                    )
                  : null,
              ])
            : h('i', { class: 'pi pi-image text-gray-500 !text-xl' }),
        ]
      ),
  },
{
    field: 'sku',
    header: 'รหัสอาหาร',
    render: (slotProps: any) =>
      slotProps.data.sku
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.sku)
        : h('span', '-'),
  },
  {
    field: 'lotNumber',
    header: 'เลขล็อต',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      h('span', { class: 'text-sm text-gray-900' }, slotProps.data?.lotNumber?.name || '-'),
  },
  {
    field: 'balance',
    header: 'สินค้าคงเหลือ',
    headCell: '!min-w-[5rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.balance
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.balance)
        : h('span', { class: 'text-sm text-red-600' }, 'หมด'),
  },
  {
    field: 'brand',
    header: 'ชื่อแบรนด์',
    headCell: '!min-w-[7.5rem]',
    render: (slotProps: any) =>

      h(
        'div',
        {
          class: ['flex items-center gap-1.5'],
        },
        [
          slotProps.data.brand.image
            ? h('img', {
                src: getImageBrand(slotProps.data.brand.image),
                alt: 'product image',
                class:
                  'w-auto h-8 object-contain rounded',
              })
            : h('i', { class: 'pi pi-image text-gray-500 text-lg' }),
          h('span', { class: 'text-sm text-gray-900 font-medium' }, slotProps.data?.brand?.name),
        ]
      ),
  },
  {
    field: 'foodtype',
    header: 'ประเภทอาหาร',
    headCell: '!min-w-[6.5rem]',
    render: (slotProps: any) =>
      slotProps.data?.foodtype
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.foodtype.name)
        : h('span', '-'),
  },
  {
    field: 'seedType',
    header: 'ชนิดเม็ด',
    headCell: ' justify-center',
    bodyCell: ' text-center',
    render: (slotProps: any) =>
      h(Tag, {
        value: getSeedTypeLabel(slotProps.data.seedType).label,
        severity: getSeedTypeLabel(slotProps.data.seedType)?.severity,
        size: 'small',
        class: 'text-xs',
      }),
  },
  {
    field: 'seedSize',
    header: 'ขนาดเม็ด',
    headCell: ' justify-center',
    bodyCell: ' text-center',
    render: (slotProps: any) =>
      h(Tag, {
        value: getSeedSizeLabel(slotProps.data?.seedSize)?.label,
        severity: getSeedSizeLabel(slotProps.data?.seedSize)?.severity,
        size: 'small',
        class: 'text-xs',
      }),
  },
  {
    field: 'weight',
    header: 'น้ำหนักต่อกระสอบ',
    headCell: '!min-w-[7rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.weight
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.weight)
        : h('span', '-'),
  },
  {
    field: 'food.produceDate',
    header: 'วันผลิต',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data?.food?.produceDate
        ? h(
            'span',
            { class: 'text-sm text-gray-900' },
            dayjs(slotProps.data?.food?.produceDate).format('DD/MM/YYYY')
          )
        : h('span', '-'),
  },
  {
    field: 'food.expireDate',
    header: 'วันหมดอายุ',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data?.food?.expireDate
        ? h(
            'span',
            { class: 'text-sm text-gray-900' },
            dayjs(slotProps.data?.food?.expireDate).format('DD/MM/YYYY')
          )
        : h('span', '-'),
  },
  {
    field: 'food.marketPrice',
    header: 'ราคาท้องตลาด',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data?.food?.marketPrice
        ? h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data?.food?.marketPrice)
          )
        : h('span', '-'),
  },
  {
    field: 'food.costPrice',
    header: 'ราคาทุน',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data?.food?.costPrice
        ? h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data?.food?.costPrice)
          )
        : h('span', '-'),
  },
  {
    field: 'food.customerPrice',
    header: 'ราคาลูกค้า',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data?.food?.customerPrice
        ? h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data?.food?.customerPrice)
          )
        : h('span', '-'),
  },
  {
    field: 'food.dealerPrice',
    header: 'ราคาพ่อค้า',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data?.food?.dealerPrice
        ? h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data?.food?.dealerPrice)
          )
        : h('span', '-'),
  },
])

const fishColumns = ref([
  {
    field: 'images',
    header: 'รูปปลา',
    headCell: '!min-w-[2.5rem] justify-center',
    bodyCell: ' text-center',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center justify-center relative group'],
        },
        [
          slotProps.data.images && slotProps.data.images.length > 0
            ? h('div', { class: 'relative' }, [
                h('img', {
                  src: getImageUrl(slotProps.data.images[0]),
                  alt: 'fish image',
                  class: [
                    'w-auto h-10 object-contain rounded cursor-pointer',
                    'hover:ring hover:ring-blue-500/75 duration-150 transition-all',
                    'hover:scale-110 transform',
                  ].join(' '),
                  onClick: () => openImageGalleryModal(slotProps.data.images, 0),
                }),
                // Badge แสดงจำนวนรูป
                slotProps.data.images.length > 1
                  ? h(
                      'span',
                      {
                        class: [
                          'absolute -top-1 -right-1 bg-blue-600 text-white',
                          'text-[10px] font-semibold rounded-full',
                          'w-4 h-4 flex items-center justify-center',
                        ].join(' '),
                      },
                      slotProps.data.images.length
                    )
                  : null,
              ])
            : h('i', { class: 'pi pi-image text-gray-500 !text-xl' }),
        ]
      ),
  },
  {
    field: 'youtube',
    header: 'วิดีโอ',
    headCell: ' justify-center',
    bodyCell: ' text-center',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center justify-center'],
        },
        [
          slotProps.data.youtube
            ? h(Button, {
                icon: 'pi pi-play-circle',
                severity: 'success',
                size: 'small',
                outlined: true,
                onClick: () => openVideoModal(slotProps.data.youtube),
                pt: {
                  root: { class: '!w-8 !h-8' },
                },
              })
            : h('i', { class: 'pi pi-video text-gray-400 !text-xl' }),
        ]
      ),
  },
  {
    field: 'certificate',
    header: 'ใบเซอร์',
    headCell: ' justify-center',
    bodyCell: ' text-center',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center justify-center'],
        },
        [
          slotProps.data?.certificate
            ? h('img', {
                src: getCertificateUrl(slotProps.data?.certificate),
                alt: 'certificate image',
                class: [
                  'w-auto h-10 object-contain rounded cursor-pointer',
                  'hover:ring hover:ring-purple-500/75 duration-150 transition-all',
                  'hover:scale-110 transform',
                ].join(' '),
                onClick: () => openCertificateModal(slotProps.data?.certificate),
              })
            : h('i', { class: 'pi pi-file text-gray-500 !text-xl' }),
        ]
      ),
  },
  {
    field: 'lotNumber',
    header: 'ล็อต',
    render: (slotProps: any) =>
      h('span', { class: 'text-sm text-gray-900' }, slotProps.data.lotNumber.name),
  },
  {
    field: 'sku',
    header: 'รหัสปลา',
    render: (slotProps: any) => h('span', { class: 'text-sm text-gray-900' }, slotProps.data.sku),
  },
  {
    field: 'greenhouse',
    header: 'กรีนเฮ้า',
    headCell: '!min-w-[5rem]',
    render: (slotProps: any) =>
      slotProps?.data?.fishpond
        ? h(
            'span',
            { class: 'text-sm text-gray-900' },
            greenhouseData.value?.find(
              (greenhouse) => greenhouse._id === slotProps?.data?.fishpond?.greenhouse
            )?.name
          )
        : h('span', '-'),
  },
  {
    field: 'fishpond',
    header: 'บ่อ',
    headCell: '!min-w-[5rem]',
    render: (slotProps: any) =>
      slotProps?.data?.fishpond
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps?.data?.fishpond?.code)
        : h('span', '-'),
  },
  {
    field: 'species',
    header: 'สายพันธุ์',
    headCell: '!min-w-[7rem]',
    render: (slotProps: any) =>
      slotProps.data.species
        ? h('span', { class: 'text-sm text-gray-900 font-medium' }, slotProps.data.species.name)
        : h('span', '-'),
  },
  {
    field: 'price',
    header: 'ราคา',
    headCell: '!min-w-[5rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.price
        ? h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data.price)
          )
        : h('span', '-'),
  },
  {
    field: 'sold',
    header: 'สถานะขาย',
    headCell: 'justify-center',
    bodyCell: 'text-center',
    render: (slotProps: any) =>
      h(Tag, {
        value: slotProps.data.sold ? 'ขายแล้ว' : 'พร้อมขาย',
        severity: slotProps.data.sold ? 'danger' : 'success',
        size: 'small',
      }),
  },

   {
    field: 'size',
    header: 'ไซต์',
    headCell: '!min-w-[4rem] justify-center',
    bodyCell: 'text-center',
    render: (slotProps: any) =>
      slotProps.data.size
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.size)
        : h('span', '-'),
  },

   {
    field: 'age',
    header: 'อายุ',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data.age
        ? h('span', { class: 'text-sm text-gray-900 uppercase' }, slotProps.data.age)
        : h('span', '-'),
  },
    {
    field: 'weight',
    header: 'น้ำหนัก (กก.)',
    headCell: '!min-w-[5rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.weight
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.weight)
        : h('span', '-'),
  },

  {
    field: 'breeders',
    header: 'แม่พันธุ์',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data.breeders
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.breeders)
        : h('span', '-'),
  },
  {
    field: 'birth',
    header: 'วันเกิด',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data.birth
        ? h(
            'span',
            { class: 'text-sm text-gray-900' },
            dayjs(slotProps.data.birth).format('DD/MM/YYYY')
          )
        : h('span', '-'),
  },

  {
    field: 'quality',
    header: 'คุณภาพปลา',
    render: (slotProps: any) =>
      slotProps.data.quality
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.quality.name || '-')
        : h('span', '-'),
  },
  {
    field: 'farm',
    header: 'ฟาร์ม',
    headCell: '!min-w-[7.5rem]',
    render: (slotProps: any) =>
      slotProps?.data?.farm
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps?.data?.farm?.name)
        : h('span', '-'),
  },


  {
    field: 'gender',
    header: 'เพศ',
    headCell: '!min-w-[4rem] justify-center',
    bodyCell: 'text-center',
    render: (slotProps: any) =>
      h(Tag, {
        value: getGenderTag(slotProps.data.gender)?.label,
        severity: getGenderTag(slotProps.data.gender)?.severity,
        size: 'small',
      }),
  },

])

const microorganismColumns = ref([
  {
    field: 'images',
    header: 'รูปสินค้า',
    headCell: '!min-w-[3rem] justify-center',
    bodyCell: ' text-center',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center justify-center relative group'],
        },
        [
          slotProps.data.images && slotProps.data.images.length > 0
            ? h('div', { class: 'relative' }, [
                h('img', {
                  src: getImageUrl(slotProps.data.images[0]),
                  alt: 'product image',
                  class: [
                    'w-auto h-10 object-contain rounded cursor-pointer',
                    'hover:ring hover:ring-blue-500/75 duration-150 transition-all',
                    'hover:scale-110 transform',
                  ].join(' '),
                  onClick: () => openImageGalleryModal(slotProps.data.images, 0),
                }),
                // Badge แสดงจำนวนรูป
                slotProps.data.images.length > 1
                  ? h(
                      'span',
                      {
                        class: [
                          'absolute -top-1 -right-1 bg-blue-600 text-white',
                          'text-[10px] font-semibold rounded-full',
                          'w-4 h-4 flex items-center justify-center',
                        ].join(' '),
                      },
                      slotProps.data.images.length
                    )
                  : null,
              ])
            : h('i', { class: 'pi pi-image text-gray-500 !text-xl' }),
        ]
      ),
  },
  {
    field: 'sku',
    header: 'รหัสสารปรับสภาพน้ำ',
    headCell: '!min-w-[8rem]',
    render: (slotProps: any) =>
      slotProps.data.sku
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.sku)
        : h('span', '-'),
  },
  {
    field: 'lotNumber',
    header: 'เลขล็อต',
    render: (slotProps: any) =>
      h('span', { class: 'text-sm text-gray-900' }, slotProps.data?.lotNumber?.name || '-'),
  },
  {
    field: 'balance',
    header: 'สินค้าคงเหลือ',
    headCell: '!min-w-[5rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.balance
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.balance)
        : h('span', { class: 'text-sm text-red-600' }, 'หมด'),
  },
  {
    field: 'brand',
    header: 'ชื่อแบรนด์',
    headCell: '!min-w-[7.5rem]',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center gap-1.5'],
        },
        [
          slotProps.data?.brand?.image
            ? h('img', {
                src: getImageBrand(slotProps.data.brand.image),
                alt: 'product image',
                class:
                  'w-auto h-8 object-contain rounded',
              })
            : h('i', { class: 'pi pi-image text-gray-500 text-lg' }),
          h('span', { class: 'text-sm text-gray-900 font-medium' }, slotProps.data?.brand?.name),
        ]
      ),
  },
  {
    field: 'weight',
    header: 'น้ำหนัก (กรัม)',
    headCell: '!min-w-[7rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.weight
        ? h('span', { class: 'text-sm text-gray-900' }, Number(slotProps.data.weight) * 1000)
        : h('span', '-'),
  },
  {
    field: 'food.produceDate',
    header: 'วันที่ผลิต',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data?.food?.produceDate
        ? h(
            'span',
            { class: 'text-sm text-gray-900' },
            dayjs(slotProps.data?.food?.produceDate).format('DD/MM/YYYY')
          )
        : h('span', '-'),
  },
  {
    field: 'food.expireDate',
    header: 'วันหมดอายุ',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data?.food?.expireDate
        ? h(
            'span',
            { class: 'text-sm text-gray-900' },
            dayjs(slotProps.data?.food?.expireDate).format('DD/MM/YYYY')
          )
        : h('span', '-'),
  },
  {
    field: 'food.marketPrice',
    header: 'ราคาท้องตลาด',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data?.food?.marketPrice
        ? h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data?.food?.marketPrice)
          )
        : h('span', '-'),
  },
  {
    field: 'food.costPrice',
    header: 'ราคาทุน',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data?.food?.costPrice
        ? h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data?.food?.costPrice)
          )
        : h('span', '-'),
  },
  {
    field: 'food.customerPrice',
    header: 'ราคาลูกค้า',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data?.food?.customerPrice
        ? h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data?.food?.customerPrice)
          )
        : h('span', '-'),
  },
  {
    field: 'food.dealerPrice',
    header: 'ราคาพ่อค้า',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data?.food?.dealerPrice
        ? h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data?.food?.dealerPrice)
          )
        : h('span', '-'),
  },
])

const displayColumns = computed(() => {
  if (props.selectedCategory?.value === 'food') {
    return foodColumns.value
  } else if (props.selectedCategory?.value === 'fish') {
    return fishColumns.value
  } else if (props.selectedCategory?.value === 'microorganism') {
    return microorganismColumns.value
  }
  return []
})
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
        v-for="(item, index) in displayColumns"
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

  <Dialog
    v-model:visible="showVideoModal"
    modal
    :dismissableMask="true"
    :draggable="false"
    :pt="{
      root: { class: 'w-[90vw] max-w-4xl' },
      content: { class: 'p-0' },
    }"
    @hide="closeVideoModal"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-video text-green-600"></i>
        <h3 class="text-lg font-semibold text-gray-800">วิดีโอสินค้า</h3>
      </div>
    </template>

    <div v-if="selectedVideoUrl" class="relative px-4">
      <div class="bg-black rounded-lg pb-2">
        <video :src="selectedVideoUrl" class="w-full h-auto max-h-[60vh]" controls>
          <p class="text-white p-4">เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ</p>
        </video>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 pt-4">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="closeVideoModal"
          size="small"
        />
      </div>
    </template>
  </Dialog>

  <!-- Image Gallery Modal with Carousel -->
  <Dialog
    v-model:visible="showImageGalleryModal"
    modal
    :dismissableMask="true"
    :draggable="false"
    :pt="{
      root: { class: 'w-[90vw] max-w-5xl' },
      content: { class: 'p-0' },
    }"
    @hide="closeImageGalleryModal"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-images text-blue-600"></i>
        <h3 class="text-lg font-semibold text-gray-800">
          รูปภาพสินค้า
          <span class="text-sm font-normal text-gray-500 ml-2">
            ({{ activeImageIndex + 1 }}/{{ selectedImages.length }})
          </span>
        </h3>
      </div>
    </template>

    <div v-if="galleriaImages.length > 0" class="px-4 pb-4">
      <Galleria
        v-model:activeIndex="activeImageIndex"
        :value="galleriaImages"
        :numVisible="5"
        :circular="true"
        :showItemNavigators="true"
        :showThumbnails="true"
        :showItemNavigatorsOnHover="true"
        :pt="{
          root: { class: 'max-w-full' },
          content: { class: 'bg-gray-50 rounded-lg' },
          thumbnailsContent: { class: 'bg-gray-100 rounded-lg mt-3' },
        }"
      >
        <template #item="{ item }">
          <div class="flex justify-center items-center overflow-hidden">
            <img
              :src="item.itemImageSrc"
              :alt="item.alt"
              class="w-full h-auto max-h-[55vh] object-contain"
            />
          </div>
        </template>

        <template #thumbnail="{ item }">
          <div class="p-1">
            <img
              :src="item.thumbnailImageSrc"
              :alt="item.alt"
              class="w-full h-16 object-contain rounded cursor-pointer hover:ring-2 hover:ring-blue-500/50 duration-150 transition-all"
            />
          </div>
        </template>
      </Galleria>
    </div>

    <template #footer>
      <div class="flex justify-end items-center">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="closeImageGalleryModal"
          size="small"
        />
      </div>
    </template>
  </Dialog>

  <!-- Certificate Modal (Single Image) -->
  <Dialog
    v-model:visible="showCertificateModal"
    modal
    :dismissableMask="true"
    :draggable="false"
    :pt="{
      root: { class: 'w-[90vw] max-w-3xl' },
      content: { class: 'p-0' },
    }"
    @hide="closeCertificateModal"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-file-pdf text-purple-600"></i>
        <h3 class="text-lg font-semibold text-gray-800">ใบเซอร์</h3>
      </div>
    </template>

    <div v-if="selectedCertificateUrl" class="relative px-4 pb-4">
      <div class="bg-gray-50 rounded-lg p-4 flex justify-center items-center">
        <img
          :src="selectedCertificateUrl"
          alt="Certificate"
          class="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-md"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end items-center">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="closeCertificateModal"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
