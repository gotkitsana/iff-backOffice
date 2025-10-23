<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import formatCurrency from '@/utils/formatCurrency'
import { type ICategory } from '@/stores/product/category'

interface Props {
  category: ICategory | undefined
  name: string
  quantity: number
  price: number
  detail?: string
}

const props = defineProps<Props>()
</script>

<template>
  <Card
    v-if="props.category"
    :pt="{ body: 'p-3' }"
    :class="`${props.category.bgColor.replace('-100', '-50')} ${props.category.bgColor}`"
  >
    <template #content>
      <div class="flex items-center justify-between">
        <!-- Product Info -->
        <div class="flex items-center gap-3 flex-1">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-xl"
            :class="props.category.bgColor"
          >
            <i
              :class="`pi ${props.category.icon} text-lg ${props.category.iconColor}`"
            ></i>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <h5 class="font-[500]! text-gray-900">
                {{ props.name }}
              </h5>
              <Tag v-if="props.detail"
                :value="
                  props.category.name ||
                  'ไม่ระบุ'
                "
                severity="info"
                size="small"
                class="text-xs"
              />
            </div>
            <span v-if="props.detail" class="text-xs text-gray-500"
              >รายละเอียด: {{ props.detail }}</span
            >
            <Tag v-else
                :value="
                  props.category.name ||
                  'ไม่ระบุ'
                "
                severity="info"
                size="small"
                class="text-xs"
              />
          </div>
        </div>

        <!-- Quantity & Price -->
        <div class="text-right">
          <div class="text-sm font-[500]! text-gray-900">
            {{ props.quantity }} ชิ้น
          </div>
          <div class="text-xs text-gray-500">
            ราคา: {{ formatCurrency(props.price || 0) }} / ชิ้น
          </div>
          <div class="text-sm font-[500]! text-green-600 mt-1">
            {{
              formatCurrency(
                (props.price || 0) *
                  props.quantity
              )
            }}
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>


