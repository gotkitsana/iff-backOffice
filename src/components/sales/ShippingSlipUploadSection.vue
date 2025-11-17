<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Button, FileUpload } from 'primevue'
import { useMutation } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import { useUploadFileStore } from '@/stores/product/upload_file'
import { getShippingSlipUrl, clearImageCacheByFilename } from '@/utils/imageUrl'
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
  'shipping-slip-status-changed': [hasSlip: boolean]
  'shipping-slip-pending-upload': [isPending: boolean]
}>()

// Stores
const uploadFileStore = useUploadFileStore()

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
const requiresShippingSlipUpload = computed(() => {
  // แสดงเฉพาะเมื่อ status = preparing เท่านั้น
  return props.selectedStatus === 'preparing'
})

const closeEdit = computed(() => {
  const currentStepIndex = statusSteps.indexOf(props.isCurrentStatus as SellingStatusString)
  const shippingStepIndex = statusSteps.indexOf('shipping')
  return currentStepIndex >= shippingStepIndex
})

const hasShippingSlip = ref(false)
const isCheckingSlip = ref(false)
const shippingSlipExtension = ref<string | undefined>(undefined)

const checkShippingSlipExists = async (saleId: string) => {
  if (!saleId) {
    hasShippingSlip.value = false
    isCheckingSlip.value = false
    return false
  }

  try {
    isCheckingSlip.value = true

    // ถ้ามี extension ที่เก็บไว้แล้ว ให้ใช้ extension นั้น
    if (shippingSlipExtension.value) {
      const slipUrl = getShippingSlipUrl(saleId, shippingSlipExtension.value)
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
    }

    // ถ้ายังไม่มี extension ให้ลองหาไฟล์ที่มี extension หลายแบบ
    const extensions = ['jpg', 'jpeg', 'png']
    for (const ext of extensions) {
      const slipUrl = getShippingSlipUrl(saleId, ext)
      const exists = await new Promise<boolean>((resolve) => {
        const img = new Image()
        const timeout = setTimeout(() => {
          resolve(false)
        }, 5000)

        img.onload = () => {
          clearTimeout(timeout)
          shippingSlipExtension.value = ext
          resolve(true)
        }

        img.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }

        img.src = slipUrl
      })

      if (exists) {
        hasShippingSlip.value = true
        isCheckingSlip.value = false
        emit('shipping-slip-status-changed', true)
        return true
      }
    }

    // ถ้าไม่พบไฟล์เลย
    hasShippingSlip.value = false
    isCheckingSlip.value = false
    emit('shipping-slip-status-changed', false)
    return false
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
  return getShippingSlipUrl(id, shippingSlipExtension.value)
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
        emit('shipping-slip-pending-upload', true)
      }
    }
    reader.readAsDataURL(file)
    if (props.isAddSale) {
      emit('shipping-slip-status-changed', true)
    }
  }
}

const confirmUploadShippingSlip = () => {
  if (uploadedFile.value && props.saleId) {
    // Rename file to express-slip-{saleId}
    const fileExtension = uploadedFile.value.name.split('.').pop() || 'jpg'
    shippingSlipExtension.value = fileExtension // เก็บ extension ไว้
    const newFileName = `express-slip-${props.saleId}.${fileExtension}`
    const renamedFile = new File([uploadedFile.value], newFileName, {
      type: uploadedFile.value.type,
    })

    uploadShippingSlip(renamedFile)
  }
}

const removeSelectedFile = () => {
  showUploadSection.value = false
  uploadedFile.value = null
  previewImage.value = ''
  // Emit pending upload state = false เมื่อลบไฟล์
  if (!props.isAddSale) {
    emit('shipping-slip-pending-upload', false)
  }
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
  mutationFn: (file: File) => uploadFileStore.onUploadImage(file),
  onSuccess: () => {
    toast.success('อัปโหลดสลิปการจัดส่งสำเร็จ')

    // ล้าง cache ของ shipping slip URL เพื่อให้โหลดรูปใหม่
    if (props.saleId && shippingSlipExtension.value) {
      const filename = `express-slip-${props.saleId}.${shippingSlipExtension.value}`
      clearImageCacheByFilename(filename, 'product')
    }

    hasShippingSlip.value = true
    emit('shipping-slip-status-changed', true)
    emit('shipping-slip-pending-upload', false) // Clear pending state

    previewImage.value = ''
    uploadedFile.value = null
    showUploadSection.value = false

    // รีเฟรชการตรวจสอบสลิปเพื่อให้แสดงรูปใหม่
    if (props.saleId) {
      setTimeout(() => {
        checkShippingSlipExists(props.saleId)
      }, 500)
    }
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'อัปโหลดสลิปการจัดส่งไม่สำเร็จ')
    emit('shipping-slip-pending-upload', false) // Clear pending state on error
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

