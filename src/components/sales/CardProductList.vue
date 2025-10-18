<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { useSalesStore } from '@/stores/sales/sales'
import formatCurrency from '@/utils/formatCurrency'

interface Props {
  category: string
  name: string
  quantity: number
  price: number
  detail?: string
}

const props = defineProps<Props>()

const salesStore = useSalesStore()
</script>

<template>
  <Card
    :pt="{ body: 'p-3' }"
    :class="`${salesStore.getCategoryBgColor(
      props.category
    )} border ${salesStore.getCategoryBorderColor(props.category)}`"
  >
    <template #content>
      <div class="flex items-center justify-between">
        <!-- Product Info -->
        <div class="flex items-center gap-3 flex-1">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-xl"
            :class="salesStore.getCategoryBgIcon(props.category)"
          >
            <i
              :class="`pi ${salesStore.getCategoryIcon(
                props.category
              )} text-lg ${salesStore.getCategoryColor(props.category)}`"
            ></i>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <h5 class="font-[500]! text-gray-900">
                {{ props.name }}
              </h5>
              <Tag v-if="props.detail"
                :value="
                  salesStore.categoryTypes.find((t) => t.value === props.category)?.label ||
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
                  salesStore.categoryTypes.find((t) => t.value === props.category)?.label ||
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


