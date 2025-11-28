<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button, InputNumber, InputText } from 'primevue'
import { toast } from 'vue3-toastify'
import type { FoodCalculationSettings } from './types'

const props = defineProps<{
  visible: boolean
  settings: FoodCalculationSettings
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:settings': [settings: FoodCalculationSettings]
}>()

const localSettings = ref<FoodCalculationSettings>({
  temperatures: [],
  fishSizes: [],
})

// Initialize with default values
const defaultSettings: FoodCalculationSettings = {
  temperatures: [
    { min: 21, max: 23 },
    { min: 24, max: 26 },
  ],
  fishSizes: ['เล็ก', 'กลาง', 'ใหญ่'],
}

// Watch for prop changes and initialize
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // Initialize with props or defaults
      if (props.settings && props.settings.temperatures.length > 0) {
        localSettings.value = JSON.parse(JSON.stringify(props.settings))
      } else {
        localSettings.value = JSON.parse(JSON.stringify(defaultSettings))
      }
    }
  },
  { immediate: true }
)

const addTemperature = () => {
  localSettings.value.temperatures.push({ min: 21, max: 23 })
}

const removeTemperature = (index: number) => {
  localSettings.value.temperatures.splice(index, 1)
}

const addFishSize = () => {
  localSettings.value.fishSizes.push('')
}

const removeFishSize = (index: number) => {
  localSettings.value.fishSizes.splice(index, 1)
}

const handleSave = () => {
  // Validate temperatures
  for (const temp of localSettings.value.temperatures) {
    if (temp.min >= temp.max) {
      toast.error('อุณหภูมิต่ำสุดต้องน้อยกว่าอุณหภูมิสูงสุด')
      return
    }
  }

  // Validate fish sizes
  if (localSettings.value.fishSizes.some((size) => !size.trim())) {
    toast.error('กรุณากรอกชื่อขนาดปลาให้ครบถ้วน')
    return
  }

  emit('update:settings', JSON.parse(JSON.stringify(localSettings.value)))
  emit('update:visible', false)
  toast.success('บันทึกการตั้งค่าสำเร็จ')
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="ตั้งค่า"
    :style="{ width: '30rem' }" :pt="{ header: 'p-4', footer: 'p-4' }">
    <div class="flex flex-col gap-4">
      <!-- อุณภูมิ Section -->
      <div class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-gray-800">อุณภูมิ</h3>
        <div class="flex flex-col gap-2">
          <div
            v-for="(temp, index) in localSettings.temperatures"
            :key="index"
            class="flex items-center gap-2 p-2 border border-gray-200 rounded-lg"
          >
            <InputNumber
              v-model="temp.min"
              :min="0"
              :max="50"
              placeholder="ต่ำสุด"
              class="flex-1"
              size="small"
            />
            <span class="text-sm text-gray-500">-</span>
            <InputNumber
              v-model="temp.max"
              :min="0"
              :max="50"
              placeholder="สูงสุด"
              class="flex-1"
              size="small"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              @click="removeTemperature(index)"
              :disabled="localSettings.temperatures.length <= 1"
            />
          </div>
          <Button
            label="เพิ่มช่วงอุณภูมิ"
            icon="pi pi-plus"
            severity="secondary"
            outlined
            size="small"
            @click="addTemperature"
          />
        </div>
      </div>

      <!-- ขนาดปลา Section -->
      <div class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-gray-800">ขนาดปลา</h3>
        <div class="flex flex-col gap-2">
          <div
            v-for="(size, index) in localSettings.fishSizes"
            :key="index"
            class="flex items-center gap-2 p-2 border border-gray-200 rounded-lg"
          >
            <InputText
              v-model="localSettings.fishSizes[index]"
              placeholder="ชื่อขนาดปลา"
              class="flex-1"
              size="small"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              @click="removeFishSize(index)"
              :disabled="localSettings.fishSizes.length <= 1"
            />
          </div>
          <Button
            label="เพิ่มขนาดปลา"
            icon="pi pi-plus"
            severity="secondary"
            outlined
            size="small"
            @click="addFishSize"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="handleClose" size="small" />
        <Button label="บันทึก" icon="pi pi-check" @click="handleSave" severity="success" size="small" />
      </div>
    </template>
  </Dialog>
</template>

