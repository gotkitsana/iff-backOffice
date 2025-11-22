<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Button, FileUpload, RadioButton, InputText } from 'primevue'
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
  skipUpload?: boolean // เพิ่ม prop สำหรับบอกว่าข้ามการอัพโหลดหรือไม่
  requireUpload?: boolean // เพิ่ม prop สำหรับบอกว่าต้องการอัพโหลดหรือไม่ (ค่าเริ่มต้น = true)
  delivery?: string // เพิ่ม prop สำหรับหมายเลขการจัดส่ง
  isReadOnly?: boolean // เพิ่ม prop สำหรับ disable เมื่อสถานะเป็น received หรือ damaged
}>()

// Emits
const emit = defineEmits<{
  'shipping-slip-status-changed': [hasSlip: boolean]
  'shipping-slip-pending-upload': [isPending: boolean]
  'shipping-slip-uploaded': [saleId: string]
  'skip-upload-changed': [skipUpload: boolean] // เพิ่ม emit event
  'require-upload-changed': [requireUpload: boolean] // เพิ่ม emit event
  'delivery-changed': [delivery: string] // เพิ่ม emit event สำหรับหมายเลขการจัดส่ง
}>()

// Stores
const uploadFileStore = useUploadFileStore()

// Reactive data
const uploadedFile = ref<File | null>(null)
const previewImage = ref<string>('')
const showUploadSection = ref<boolean>(false)

// Local state for delivery tracking number
const deliveryNumber = ref<string>(props.delivery || '')

// Watch props.delivery to sync with parent
watch(
  () => props.delivery,
  (newValue) => {
    if (newValue !== undefined && newValue !== deliveryNumber.value) {
      deliveryNumber.value = newValue || ''
    }
  },
  { immediate: true }
)

// Watch deliveryNumber to emit changes
watch(
  () => deliveryNumber.value,
  (newValue) => {
    emit('delivery-changed', newValue)
  }
)

// State สำหรับเลือกอัพโหลดหรือข้าม
const uploadOption = ref<'upload' | 'skip'>(props.requireUpload === false ? 'skip' : 'upload')

// Computed สำหรับตรวจสอบว่าต้องการอัพโหลดหรือไม่ (ใช้ชื่อต่างจาก props เพื่อหลีกเลี่ยงการชนกัน)
const shouldRequireUpload = computed(() => uploadOption.value === 'upload')
const shouldSkipUpload = computed(() => uploadOption.value === 'skip')

// Watch สำหรับ emit events เมื่อ uploadOption เปลี่ยน
watch(
  () => uploadOption.value,
  (newValue) => {
    if (newValue === 'skip') {
      emit('skip-upload-changed', true)
      emit('require-upload-changed', false)
      // ล้าง pending upload state เมื่อเลือกข้าม
      emit('shipping-slip-pending-upload', false)
    } else {
      emit('skip-upload-changed', false)
      emit('require-upload-changed', true)
    }
  },
  { immediate: true }
)

// Watch props.skipUpload และ props.requireUpload เพื่อ sync กับ parent
watch(
  () => props.skipUpload,
  (newValue) => {
    if (newValue !== undefined && newValue !== shouldSkipUpload.value) {
      uploadOption.value = newValue ? 'skip' : 'upload'
    }
  },
  { immediate: true }
)

watch(
  () => props.requireUpload,
  (newValue) => {
    if (newValue !== undefined && newValue !== shouldRequireUpload.value) {
      uploadOption.value = newValue ? 'upload' : 'skip'
    }
  },
  { immediate: true }
)

// Computed
const statusSteps: SellingStatusString[] = [
  'order',
  'wait_payment',
  'preparing',
  'shipping',
  'received',
  'damaged',
]

const closeEdit = computed(() => {
  const currentStepIndex = statusSteps.indexOf(props.isCurrentStatus as SellingStatusString)
  const shippingStepIndex = statusSteps.indexOf('shipping')
  return currentStepIndex >= shippingStepIndex
})

// Computed สำหรับตรวจสอบว่าควรแสดง upload section หรือไม่
const shouldShowUploadSection = computed(() => {
  // ถ้าเลือกข้ามและสถานะเป็น shipping → แสดงแต่ปิดไว้
  if (shouldSkipUpload.value && props.isCurrentStatus === 'shipping') {
    return true
  }
  // ถ้าเลือกข้าม → ไม่แสดง upload section
  if (shouldSkipUpload.value) {
    return false
  }
  // ถ้าเลือกอัพโหลด → แสดง upload section
  return shouldRequireUpload.value
})

// Computed สำหรับตรวจสอบว่าควร disable หรือไม่
const isDisabled = computed(() => {
  // ถ้าเลือกข้ามและสถานะเป็น shipping → disable
  return shouldSkipUpload.value && props.isCurrentStatus === 'shipping'
})

// Computed สำหรับตรวจสอบว่าควร disable input หรือไม่
const isInputDisabled = computed(() => {
  // Disable เมื่อ isReadOnly หรือ isDisabled
  return props.isReadOnly || isDisabled.value
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

    // เก็บ previewImage ไว้จนกว่าจะรีเฟรชสำเร็จ
    // previewImage จะถูกล้างเมื่อ checkShippingSlipExists สำเร็จ

    uploadedFile.value = null
    showUploadSection.value = false

    // รีเฟรชการตรวจสอบสลิปเพื่อให้แสดงรูปใหม่
    if (props.saleId) {
      setTimeout(async () => {
        const exists = await checkShippingSlipExists(props.saleId)
        // เมื่อรีเฟรชสำเร็จแล้ว ให้ล้าง previewImage
        if (exists) {
          previewImage.value = ''
        }
      }, 500)
    } else {
      // ถ้าไม่มี saleId ให้ล้าง previewImage ทันที
      previewImage.value = ''
    }

    // ถ้า status = preparing และไม่ใช่ skip mode ให้ emit shipping-slip-uploaded เพื่อเปลี่ยนสถานะอัตโนมัติ
    if (props.selectedStatus === 'preparing' && props.saleId && !shouldSkipUpload.value) {
      emit('shipping-slip-uploaded', props.saleId)
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
  <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <i class="pi pi-truck text-blue-600 text-lg"></i>
      </div>
      <div class="flex-1">
        <h4 class="font-semibold text-blue-900">สลิปการจัดส่ง</h4>
        <p class="text-sm text-blue-700">
          {{
            isCheckingSlip
              ? 'กำลังตรวจสอบสลิป...'
              : hasShippingSlip
              ? 'แสดงสลิปการจัดส่งที่อัปโหลดแล้ว'
              : shouldSkipUpload && isCurrentStatus === 'shipping'
              ? 'ข้ามการอัพโหลดสลิปการจัดส่ง'
              : 'อัปโหลดสลิปการจัดส่ง'
          }}
        </p>
      </div>
    </div>

    <!-- Delivery Tracking Number Input (แสดงเสมอ) -->
    <div class="mb-4 bg-white border border-gray-200 rounded-lg p-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        หมายเลขการจัดส่ง
        <span class="text-gray-400 text-xs font-normal">(ไม่บังคับ)</span>
      </label>
      <InputText
        v-model="deliveryNumber"
        placeholder="กรอกหมายเลขการจัดส่ง"
        fluid
        size="small"
        :disabled="isInputDisabled"
        class="w-full"
      />
      <p class="text-xs text-gray-500 mt-1">หมายเลขติดตามการจัดส่งสินค้า</p>
    </div>

    <!-- Upload Option Selection (แสดงเฉพาะเมื่อ status = preparing และ isCurrentStatus = preparing) -->
    <div
      v-if="selectedStatus === 'preparing' && isCurrentStatus === 'preparing'"
      class="mb-4 bg-white border border-gray-200 rounded-lg p-4"
    >
      <label class="block text-sm font-medium text-gray-700 mb-3">เลือกการดำเนินการ</label>
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <RadioButton
            v-model="uploadOption"
            inputId="upload-option"
            value="upload"
            :disabled="isDisabled"
          />
          <label for="upload-option" class="text-sm text-gray-700 cursor-pointer">
            อัพโหลดสลิปการจัดส่ง
          </label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton
            v-model="uploadOption"
            inputId="skip-option"
            value="skip"
            :disabled="isDisabled"
          />
          <label for="skip-option" class="text-sm text-gray-700 cursor-pointer">
            ข้ามการอัพโหลดสลิปการจัดส่ง
          </label>
        </div>
      </div>
    </div>

    <!-- Skip Message (แสดงเมื่อเลือกข้ามและสถานะเป็น shipping) -->
    <div
      v-if="shouldSkipUpload && isCurrentStatus === 'shipping'"
      class="mb-4 bg-white border border-gray-300 rounded-lg p-4 opacity-60"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-info-circle text-gray-500"></i>
        <p class="text-sm text-gray-600">ข้ามการอัพโหลดสลิปการจัดส่ง</p>
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

    <!-- Slip Display (แสดงเฉพาะเมื่อมี shipping slip และไม่ใช่ skip mode หรือ skip mode แต่สถานะเป็น shipping) -->
    <div
      v-else-if="
        hasShippingSlip &&
        !showUploadSection &&
        !previewImage &&
        (!shouldSkipUpload || (shouldSkipUpload && isCurrentStatus === 'shipping'))
      "
      class="mb-4"
    >
      <div
        class="bg-white border border-gray-200 rounded-lg p-4"
        :class="{ 'opacity-60': isDisabled }"
      >
        <div class="flex items-center justify-between mb-3">
          <h5 class="text-sm font-medium text-gray-700">สลิปการจัดส่ง</h5>
          <div class="flex items-center gap-2">
            <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"> อัปโหลดแล้ว </span>
            <Button
              v-if="!closeEdit && !isDisabled"
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

    <!-- Upload Section (แสดงเฉพาะเมื่อ requireUpload = true หรือ skip mode และสถานะเป็น shipping) -->
    <div
      v-else-if="
        shouldShowUploadSection &&
        (!hasShippingSlip ||
          showUploadSection ||
          previewImage ||
          (shouldSkipUpload && isCurrentStatus === 'shipping'))
      "
      class="space-y-4"
    >
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
      <div v-if="shouldRequireUpload" class="bg-white border border-gray-200 rounded-lg p-4">
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
              :disabled="isUploadingSlip || isDisabled || isInputDisabled"
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
              :disabled="isDisabled"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

