<script setup lang="ts">
defineOptions({
  name: 'ModalProductionSettings',
})
import { computed, ref } from 'vue'
import { Dialog, Button, InputText, InputNumber, Textarea, ToggleButton } from 'primevue'
import { toast } from 'vue3-toastify'

const props = defineProps<{
  showSettingsModal: boolean
}>()

const emit = defineEmits<{
  (e: 'onCloseSettingsModal'): void
}>()

const showSettingsModal = computed({
  get: () => props.showSettingsModal,
  set: (value: boolean) => {
    if (!value) {
      closeSettingsModal()
    }
  },
})

const isSubmitting = ref(false)
const settings = ref({
  // General Settings
  companyName: 'ฟาร์มปลาคาร์ฟ IFF',
  productionManager: 'คุณสมชาย ใจดี',
  contactPhone: '081-234-5678',
  contactEmail: 'production@iff-koi.com',

  // Production Settings
  defaultWaterTemp: 24.0,
  defaultPhLevel: 7.0,
  defaultGrowthPeriod: 8.5,
  qualityThreshold: 85,

  // Notification Settings
  enableNotifications: true,
  notifyBeforeHarvest: 7,
  notifyQualityIssues: true,
  notifyDailyTasks: true,

  // System Settings
  autoGenerateBatchNumbers: true,
  batchNumberPrefix: 'BATCH',
  enableQualityControl: true,
  enableEnvironmentMonitoring: true,

  // Additional Settings
  notes: 'การตั้งค่าการผลิตปลาคาร์ฟ',
})

const closeSettingsModal = () => {
  emit('onCloseSettingsModal')
}

const handleSaveSettings = () => {
  isSubmitting.value = true

  if (!settings.value.companyName || !settings.value.productionManager) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    isSubmitting.value = false
    return
  }

  // Simulate API call
  setTimeout(() => {
    toast.success('บันทึกการตั้งค่าสำเร็จ')
    closeSettingsModal()
    isSubmitting.value = false
  }, 1000)
}

const resetToDefault = () => {
  settings.value = {
    companyName: 'ฟาร์มปลาคาร์ฟ IFF',
    productionManager: 'คุณสมชาย ใจดี',
    contactPhone: '081-234-5678',
    contactEmail: 'production@iff-koi.com',
    defaultWaterTemp: 24.0,
    defaultPhLevel: 7.0,
    defaultGrowthPeriod: 8.5,
    qualityThreshold: 85,
    enableNotifications: true,
    notifyBeforeHarvest: 7,
    notifyQualityIssues: true,
    notifyDailyTasks: true,
    autoGenerateBatchNumbers: true,
    batchNumberPrefix: 'BATCH',
    enableQualityControl: true,
    enableEnvironmentMonitoring: true,
    notes: 'การตั้งค่าการผลิตปลาคาร์ฟ',
  }
  toast.info('รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้น')
}
</script>

<template>
  <Dialog
    v-model:visible="showSettingsModal"
    @update:visible="closeSettingsModal"
    modal
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '85vw', '575px': '95vw' }"
    :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-cog text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">ตั้งค่าการผลิต</h3>
          <p class="text-sm text-gray-600">จัดการการตั้งค่าระบบการผลิตปลาคาร์ฟ</p>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Company Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-building text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลบริษัท</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-building mr-1.5 !text-sm"></i>
              ชื่อบริษัท *
            </label>
            <InputText
              v-model="settings.companyName"
              placeholder="ชื่อบริษัท"
              :invalid="!settings.companyName && isSubmitting"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-user mr-1.5 !text-sm"></i>
              ผู้จัดการการผลิต *
            </label>
            <InputText
              v-model="settings.productionManager"
              placeholder="ชื่อผู้จัดการการผลิต"
              :invalid="!settings.productionManager && isSubmitting"
              fluid
              size="small"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-phone mr-1.5 !text-sm"></i>
              เบอร์โทรศัพท์
            </label>
            <InputText
              v-model="settings.contactPhone"
              placeholder="081-234-5678"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-envelope mr-1.5 !text-sm"></i>
              อีเมล
            </label>
            <InputText
              v-model="settings.contactEmail"
              placeholder="production@company.com"
              type="email"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- Production Defaults -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-cog text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">การตั้งค่าการผลิต</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-thermometer mr-1.5 !text-sm"></i>
              อุณหภูมิน้ำเริ่มต้น (°C)
            </label>
            <InputNumber
              v-model="settings.defaultWaterTemp"
              :min="15"
              :max="35"
              :step="0.1"
              placeholder="24.0"
              suffix=" °C"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-circle mr-1.5 !text-sm"></i>
              ระดับ pH เริ่มต้น
            </label>
            <InputNumber
              v-model="settings.defaultPhLevel"
              :min="6.0"
              :max="8.5"
              :step="0.1"
              placeholder="7.0"
              fluid
              size="small"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-clock mr-1.5 !text-sm"></i>
              ระยะเวลาการเจริญเติบโต (เดือน)
            </label>
            <InputNumber
              v-model="settings.defaultGrowthPeriod"
              :min="1"
              :max="24"
              :step="0.5"
              placeholder="8.5"
              suffix=" เดือน"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-star mr-1.5 !text-sm"></i>
              เกณฑ์คุณภาพขั้นต่ำ (%)
            </label>
            <InputNumber
              v-model="settings.qualityThreshold"
              :min="0"
              :max="100"
              placeholder="85"
              suffix=" %"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-bell text-orange-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">การตั้งค่าการแจ้งเตือน</h4>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-[500]! text-gray-700">เปิดใช้งานการแจ้งเตือน</label>
              <p class="text-xs text-gray-500">รับการแจ้งเตือนเกี่ยวกับการผลิต</p>
            </div>
            <ToggleButton
              v-model="settings.enableNotifications"
              onLabel="เปิด"
              offLabel="ปิด"
              size="small"
            />
          </div>

          <div v-if="settings.enableNotifications" class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-[500]! text-gray-700">แจ้งเตือนก่อนเก็บเกี่ยว</label>
                <p class="text-xs text-gray-500">แจ้งเตือนก่อนเก็บเกี่ยว (วัน)</p>
              </div>
              <InputNumber
                v-model="settings.notifyBeforeHarvest"
                :min="1"
                :max="30"
                :disabled="!settings.enableNotifications"
                size="small"
                :style="{ width: '80px' }"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-[500]! text-gray-700">แจ้งเตือนปัญหาคุณภาพ</label>
                <p class="text-xs text-gray-500">แจ้งเตือนเมื่อพบปัญหาคุณภาพ</p>
              </div>
              <ToggleButton
                v-model="settings.notifyQualityIssues"
                onLabel="เปิด"
                offLabel="ปิด"
                size="small"
                :disabled="!settings.enableNotifications"
              />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-[500]! text-gray-700">แจ้งเตือนงานประจำวัน</label>
                <p class="text-xs text-gray-500">แจ้งเตือนงานประจำวันในการผลิต</p>
              </div>
              <ToggleButton
                v-model="settings.notifyDailyTasks"
                onLabel="เปิด"
                offLabel="ปิด"
                size="small"
                :disabled="!settings.enableNotifications"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- System Settings -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-wrench text-purple-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">การตั้งค่าระบบ</h4>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-[500]! text-gray-700">สร้างหมายเลขแบทช์อัตโนมัติ</label>
              <p class="text-xs text-gray-500">สร้างหมายเลขแบทช์อัตโนมัติเมื่อเพิ่มการผลิตใหม่</p>
            </div>
            <ToggleButton
              v-model="settings.autoGenerateBatchNumbers"
              onLabel="เปิด"
              offLabel="ปิด"
              size="small"
            />
          </div>

          <div v-if="settings.autoGenerateBatchNumbers" class="flex items-center justify-between">
            <div>
              <label class="text-sm font-[500]! text-gray-700">คำนำหน้าหมายเลขแบทช์</label>
              <p class="text-xs text-gray-500">คำนำหน้าสำหรับหมายเลขแบทช์</p>
            </div>
            <InputText
              v-model="settings.batchNumberPrefix"
              placeholder="BATCH"
              size="small"
              :style="{ width: '120px' }"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-[500]! text-gray-700">เปิดใช้งานการควบคุมคุณภาพ</label>
              <p class="text-xs text-gray-500">เปิดใช้งานระบบควบคุมคุณภาพ</p>
            </div>
            <ToggleButton
              v-model="settings.enableQualityControl"
              onLabel="เปิด"
              offLabel="ปิด"
              size="small"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-[500]! text-gray-700"
                >เปิดใช้งานการตรวจสอบสิ่งแวดล้อม</label
              >
              <p class="text-xs text-gray-500">เปิดใช้งานระบบตรวจสอบสิ่งแวดล้อม</p>
            </div>
            <ToggleButton
              v-model="settings.enableEnvironmentMonitoring"
              onLabel="เปิด"
              offLabel="ปิด"
              size="small"
            />
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
            v-model="settings.notes"
            placeholder="ระบุหมายเหตุเพิ่มเติมเกี่ยวกับการตั้งค่า (ถ้ามี)"
            :rows="3"
            fluid
            size="small"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <Button
          label="รีเซ็ต"
          icon="pi pi-refresh"
          severity="secondary"
          @click="resetToDefault"
          :disabled="isSubmitting"
          size="small"
        />
        <div class="flex gap-3">
          <Button
            label="ยกเลิก"
            icon="pi pi-times"
            severity="secondary"
            @click="closeSettingsModal"
            :disabled="isSubmitting"
            size="small"
          />
          <Button
            label="บันทึกการตั้งค่า"
            icon="pi pi-check"
            @click="handleSaveSettings"
            :loading="isSubmitting"
            severity="success"
            size="small"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>
