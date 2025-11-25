<script setup lang="ts">
import { ref, h, computed, watch } from 'vue'
import { DataTable, Column, Tag, Button, Dialog } from 'primevue'
import type { IProduct, IProductImage, IUpdateProductPayload } from '@/stores/product/product'
import formatCurrency from '@/utils/formatCurrency'
import type { ICategory } from '@/stores/product/category'
import dayjs from 'dayjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useGreenhouseStore, type IGreenhouse } from '@/stores/fish/greenhouse'
import { getProductImageUrl } from '@/utils/imageUrl'
import { useProductStore } from '@/stores/product/product'
import { toast } from 'vue3-toastify'
import ModalPrintFish from './ModalPrintFish.vue'

// Props
const props = defineProps<{
  filteredProducts: IProduct[]
  isLoadingProducts: boolean
  selectedCategory: ICategory | null
  selectable?: boolean
}>()

// Emits
const emit = defineEmits<{
  'open-detail-modal': [product: IProduct]
  'open-edit-modal': [product: IProduct]
  'open-delete-modal': [product: IProduct]
  'update-selection': [products: IProduct[]]
}>()

// Utility functions
const getGenderTag = (gender: string) => {
  switch (gender) {
    case 'male':
      return { label: 'ตัวผู้', severity: 'info' }
    case 'female':
      return { label: 'ตัวเมีย', severity: 'warning' }
    case 'unknown':
      return { label: 'ไม่ระบุ', severity: 'secondary' }
    default:
      return { label: '-', severity: 'secondary' }
  }
}

const getImageUrl = (image: IProductImage | undefined) => {
  if (!image) return ''
  return getProductImageUrl(image?.filename)
}

const getCertificateUrl = (image: string | undefined) => {
  if (!image) return ''
  return getProductImageUrl(image)
}

const greenhouseStore = useGreenhouseStore()
const { data: greenhouseData } = useQuery<IGreenhouse[]>({
  queryKey: ['get_greenhouses'],
  queryFn: () => greenhouseStore.onGetGreenhouses(),
})

const selectedRows = ref<IProduct[]>([])
const showPrintModal = ref(false)

const handleSelectionChange = (value: IProduct[]) => {
  selectedRows.value = value
  emit('update-selection', value)
}

watch(
  () => props.filteredProducts,
  () => {
    if (selectedRows.value.length > 0) {
      selectedRows.value = []
      emit('update-selection', [])
    }
  }
)

// QC Status Modal State
const showQcConfirmModal = ref(false)
const selectedQcProduct = ref<IProduct | null>(null)
const qcActionType = ref<'ready' | 'wait-qc'>('ready')

const productStore = useProductStore()
const queryClient = useQueryClient()

const { mutate: updateProduct, isPending: isUpdatingProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
  onSuccess: (data: any) => {
    if (data.data.modifiedCount > 0) {
      toast.success('อัปเดตสถานะสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_products'] })
      if (props.selectedCategory?._id) {
        queryClient.invalidateQueries({
          queryKey: ['get_products_by_category', props.selectedCategory._id],
        })
      }
      showQcConfirmModal.value = false
      selectedQcProduct.value = null
    } else {
      toast.error(data.error?.message || 'อัปเดตสถานะไม่สำเร็จ')
    }
  },
  onError: (error: any) => {
    console.error('Update error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตสถานะไม่สำเร็จ')
  },
})

const handleQcStatusClick = (product: IProduct, action: 'ready' | 'wait-qc') => {
  selectedQcProduct.value = product
  qcActionType.value = action
  showQcConfirmModal.value = true
}

const confirmQcStatusChange = () => {
  if (!selectedQcProduct.value) return

  const payload: IUpdateProductPayload = {
    ...selectedQcProduct.value,
    _id: selectedQcProduct.value._id,
    waitQC: qcActionType.value === 'wait-qc',
    category: selectedQcProduct.value.category || { _id: '', name: '' },
    fishpond: selectedQcProduct.value.fishpond?._id,
    species: selectedQcProduct.value.species?._id,
    farm: selectedQcProduct.value.farm?._id,
    quality: selectedQcProduct.value.quality?._id,
    lotNumber: selectedQcProduct.value.lotNumber?._id,
    foodtype: selectedQcProduct.value.foodtype?._id,
    seedSize: selectedQcProduct.value.seedSize?._id,
    brand: selectedQcProduct.value.brand?._id,
    fishStatus: selectedQcProduct.value.fishStatus?._id,
    images: selectedQcProduct.value.images.map((img) => ({
      filename: img.filename,
      type: img.type,
    })),
  }

  updateProduct(payload)
}

const closeQcModal = () => {
  showQcConfirmModal.value = false
  selectedQcProduct.value = null
}

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
                onClick: () => emit('open-detail-modal', slotProps.data),
                loading: 'lazy',
                fetchpriority: 'low',
                crossorigin: 'anonymous',
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
              onClick: () => emit('open-detail-modal', slotProps.data),
              loading: 'lazy',
              fetchpriority: 'low',
              crossorigin: 'anonymous',
            })
            : h('i', { class: 'pi pi-file text-gray-500 !text-xl' }),
        ]
      ),
  },
  {
    field: 'lotNumber',
    header: 'ล็อต',
    headCell: '!min-w-[6.25rem]',
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
    render: (slotProps: any) => {
      const product = slotProps.data as IProduct

      // ถ้า waitQC = true แสดง "รอ QC" และคลิกได้
      if (product.waitQC) {
        return h(
          Tag,
          {
            value: 'รอ QC',
            severity: 'warn',
            size: 'small',
            style: { cursor: 'pointer' },
            onClick: () => handleQcStatusClick(product, 'ready'),
          },
          { default: () => 'รอ QC' }
        )
      }

      // ถ้า waitQC = false และ sold = false แสดง "พร้อมขาย" และคลิกได้
      if (!product.sold) {
        return h(
          Tag,
          {
            value: 'พร้อมขาย',
            severity: 'success',
            size: 'small',
            style: { cursor: 'pointer' },
            onClick: () => handleQcStatusClick(product, 'wait-qc'),
          },
          { default: () => 'พร้อมขาย' }
        )
      }

      // ถ้า waitQC = false และ sold = true แสดง "ขายแล้ว" และไม่คลิกได้
      return h(Tag, {
        value: 'ขายแล้ว',
        severity: 'danger',
        size: 'small',
      })
    },
  },
  {
    field: 'fishStatus',
    header: 'สถานะปลา',
    render: (slotProps: any) =>
      slotProps.data.fishStatus
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.fishStatus.name)
        : h('span', '-'),
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

const displayColumns = computed(() => {
  if (props.selectedCategory?.value === 'fish') {
    return fishColumns.value
  }
  return []
})
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl px-4 shadow-sm">
    <div class="py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div v-if="props.selectedCategory"
            :class="`w-10 h-10 rounded-lg flex items-center justify-center ${props.selectedCategory?.bgColor}`">
            <i :class="`${props.selectedCategory?.icon} ${props.selectedCategory?.iconColor}`"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">
              {{ props.selectedCategory?.name || 'ไม่ระบุหมวดหมู่' }}
            </h3>
            <p class="text-sm text-gray-600">แสดง {{ filteredProducts.length }} รายการ</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <Button v-if="selectedRows.length > 0" label="สร้าง PDF" icon="pi pi-file-pdf" severity="danger" size="small"
            @click="showPrintModal = true" />
        </div>
      </div>
    </div>

    <DataTable :value="filteredProducts" :loading="isLoadingProducts" :paginator="true" :rows="50"
      :rowsPerPageOptions="[20, 50, 100]" scrollHeight="600px" scrollable v-model:selection="selectedRows" dataKey="_id"
      :pt="{
        table: 'text-sm',
        header: 'py-2',
        body: 'py-1',
        row: 'py-1',
        cell: 'py-1 px-2',
        columnHeader: 'py-2 px-2',
      }" @update:selection="handleSelectionChange">
      <Column v-if="props.selectable" selectionMode="multiple" headerClass="w-12 text-center" bodyClass="text-center"
        style="width: 3rem" />

      <Column v-for="(item, index) in displayColumns" :key="index" :field="item.field" :header="item.header"
        :frozen="index === 0" :pt="{
          columnHeaderContent: { class: ['min-w-[4.5rem]', item.headCell] },
          bodyCell: { class: [item?.bodyCell || ''] },
        }">
        <template #body="slotProps">
          <component :is="item.render?.(slotProps)" v-if="item.render" />
          <span v-else>
            {{ slotProps.data[item.field] }}
          </span>
        </template>
      </Column>

      <Column field="action" header="จัดการ" headCell="!min-w-[6rem]" :pt="{ columnHeaderContent: 'justify-end' }">
        <template #body="{ data }">
          <div class="flex items-center gap-2 justify-end">
            <Button v-tooltip.top="'ดูรายละเอียด'" icon="pi pi-eye" severity="info" size="small"
              @click="$emit('open-detail-modal', data)" />
            <Button v-tooltip.top="'แก้ไขข้อมูล'" icon="pi pi-pencil" severity="success" size="small"
              @click="$emit('open-edit-modal', data)" />
            <Button v-tooltip.top="'ลบข้อมูล'" icon="pi pi-trash" severity="danger" size="small"
              @click="$emit('open-delete-modal', data)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- QC Status Confirmation Modal -->
  <Dialog v-model:visible="showQcConfirmModal" modal :style="{ width: '30rem' }" :pt="{
    header: 'p-4',
    footer: 'p-4',
  }">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-exclamation-triangle text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">ยืนยันการเปลี่ยนสถานะ</h3>
        </div>
      </div>
    </template>

    <div class="pt-4">
      <p class="text-gray-700 mb-2">
        {{
          qcActionType === 'ready'
            ? 'คุณต้องการเปลี่ยนสถานะจาก "รอ QC" เป็น "พร้อมขาย" หรือไม่?'
            : 'คุณต้องการเปลี่ยนสถานะจาก "พร้อมขาย" เป็น "รอ QC" หรือไม่?'
        }}
      </p>
      <p v-if="selectedQcProduct" class="text-sm text-gray-600">
        รหัสปลา: <span class="font-semibold">{{ selectedQcProduct.sku }}</span>
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="closeQcModal" size="small" />
        <Button label="ยืนยัน" icon="pi pi-check" @click="confirmQcStatusChange" severity="success" size="small"
          :loading="isUpdatingProduct" />
      </div>
    </template>
  </Dialog>

  <!-- Print Modal -->
  <ModalPrintFish v-model:visible="showPrintModal" :selected-products="selectedRows" />
</template>
