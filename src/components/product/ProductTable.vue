<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { DataTable, Column, Tag, Button } from 'primevue'
import type { IProduct, IProductImage, ISeedSizeValue } from '../../stores/product/product'
import formatCurrency from '../../utils/formatCurrency'
import type { ICategory } from '@/stores/product/category'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useGreenhouseStore, type IGreenhouse } from '@/stores/product/greenhouse'

// Router
const router = useRouter()

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

const getCertificateUrl = (image: string | undefined) => {
  if (!image) return ''
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${image}`
}

const getSeedSizeLabel = (seedSize: ISeedSizeValue) => {
  const sizeMap = {
    1: 'SS',
    2: 'S',
    3: 'M',
    4: 'L',
    5: 'XL',
  }
  return sizeMap[seedSize as keyof typeof sizeMap] || '-'
}

const getSeedTypeLabel = (seedType: string) => {
  return seedType || '-'
}

const greenhouseStore = useGreenhouseStore()
const { data: greenhouseData } = useQuery<IGreenhouse[]>({
  queryKey: ['get_greenhouses'],
  queryFn: () => greenhouseStore.onGetGreenhouses(),
})

const foodColumns = ref([
  {
    field: 'sku',
    header: 'รหัสอาหาร',
    render: (slotProps: any) =>
      slotProps.data.sku
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-qrcode text-orange-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps.data.sku),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'lotNumber',
    header: 'รหัสล็อต',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center gap-1.5'],
        },
        [
          h('i', { class: 'pi pi-tag text-blue-500 text-xs' }),
          h('span', { class: 'text-sm text-gray-900' }, slotProps.data.lotNumber),
        ]
      ),
  },
  {
    field: 'name',
    header: 'ชื่อแบรนด์',
    headCell: '!min-w-[8rem]',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center gap-1.5'],
        },
        [
          slotProps.data.images && slotProps.data.images.length > 0
            ? h('img', {
                src: getImageUrl(slotProps.data.images[0]),
                alt: 'product image',
                class: 'w-auto h-8 object-contain rounded-lg',
              })
            : h('i', { class: 'pi pi-image text-gray-500 text-lg' }),
          h('span', { class: 'text-sm text-gray-900 font-medium' }, slotProps.data.name),
        ]
      ),
  },
  {
    field: 'food.type',
    header: 'ประเภทอาหาร',
    headCell: '!min-w-[5.5rem]',
    render: (slotProps: any) =>
      slotProps.data?.food?.type
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-shopping-bag text-green-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps.data.food.type),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'seedType',
    header: 'ชนิดเม็ด',
    headCell: ' justify-center',
    bodyCell: ' text-center',
    render: (slotProps: any) =>
      h(Tag, {
        value: getSeedTypeLabel(slotProps.data.seedType),
        severity: 'info',
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
        value: getSeedSizeLabel(slotProps.data.seedSize),
        severity: 'success',
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
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-calendar text-blue-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900' },
                dayjs(slotProps.data?.food?.produceDate).format('DD/MM/YYYY')
              ),
            ]
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
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-clock text-red-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900' },
                dayjs(slotProps.data?.food?.expireDate).format('DD/MM/YYYY')
              ),
            ]
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
            'div',
            {
              class: ['flex items-center gap-1.5 justify-end'],
            },
            [
              h('i', { class: 'pi pi-money-bill text-green-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900 font-medium' },
                formatCurrency(slotProps.data?.food?.marketPrice)
              ),
            ]
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
            'div',
            {
              class: ['flex items-center gap-1.5 justify-end'],
            },
            [
              h('i', { class: 'pi pi-dollar text-orange-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900 font-medium' },
                formatCurrency(slotProps.data?.food?.costPrice)
              ),
            ]
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
            'div',
            {
              class: ['flex items-center gap-1.5 justify-end'],
            },
            [
              h('i', { class: 'pi pi-shopping-cart text-blue-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900 font-medium' },
                formatCurrency(slotProps.data?.food?.customerPrice)
              ),
            ]
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
            'div',
            {
              class: ['flex items-center gap-1.5 justify-end'],
            },
            [
              h('i', { class: 'pi pi-building text-purple-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900 font-medium' },
                formatCurrency(slotProps.data?.food?.dealerPrice)
              ),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'balance',
    header: 'สินค้าคงเหลือ',
    headCell: '!min-w-[6rem] justify-end',
    render: (slotProps: any) =>
      slotProps.data.balance
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5 justify-end'],
            },
            [
              h('i', { class: 'pi pi-box text-green-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps.data.balance),
            ]
          )
        : h('span', '-'),
  },
])

const fishColumns = ref([
  {
    field: 'images',
    header: 'รูปปลา',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center'],
        },
        [
          slotProps.data.images && slotProps.data.images.length > 0
            ? h('img', {
                src: getImageUrl(slotProps.data.images[0]),
                alt: 'fish image',
                class: 'w-auto h-10 object-contain rounded',
              })
            : h('i', { class: 'pi pi-image text-gray-500 !text-xl' }),
        ]
      ),
  },
  {
    field: 'certificate',
    header: 'ใบรับรอง',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center'],
        },
        [
          slotProps.data?.certificate
            ? h('img', {
                src: getCertificateUrl(slotProps.data?.certificate),
                alt: 'certificate image',
                class: 'w-auto h-10 object-contain rounded',
              })
            : h('i', { class: 'pi pi-file text-gray-500 !text-xl' }),
        ]
      ),
  },
  {
    field: 'lotNumber',
    header: 'เลขล็อต',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center gap-1.5'],
        },
        [
          h('i', { class: 'pi pi-tag text-blue-500 text-xs' }),
          h('span', { class: 'text-sm text-gray-900' }, slotProps.data.lotNumber || '-'),
        ]
      ),
  },
  {
    field: 'greenhouse',
    header: 'กรีนเฮ้า',
    headCell: '!min-w-[5rem]',
    render: (slotProps: any) =>
      slotProps?.data?.fishpond
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-warehouse text-blue-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900' },
                greenhouseData.value?.find(
                  (greenhouse) => greenhouse._id === slotProps?.data?.fishpond?.greenhouse
                )?.name
              ),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'fishpond',
    header: 'บ่อ',
    headCell: '!min-w-[5rem]',
    render: (slotProps: any) =>
      slotProps?.data?.fishpond
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-circle-fill text-cyan-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps?.data?.fishpond?.code),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'sku',
    header: 'รหัสปลา',
    render: (slotProps: any) =>
      slotProps.data.sku
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-qrcode text-orange-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps.data.sku),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'species',
    header: 'สายพันธุ์',
    headCell: '!min-w-[7rem]',
    render: (slotProps: any) =>
      slotProps.data.species
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-star text-blue-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900 font-medium' },
                slotProps.data.species.name
              ),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'breeders',
    header: 'แม่พันธุ์',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data.breeders
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-heart text-pink-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps.data.breeders),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'birth',
    header: 'วันเกิด',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data.birth
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-calendar text-purple-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900' },
                dayjs(slotProps.data.birth).format('DD/MM/YYYY')
              ),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'age',
    header: 'อายุ',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data.age
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-clock text-orange-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900 uppercase' }, slotProps.data.age),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'quality',
    header: 'คุณภาพปลา',
    render: (slotProps: any) =>
      slotProps.data.quality
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-star-fill text-yellow-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps.data.quality),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'farm',
    header: 'ฟาร์ม',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps?.data?.farm
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-building text-green-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps?.data?.farm?.name),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'size',
    header: 'ไซต์',
    headCell: '!min-w-[4rem] justify-center',
    bodyCell: 'text-center',
    render: (slotProps: any) =>
      slotProps.data.size
        ? h(
            'div',
            {
              class: ['flex items-center justify-center gap-1'],
            },
            [
              h('i', { class: 'pi pi-thumbtack text-blue-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps.data.size),
            ]
          )
        : h('span', '-'),
  },
  {
    field: 'weight',
    header: 'น้ำหนัก',
    headCell: '!min-w-[5rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.weight
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5 justify-end'],
            },
            [
              h('i', { class: 'pi pi-inbox text-indigo-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps.data.weight),
            ]
          )
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
  {
    field: 'price',
    header: 'ราคา',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.price
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5 justify-end'],
            },
            [
              h('i', { class: 'pi pi-money-bill text-green-500 text-xs' }),
              h(
                'span',
                { class: 'text-sm text-gray-900 font-medium' },
                formatCurrency(slotProps.data.price)
              ),
            ]
          )
        : h('span', '-'),
  },
])

const displayColumns = computed(() => {
  if (props.selectedCategory?.value === 'food') {
    return foodColumns.value
  } else if (props.selectedCategory?.value === 'fish') {
    return fishColumns.value
  }
  return []
})

// Methods
const openSpeciesSettings = () => {
  router.push('/product/species-settings')
}
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

        <div v-if="props.selectedCategory?.value === 'fish'" class="flex items-center gap-2">
          <Button
            label="สายพันธุ์ปลา"
            icon="pi pi-pencil"
            severity="success"
            size="small"
            @click="openSpeciesSettings"
          />
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
          columnHeaderContent: { class: ['!min-w-[4.5rem]', item.headCell] },
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
</template>
