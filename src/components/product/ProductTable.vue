<script setup lang="ts">
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
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-0 shadow-sm">
    <div class="p-4 border-b border-gray-200">
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
      :rows="10"
      scrollHeight="600px"
    >
      <!-- Common Columns -->
      <Column field="name" header="ชื่อสินค้า" :pt="{ columnHeaderContent: 'min-w-[8rem]' }">
        <template #body="slotProps">
          <div class="flex items-center gap-2">
            <img
              :src="getImageUrl(slotProps.data.images[0])"
              alt="product image"
              class="w-auto h-12 object-contain rounded-lg"
            />
            <div>
              <p class="font-medium text-gray-900 text-sm">{{ slotProps.data.name }}</p>
              <p class="text-xs text-gray-500">{{ slotProps.data.sku }}</p>
            </div>
          </div>
        </template>
      </Column>

      <!-- Fish-specific Columns -->
      <template v-if="props.selectedCategory?.value === 'fish'">
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
      <template v-else-if="props.selectedCategory?.value === 'service'">
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
      <template v-else-if="props.selectedCategory?.value === 'equipment'">
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
      <template v-else-if="props.selectedCategory?.value === 'medicine'">
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
