<script setup lang="ts">
defineOptions({
  name: 'ModalAddProduction',
})
import { computed, ref } from 'vue'
import { Dialog, Button, InputText, InputNumber, Select, Textarea, DatePicker } from 'primevue'
import { toast } from 'vue3-toastify'

const props = defineProps<{
  showAddModal: boolean
}>()

const emit = defineEmits<{
  (e: 'onCloseAddModal'): void
}>()

const showAddModal = computed({
  get: () => props.showAddModal,
  set: (value: boolean) => {
    if (!value) {
      closeAddModal()
    }
  },
})

const isSubmitting = ref(false)
const newProduction = ref({
  batchNumber: '',
  fishType: '',
  quantity: 0,
  startDate: null as Date | null,
  expectedHarvest: null as Date | null,
  waterTemp: 24.0,
  phLevel: 7.0,
  notes: '',
})

const fishTypeOptions = [
  { label: 'โคฮากุ', value: 'โคฮากุ' },
  { label: 'ไทชู', value: 'ไทชู' },
  { label: 'ชิโรอุตสึริ', value: 'ชิโรอุตสึริ' },
  { label: 'ซันเกะ', value: 'ซันเกะ' },
  { label: 'เบคโกะ', value: 'เบคโกะ' },
  { label: 'อูตสึริ', value: 'อูตสึริ' },
  { label: 'อื่นๆ', value: 'อื่นๆ' },
]

const closeAddModal = () => {
  newProduction.value = {
    batchNumber: '',
    fishType: '',
    quantity: 0,
    startDate: null,
    expectedHarvest: null,
    waterTemp: 24.0,
    phLevel: 7.0,
    notes: '',
  }
  emit('onCloseAddModal')
}

const generateBatchNumber = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `BATCH-${year}-${month}${day}-${random}`
}

const handleAddProduction = () => {
  isSubmitting.value = true

  if (
    !newProduction.value.batchNumber ||
    !newProduction.value.fishType ||
    !newProduction.value.quantity ||
    !newProduction.value.startDate ||
    !newProduction.value.expectedHarvest
  ) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    isSubmitting.value = false
    return
  }

  if (newProduction.value.quantity <= 0) {
    toast.error('จำนวนปลาต้องมากกว่า 0')
    isSubmitting.value = false
    return
  }

  if (
    newProduction.value.startDate &&
    newProduction.value.expectedHarvest &&
    newProduction.value.startDate >= newProduction.value.expectedHarvest
  ) {
    toast.error('วันที่คาดการณ์เก็บเกี่ยวต้องมากกว่าวันที่เริ่มผลิต')
    isSubmitting.value = false
    return
  }

  // Simulate API call
  setTimeout(() => {
    toast.success('เพิ่มการผลิตใหม่สำเร็จ')
    closeAddModal()
    isSubmitting.value = false
  }, 1000)
}

const autoGenerateBatchNumber = () => {
  newProduction.value.batchNumber = generateBatchNumber()
}
</script>

<template>
  <Dialog
    v-model:visible="showAddModal"
    @update:visible="closeAddModal"
    modal
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มการผลิตใหม่</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลสำหรับการผลิตปลาคาร์ฟให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Basic Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-info-circle text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลพื้นฐาน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tag mr-1.5 !text-sm"></i>
              หมายเลขแบทช์ *
            </label>
            <div class="flex gap-2">
              <InputText
                v-model="newProduction.batchNumber"
                placeholder="BATCH-2024-001"
                :invalid="!newProduction.batchNumber && isSubmitting"
                fluid
                size="small"
              />
              <Button
                icon="pi pi-refresh"
                severity="secondary"
                size="small"
                @click="autoGenerateBatchNumber"
                v-tooltip.top="'สร้างหมายเลขอัตโนมัติ'"
              />
            </div>
            <small
              v-if="!newProduction.batchNumber && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              <i class="pi pi-exclamation-triangle text-xs"></i>
              กรุณาระบุหมายเลขแบทช์
            </small>
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-fish mr-1.5 !text-sm"></i>
              ประเภทปลา *
            </label>
            <Select
              v-model="newProduction.fishType"
              :options="fishTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกประเภทปลา"
              :invalid="!newProduction.fishType && isSubmitting"
              fluid
              size="small"
            />
            <small
              v-if="!newProduction.fishType && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              <i class="pi pi-exclamation-triangle text-xs"></i>
              กรุณาเลือกประเภทปลา
            </small>
          </div>
        </div>

        <div class="mt-4">
          <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
            <i class="pi pi-hashtag mr-1.5 !text-sm"></i>
            จำนวนปลา (ตัว) *
          </label>
          <InputNumber
            v-model="newProduction.quantity"
            :min="1"
            :max="10000"
            :invalid="(!newProduction.quantity || newProduction.quantity <= 0) && isSubmitting"
            placeholder="ระบุจำนวนปลา"
            suffix=" ตัว"
            fluid
            size="small"
          />
          <small
            v-if="(!newProduction.quantity || newProduction.quantity <= 0) && isSubmitting"
            class="text-red-500 flex items-center gap-1"
          >
            <i class="pi pi-exclamation-triangle text-xs"></i>
            กรุณาระบุจำนวนปลา
          </small>
        </div>
      </div>

      <!-- Production Schedule -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-calendar text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">กำหนดการผลิต</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-play mr-1.5 !text-sm"></i>
              วันที่เริ่มผลิต *
            </label>
            <DatePicker
              v-model="newProduction.startDate"
              showIcon
              fluid
              iconDisplay="input"
              :invalid="!newProduction.startDate && isSubmitting"
              placeholder="เลือกวันที่เริ่มผลิต"
              size="small"
              dateFormat="dd/mm/yy"
            />
            <small
              v-if="!newProduction.startDate && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              <i class="pi pi-exclamation-triangle text-xs"></i>
              กรุณาเลือกวันที่เริ่มผลิต
            </small>
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-stop mr-1.5 !text-sm"></i>
              วันที่คาดการณ์เก็บเกี่ยว *
            </label>
            <DatePicker
              v-model="newProduction.expectedHarvest"
              showIcon
              fluid
              iconDisplay="input"
              :invalid="!newProduction.expectedHarvest && isSubmitting"
              placeholder="เลือกวันที่คาดการณ์เก็บเกี่ยว"
              size="small"
              dateFormat="dd/mm/yy"
            />
            <small
              v-if="!newProduction.expectedHarvest && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              <i class="pi pi-exclamation-triangle text-xs"></i>
              กรุณาเลือกวันที่คาดการณ์เก็บเกี่ยว
            </small>
          </div>
        </div>
      </div>

      <!-- Environment Settings -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-cog text-purple-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">การตั้งค่าสิ่งแวดล้อม</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-thermometer mr-1.5 !text-sm"></i>
              อุณหภูมิน้ำ (°C)
            </label>
            <InputNumber
              v-model="newProduction.waterTemp"
              :min="15"
              :max="35"
              :step="0.1"
              placeholder="24.0"
              suffix=" °C"
              fluid
              size="small"
            />
            <small class="text-gray-500">ช่วงที่เหมาะสม: 20-28°C</small>
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-circle mr-1.5 !text-sm"></i>
              ระดับ pH
            </label>
            <InputNumber
              v-model="newProduction.phLevel"
              :min="6.0"
              :max="8.5"
              :step="0.1"
              placeholder="7.0"
              fluid
              size="small"
            />
            <small class="text-gray-500">ช่วงที่เหมาะสม: 6.5-7.5</small>
          </div>
        </div>
      </div>

      <!-- Additional Notes -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-file-edit text-orange-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">หมายเหตุเพิ่มเติม</h4>
        </div>

        <div>
          <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
            <i class="pi pi-comment mr-1.5 !text-sm"></i>
            หมายเหตุ
          </label>
          <Textarea
            v-model="newProduction.notes"
            placeholder="ระบุหมายเหตุเพิ่มเติมเกี่ยวกับการผลิต (ถ้ามี)"
            :rows="3"
            fluid
            size="small"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="closeAddModal"
          :disabled="isSubmitting"
          size="small"
        />
        <Button
          label="เพิ่มการผลิต"
          icon="pi pi-plus"
          @click="handleAddProduction"
          :loading="isSubmitting"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
