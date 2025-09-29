<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCustomerStore, type CreateCustomerPayload } from '@/stores/customer/customer'
import { Dialog, InputMask } from 'primevue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { toast } from 'vue3-toastify'
import { useMutation } from '@tanstack/vue-query'

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
const newCustomer = ref<CreateCustomerPayload>({
  username: '',
  displayName: '',
  name: '',
  password: '',
  // phone: '',
  email: '',
  bidder: false,
})

const closeAddModal = () => {
  newCustomer.value = {
    username: '',
    displayName: '',
    name: '',
    password: '',
    // phone: '',
    email: '',
    bidder: false,
  }
  emit('onCloseAddModal')
}

const handleAddCustomer = () => {
  isSubmitting.value = true

  if (
    !newCustomer.value.username ||
    !newCustomer.value.displayName ||
    !newCustomer.value.name ||
    !newCustomer.value.password
  ) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  mutate(newCustomer.value)
}

const customerStore = useCustomerStore()

const { mutate, isPending } = useMutation({
  mutationFn: (payload: CreateCustomerPayload) => customerStore.onCreateCustomer(payload),
  onSuccess: (data: any) => {
    if(data.data) {
      toast.success('เพิ่มลูกค้าสำเร็จ')
      closeAddModal()
      isSubmitting.value = false
    } else {
      toast.error('เพิ่มลูกค้าไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
})
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
        <div>
          <label class="block text-sm font-medium! text-gray-700 mb-1">ชื่อผู้ใช้ *</label>
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

      <div>
        <label class="block text-sm font-medium! text-gray-700 mb-1">รหัสผ่าน *</label>
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

      <div class="grid grid-cols-1 md:grid-cols-1 gap-3">
        <div>
          <label class="block text-sm font-medium! text-gray-700 mb-1">อีเมล</label>
          <InputText
            v-model="newCustomer.email"
            placeholder="กรุณาใส่อีเมล"
            type="email"
            fluid
            size="small"
          />
        </div>

        <!-- <div>
          <label class="block text-sm font-medium! text-gray-700 mb-1">เบอร์โทรศัพท์</label>
          <InputMask
            id="basic"
            v-model="newCustomer.phone"
            mask="999-9999999"
            placeholder="เบอร์โทรศัพท์"
            fluid
            size="small"
          />
        </div> -->
      </div>

      <div class="flex items-center space-x-2">
        <Checkbox v-model="newCustomer.bidder" binary inputId="bidder" size="small" />
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
          :loading="isPending"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
