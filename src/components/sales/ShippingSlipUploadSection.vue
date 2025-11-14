<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Button, FileUpload } from 'primevue'
import { useMutation } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import { useSalesStore } from '@/stores/sales/sales'
import type { SellingStatus } from '@/types/sales'

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
  'shipping-slip-status-changed': [hasSlip: boolean]
}>()

// Stores
const salesStore = useSalesStore()

// Reactive data
const uploadedFile = ref<File | null>(null)
const previewImage = ref<string>('')
const showUploadSection = ref<boolean>(false)

// Computed
const statusSteps: SellingStatus[] = [
  'wait_product',
  'wait_confirm',
  'wait_payment',
  'preparing',
  'shipping',
  'received',
  'damaged',
]
const requiresShippingSlipUpload = computed(() => {
  const currentStepIndex = statusSteps.indexOf(props.selectedStatus as SellingStatus)
  const preparingStepIndex = statusSteps.indexOf('preparing')
  const shippingStepIndex = statusSteps.indexOf('shipping')
  // Show for wait_payment (optional), preparing (mandatory), shipping and above
  return currentStepIndex >= preparingStepIndex || props.selectedStatus === 'wait_payment'
})

const closeEdit = computed(() => {
  const currentStepIndex = statusSteps.indexOf(props.isCurrentStatus as SellingStatus)
  const shippingStepIndex = statusSteps.indexOf('shipping')
  return currentStepIndex >= shippingStepIndex
})

const hasShippingSlip = ref(false)
const isCheckingSlip = ref(false)

const checkShippingSlipExists = async (saleId: string) => {
  if (!saleId) {
    hasShippingSlip.value = false
    isCheckingSlip.value = false
    return false
  }

  try {
    isCheckingSlip.value = true
    const slipUrl = `${import.meta.env.VITE_API_URL}/erp/download/shipping-slip?saleId=${saleId}`

    return new Promise((resolve) => {
      const img = new Image()

      const timeout = setTimeout(() => {
        hasShippingSlip.value = false
        isCheckingSlip.value = false
        resolve(false)
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)
        hasShippingSlip.value = true
        isCheckingSlip.value = false
        emit('shipping-slip-status-changed', true)
        resolve(true)
      }

      img.onerror = () => {
        clearTimeout(timeout)
        hasShippingSlip.value = false
        isCheckingSlip.value = false
        emit('shipping-slip-status-changed', false)
        resolve(false)
      }

      img.src = slipUrl
    })
  } catch (error) {
    console.error('Error checking shipping slip:', error)
    hasShippingSlip.value = false
    isCheckingSlip.value = false
    return false
  }
}

// Watch for saleId changes
watch(
  () => props.saleId,
  (newSaleId, oldSaleId) => {
    if (newSaleId && newSaleId !== oldSaleId) {
      checkShippingSlipExists(newSaleId)
    }
  },
  { immediate: true }
)
onUnmounted(() => {
  isCheckingSlip.value = false
})

// Helper function to get shipping slip image URL
const onGetShippingSlipImg = (id: string) => {
  return `${import.meta.env.VITE_API_URL}/erp/download/shipping-slip?saleId=${id}`
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
    }
    reader.readAsDataURL(file)
    if (props.isAddSale) {
      emit('shipping-slip-status-changed', true)
    }
  }
}

const confirmUploadShippingSlip = () => {
  if (uploadedFile.value) {
    uploadShippingSlip({
      id: props.saleId,
      file: uploadedFile.value,
    })
  }
}

const removeSelectedFile = () => {
  showUploadSection.value = false
  uploadedFile.value = null
  previewImage.value = ''
}

const handleImageError = (event: Event) => {
  console.error('Image load error:', event)
  hasShippingSlip.value = false
  toast.error('ไม่สามารถโหลดรูปสลิปการจัดส่งได้')
}

const editSlip = () => {
  showUploadSection.value = true
}

watch(
  () => props.uploadToSubmit,
  (newUploadToSubmit) => {
    if (!!newUploadToSubmit) {
      confirmUploadShippingSlip()
    }
  },
  { immediate: true }
)

// Mutations
const { mutate: uploadShippingSlip, isPending: isUploadingSlip } = useMutation({
  mutationFn: (payload: { id: string; file: File }) =>
    salesStore.onUploadShippingSlip(payload.id, payload.file),
  onSuccess: (data: any) => {
    toast.success('อัปโหลดสลิปการจัดส่งสำเร็จ')
    hasShippingSlip.value = true
    emit('shipping-slip-status-changed', true)
    previewImage.value = ''
    uploadedFile.value = null
    showUploadSection.value = false
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'อัปโหลดสลิปการจัดส่งไม่สำเร็จ')
    previewImage.value = ''
    uploadedFile.value = null
  },
})
</script>

<template>
  <div
    v-if="requiresShippingSlipUpload"
    class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
  >
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <i class="pi pi-truck text-blue-600 text-lg"></i>
      </div>
      <div>
        <h4 class="font-semibold text-blue-900">สลิปการจัดส่ง</h4>
        <p class="text-sm text-blue-700">
          {{
            isCheckingSlip
              ? 'กำลังตรวจสอบสลิป...'
              : hasShippingSlip
              ? 'แสดงสลิปการจัดส่งที่อัปโหลดแล้ว'
              : 'อัปโหลดสลิปการจัดส่ง (ไม่บังคับ)'
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
    <div v-else-if="hasShippingSlip && !showUploadSection" class="mb-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h5 class="text-sm font-medium text-gray-700">สลิปการจัดส่ง</h5>
          <div class="flex items-center gap-2">
            <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"> อัปโหลดแล้ว </span>
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
            :src="onGetShippingSlipImg(props.saleId)"
            alt="shipping slip"
            class="w-full max-h-50 object-contain rounded-lg border border-gray-200"
            @error="handleImageError"
          />
        </div>
      </div>
    </div>

    <!-- Upload Section -->
    <div v-else-if="!hasShippingSlip || showUploadSection" class="space-y-4">
      <!-- Preview Section -->
      <div
        v-if="previewImage || isUploadingSlip"
        class="bg-white border border-gray-200 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <h6 class="text-sm font-medium text-gray-700">
            {{ hasShippingSlip ? 'สลิปใหม่' : 'สลิปการจัดส่ง' }}
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
            alt="shipping slip preview"
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
              {{ hasShippingSlip ? 'เลือกสลิปใหม่' : 'เลือกสลิปการจัดส่ง' }}
            </label>
            <FileUpload
              mode="basic"
              name="shipping-slip"
              accept="image/*"
              :maxFileSize="2000000"
              @select="onFileSelect"
              :chooseLabel="
                isUploadingSlip
                  ? 'กำลังอัปโหลด...'
                  : previewImage
                  ? hasShippingSlip
                    ? 'เปลี่ยนสลิป'
                    : 'เลือกสลิปอื่น'
                  : 'เลือกสลิป'
              "
              :disabled="isUploadingSlip"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-1">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 2MB</p>
          </div>

          <!-- Action Buttons -->
          <div v-if="!isAddSale" class="flex items-center gap-3">
            <Button
              v-if="previewImage && !isUploadingSlip"
              :label="hasShippingSlip ? 'อัปเดตสลิป' : 'ยืนยันการอัปโหลด'"
              icon="pi pi-upload"
              severity="success"
              size="small"
              @click="confirmUploadShippingSlip"
              :loading="isUploadingSlip"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

