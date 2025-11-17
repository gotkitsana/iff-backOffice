<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Button, FileUpload } from 'primevue'
import { useMutation } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import { useSalesStore } from '@/stores/sales/sales'
import type { SellingStatusString } from '@/types/sales'

// Props
const props = defineProps<{
  saleId: string
  uploadToSubmit?: boolean
  isAddSale?: boolean
  selectedStatus: string
  isCurrentStatus: string
  isSubmitting: boolean
}>()

// Emits
const emit = defineEmits<{
  'slip-status-changed': [hasSlip: boolean]
  'slip-pending-upload': [isPending: boolean]
  'slip-uploaded': [saleId: string]
}>()

// Stores
const salesStore = useSalesStore()

// Reactive data
const uploadedFile = ref<File | null>(null)
const previewImage = ref<string>('')
const showUploadSection = ref<boolean>(false)

// Computed
const statusSteps: SellingStatusString[] = [
  'order',
  'wait_payment',
  'preparing',
  'shipping',
  'received',
  'damaged',
]
const requiresSlipUpload = computed(() => {
  const currentStepIndex = statusSteps.indexOf(props.selectedStatus as SellingStatusString)
  const waitPaymentStepIndex = statusSteps.indexOf('wait_payment')
  // Show for wait_payment, preparing, shipping and above
  return currentStepIndex >= waitPaymentStepIndex
})

const closeEdit = computed(() => {
  const currentStepIndex = statusSteps.indexOf(props.isCurrentStatus as SellingStatusString)
  const preparingStepIndex = statusSteps.indexOf('preparing')
  return currentStepIndex >= preparingStepIndex
})

const hasSlip = ref(false)
const isCheckingSlip = ref(false)

const checkSlipExists = async (saleId: string) => {
  if (!saleId) {
    hasSlip.value = false
    isCheckingSlip.value = false
    return false
  }

  try {
    isCheckingSlip.value = true
    const slipUrl = `${import.meta.env.VITE_API_URL}/erp/download/slip?saleId=${saleId}`

    return new Promise((resolve) => {
      const img = new Image()

      const timeout = setTimeout(() => {
        hasSlip.value = false
        isCheckingSlip.value = false
        resolve(false)
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)
        hasSlip.value = true
        isCheckingSlip.value = false
        emit('slip-status-changed', true)
        resolve(true)
      }

      img.onerror = () => {
        clearTimeout(timeout)
        hasSlip.value = false
        isCheckingSlip.value = false
        emit('slip-status-changed', false)
        resolve(false)
      }

      img.src = slipUrl
    })
  } catch (error) {
    console.error('Error checking slip:', error)
    hasSlip.value = false
    isCheckingSlip.value = false
    return false
  }
}

// แก้ไข watch ให้ดีขึ้น
watch(
  () => props.saleId,
  (newSaleId, oldSaleId) => {
    if (newSaleId && newSaleId !== oldSaleId) {
      checkSlipExists(newSaleId)
    }
  },
  { immediate: true }
)
onUnmounted(() => {
  // Cleanup any pending image checks
  isCheckingSlip.value = false
})

// Helper function to get slip image URL
const onGetSlipImg = (id: string) => {
  const data = `${import.meta.env.VITE_API_URL}/erp/download/slip?saleId=${id}`
  return data
}

// File upload handlers
const onFileSelect = (event: { files: File[] }) => {
  const file = event.files[0]
  if (file) {
    uploadedFile.value = file

    // Create preview URL for display
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target?.result as string
      // Emit pending upload state (มี previewImage แต่ยังไม่ confirm)
      if (!props.isAddSale) {
        emit('slip-pending-upload', true)
      }
    }
    reader.readAsDataURL(file)
    if (props.isAddSale) {
      emit('slip-status-changed', true)
    }
  }
}

const confirmUploadSlip = () => {
  if (uploadedFile.value) {
    uploadSlip({
      id: props.saleId,
      file: uploadedFile.value,
    })
  }
}

const removeSelectedFile = () => {
  showUploadSection.value = false
  uploadedFile.value = null
  previewImage.value = ''
  // Emit pending upload state = false เมื่อลบไฟล์
  if (!props.isAddSale) {
    emit('slip-pending-upload', false)
  }
}

const handleImageError = (event: Event) => {
  console.error('Image load error:', event)
  hasSlip.value = false
  toast.error('ไม่สามารถโหลดรูปสลิปได้')
}

const editSlip = () => {
  showUploadSection.value = true
}

watch(
  () => props.uploadToSubmit,
  (newUploadToSubmit) => {
    if (!!newUploadToSubmit) {
      confirmUploadSlip()
    }
  },
  { immediate: true }
)

// Mutations
const { mutate: uploadSlip, isPending: isUploadingSlip } = useMutation({
  mutationFn: (payload: { id: string; file: File }) =>
    salesStore.onUploadSlip(payload.id, payload.file),
  onSuccess: (data: any) => {
    toast.success('อัปโหลดสลิปสำเร็จ')
    hasSlip.value = true
    emit('slip-status-changed', true)
    emit('slip-pending-upload', false) // Clear pending state

    // ถ้า status = wait_payment ให้ emit slip-uploaded เพื่อเปลี่ยนสถานะอัตโนมัติ
    if (props.selectedStatus === 'wait_payment' && props.saleId) {
      emit('slip-uploaded', props.saleId)
    }

    previewImage.value = ''
    uploadedFile.value = null
    showUploadSection.value = false
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'อัปโหลดสลิปไม่สำเร็จ')
    emit('slip-pending-upload', false) // Clear pending state on error
    previewImage.value = ''
    uploadedFile.value = null
  },
})
</script>

<template>
  <div
    v-if="requiresSlipUpload"
    :class="`mt-4 p-4 border rounded-lg ${
      props.selectedStatus === 'wait_payment'
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-green-50 border-green-200'
    }`"
  >
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
        <i class="pi pi-upload text-green-600 text-lg"></i>
      </div>
      <div>
        <h4
          class="font-semibold"
          :class="props.selectedStatus === 'wait_payment' ? 'text-yellow-900' : 'text-green-900'"
        >
          สลิปการโอนเงิน
        </h4>
        <p
          class="text-sm"
          :class="props.selectedStatus === 'wait_payment' ? 'text-yellow-700' : 'text-green-700'"
        >
          {{
            isCheckingSlip
              ? 'กำลังตรวจสอบสลิป...'
              : hasSlip
              ? 'แสดงสลิปการโอนเงินที่อัปโหลดแล้ว'
              : props.selectedStatus === 'wait_payment'
              ? 'อัปโหลดสลิปการโอนเงิน (บังคับ) - อัปโหลดแล้วจะเปลี่ยนเป็น preparing'
              : 'อัปโหลดสลิปการโอนเงินเพื่อยืนยันการชำระเงิน'
          }}
        </p>
      </div>
    </div>

    <div v-if="isCheckingSlip" class="mb-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div
          class="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200"
        >
          <div class="text-center">
            <i class="pi pi-spin pi-spinner text-blue-500 text-2xl mb-2"></i>
            <p class="text-sm text-gray-600">กำลังตรวจสอบสลิป...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Slip Display -->
    <div v-else-if="hasSlip && !showUploadSection" class="mb-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h5 class="text-sm font-medium text-gray-700">สลิปการโอนเงิน</h5>
          <div class="flex items-center gap-2">
            <span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              อัปโหลดแล้ว
            </span>
            <Button
              v-if="!closeEdit"
              icon="pi pi-pencil"
              severity="info"
              size="small"
              text
              rounded
              @click="editSlip"
              v-tooltip.top="'แก้ไขสลิป'"
            />
          </div>
        </div>

        <div class="relative">
          <img
            :src="onGetSlipImg(props.saleId)"
            alt="slip"
            class="w-full max-h-50 object-contain rounded-lg border border-gray-200"
            @error="handleImageError"
          />
        </div>
      </div>
    </div>

    <!-- Upload Section -->
    <div v-else-if="!hasSlip || showUploadSection" class="space-y-4">
      <!-- Preview Section -->
      <div
        v-if="previewImage || isUploadingSlip"
        class="bg-white border border-gray-200 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <h6 class="text-sm font-medium text-gray-700">
            {{ hasSlip ? 'สลิปใหม่' : 'สลิปการโอนเงิน' }}
          </h6>
          <div class="flex items-center gap-2">
            <span
              v-if="previewImage && !isUploadingSlip"
              class="bg-orange-500 text-white text-xs px-2 py-1 rounded-full"
            >
              รอการยืนยัน
            </span>
            <span
              v-if="isUploadingSlip"
              class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
            >
              กำลังอัปโหลด...
            </span>
            <Button
              v-if="previewImage && !isUploadingSlip"
              icon="pi pi-times"
              severity="danger"
              size="small"
              text
              rounded
              @click="removeSelectedFile"
              v-tooltip.top="'ลบไฟล์ที่เลือก'"
            />
          </div>
        </div>

        <div class="relative">
          <img
            v-if="!isUploadingSlip"
            :src="previewImage"
            alt="slip preview"
            class="w-full max-h-64 object-contain rounded-lg border border-gray-200"
          />
          <div
            v-else
            class="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200"
          >
            <div class="text-center">
              <i class="pi pi-spin pi-spinner text-2xl text-blue-500 mb-2"></i>
              <p class="text-sm text-gray-600">กำลังอัปโหลดสลิป...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Controls -->
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="space-y-4">
          <!-- File Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ hasSlip ? 'เลือกสลิปใหม่' : 'เลือกสลิปการโอนเงิน' }}
            </label>
            <FileUpload
              mode="basic"
              name="slip"
              accept="image/*"
              :maxFileSize="2000000"
              @select="onFileSelect"
              :chooseLabel="
                isUploadingSlip
                  ? 'กำลังอัปโหลด...'
                  : previewImage
                  ? hasSlip
                    ? 'เปลี่ยนสลิป'
                    : 'เลือกสลิปอื่น'
                  : 'เลือกสลิป'
              "
              :disabled="isUploadingSlip"
              class="w-full"
              :invalid="requiresSlipUpload && !hasSlip && props.isSubmitting"
            />
            <p class="text-xs text-gray-500 mt-1">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 2MB</p>
          </div>

          <!-- Action Buttons -->
          <div v-if="!isAddSale" class="flex items-center gap-3">
            <Button
              v-if="previewImage && !isUploadingSlip"
              :label="hasSlip ? 'อัปเดตสลิป' : 'ยืนยันการอัปโหลด'"
              icon="pi pi-upload"
              severity="success"
              size="small"
              @click="confirmUploadSlip"
              :loading="isUploadingSlip"
            />

            <!-- <Button
              label="ยกเลิก"
              icon="pi pi-times"
              severity="danger"
              size="small"
              @click="cancelEdit"
            /> -->
          </div>
        </div>
      </div>

      <!-- Validation Message -->
      <div
        v-if="requiresSlipUpload && !hasSlip && !isCheckingSlip && props.isSubmitting"
        class="bg-red-50 border border-red-200 rounded-lg p-3"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-red-500"></i>
          <p class="text-sm text-red-700">กรุณาอัปโหลดสลิปการโอนเงินก่อนบันทึกข้อมูล</p>
        </div>
      </div>
    </div>
  </div>
</template>
