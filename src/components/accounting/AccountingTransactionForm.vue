<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button, Select, InputText, InputNumber, Textarea } from 'primevue'
import { toast } from 'vue3-toastify'

interface TransactionForm {
  type: 'income' | 'expense'
  paymentMethod: 'cash' | 'transfer'
  department: string
  project: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  purpose: string
}

interface Transaction {
  id?: number
  type: 'income' | 'expense'
  paymentMethod: 'cash' | 'transfer'
  department: string
  project: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  purpose: string
}

const props = defineProps<{
  visible: boolean
  departments: Array<{ label: string; value: string }>
  projects: Array<{ label: string; value: string }>
  transaction?: Transaction | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: TransactionForm]
}>()

const form = ref<TransactionForm>({
  type: 'income',
  paymentMethod: 'transfer',
  department: '',
  project: '',
  item: '',
  quantity: 0,
  unitPrice: 0,
  total: 0,
  purpose: '',
})

// คำนวณยอดรวมอัตโนมัติ
watch([() => form.value.quantity, () => form.value.unitPrice], () => {
  form.value.total = form.value.quantity * form.value.unitPrice
})

const showModal = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const resetForm = () => {
  form.value = {
    type: 'income',
    paymentMethod: 'transfer',
    department: '',
    project: '',
    item: '',
    quantity: 0,
    unitPrice: 0,
    total: 0,
    purpose: '',
  }
}

const handleSubmit = () => {
  if (!form.value.department || !form.value.project || !form.value.item) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  if (form.value.quantity <= 0 || form.value.unitPrice <= 0) {
    toast.error('กรุณากรอกจำนวนหน่วยและราคาหน่วยให้ถูกต้อง')
    return
  }

  emit('submit', { ...form.value })
  resetForm()
  showModal.value = false
  toast.success('บันทึกรายการสำเร็จ')
}

const handleCancel = () => {
  resetForm()
  showModal.value = false
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.transaction) {
        // Edit mode - pre-fill form
        form.value = {
          type: props.transaction.type,
          paymentMethod: props.transaction.paymentMethod,
          department: props.transaction.department,
          project: props.transaction.project,
          item: props.transaction.item,
          quantity: props.transaction.quantity,
          unitPrice: props.transaction.unitPrice,
          total: props.transaction.total,
          purpose: props.transaction.purpose,
        }
      } else {
        // Add mode - reset form
        resetForm()
      }
    }
  }
)
</script>

<template>
  <Dialog
    v-model:visible="showModal"
    modal
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">
            {{ props.transaction ? 'แก้ไขรายการ' : 'บันทึกรายการ' }}
          </h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลรายรับหรือรายจ่าย</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- 1. เลือกประเภท: รายรับ/รายจ่าย -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-tag text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">1. เลือกประเภท</h4>
        </div>
        <Select
          v-model="form.type"
          :options="[
            { label: 'รายรับ', value: 'income' },
            { label: 'รายจ่าย', value: 'expense' },
          ]"
          optionLabel="label"
          optionValue="value"
          fluid
          size="small"
        />
      </div>

      <!-- 2. รูปแบบ: เงินโอน / เงินสด -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-credit-card text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">2. รูปแบบการชำระเงิน</h4>
        </div>
        <Select
          v-model="form.paymentMethod"
          :options="[
            { label: 'เงินโอน', value: 'transfer' },
            { label: 'เงินสด', value: 'cash' },
          ]"
          optionLabel="label"
          optionValue="value"
          fluid
          size="small"
        />
      </div>

      <!-- 3. เลือกแผนก และ 4. เลือกโครงการ -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-sitemap text-purple-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">3. เลือกแผนก และ 4. เลือกโครงการ</h4>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-building mr-1.5 !text-sm"></i>
              แผนก *
            </label>
            <Select
              v-model="form.department"
              :options="departments"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกแผนก"
              fluid
              size="small"
            />
          </div>
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-folder mr-1.5 !text-sm"></i>
              โครงการ *
            </label>
            <Select
              v-model="form.project"
              :options="projects"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกโครงการ"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- 5. รายการ -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-file-edit text-orange-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">5. รายการ</h4>
        </div>
        <InputText v-model="form.item" placeholder="กรอกรายการ" fluid size="small" />
      </div>

      <!-- 6. จำนวนหน่วย, 7. ราคาหน่วย, 8. ยอดรวม -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-calculator text-indigo-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">6. จำนวนหน่วย, 7. ราคาหน่วย, 8. ยอดรวม</h4>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-hashtag mr-1.5 !text-sm"></i>
              จำนวนหน่วย *
            </label>
            <InputNumber
              v-model="form.quantity"
              :min="0"
              :max="999999"
              mode="decimal"
              :minFractionDigits="0"
              :maxFractionDigits="2"
              fluid
              size="small"
            />
          </div>
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-money-bill mr-1.5 !text-sm"></i>
              ราคาหน่วย (บาท) *
            </label>
            <InputNumber
              v-model="form.unitPrice"
              :min="0"
              :max="999999999"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
          </div>
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-dollar mr-1.5 !text-sm"></i>
              ยอดรวม (บาท)
            </label>
            <InputNumber
              v-model="form.total"
              :min="0"
              :max="999999999"
              mode="currency"
              currency="THB"
              locale="th-TH"
              disabled
              fluid
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- 9. จุดประสงค์รายการ -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-info-circle text-teal-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">9. จุดประสงค์รายการ</h4>
        </div>
        <Textarea
          v-model="form.purpose"
          placeholder="กรอกจุดประสงค์ของรายการ"
          rows="3"
          fluid
          size="small"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="handleCancel"
          size="small"
        />
        <Button
          label="บันทึก"
          icon="pi pi-check"
          @click="handleSubmit"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>

