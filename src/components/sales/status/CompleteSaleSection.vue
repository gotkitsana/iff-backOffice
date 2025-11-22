<script setup lang="ts">
import { ref } from 'vue'
import { Textarea } from 'primevue'

// Props
const props = defineProps<{
  finalSaleStatus: 'received' | 'damaged' | null
  note?: string
  showCompleteSale: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:final-sale-status': [status: 'received' | 'damaged']
}>()

const localFinalSaleStatus = ref(props.finalSaleStatus)

const updateStatus = (status: 'received' | 'damaged') => {
  localFinalSaleStatus.value = status
  emit('update:final-sale-status', status)
}
</script>

<template>
  <div v-if="showCompleteSale" class="space-y-4">
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200">
        <h4 class="font-medium text-gray-900 flex items-center gap-2">
          <i class="pi pi-send text-purple-600"></i>
          จบการขาย
        </h4>
      </div>
      <div class="p-4 space-y-3">
        <div
          v-for="option in [
            {
              value: 'received',
              label: 'ได้รับสินค้าแล้ว',
              icon: 'pi-check-circle',
              color: 'success',
              description: 'ลูกค้าได้รับสินค้าเรียบร้อยแล้ว',
            },
            {
              value: 'damaged',
              label: 'สินค้าเสียหาย',
              icon: 'pi-times-circle',
              color: 'danger',
              description: 'สินค้าเสียหายระหว่างการขนส่ง',
            },
          ]"
          :key="option.value"
          :class="`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
            localFinalSaleStatus === option.value
              ? option.color === 'success'
                ? 'border-green-500 bg-green-50 shadow-sm'
                : 'border-red-500 bg-red-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`"
          @click="updateStatus(option.value as 'received' | 'damaged')"
        >
          <div class="flex items-center gap-4">
            <div
              :class="`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                option.color === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`"
            >
              <i
                :class="`pi ${option.icon} text-xl ${
                  option.color === 'success' ? 'text-green-600' : 'text-red-600'
                }`"
              ></i>
            </div>
            <div class="flex-1">
              <div class="font-semibold text-gray-900 text-lg">{{ option.label }}</div>
              <div class="text-sm text-gray-600 mt-0.5">{{ option.description }}</div>
            </div>
            <div
              v-if="localFinalSaleStatus === option.value"
              :class="`w-8 h-8 rounded-full flex items-center justify-center ${
                option.color === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`"
            >
              <i class="pi pi-check text-white text-sm"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
        <h4 class="font-medium text-gray-900 flex items-center gap-2">
          <i class="pi pi-file-edit text-gray-600"></i>
          หมายเหตุ
        </h4>
      </div>
      <div class="p-4">
        <Textarea
          :model-value="note || ''"
          placeholder="ไม่มีหมายเหตุ"
          rows="3"
          fluid
          size="small"
          disabled
          class="opacity-60"
        />
      </div>
    </div>
  </div>
</template>

