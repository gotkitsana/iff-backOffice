<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ResetPasswordPayload } from '@/stores/customer/customer'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { toast } from 'vue3-toastify'
import { useCustomerStore } from '@/stores/customer/customer'
import { useMutation } from '@tanstack/vue-query'

const customerStore = useCustomerStore()

const props = defineProps<{
  showResetModal: boolean
  customerId: string | null
  customerName: string
}>()

const emit = defineEmits<{
  (e: 'onCloseResetModal'): void
}>()

const isSubmitting = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

const showResetModal = computed({
  get: () => props.showResetModal,
  set: (value: boolean) => {
    if (!value) {
      closeResetModal()
    }
  },
})

const closeResetModal = () => {
  isSubmitting.value = false
  newPassword.value = ''
  confirmPassword.value = ''
  emit('onCloseResetModal')
}

const validatePassword = (password: string) => {
  const minLength = 8
  const hasNumbers = /\d/.test(password)

  return {
    isValid: password.length >= minLength && hasNumbers,
    minLength: password.length >= minLength,
    hasNumbers,
  }
}

const passwordValidation = computed(() => {
  if (!newPassword.value) return null
  return validatePassword(newPassword.value)
})

const isFormValid = computed(() => {
  return passwordValidation.value?.isValid && newPassword.value === confirmPassword.value
})

const handleResetPassword = async () => {
  isSubmitting.value = true

  if (!newPassword.value || !confirmPassword.value) {
    toast.error('กรุณากรอกรหัสผ่านให้ครบถ้วน')
    return
  }

  if (!passwordValidation.value?.isValid) {
    toast.error('รหัสผ่านไม่ตรงตามเงื่อนไข')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.error('รหัสผ่านไม่ตรงกัน')
    return
  }

  if (!props.customerId) {
    toast.error('เกิดข้อผิดพลาดกรุณาลองใหม่อีกครั้ง')
    return
  }

  mutate({ id: props.customerId!, password: newPassword.value })
}

const { mutate, isPending } = useMutation({
  mutationFn: (payload: ResetPasswordPayload) => customerStore.onResetPassword(payload),
  onSuccess: (data: any) => {
    console.log(data)
    if (data.data) {
      toast.success('รีเซ็ตรหัสผ่านสำเร็จ')
      closeResetModal()
      isSubmitting.value = false
    } else {
      toast.error('รีเซ็ตรหัสผ่านไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
})
</script>

<template>
  <Dialog
    v-model:visible="showResetModal"
    modal
    header="รีเซ็ตรหัสผ่าน"
    :style="{ width: '40rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    :pt="{
      header: 'p-4',
      title: 'text-lg font-semibold!',
    }"
  >
    <div class="space-y-4">
      <!-- Header Section -->
      <div
        class="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100"
      >
        <div
          class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center"
        >
          <i class="pi pi-key text-white text-xl"></i>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold! text-gray-800">รีเซ็ตรหัสผ่าน</h3>
          <p class="text-sm text-gray-600">{{ customerName }}</p>
        </div>
      </div>

      <!-- Password Form -->
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700"> รหัสผ่านใหม่ * </label>
          <Password
            v-model="newPassword"
            placeholder="กรุณาใส่รหัสผ่านใหม่"
            :feedback="true"
            :invalid="!passwordValidation?.isValid && newPassword.length > 0"
            toggleMask
            fluid
            size="small"
            :pt="{
              input: 'w-full',
              panel: 'mt-2',
            }"
          />

          <!-- Password Requirements -->
          <div v-if="newPassword" class="mt-3 space-y-2">
            <p class="text-xs font-medium text-gray-600 mb-2">เงื่อนไขรหัสผ่าน:</p>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center space-x-2">
                <i
                  :class="
                    passwordValidation?.minLength
                      ? 'pi pi-check text-green-500'
                      : 'pi pi-times text-red-500'
                  "
                ></i>
                <span :class="passwordValidation?.minLength ? 'text-green-600' : 'text-red-600'">
                  อย่างน้อย 8 ตัวอักษร
                </span>
              </div>
              <div class="flex items-center space-x-2">
                <i
                  :class="
                    passwordValidation?.hasNumbers
                      ? 'pi pi-check text-green-500'
                      : 'pi pi-times text-red-500'
                  "
                ></i>
                <span :class="passwordValidation?.hasNumbers ? 'text-green-600' : 'text-red-600'">
                  ตัวเลข 1 ตัวขึ้นไป
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700"> ยืนยันรหัสผ่าน * </label>
          <Password
            v-model="confirmPassword"
            placeholder="กรุณายืนยันรหัสผ่าน"
            :feedback="false"
            :invalid="!!(confirmPassword && newPassword !== confirmPassword)"
            toggleMask
            fluid
            size="small"
          />
          <small
            v-if="confirmPassword && newPassword !== confirmPassword"
            class="text-red-500 text-xs"
          >
            รหัสผ่านไม่ตรงกัน
          </small>
        </div>
      </div>

      <!-- Warning Message -->
      <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-3">
        <div class="flex items-start space-x-3">
          <i class="pi pi-exclamation-triangle text-yellow-600 text-lg mt-0.5"></i>
          <div>
            <h4 class="text-sm font-medium text-yellow-800">คำเตือน</h4>
            <p class="text-xs text-yellow-700 mt-1">
              การรีเซ็ตรหัสผ่านจะทำให้ผู้ใช้ไม่สามารถเข้าสู่ระบบด้วยรหัสผ่านเดิมได้
              กรุณาแจ้งให้ผู้ใช้ทราบถึงรหัสผ่านใหม่
            </p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-x-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="closeResetModal"
          severity="secondary"
          size="small"
        />
        <Button
          label="รีเซ็ตรหัสผ่าน"
          icon="pi pi-key"
          @click="handleResetPassword"
          :loading="isPending"
          :disabled="!isFormValid"
          severity="danger"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
