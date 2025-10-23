<script setup lang="ts">
import { DataTable, Column, Tag, Button } from 'primevue'
import type { IProduct } from '../../stores/product/product'
import formatCurrency from '../../utils/formatCurrency'
import { computed } from 'vue';
import type { ISalesProduct } from '@/types/sales'

// Props
const props = defineProps<{
  filteredProducts: IProduct[]
  isLoadingProducts: boolean
  selectedCategory: string | null
}>()

// Emits
defineEmits<{
  'open-detail-modal': [product: IProduct]
  'open-edit-modal': [product: IProduct]
}>()

const categoryOptions = [
  {
    value: 'fish',
    label: 'ปลา',
    icon: 'pi pi-star',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    value: 'food',
    label: 'อาหาร',
    icon: 'pi pi-heart',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    value: 'microorganism',
    label: 'สารปรับสภาพน้ำ',
    icon: 'pi pi-sparkles',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    value: 'equipment',
    label: 'อุปกรณ์',
    icon: 'pi pi-wrench',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    value: 'medicine',
    label: 'เวชภัณฑ์',
    icon: 'pi pi-plus-circle',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    value: 'construction',
    label: 'คอนสทรัคชั่น',
    icon: 'pi pi-building',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
  {
    value: 'service',
    label: 'บริการ',
    icon: 'pi pi-cog',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
]

const getSelectedCategoryLabel = () => {
  if (props.selectedCategory === 'all') return 'สินค้าทั้งหมด'
  const category = categoryOptions.find((c) => c.value === props.selectedCategory)
  return category?.label || 'สินค้า'
}

const getSelectedCategoryInfo = () => {
  if (props.selectedCategory === 'all') return null
  return categoryOptions.find((c) => c.value === props.selectedCategory) || null
}


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

// Category type checks
const isFishCategory = (category: string | null) => category === 'fish'
const isServiceCategory = (category: string | null) => category === 'service'
const isEquipmentCategory = (category: string | null) => category === 'equipment'
const isMedicineCategory = (category: string | null) => category === 'medicine'
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-0 shadow-sm">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            v-if="getSelectedCategoryInfo()"
            :class="`w-10 h-10 rounded-lg flex items-center justify-center ${
              getSelectedCategoryInfo()?.bgColor
            }`"
          >
            <i
              :class="`${getSelectedCategoryInfo()?.icon} ${getSelectedCategoryInfo()?.iconColor}`"
            ></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">
              {{ getSelectedCategoryLabel() }}
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
      :rows="10"
      scrollHeight="600px"
    >
      <!-- Common Columns -->
      <Column field="name" header="ชื่อสินค้า" :pt="{ columnHeaderContent: 'min-w-[8rem]' }">
        <template #body="slotProps">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-fish text-blue-600 text-lg"></i>
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm">{{ slotProps.data.name }}</p>
              <p class="text-xs text-gray-500">{{ slotProps.data.sku }}</p>
            </div>
          </div>
        </template>
      </Column>

      <!-- Fish-specific Columns -->
      <template v-if="isFishCategory(selectedCategory)">
        <Column
          field="size"
          header="ขนาด (ซม.)"
          :pt="{ columnHeaderContent: 'min-w-[5rem] justify-center', bodyCell: 'text-center' }"
        >
          <template #body="slotProps">
            <div class="flex items-center justify-center gap-1">
              <i class="pi pi-ruler text-blue-500 text-xs"></i>
              <span class="text-sm text-gray-900">{{ slotProps.data.size }}</span>
            </div>
          </template>
        </Column>

        <Column
          field="gender"
          header="เพศ"
          :pt="{ columnHeaderContent: 'min-w-[4rem] justify-center', bodyCell: 'text-center' }"
        >
          <template #body="slotProps">
            <Tag
              :value="getGenderTag(slotProps.data.gender).label"
              :severity="getGenderTag(slotProps.data.gender).severity"
              size="small"
            />
          </template>
        </Column>

        <Column field="farm" header="ฟาร์ม" :pt="{ columnHeaderContent: 'min-w-[6rem]' }">
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <i class="pi pi-building text-green-500 text-xs"></i>
              <span class="text-sm text-gray-900">{{ slotProps.data.farm }}</span>
            </div>
          </template>
        </Column>

        <Column field="age" header="อายุ" :pt="{ columnHeaderContent: 'min-w-[4rem]' }">
          <template #body="slotProps">
            <div class="flex items-center gap-1">
              <i class="pi pi-calendar text-purple-500 text-xs"></i>
              <span class="text-sm text-gray-900">{{ slotProps.data.age || '-' }}</span>
            </div>
          </template>
        </Column>

        <Column
          field="rate"
          header="คะแนน"
          :pt="{ columnHeaderContent: 'min-w-[4rem] justify-center', bodyCell: 'text-center' }"
        >
          <template #body="slotProps">
            <div class="flex items-center justify-center gap-1">
              <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
              <span class="text-sm text-gray-900">{{ slotProps.data.rate || '-' }}</span>
            </div>
          </template>
        </Column>
      </template>

      <!-- Service-specific Columns -->
      <template v-else-if="isServiceCategory(selectedCategory)">
        <Column field="detail" header="รายละเอียด" :pt="{ columnHeaderContent: 'min-w-[12rem]' }">
          <template #body="slotProps">
            <div class="max-w-xs">
              <p class="text-sm text-gray-900 truncate">{{ slotProps.data.detail || '-' }}</p>
            </div>
          </template>
        </Column>

        <Column field="youtube" header="วิดีโอ" :pt="{ columnHeaderContent: 'min-w-[6rem]' }">
          <template #body="slotProps">
            <div v-if="slotProps.data.youtube" class="flex items-center gap-2">
              <i class="pi pi-youtube text-red-500"></i>
              <span class="text-xs text-blue-600 hover:underline cursor-pointer">ดูวิดีโอ</span>
            </div>
            <span v-else class="text-sm text-gray-500">-</span>
          </template>
        </Column>
      </template>

      <!-- Equipment-specific Columns -->
      <template v-else-if="isEquipmentCategory(selectedCategory)">
        <Column field="detail" header="รายละเอียด" :pt="{ columnHeaderContent: 'min-w-[12rem]' }">
          <template #body="slotProps">
            <div class="max-w-xs">
              <p class="text-sm text-gray-900 truncate">{{ slotProps.data.detail || '-' }}</p>
            </div>
          </template>
        </Column>

        <Column field="sku" header="รหัสสินค้า" :pt="{ columnHeaderContent: 'min-w-[8rem]' }">
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <i class="pi pi-qrcode text-orange-500 text-xs"></i>
              <span class="text-sm text-gray-900 font-mono">{{ slotProps.data.sku }}</span>
            </div>
          </template>
        </Column>
      </template>

      <!-- Medicine-specific Columns -->
      <template v-else-if="isMedicineCategory(selectedCategory)">
        <Column field="detail" header="รายละเอียด" :pt="{ columnHeaderContent: 'min-w-[12rem]' }">
          <template #body="slotProps">
            <div class="max-w-xs">
              <p class="text-sm text-gray-900 truncate">{{ slotProps.data.detail || '-' }}</p>
            </div>
          </template>
        </Column>

        <Column field="certificate" header="ใบรับรอง" :pt="{ columnHeaderContent: 'min-w-[8rem]' }">
          <template #body="slotProps">
            <div v-if="slotProps.data.certificate" class="flex items-center gap-2">
              <i class="pi pi-certificate text-green-500 text-xs"></i>
              <span class="text-xs text-green-600">มีใบรับรอง</span>
            </div>
            <span v-else class="text-sm text-gray-500">-</span>
          </template>
        </Column>
      </template>

      <!-- Common Columns for All Categories -->
      <Column
        field="price"
        header="ราคา"
        :pt="{ columnHeaderContent: 'min-w-[6rem] justify-end', bodyCell: 'text-end' }"
      >
        <template #body="slotProps">
          <div class="flex items-center justify-end gap-1">
            <i class="pi pi-money-bill text-green-500 text-xs"></i>
            <span class="font-medium text-gray-900 text-sm">
              {{ slotProps.data.price ? formatCurrency(slotProps.data.price) : 'ไม่ระบุ' }}
            </span>
          </div>
        </template>
      </Column>

      <Column
        field="sold"
        header="สถานะ"
        :pt="{ columnHeaderContent: 'min-w-[5rem] justify-center', bodyCell: 'text-center' }"
      >
        <template #body="slotProps">
          <Tag
            :value="getStatusTag(slotProps.data.sold).label"
            :severity="getStatusTag(slotProps.data.sold).severity"
            size="small"
          />
        </template>
      </Column>

      <Column
        field="auctionOnly"
        header="ประเภท"
        :pt="{ columnHeaderContent: 'min-w-[6rem] justify-center', bodyCell: 'text-center' }"
      >
        <template #body="slotProps">
          <div class="flex items-center justify-center gap-1">
            <i
              :class="`pi ${
                slotProps.data.auctionOnly === 1
                  ? 'pi-gavel text-orange-500'
                  : 'pi-shopping-cart text-blue-500'
              } text-xs`"
            ></i>
            <Tag
              :value="slotProps.data.auctionOnly === 1 ? 'ประมูล' : 'ขาย'"
              :severity="slotProps.data.auctionOnly === 1 ? 'warning' : 'info'"
              size="small"
            />
          </div>
        </template>
      </Column>

      <Column
        header="การจัดการ"
        :exportable="false"
        frozen
        :pt="{ columnHeaderContent: 'justify-end' }"
      >
        <template #body="slotProps">
          <div class="flex gap-2 justify-end">
            <Button
              icon="pi pi-eye"
              severity="info"
              size="small"
              outlined
              @click="$emit('open-detail-modal', slotProps.data)"
              v-tooltip.top="'ดูรายละเอียด'"
            />
            <Button
              icon="pi pi-pencil"
              severity="warning"
              size="small"
              outlined
              @click="$emit('open-edit-modal', slotProps.data)"
              v-tooltip.top="'แก้ไขข้อมูล'"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
