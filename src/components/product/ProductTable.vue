<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { DataTable, Column, Tag, Button } from 'primevue'
import type { IProduct, IProductImage } from '../../stores/product/product'
import formatCurrency from '../../utils/formatCurrency'
import type { ICategory } from '@/stores/product/category'

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
}>()

// Utility functions
const getGenderTag = (gender: number) => {
  switch (gender) {
    case 1:
      return { label: 'ตัวผู้', severity: 'info' }
    case 2:
      return { label: 'ตัวเมีย', severity: 'warning' }
    default:
      return { label: 'ไม่ระบุ', severity: 'secondary' }
  }
}

const getStatusTag = (sold: boolean) => {
  return sold
    ? { label: 'ขายแล้ว', severity: 'danger' }
    : { label: 'พร้อมขาย', severity: 'success' }
}

const getImageUrl = (image: IProductImage) => {
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${image.filename}`
}

const getSeedSizeLabel = (seedSize: number) => {
  const sizeMap = {
    0: 'SS',
    1: 'S',
    2: 'M',
    3: 'L',
    4: 'XL',
  }
  return sizeMap[seedSize as keyof typeof sizeMap] || '-'
}

const getSeedTypeLabel = (seedType: string) => {
  return seedType || '-'
}

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
          h('img', {
            src: getImageUrl(slotProps.data.images[0]),
            alt: 'product image',
            class: 'w-auto h-8 object-contain rounded-lg',
          }),
          h('span', { class: 'text-sm text-gray-900 font-medium' }, slotProps.data.name),
        ]
      ),
  },
  {
    field: 'foodType',
    header: 'ประเภทอาหาร',
    headCell: '!min-w-[5.5rem]',
    render: (slotProps: any) =>
      slotProps.data.foodType
        ? h(
            'div',
            {
              class: ['flex items-center gap-1.5'],
            },
            [
              h('i', { class: 'pi pi-shopping-bag text-green-500 text-xs' }),
              h('span', { class: 'text-sm text-gray-900' }, slotProps.data.foodType),
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
        class:'text-xs'
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
        class:'text-xs'
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
    field: 'productionDate',
    header: 'วันผลิต',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.productionDate ? h(
        'div',
        {
          class: ['flex items-center gap-1.5'],
        },
        [
          h('i', { class: 'pi pi-calendar text-blue-500 text-xs' }),
          h('span', { class: 'text-sm text-gray-900' }, slotProps.data.productionDate),
        ]
      ) : h('span', '-'),
  },
  {
    field: 'expiryDate',
    header: 'วันหมดอายุ',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.expiryDate ? h(
        'div',
        {
          class: ['flex items-center gap-1.5'],
        },
        [
          h('i', { class: 'pi pi-clock text-red-500 text-xs' }),
          h('span', { class: 'text-sm text-gray-900' }, slotProps.data.expiryDate),
        ]
      ) : h('span', '-'),
  },
  {
    field: 'marketPrice',
    header: 'ราคาท้องตลาด',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.marketPrice ? h(
        'div',
        {
          class: ['flex items-center gap-1.5 justify-end'],
        },
        [
          h('i', { class: 'pi pi-money-bill text-green-500 text-xs' }),
          h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data.marketPrice)
          ),
        ]
      ) : h('span', '-'),
  },
  {
    field: 'costPrice',
    header: 'ราคาทุน',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.costPrice ? h(
        'div',
        {
          class: ['flex items-center gap-1.5 justify-end'],
        },
        [
          h('i', { class: 'pi pi-dollar text-orange-500 text-xs' }),
          h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data.costPrice)
          ),
        ]
      ) : h('span', '-'),
  },
  {
    field: 'customerPrice',
    header: 'ราคาลูกค้า',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.customerPrice ? h(
        'div',
        {
          class: ['flex items-center gap-1.5 justify-end'],
        },
        [
          h('i', { class: 'pi pi-shopping-cart text-blue-500 text-xs' }),
          h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data.customerPrice)
          ),
        ]
      ) : h('span', '-'),
  },
  {
    field: 'merchantPrice',
    header: 'ราคาพ่อค้า',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.merchantPrice ? h(
        'div',
        {
          class: ['flex items-center gap-1.5 justify-end'],
        },
        [
          h('i', { class: 'pi pi-building text-purple-500 text-xs' }),
          h(
            'span',
            { class: 'text-sm text-gray-900 font-medium' },
            formatCurrency(slotProps.data.merchantPrice)
          ),
        ]
      ) : h('span', '-'),
  },
  {
    field: 'balance',
    header: 'สินค้าคงเหลือ',
    headCell: '!min-w-[6rem] justify-end',
    render: (slotProps: any) =>
      slotProps.data.balance ? h(
        'div',
        {
          class: ['flex items-center gap-1.5 justify-end'],
        },
        [
          h('i', { class: 'pi pi-box text-green-500 text-xs' }),
          h('span', { class: 'text-sm text-gray-900' }, slotProps.data.balance),
        ]
      ) : h('span', '-'),
  },
])

const fishColumns = ref([
  {
    field: 'name',
    header: 'ชื่อสินค้า',
    headCell: '!min-w-[8rem]',
    bodyCell: ' ',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center gap-2'],
        },
        [
          h('img', {
            src: getImageUrl(slotProps.data.images[0]),
            alt: 'product image',
            class: 'w-auto h-12 object-contain rounded-lg',
          }),
          h('div', {}, [
            h('p', { class: 'font-medium text-gray-900 text-sm' }, slotProps.data.name),
            h('p', { class: 'text-xs text-gray-500' }, slotProps.data.sku),
          ]),
        ]
      ),
  },
  {
    field: 'size',
    header: 'ขนาด (ซม.)',
    headCell: '!min-w-[5rem]',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center justify-center gap-1'],
        },
        [
          h('i', { class: 'pi pi-ruler text-blue-500 text-xs' }),
          h('span', { class: 'text-sm text-gray-900' }, slotProps.data.size),
        ]
      ),
  },
  {
    field: 'gender',
    header: 'เพศ',
    headCell: '!min-w-[4rem]',
    render: (slotProps: any) =>
      h(Tag, {
        value: getGenderTag(slotProps.data.gender).label,
        severity: getGenderTag(slotProps.data.gender).severity,
        size: 'small',
      }),
  },
  {
    field: 'farm',
    header: 'ฟาร์ม',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center gap-2'],
        },
        [
          h('i', { class: 'pi pi-building text-green-500 text-xs' }),
          h('span', { class: 'text-sm text-gray-900' }, slotProps.data.farm),
        ]
      ),
  },
  {
    field: 'age',
    header: 'อายุ',
    headCell: '!min-w-[4rem]',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center gap-1'],
        },
        [
          h('i', { class: 'pi pi-calendar text-purple-500 text-xs' }),
          h('span', { class: 'text-sm text-gray-900' }, slotProps.data.age || '-'),
        ]
      ),
  },
  {
    field: 'rate',
    header: 'คะแนน',
    headCell: '!min-w-[4rem]',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center justify-center gap-1'],
        },
        [
          h('i', { class: 'pi pi-star-fill text-yellow-500 text-xs' }),
          h('span', { class: 'text-sm text-gray-900' }, slotProps.data.rate || '-'),
        ]
      ),
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
    </DataTable>
  </div>
</template>
