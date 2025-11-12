<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button, InputText, Textarea } from 'primevue'
import { toast } from 'vue3-toastify'

interface ProjectForm {
  projectName: string
  departmentName: string
  projectPurpose: string
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: ProjectForm]
}>()

const form = ref<ProjectForm>({
  projectName: '',
  departmentName: '',
  projectPurpose: '',
})

const showModal = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const resetForm = () => {
  form.value = {
    projectName: '',
    departmentName: '',
    projectPurpose: '',
  }
}

const handleSubmit = () => {
  if (!form.value.projectName || !form.value.departmentName || !form.value.projectPurpose) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  emit('submit', { ...form.value })
  resetForm()
  showModal.value = false
  toast.success('บันทึกตั้งค่าโครงการสำเร็จ')
}

const handleCancel = () => {
  resetForm()
  showModal.value = false
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      resetForm()
    }
  }
)
</script>

<template>
  <Dialog
    v-model:visible="showModal"
    modal
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-cog text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">ตั้งค่าโครงการ</h3>
          <p class="text-sm text-gray-600">จัดการข้อมูลโครงการและแผนก</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- ชื่อโครงการ -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-folder text-purple-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ชื่อโครงการ</h4>
        </div>
        <InputText v-model="form.projectName" placeholder="กรอกชื่อโครงการ" fluid size="small" />
      </div>

      <!-- ชื่อแผนก -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-building text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ชื่อแผนก</h4>
        </div>
        <InputText v-model="form.departmentName" placeholder="กรอกชื่อแผนก" fluid size="small" />
      </div>

      <!-- วัตถุประสงค์โครงการ -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-info-circle text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">วัตถุประสงค์โครงการ</h4>
        </div>
        <Textarea
          v-model="form.projectPurpose"
          placeholder="กรอกวัตถุประสงค์ของโครงการ"
          rows="4"
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

