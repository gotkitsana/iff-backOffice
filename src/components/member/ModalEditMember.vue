<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useCustomerStore,
  type Customer,
  type EditCustomerPayload,
} from '@/stores/customer/customer'
import { Dialog, InputMask } from 'primevue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { toast } from 'vue3-toastify'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const props = defineProps<{
  showEditModal: boolean
  customerData: Customer
}>()

const emit = defineEmits<{
  (e: 'onCloseEditModal'): void
}>()

const showEditModal = computed({
  get: () => props.showEditModal,
  set: (value: boolean) => {
    if (!value) {
      closeEditModal()
    }
  },
})

const isSubmitting = ref(false)
const customerData = ref<EditCustomerPayload>({
  _id: props.customerData._id,
  displayName: props.customerData.displayName,
  name: props.customerData.name,
  email: props.customerData.email,
  // phone: props.customerData.phone,
  bidder: props.customerData.bidder,
})

const closeEditModal = () => {
  customerData.value = {
    _id: '',
    displayName: '',
    name: '',
    email: '',
    // phone: '',
    bidder: false,
  }
  emit('onCloseEditModal')
}

const handleEditCustomer = () => {
  isSubmitting.value = true

  if (!customerData.value.displayName || !customerData.value.name) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  mutate(customerData.value)
}

const customerStore = useCustomerStore()

const queryClient = useQueryClient()
const { mutate, isPending } = useMutation({
  mutationFn: (payload: EditCustomerPayload) => customerStore.onUpdateCustomer(payload),
  onSuccess: (data: any) => {
    if (data.data) {
      toast.success('แก้ไขข้อมูลลูกค้าสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_customers'] })
      closeEditModal()
      isSubmitting.value = false
    } else {
      toast.error('แก้ไขข้อมูลลูกค้าไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
})
</script>

<template>
  <Dialog
    v-model:visible="showEditModal"
    @update:visible="closeEditModal"
    modal
    header="แก้ไขข้อมูลลูกค้า"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
  >
    <div class="space-y-3">
      <div class="space-y-1">
        <label class="block text-sm font-medium! text-gray-700">ชื่อแสดง *</label>
        <InputText
          v-model="customerData.displayName"
          placeholder="กรุณาใส่ชื่อแสดง"
          :invalid="!customerData.displayName && isSubmitting"
          fluid
          size="small"
        />
        <small v-if="!customerData.displayName && isSubmitting" class="text-red-500"
          >กรุณาระบุชื่อแสดง</small
        >
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-medium! text-gray-700">ชื่อ-นามสกุล *</label>
        <InputText
          v-model="customerData.name"
          placeholder="กรุณาใส่ชื่อ-นามสกุล"
          :invalid="!customerData.name && isSubmitting"
          fluid
          size="small"
        />
        <small v-if="!customerData.name && isSubmitting" class="text-red-500"
          >กรุณาระบุชื่อ-นามสกุล</small
        >
      </div>

      <div>
        <label class="block text-sm font-medium! text-gray-700 mb-1">อีเมล</label>
        <InputText
          v-model="customerData.email"
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
          v-model="customerData.phone"
          mask="999-9999999"
          placeholder="เบอร์โทรศัพท์"
          fluid
          size="small"
        />
      </div> -->

      <div class="flex items-center space-x-2">
        <Checkbox v-model="customerData.bidder" binary inputId="bidder" size="small" />
        <label for="bidder" class="text-sm font-medium! text-gray-700">ลูกค้าประมูล</label>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="danger"
          @click="closeEditModal"
          size="small"
        />
        <Button
          label="ยืนยัน"
          icon="pi pi-check"
          @click="handleEditCustomer"
          :loading="isPending"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
