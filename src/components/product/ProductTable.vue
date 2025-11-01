<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { DataTable, Column, Tag, Button } from 'primevue'
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

const getCertificateUrl = (image: string | undefined) => {
  if (!image) return ''
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${image}`
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
    field: 'brand',
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
          h('span', { class: 'text-sm text-gray-900 font-medium' }, slotProps.data?.brand?.name),
        ]
      ),
  },
  {
    field: 'foodtype',
    header: 'ประเภทอาหาร',
    headCell: '!min-w-[5.5rem]',
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
        value: slotProps.data?.seedSize?.name || '-',
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
  {
    field: 'balance',
    header: 'สินค้าคงเหลือ',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.balance
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.balance)
        : h('span', '-'),
  },
])

const fishColumns = ref([
  {
    field: 'images',
    header: 'รูปปลา',
    headCell: '!min-w-[2.5rem] justify-center',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center justify-center'],
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
    field: 'youtube',
    header: 'วิดีโอ',
    render: (slotProps: any) =>
      h(
        'div',
        {
          class: ['flex items-center'],
        },
        [
          slotProps.data.youtube
            ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.youtube)
            : h('i', { class: 'pi pi-video text-gray-500 !text-xl' }),
        ]
      ),
  },
  {
    field: 'certificate',
    header: 'ใบเซอร์',
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
    field: 'age',
    header: 'อายุ',
    headCell: '!min-w-[6rem]',
    render: (slotProps: any) =>
      slotProps.data.age
        ? h('span', { class: 'text-sm text-gray-900 uppercase' }, slotProps.data.age)
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
    field: 'weight',
    header: 'น้ำหนัก',
    headCell: '!min-w-[5rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.weight
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.weight)
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
])

const microorganismColumns = ref([
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
    field: 'brand',
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
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.weight)
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
  {
    field: 'balance',
    header: 'สินค้าคงเหลือ',
    headCell: '!min-w-[6rem] justify-end',
    bodyCell: 'text-end',
    render: (slotProps: any) =>
      slotProps.data.balance
        ? h('span', { class: 'text-sm text-gray-900' }, slotProps.data.balance)
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
</template>
