<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import formatCurrency from '@/utils/formatCurrency'
import { type ICategory } from '@/stores/product/category'
import { computed } from 'vue'

interface Props {
  category?: ICategory
  name?: string
  quantity: number
  price?: number
  detail?: string
  isMissing?: boolean
}

const props = defineProps<Props>()
const isProductMissing = computed(() => !props.category || props.isMissing)

const cardToneClass = computed(
  () =>
    props.category?.bgColor?.replace('-100', '-50') ??
    'bg-red-50 border border-dashed border-red-300'
)

const iconWrapperClass = computed(() => props.category?.bgColor ?? 'bg-red-100')

const iconClass = computed(() =>
  props.category
    ? `pi ${props.category.icon} text-lg ${props.category.iconColor}`
    : 'pi pi-exclamation-triangle text-lg text-red-500'
)
</script>

<template>
  <Card :pt="{ body: 'p-3' }" :class="cardToneClass">
    <template #content>
      <div class="flex items-center justify-between gap-3">
        <!-- Product Info -->
        <div class="flex items-center gap-3 flex-1">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-xl"
            :class="iconWrapperClass"
          >
            <i :class="iconClass"></i>
          </div>

          <div class="flex-1 min-w-0">
            <template v-if="!isProductMissing">
              <div class="flex items-center gap-3">
                <h5 class="font-[500]! text-sm text-gray-900">
                  {{ props.name }}
                </h5>
                <Tag
                  v-if="props.detail"
                  :value="props.category?.name || 'ไม่ระบุ'"
                  severity="info"
                  size="small"
                  class="text-xs"
                />
              </div>
              <span v-if="props.detail" class="text-xs text-gray-500"
                >รายละเอียด: {{ props.detail }}</span
              >
              <Tag
                v-else
                :value="props.category?.name || 'ไม่ระบุ'"
                severity="info"
                size="small"
                class="text-xs"
              />
            </template>

            <template v-else>
              <!-- กรณีสินค้าไม่พบ -->
              <h5 class="font-[500]! text-sm text-red-600">ไม่พบข้อมูลสินค้า</h5>
              <p class="text-xs text-gray-500">รายการนี้อาจถูกลบออกจากระบบ โปรดเลือกสินค้าใหม่</p>
            </template>
          </div>
        </div>

        <!-- Quantity & Price -->
        <div class="text-right">
          <div class="text-sm font-[500]! text-gray-900">{{ props.quantity }} ชิ้น</div>
          <div v-if="!isProductMissing" class="text-xs text-gray-500">
            ราคา: {{ formatCurrency(props.price || 0) }} / ชิ้น
          </div>
          <div
            class="text-sm font-[500]! mt-1"
            :class="isProductMissing ? 'text-red-500' : 'text-green-600'"
          >
            {{ formatCurrency((props.price || 0) * props.quantity) }}
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>


