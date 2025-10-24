<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Button,
  InputText,
  InputNumber,
  Textarea,
  Select,
  Card,
  Tag,
  DataTable,
  Column,
  Dialog,
} from 'primevue'
import { toast } from 'vue3-toastify'

// Types
interface IPond {
  _id: string
  name: string
  size: number
  depth: number
  capacity: number
  waterType: 'fresh' | 'salt' | 'brackish'
  temperature: number
  ph: number
  oxygen: number
  status: 'active' | 'maintenance' | 'inactive'
  description: string
  createdAt: string
  updatedAt: string
}

interface IPondForm {
  name: string
  size: number
  depth: number
  capacity: number
  waterType: 'fresh' | 'salt' | 'brackish'
  temperature: number
  ph: number
  oxygen: number
  status: 'active' | 'maintenance' | 'inactive'
  description: string
}

// Router
const router = useRouter()

// Data
const showAddPond = ref(false)
const showEditPond = ref(false)
const selectedPond = ref<IPond | null>(null)
const isSubmitting = ref(false)

// Form data
const pondForm = ref<IPondForm>({
  name: '',
  size: 0,
  depth: 0,
  capacity: 0,
  waterType: 'fresh',
  temperature: 25,
  ph: 7.0,
  oxygen: 8.0,
  status: 'active',
  description: '',
})

// Options
const waterTypeOptions = [
  { label: 'น้ำจืด', value: 'fresh' },
  { label: 'น้ำเค็ม', value: 'salt' },
  { label: 'น้ำกร่อย', value: 'brackish' },
]

const statusOptions = [
  { label: 'ใช้งาน', value: 'active' },
  { label: 'บำรุงรักษา', value: 'maintenance' },
  { label: 'ไม่ใช้งาน', value: 'inactive' },
]

// Mock data - ในอนาคตจะเชื่อมต่อกับ API
const ponds = ref<IPond[]>([
  {
    _id: '1',
    name: 'บ่อหลัก A',
    size: 100,
    depth: 1.5,
    capacity: 50,
    waterType: 'fresh',
    temperature: 25,
    ph: 7.2,
    oxygen: 8.5,
    status: 'active',
    description: 'บ่อหลักสำหรับเลี้ยงปลาคราฟคุณภาพสูง',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  },
  {
    _id: '2',
    name: 'บ่ออนุบาล B',
    size: 50,
    depth: 1.0,
    capacity: 30,
    waterType: 'fresh',
    temperature: 26,
    ph: 7.0,
    oxygen: 8.0,
    status: 'active',
    description: 'บ่อสำหรับอนุบาลปลาเล็ก',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-10',
  },
  {
    _id: '3',
    name: 'บ่อกักกัน C',
    size: 30,
    depth: 1.2,
    capacity: 20,
    waterType: 'fresh',
    temperature: 24,
    ph: 6.8,
    oxygen: 7.5,
    status: 'maintenance',
    description: 'บ่อสำหรับกักกันปลาที่มีปัญหา',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-20',
  },
])

// Computed
const filteredPonds = computed(() => ponds.value)

const getStatusTag = (status: string) => {
  const statusMap = {
    active: { severity: 'success', label: 'ใช้งาน' },
    maintenance: { severity: 'warning', label: 'บำรุงรักษา' },
    inactive: { severity: 'danger', label: 'ไม่ใช้งาน' },
  }
  return statusMap[status as keyof typeof statusMap] || { severity: 'secondary', label: 'ไม่ระบุ' }
}

const getWaterTypeLabel = (type: string) => {
  const typeMap = {
    fresh: 'น้ำจืด',
    salt: 'น้ำเค็ม',
    brackish: 'น้ำกร่อย',
  }
  return typeMap[type as keyof typeof typeMap] || 'ไม่ระบุ'
}

// Methods
const goBack = () => {
  router.push('/product')
}

const resetForm = () => {
  pondForm.value = {
    name: '',
    size: 0,
    depth: 0,
    capacity: 0,
    waterType: 'fresh',
    temperature: 25,
    ph: 7.0,
    oxygen: 8.0,
    status: 'active',
    description: '',
  }
}

const openAddPond = () => {
  resetForm()
  showAddPond.value = true
}

const openEditPond = (pond: IPond) => {
  selectedPond.value = pond
  pondForm.value = { ...pond }
  showEditPond.value = true
}

const closeModals = () => {
  showAddPond.value = false
  showEditPond.value = false
  selectedPond.value = null
  resetForm()
}

const validateForm = () => {
  if (!pondForm.value.name.trim()) {
    toast.error('กรุณากรอกชื่อบ่อ')
    return false
  }
  if (pondForm.value.size <= 0) {
    toast.error('กรุณากรอกขนาดบ่อที่ถูกต้อง')
    return false
  }
  if (pondForm.value.depth <= 0) {
    toast.error('กรุณากรอกความลึกที่ถูกต้อง')
    return false
  }
  if (pondForm.value.capacity <= 0) {
    toast.error('กรุณากรอกความจุที่ถูกต้อง')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (showAddPond.value) {
      // Add new pond
      const newPond: IPond = {
        _id: Date.now().toString(),
        ...pondForm.value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      ponds.value.push(newPond)
      toast.success('เพิ่มบ่อสำเร็จ')
    } else if (showEditPond.value && selectedPond.value) {
      // Update existing pond
      const index = ponds.value.findIndex((p) => p._id === selectedPond.value!._id)
      if (index !== -1) {
        ponds.value[index] = {
          ...ponds.value[index],
          ...pondForm.value,
          updatedAt: new Date().toISOString(),
        }
      }
      toast.success('อัปเดตบ่อสำเร็จ')
    }

    closeModals()
  } catch (error) {
    toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
  } finally {
    isSubmitting.value = false
  }
}

const handleDeletePond = (pond: IPond) => {
  const index = ponds.value.findIndex((p) => p._id === pond._id)
  if (index !== -1) {
    ponds.value.splice(index, 1)
    toast.success('ลบบ่อสำเร็จ')
  }
}

const getPondHealthStatus = (pond: IPond) => {
  let score = 0
  const issues: string[] = []

  // Temperature check
  if (pond.temperature >= 20 && pond.temperature <= 30) {
    score += 25
  } else {
    issues.push('อุณหภูมิน้ำไม่เหมาะสม')
  }

  // pH check
  if (pond.ph >= 6.5 && pond.ph <= 8.5) {
    score += 25
  } else {
    issues.push('ค่า pH ไม่เหมาะสม')
  }

  // Oxygen check
  if (pond.oxygen >= 6.0) {
    score += 25
  } else {
    issues.push('ออกซิเจนต่ำ')
  }

  // Capacity check
  const utilization = (pond.capacity / (pond.size * pond.depth * 1000)) * 100
  if (utilization <= 80) {
    score += 25
  } else {
    issues.push('ความหนาแน่นสูงเกินไป')
  }

  return {
    score,
    issues,
    status: score >= 75 ? 'ดี' : score >= 50 ? 'ปานกลาง' : 'ต้องปรับปรุง',
  }
}
</script>

<template>
  <div class="flex items-center justify-between flex-wrap gap-2">
    <div>
      <h1 class="text-xl font-semibold! text-gray-900">ตั้งค่าบ่อปลาคาร์ฟ</h1>
      <p class="text-gray-600">จัดการข้อมูลบ่อปลาและสภาพแวดล้อม</p>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-2">
      <Button
        label="เพิ่มบ่อใหม่"
        icon="pi pi-plus"
        severity="success"
        size="small"
        @click="openAddPond"
      />
      <Button
        label="กลับ"
        icon="pi pi-angle-left"
        severity="contrast"
        size="small"
        @click="goBack"
      />
    </div>
  </div>

  <div class="space-y-4 mt-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card :pt="{ body: 'p-3 md:p-4' }" class="bg-blue-100 border-blue-200">
        <template #content>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i class="pi pi-water text-white"></i>
            </div>
            <div>
              <p class="text-sm text-gray-600">จำนวนบ่อทั้งหมด</p>
              <p class="text-2xl font-bold text-blue-600">{{ filteredPonds.length }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-3 md:p-4' }" class="bg-green-50 border-green-200">
        <template #content>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i class="pi pi-check-circle text-white"></i>
            </div>
            <div>
              <p class="text-sm text-gray-600">บ่อที่ใช้งาน</p>
              <p class="text-2xl font-bold text-green-600">
                {{ filteredPonds.filter((p) => p.status === 'active').length }}
              </p>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-3 md:p-4' }" class="bg-orange-50 border-orange-200">
        <template #content>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <i class="pi pi-wrench text-white"></i>
            </div>
            <div>
              <p class="text-sm text-gray-600">บ่อบำรุงรักษา</p>
              <p class="text-2xl font-bold text-orange-600">
                {{ filteredPonds.filter((p) => p.status === 'maintenance').length }}
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm px-2 md:px-4">
      <div class="py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold! text-gray-800">รายการบ่อปลา</h3>
      </div>

      <DataTable
        :value="filteredPonds"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        :pt="{
          table: 'text-sm',
          header: 'bg-gray-50',
          row: 'hover:bg-gray-50',
        }"
      >
        <Column field="name" header="ชื่อบ่อ" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-warehouse text-blue-600"></i>
              <span class="font-[600]!">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="size" header="ขนาด (ตร.ม.)" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.size }} ตร.ม.</span>
          </template>
        </Column>

        <Column field="capacity" header="ความจุ" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.capacity }} ตัว</span>
          </template>
        </Column>

        <Column field="waterType" header="ประเภทน้ำ" sortable>
          <template #body="{ data }">
            <Tag
              :value="getWaterTypeLabel(data.waterType)"
              :severity="
                data.waterType === 'fresh'
                  ? 'success'
                  : data.waterType === 'salt'
                  ? 'info'
                  : 'warning'
              "
              size="small"
            />
          </template>
        </Column>

        <Column field="status" header="สถานะ" sortable>
          <template #body="{ data }">
            <Tag
              :value="getStatusTag(data.status).label"
              :severity="getStatusTag(data.status).severity"
              size="small"
            />
          </template>
        </Column>

        <Column header="สุขภาพบ่อ">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-green-500': getPondHealthStatus(data).score >= 75,
                  'bg-yellow-500':
                    getPondHealthStatus(data).score >= 50 && getPondHealthStatus(data).score < 75,
                  'bg-red-500': getPondHealthStatus(data).score < 50,
                }"
              ></div>
              <span class="text-sm">{{ getPondHealthStatus(data).status }}</span>
            </div>
          </template>
        </Column>

        <Column header="จัดการ" style="width: 120px">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <Button
                icon="pi pi-pencil"
                size="small"
                severity="info"
                text
                rounded
                @click="openEditPond(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                rounded
                @click="handleDeletePond(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <!-- Add/Edit Pond Modal -->
  <Dialog
    :visible="showAddPond || showEditPond"
    @update:visible="closeModals"
    modal
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      content: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-water text-white"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-800">
            {{ showAddPond ? 'เพิ่มบ่อใหม่' : 'แก้ไขข้อมูลบ่อ' }}
          </h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลบ่อปลาและสภาพแวดล้อม</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Basic Information -->
      <div class="bg-blue-50 rounded-lg p-4">
        <h4 class="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <i class="pi pi-info-circle"></i>
          ข้อมูลพื้นฐาน
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ชื่อบ่อ <span class="text-red-500">*</span>
            </label>
            <InputText v-model="pondForm.name" placeholder="กรอกชื่อบ่อ" class="w-full" />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              สถานะ <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="pondForm.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="เลือกสถานะ"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Physical Properties -->
      <div class="bg-green-50 rounded-lg p-4">
        <h4 class="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <i class="pi pi-cube"></i>
          คุณสมบัติทางกายภาพ
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ขนาด (ตร.ม.) <span class="text-red-500">*</span>
            </label>
            <InputNumber
              v-model="pondForm.size"
              :min="0"
              :max="1000"
              placeholder="0"
              class="w-full"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ความลึก (ม.) <span class="text-red-500">*</span>
            </label>
            <InputNumber
              v-model="pondForm.depth"
              :min="0"
              :max="10"
              :step="0.1"
              placeholder="0"
              class="w-full"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ความจุ (ตัว) <span class="text-red-500">*</span>
            </label>
            <InputNumber
              v-model="pondForm.capacity"
              :min="0"
              :max="10000"
              placeholder="0"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Water Properties -->
      <div class="bg-cyan-50 rounded-lg p-4">
        <h4 class="font-semibold text-cyan-800 mb-3 flex items-center gap-2">
          <i class="pi pi-sun"></i>
          คุณสมบัติของน้ำ
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"> ประเภทน้ำ </label>
            <Select
              v-model="pondForm.waterType"
              :options="waterTypeOptions"
              option-label="label"
              option-value="value"
              placeholder="เลือกประเภทน้ำ"
              class="w-full"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"> อุณหภูมิ (°C) </label>
            <InputNumber
              v-model="pondForm.temperature"
              :min="0"
              :max="50"
              :step="0.1"
              placeholder="25"
              class="w-full"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"> ค่า pH </label>
            <InputNumber
              v-model="pondForm.ph"
              :min="0"
              :max="14"
              :step="0.1"
              placeholder="7.0"
              class="w-full"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"> ออกซิเจน (mg/L) </label>
            <InputNumber
              v-model="pondForm.oxygen"
              :min="0"
              :max="20"
              :step="0.1"
              placeholder="8.0"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="text-sm font-medium text-gray-700 mb-1 block"> คำอธิบาย </label>
        <Textarea
          v-model="pondForm.description"
          placeholder="กรอกคำอธิบายเพิ่มเติมเกี่ยวกับบ่อ..."
          rows="3"
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button label="ยกเลิก" severity="secondary" @click="closeModals" />
        <Button
          :label="showAddPond ? 'เพิ่มบ่อ' : 'บันทึก'"
          :loading="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>
