<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import formatCurrency from '@/utils/formatCurrency'
import { type ICategory } from '@/stores/product/category'
import { computed, ref, watch } from 'vue'

interface Props {
  category?: ICategory
  name?: string
  quantity: number
  price?: number
  detail?: string
  isMissing?: boolean
  image?: string
  sku?: string
  balance?: number
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

const isImageLoading = ref(true)
const imageLoadError = ref(false)
watch(
  () => props.image,
  () => {
    isImageLoading.value = true
    imageLoadError.value = false
  }
)

const handleImageLoad = () => {
  isImageLoading.value = false
}

const handleImageError = () => {
  isImageLoading.value = false
  imageLoadError.value = true
}
</script>

<template>
  <Card :pt="{ body: 'p-3' }" :class="cardToneClass">
    <template #content>
      <div class="flex items-center justify-between gap-3">
        <!-- Product Info -->
        <div class="flex items-center gap-3 flex-1">
          <div class="relative" :class="{ 'w-14 h-15': props.image && isImageLoading }">
            <div
              v-if="props.image && isImageLoading"
              class="absolute inset-0 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center"
            >
              <i class="pi pi-spin pi-spinner text-gray-400"></i>
            </div>

            <img
              v-if="props.image && !imageLoadError"
              :key="props.image"
              :src="props.image"
              alt="product image"
              class="w-auto h-15 object-contain transition-opacity duration-200 rounded"
              :class="{ 'opacity-0': isImageLoading, 'opacity-100': !isImageLoading }"
              @load="handleImageLoad"
              @error="handleImageError"
              loading="lazy"
              fetchpriority="low"
            />

            <div
              v-else
              class="w-14 h-15 object-contain rounded-lg flex items-center justify-center backdrop-blur-xl"
              :class="iconWrapperClass"
            >
              <i :class="iconClass"></i>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <template v-if="!isProductMissing">
              <div class="flex items-center gap-3 mb-1">
                <h5 class="font-[600]! text-gray-900">
                  {{ props.name }}
                  <span class="text-sm text-gray-600 pl-1">รหัส ({{ props.sku }})</span>
                </h5>

                <!-- <Tag
                  v-if="props.detail"
                  :value="props.category?.name || 'ไม่ระบุ'"
                  severity="info"
                  size="small"
                /> -->
              </div>
              <!-- <span v-if="props.detail" class="text-sm text-gray-500"
                >รายละเอียด: {{ props.detail }}</span
              > -->
              <div class="flex items-center gap-1.5">
                <Tag :value="props.category?.name || 'ไม่ระบุ'" severity="info" size="small" />
                <Tag
                  v-if="props.balance"
                  :value="`คงเหลือ: ${props.balance}`"
                  severity="success"
                  size="small"
                />
              </div>
            </template>

            <template v-else>
              <!-- กรณีสินค้าไม่พบ -->
              <h5 class="font-[500]! text-red-600 mb-1">ไม่พบข้อมูลสินค้า</h5>
              <p class="text-sm text-gray-500">รายการนี้อาจถูกลบออกจากระบบ โปรดเลือกสินค้าใหม่</p>
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


