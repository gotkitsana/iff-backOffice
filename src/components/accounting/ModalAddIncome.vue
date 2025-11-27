<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/stores/auth'
import type { IAccountCategory } from '@/stores/accounting/category'
import type { IDepartment } from '@/stores/hr/department'

// Components
import { Select, InputNumber, Textarea, Button, Dialog, Image } from 'primevue'

const props = defineProps<{
  visible: boolean
  categories: IAccountCategory[]
  departments: IDepartment[]
}>()

const emit = defineEmits(['update:visible', 'save'])

const authStore = useAuthStore()


const form = ref({
  type: 'รายรับ',
  category: '',
  department: '',
  item: '',
  amount: 0,
  note: '',
})

const selectedFile = ref<File | null>(null)
const previewImage = ref<string | null>(null)

const typeOptions = ['รายรับ', 'รายจ่าย']

// Filter categories based on selected type
// The user said: "category select: ... แสดง group ตาม type"
// So we filter categories where category.type matches form.type
const filteredCategories = computed(() => {
  return props.categories.filter((c) => c.type === form.value.type && c.active)
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      // Reset form when opening
      form.value = {
        type: 'รายรับ',
        category: '',
        department: '',
        item: '',
        amount: 0,
        note: '',
      }
      selectedFile.value = null
      previewImage.value = null
    }
  },
)

watch(
  () => form.value.type,
  () => {
    // Reset category when type changes
    form.value.category = ''
    form.value.item = ''
  },
)

watch(
  () => form.value.category,
  (newVal) => {
    // "รายการ: item ... ให้ส่ง name ของ category ที่เลือกไป"
    const cat = props.categories.find((c) => c._id === newVal)
    if (cat) {
      form.value.item = cat.name
    } else {
      form.value.item = ''
    }
  },
)

const onFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB')
      return
    }
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const onSave = () => {
  // Validation
  if (!form.value.category) {
    toast.error('กรุณาเลือกประเภทค่าใช้จ่าย')
    return
  }
  if (!form.value.department) {
    toast.error('กรุณาเลือกแผนก')
    return
  }
  if (form.value.amount <= 0) {
    toast.error('กรุณาระบุจำนวนเงิน')
    return
  }

  const payload = {
    type: form.value.type,
    category: form.value.category,
    department: form.value.department,
    item: form.value.item,
    amount: form.value.amount,
    note: form.value.note,
    admin: authStore.user?._id || '', // Send current user ID
  }

  emit('save', { payload, file: selectedFile.value })
}
</script>

<template>
  <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" modal header="เพิ่มข้อมูล"
    :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Type -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">ประเภท</label>
        <Select v-model="form.type" :options="typeOptions" placeholder="เลือกประเภท" filter fluid size="small" />
      </div>

      <!-- Category -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">ประเภทค่าใช้จ่าย</label>
        <Select v-model="form.category" :options="filteredCategories" optionLabel="name" optionValue="_id"
          placeholder="เลือกหมวดหมู่" filter fluid size="small" />
      </div>

      <!-- Department -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">แผนก</label>
        <Select v-model="form.department" :options="departments" optionLabel="name" optionValue="_id"
          placeholder="เลือกแผนก" filter fluid size="small" />
      </div>

      <!-- Amount -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">จำนวนเงิน</label>
        <InputNumber v-model="form.amount" inputId="currency-thb" mode="currency" currency="THB" locale="th-TH" :min="0"
          fluid size="small" />
      </div>

      <!-- File Upload -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">อัพโหลดสลิป</label>
        <div class="flex items-center gap-2 border border-gray-300 rounded-md p-2">
          <input type="file" accept="image/png, image/jpeg" @change="onFileSelect"
            class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        <small class="text-gray-500">รองรับไฟล์: JPG, PNG (ขนาดไม่เกิน 5MB)</small>
        <div v-if="previewImage" class="mt-2">
          <Image :src="previewImage" alt="Preview" width="150" preview />
        </div>
      </div>

      <!-- Note -->
      <div class="col-span-1 md:col-span-2 flex flex-col gap-1">
        <label class="font-semibold">หมายเหตุ</label>
        <Textarea v-model="form.note" rows="3" placeholder="กรอกหมายเหตุ (ถ้ามี)" fluid size="small" />
      </div>
    </div>

    <template #footer>
      <Button label="ยกเลิก" icon="pi pi-times" text @click="emit('update:visible', false)" class="!text-gray-600"
        size="small" />
      <Button label="บันทึกข้อมูล" icon="pi pi-check" @click="onSave" severity="success" size="small" />
    </template>
  </Dialog>
</template>
