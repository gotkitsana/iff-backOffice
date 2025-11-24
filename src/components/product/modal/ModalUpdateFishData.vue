<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, Button, InputNumber, Select } from 'primevue'
import { useProductStore, type IFishGrowthHistory } from '../../../stores/product/product'
import dayjs from 'dayjs'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const props = defineProps<{
  visible: boolean
  productId: string
  existingRecord?: IFishGrowthHistory // If provided, we are editing this record
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'save': []
}>()

const productStore = useProductStore()

const formData = ref<{
  size: number | null
  weight: number | null
  gender: string
  price: number | null
  note: string
}>({
  size: null,
  weight: null,
  gender: '',
  price: null,
  note: ''
})

const genderOptions = [
  { label: 'ตัวผู้', value: 'male' },
  { label: 'ตัวเมีย', value: 'female' },
  { label: 'ไม่ระบุ', value: 'unknown' },
]

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.existingRecord) {
        // Edit mode
        formData.value = {
          size: props.existingRecord.size || null,
          weight: props.existingRecord.weight || null,
          gender: props.existingRecord.gender || '',
          price: props.existingRecord.price || null,
          note: '' // Note might not be in existingRecord based on interface, check later
        }
      } else {
        // Add mode
        formData.value = {
          size: null,
          weight: null,
          gender: '',
          price: null,
          note: ''
        }
      }
    }
  }
)

const loading = ref(false)

const handleSave = async () => {
  if (!props.productId) return

  loading.value = true
  try {
    const currentTimestamp = dayjs().valueOf()

    if (props.existingRecord && props.existingRecord._id) {
        // Update existing record
        await productStore.onUpdateFishGrowthHistory({
            product: props.productId,
            date: props.existingRecord.date, // Keep original date or update? Usually keep.
            size: formData.value.size || 0,
            weight: formData.value.weight || 0,
            gender: formData.value.gender || 'unknown',
            price: formData.value.price || 0,
            note: formData.value.note
        })
    } else {
        // Add new record
        await productStore.onAddFishGrowthHistory({
            product: props.productId,
            date: currentTimestamp,
            size: formData.value.size || 0,
            weight: formData.value.weight || 0,
            gender: formData.value.gender || 'unknown',
            price: formData.value.price || 0,
            note: formData.value.note
        })
    }

    toast.success('บันทึกข้อมูลเรียบร้อยแล้ว')
    emit('save')
    emit('update:visible', false)
  } catch (error) {
    console.error(error)
    toast.error('ไม่สามารถบันทึกข้อมูลได้')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="(val) => emit('update:visible', val)"
    modal
    header="อัปเดตข้อมูลการเติบโต"
    :style="{ width: '30rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-700 text-sm">ไซต์ (ซม.)</label>
          <InputNumber v-model="formData.size" :minFractionDigits="0" :maxFractionDigits="2" placeholder="ระบุขนาด" size="small" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-700 text-sm">น้ำหนัก (กก.)</label>
          <InputNumber v-model="formData.weight" :minFractionDigits="0" :maxFractionDigits="2" placeholder="ระบุน้ำหนัก" size="small" />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="font-semibold text-gray-700 text-sm">เพศ</label>
        <Select
          v-model="formData.gender"
          :options="genderOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="เลือกเพศ"
          size="small"
          class="w-full"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="font-semibold text-gray-700 text-sm">ราคา</label>
        <InputNumber v-model="formData.price" mode="currency" currency="THB" locale="th-TH" placeholder="ระบุราคา"  size="small"/>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 pt-4">
        <Button label="ยกเลิก" icon="pi pi-times" text severity="secondary" @click="emit('update:visible', false)" size="small" />
        <Button label="บันทึก" icon="pi pi-check" :loading="loading" @click="handleSave" size="small" />
      </div>
    </template>
  </Dialog>
</template>
