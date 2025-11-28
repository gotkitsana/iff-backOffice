<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button, Select } from 'primevue'
import type { IProduct } from '@/stores/product/product'
import type { FoodCalculationSettings } from './types'
import ModalFoodCalculationSettings from './ModalFoodCalculationSettings.vue'

const props = defineProps<{
  visible: boolean
  selectedProducts: IProduct[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const showSettingsModal = ref(false)

// Default settings
const defaultSettings: FoodCalculationSettings = {
  temperatures: [
    { min: 21, max: 23 },
    { min: 24, max: 26 },
  ],
  fishSizes: ['เล็ก', 'กลาง', 'ใหญ่'],
}

const settings = ref<FoodCalculationSettings>(JSON.parse(JSON.stringify(defaultSettings)))

// Computed values
const totalWeight = computed(() => {
  return props.selectedProducts.reduce((sum, product) => {
    return sum + (product.weight || 0)
  }, 0)
})

const temperatureOptions = computed(() => {
  return settings.value.temperatures.map((temp) => ({
    label: `${temp.min}-${temp.max}`,
    value: `${temp.min}-${temp.max}`,
  }))
})

const fishSizeOptions = computed(() => {
  return settings.value.fishSizes.map((size) => ({
    label: size,
    value: size,
  }))
})

const selectedTemperature = ref<string | null>(null)
const selectedFishSize = ref<string | null>(null)

// Initialize selections
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // Set default selections
      if (temperatureOptions.value.length > 0) {
        selectedTemperature.value = temperatureOptions.value[0].value
      }
      if (fishSizeOptions.value.length > 0) {
        selectedFishSize.value = fishSizeOptions.value[0].value
      }
    }
  }
)

const handleSettingsUpdate = (newSettings: FoodCalculationSettings) => {
  settings.value = newSettings
  showSettingsModal.value = false

  // Update selections if current values no longer exist
  if (selectedTemperature.value) {
    const tempExists = settings.value.temperatures.some(
      (temp) => `${temp.min}-${temp.max}` === selectedTemperature.value
    )
    if (!tempExists && temperatureOptions.value.length > 0) {
      selectedTemperature.value = temperatureOptions.value[0].value
    }
  }

  if (selectedFishSize.value) {
    const sizeExists = settings.value.fishSizes.includes(selectedFishSize.value)
    if (!sizeExists && fishSizeOptions.value.length > 0) {
      selectedFishSize.value = fishSizeOptions.value[0].value
    }
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="สูตรคำนวณอาหาร"
    :style="{ width: '90vw', maxWidth: '960px' }" :pt="{ header: 'p-4', footer: 'p-4' }">

    <div class="space-y-4">
      <div class="space-y-3 p-4 border border-gray-200 rounded-lg shadow">
        <div class="flex items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-md flex items-center justify-center bg-blue-500">
              <i class="pi pi-calculator text-white text-sm"></i>
            </div>
            <h3 class="text-lg text-gray-800">พารามิเตอร์</h3>
          </div>

          <Button label="ตั้งค่า" icon="pi pi-cog" severity="info" size="small" @click="showSettingsModal = true" />
        </div>

        <!-- น้ำหนักรวม -->
        <div class="flex flex-col ">
          <label class="text-sm text-gray-700 font-semibold!">น้ำหนักรวม</label>
          <div class="text-sm text-red-600 font-medium">
            {{ totalWeight.toFixed(2) }} กก.
          </div>
          <p class="text-sm text-gray-500">คำนวณจากปลาที่เลือก {{ selectedProducts.length }} ตัว</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- อุณภูมิ -->
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-700 font-semibold!">อุณภูมิ</label>
            <Select v-model="selectedTemperature" :options="temperatureOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกอุณภูมิ" class="w-full" size="small" />
          </div>

          <!-- ขนาดปลา -->
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-700 font-semibold!">ขนาดปลา</label>
            <Select v-model="selectedFishSize" :options="fishSizeOptions" optionLabel="label" optionValue="value"
              placeholder="เลือกขนาดปลา" class="w-full" size="small" />
          </div>
        </div>
      </div>

      <!-- สรุปปริมาณอาหาร -->
      <div class="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-white shadow">

        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-md flex items-center justify-center bg-green-500">
            <i class="pi pi-list text-white text-sm"></i>
          </div>
          <h3 class="text-lg text-gray-800">สรุปปริมาณอาหาร</h3>
        </div>


        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-gray-200">
            <span class="text-sm font-semibold! text-gray-700">เร่งด่วน</span>
            <span class="text-sm text-gray-900 font-medium">1.00%</span>
          </div>
          <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-gray-200">
            <span class="text-sm font-semibold! text-gray-700">ปกติ</span>
            <span class="text-sm text-gray-900 font-medium">0.5%</span>
          </div>
        </div>
      </div>
    </div>


    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ปิด" icon="pi pi-times" severity="secondary" @click="handleClose" size="small" />
      </div>
    </template>

    <!-- Settings Modal -->
    <ModalFoodCalculationSettings :visible="showSettingsModal" :settings="settings"
      @update:visible="showSettingsModal = $event" @update:settings="handleSettingsUpdate" />
  </Dialog>
</template>
