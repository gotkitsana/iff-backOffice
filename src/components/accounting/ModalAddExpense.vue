<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue3-toastify'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import type { IAccountCategory } from '@/stores/accounting/category'
import type { IDepartment } from '@/stores/hr/department'
import type { IExpense, ICreateExpensePayload, IUpdateExpensePayload } from '@/stores/accounting/expense'

// Components
import { Select, InputNumber, Textarea, Button, Dialog, Image, DatePicker } from 'primevue'

const props = defineProps<{
  visible: boolean
  categories: IAccountCategory[]
  departments: IDepartment[]
  expense?: IExpense | null
}>()

const emit = defineEmits(['update:visible', 'save'])

const authStore = useAuthStore()

const isEditMode = computed(() => !!props.expense)

const form = ref<ICreateExpensePayload>({
  type: 'รายจ่าย',
  category: '',
  department: '',
  item: '',
  amount: 0,
  dueDate: '',
  paymentMethod: '',
  itemStatus: '',
  note: '',
  admin: authStore.user?._id || '',
})

const dueDateModel = ref<Date | null>(null)
const selectedFile = ref<File | null>(null)
const previewImage = ref<string | null>(null)
const existingImageUrl = ref<string | null>(null)

// Payment method options
const paymentMethods = [
  { label: 'เงินสด', value: 'cash' },
  { label: 'โอน', value: 'transfer' },
  { label: 'เช็ค', value: 'check' },
  { label: 'บัตรเครดิต', value: 'credit_card' },
]

// Item status options
const itemStatuses = [
  { label: 'รอชำระ', value: 'pending' },
  { label: 'ชำระแล้ว', value: 'paid' },
  { label: 'ยกเลิก', value: 'cancelled' },
]

// Filter categories based on type (รายจ่าย)
const filteredCategories = computed(() => {
  return props.categories.filter((c) => c.type === 'รายจ่าย' && c.active)
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.expense && isEditMode.value) {
        // Edit mode - pre-fill form
        form.value = {
          type: props.expense.type || 'รายจ่าย',
          category: props.expense.category?._id || '',
          department: props.expense.department?._id || '',
          item: props.expense.item || '',
          amount: props.expense.amount || 0,
          dueDate: props.expense.dueDate || '',
          paymentMethod: props.expense.paymentMethod || '',
          itemStatus: props.expense.itemStatus || '',
          note: props.expense.note || '',
          admin: props.expense.admin || authStore.user?._id || '',
        }
        // Convert dueDate string to Date object for DatePicker
        dueDateModel.value = props.expense.dueDate ? dayjs(props.expense.dueDate).toDate() : null
        existingImageUrl.value = (props.expense as IExpense & { image?: string }).image || null
        selectedFile.value = null
        previewImage.value = null
      } else {
        // Add mode - reset form
        form.value = {
          type: 'รายจ่าย',
          category: '',
          department: '',
          item: '',
          amount: 0,
          dueDate: '',
          paymentMethod: '',
          itemStatus: '',
          note: '',
          admin: authStore.user?._id || '',
        }
        dueDateModel.value = null
        selectedFile.value = null
        previewImage.value = null
        existingImageUrl.value = null
      }
    }
  },
)

watch(
  () => form.value.category,
  (newVal) => {
    // Auto-fill item from category name
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
  if (!dueDateModel.value) {
    toast.error('กรุณาระบุกำหนดชำระ')
    return
  }
  if (!form.value.paymentMethod) {
    toast.error('กรุณาเลือกวิธีการชำระ')
    return
  }
  if (!form.value.itemStatus) {
    toast.error('กรุณาเลือกสถานะรายการ')
    return
  }

  // Convert Date to string format (YYYY-MM-DD)
  const dueDateString = dueDateModel.value ? dayjs(dueDateModel.value).format('YYYY-MM-DD') : ''

  const payload: ICreateExpensePayload | IUpdateExpensePayload = {
    type: form.value.type,
    category: form.value.category,
    department: form.value.department,
    item: form.value.item,
    amount: form.value.amount,
    dueDate: dueDateString,
    paymentMethod: form.value.paymentMethod,
    itemStatus: form.value.itemStatus,
    note: form.value.note,
    admin: form.value.admin,
  }

  if (isEditMode.value && props.expense) {
    ;(payload as IUpdateExpensePayload)._id = props.expense._id
  }

  emit('save', { payload, file: selectedFile.value, isEdit: isEditMode.value })
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="(val) => emit('update:visible', val)"
    modal
    :header="isEditMode ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่าย'"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Category -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">ประเภทค่าใช้จ่าย <span class="text-red-500">*</span></label>
        <Select
          v-model="form.category"
          :options="filteredCategories"
          optionLabel="name"
          optionValue="_id"
          placeholder="เลือกหมวดหมู่"
          filter
          fluid
          size="small"
        />
      </div>

      <!-- Department -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">แผนก <span class="text-red-500">*</span></label>
        <Select
          v-model="form.department"
          :options="departments"
          optionLabel="name"
          optionValue="_id"
          placeholder="เลือกแผนก"
          filter
          fluid
          size="small"
        />
      </div>

      <!-- Item (Auto-filled from category) -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">รายการ</label>
        <input
          v-model="form.item"
          type="text"
          class="p-inputtext p-component p-inputtext-sm w-full"
          placeholder="รายการ (กรอกอัตโนมัติจากหมวดหมู่)"
          readonly
        />
      </div>

      <!-- Amount -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">จำนวนเงิน <span class="text-red-500">*</span></label>
        <InputNumber
          v-model="form.amount"
          inputId="currency-thb"
          mode="currency"
          currency="THB"
          locale="th-TH"
          :min="0"
          fluid
          size="small"
        />
      </div>

      <!-- Due Date -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">กำหนดชำระ <span class="text-red-500">*</span></label>
        <DatePicker
          v-model="dueDateModel"
          dateFormat="dd/mm/yy"
          showIcon
          placeholder="เลือกวันที่"
          fluid
          size="small"
        />
      </div>

      <!-- Payment Method -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">วิธีการชำระ <span class="text-red-500">*</span></label>
        <Select
          v-model="form.paymentMethod"
          :options="paymentMethods"
          optionLabel="label"
          optionValue="value"
          placeholder="เลือกวิธีการชำระ"
          fluid
          size="small"
        />
      </div>

      <!-- Item Status -->
      <div class="flex flex-col gap-1">
        <label class="font-semibold">สถานะรายการ <span class="text-red-500">*</span></label>
        <Select
          v-model="form.itemStatus"
          :options="itemStatuses"
          optionLabel="label"
          optionValue="value"
          placeholder="เลือกสถานะ"
          fluid
          size="small"
        />
      </div>

      <!-- File Upload -->
      <div class="col-span-1 md:col-span-2 flex flex-col gap-1">
        <label class="font-semibold">อัพโหลดสลิป</label>
        <div class="flex items-center gap-2 border border-gray-300 rounded-md p-2">
          <input
            type="file"
            accept="image/png, image/jpeg"
            @change="onFileSelect"
            class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <small class="text-gray-500">รองรับไฟล์: JPG, PNG (ขนาดไม่เกิน 5MB)</small>
        <div v-if="previewImage || existingImageUrl" class="mt-2">
          <Image
            :src="previewImage || existingImageUrl || ''"
            alt="Preview"
            width="150"
            preview
          />
        </div>
      </div>

      <!-- Note -->
      <div class="col-span-1 md:col-span-2 flex flex-col gap-1">
        <label class="font-semibold">หมายเหตุ</label>
        <Textarea
          v-model="form.note"
          rows="3"
          placeholder="กรอกหมายเหตุ (ถ้ามี)"
          fluid
          size="small"
        />
      </div>
    </div>

    <template #footer>
      <Button
        label="ยกเลิก"
        icon="pi pi-times"
        text
        @click="emit('update:visible', false)"
        class="!text-gray-600"
        size="small"
      />
      <Button
        :label="isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'"
        icon="pi pi-check"
        @click="onSave"
        severity="success"
        size="small"
      />
    </template>
  </Dialog>
</template>

