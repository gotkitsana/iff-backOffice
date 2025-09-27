<script setup lang="ts">
import { ref } from 'vue'
import type { CreateCustomerPayload } from '@/stores/customer/customer'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { toast } from 'vue3-toastify'

const props = defineProps<{
  showAddModal: boolean
}>()

const emit = defineEmits<{
  (e: 'onCloseAddModal'): void
}>()


const showAddModal = ref(props.showAddModal)

const isSubmitting = ref(false)
const newCustomer = ref<CreateCustomerPayload>({
  username: '',
  displayName: '',
  name: '',
  password: '',
  phone: '',
  email: '',
  bidder: false,
})

const closeAddModal = () => {
  showAddModal.value = false
  isSubmitting.value = false
  newCustomer.value = {
    username: '',
    displayName: '',
    name: '',
    password: '',
    phone: '',
    email: '',
    bidder: false,
  }
  emit('onCloseAddModal')
}



const handleAddCustomer = async () => {
  isSubmitting.value = true

  if (
    !newCustomer.value.username ||
    !newCustomer.value.displayName ||
    !newCustomer.value.name ||
    !newCustomer.value.password
  ) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    isSubmitting.value = false
    return
  }

  emit('onCloseAddModal')
}
</script>

<template>
  <Dialog
    v-model:visible="showAddModal"
    @update:visible="closeAddModal"
    modal
    header="เพิ่มลูกค้าใหม่"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
  >
    <div class="space-y-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="block text-sm font-medium! text-gray-700">ชื่อผู้ใช้ *</label>
          <InputText
            v-model="newCustomer.username"
            placeholder="กรุณาใส่ชื่อผู้ใช้"
            :invalid="!newCustomer.username && isSubmitting"
            fluid
            size="small"
          />
          <small v-if="!newCustomer.username && isSubmitting" class="text-red-500"
            >กรุณาระบุชื่อผู้ใช้</small
          >
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium! text-gray-700">ชื่อแสดง *</label>
          <InputText
            v-model="newCustomer.displayName"
            placeholder="กรุณาใส่ชื่อแสดง"
            :invalid="!newCustomer.displayName && isSubmitting"
            fluid
            size="small"
          />
          <small v-if="!newCustomer.displayName && isSubmitting" class="text-red-500"
            >กรุณาระบุชื่อแสดง</small
          >
        </div>
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium! text-gray-700">ชื่อ-นามสกุล *</label>
        <InputText
          v-model="newCustomer.name"
          placeholder="กรุณาใส่ชื่อ-นามสกุล"
          :invalid="!newCustomer.name && isSubmitting"
          fluid
          size="small"
        />
        <small v-if="!newCustomer.name && isSubmitting" class="text-red-500"
          >กรุณาระบุชื่อ-นามสกุล</small
        >
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium! text-gray-700">รหัสผ่าน *</label>
        <Password
          v-model="newCustomer.password"
          placeholder="กรุณาใส่รหัสผ่าน"
          :feedback="false"
          :invalid="!newCustomer.password && isSubmitting"
          toggleMask
          fluid
          size="small"
        />
        <small v-if="!newCustomer.password && isSubmitting" class="text-red-500"
          >กรุณาระบุรหัสผ่าน</small
        >
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium! text-gray-700">อีเมล</label>
        <InputText
          v-model="newCustomer.email"
          placeholder="กรุณาใส่อีเมล"
          type="email"
          fluid
          size="small"
        />
      </div>

      <div class="flex items-center space-x-2">
        <Checkbox v-model="newCustomer.bidder" :binary="true" inputId="bidder" size="small" />
        <label for="bidder" class="text-sm font-medium! text-gray-700">ลูกค้าประมูล</label>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="danger"
          @click="closeAddModal"
          size="small"
        />
        <Button
          label="เพิ่มสมาชิก"
          icon="pi pi-check"
          @click="handleAddCustomer"
          :loading="isSubmitting"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
