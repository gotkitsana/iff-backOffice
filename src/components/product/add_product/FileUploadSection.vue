<script setup lang="ts">
import {
  useProductStore,
  type IProductImage,
  type IUploadImageResponse,
} from '@/stores/product/product'
import { useMutation } from '@tanstack/vue-query'
import { Button, FileUpload } from 'primevue'
import { computed } from 'vue';
import { toast } from 'vue3-toastify'
import {
  generateProductImageName,
  generateCertificateName,
  generateVideoName,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
  validateFileName
} from '@/utils/fileNameGenerator'
import { getProductImageUrl } from '@/utils/imageUrl'

const props = defineProps<{
  showCertificate: boolean
  showVideo: boolean
  productImages: IProductImage[]
  certificateFile: string | undefined
  videoFile: string | undefined
  isEdit?: boolean
}>()
const isEdit = computed(() => props.isEdit || false)

const emit = defineEmits<{
  'update-product-images': [images: IProductImage[]]
  'update-certificate-file': [string | undefined]
  'update-video-file': [string | undefined]
}>()

const validateFileUpload = (file: File, maxSize: number = 2000000) => {
  if (file.size > maxSize) {
    toast.error(`ขนาดไฟล์ใหญ่เกินไป (สูงสุด ${maxSize / 1000000}MB)`)
    return false
  }

  if (!file.type.startsWith('image/')) {
    toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
    return false
  }

  return true
}

const validateVideoUpload = (file: File, maxSize: number = 980000000) => {
  if (file.size > maxSize) {
    toast.error(`ขนาดไฟล์ใหญ่เกินไป (สูงสุด ${maxSize / 1000000}MB)`)
    return false
  }

  if (!file.type.startsWith('video/')) {
    toast.error('กรุณาเลือกไฟล์วิดีโอเท่านั้น')
    return false
  }

  return true
}

const removeProductImage = (index: number) => {
  emit(
    'update-product-images',
    props.productImages.filter((img, i) => i !== index)
  )
}

const removeCertificate = () => {
  emit('update-certificate-file', undefined)
}

const removeVideo = () => {
  emit('update-video-file', undefined)
}

const productStore = useProductStore()

const onProductImageSelect = (event: { files: File[] }) => {
  const files = event.files

  if (files && files.length > 0) {
    Array.from(files).forEach(file => {
      // Validate
      if (!validateFileName(file.name, ALLOWED_IMAGE_EXTENSIONS)) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`)
        return
      }

      // สร้างชื่อไฟล์ใหม่
      const newFileName = generateProductImageName(file.name)
      console.log('New filename:', newFileName)

      // สร้าง File object ใหม่ด้วยชื่อใหม่
      const renamedFile = new File([file], newFileName, { type: file.type })

      // อัพโหลดไฟล์...
      if (renamedFile && validateFileUpload(renamedFile)) {
        uploadImage(renamedFile)
      }
    })
  }
}
const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
  mutationFn: (file: File) => productStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    const filename = data.filename

    // Update productForm.images
    emit('update-product-images', [
      ...props.productImages,
      {
        filename,
        type: 'image',
      },
    ])

    toast.success('อัปโหลดรูปภาพสำเร็จ')
  },
  onError: (error: any) => {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'อัปโหลดรูปภาพไม่สำเร็จ')
  },
})

const onCertificateSelect = (event: { files: File[] }) => {
  const file = event.files[0]

  if (!file) return

  // Validate ประเภทไฟล์
  if (!validateFileName(file.name, ALLOWED_IMAGE_EXTENSIONS)) {
    toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`)
    return
  }

  // Validate ขนาดไฟล์
  if (!validateFileUpload(file)) {
    return
  }

  // สร้างชื่อไฟล์ใหม่พร้อม timestamp
  const newFileName = generateCertificateName(file.name)
  console.log('Certificate filename:', newFileName)
  // ตัวอย่าง: certificate_cert001_1699999999999.jpg

  // สร้าง File object ใหม่
  const renamedFile = new File([file], newFileName, { type: file.type })

  // อัพโหลดไฟล์
  uploadCertificate(renamedFile)
}
const { mutate: uploadCertificate, isPending: isUploadingCertificate } = useMutation({
  mutationFn: (file: File) => productStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    const filename = data.filename

    emit('update-certificate-file', filename)
    toast.success('อัปโหลดใบรับรองสำเร็จ')
  },
  onError: (error: any) => {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'อัปโหลดใบรับรองไม่สำเร็จ')
  },
})

const onVideoSelect = (event: { files: File[] }) => {
  const file = event.files[0]

  if (!file) return

  // Validate ประเภทไฟล์
  if (!validateFileName(file.name, ALLOWED_VIDEO_EXTENSIONS)) {
    toast.error(`ไฟล์ ${file.name} ไม่ใช่วิดีโอที่รองรับ`)
    return
  }

  // Validate ขนาดไฟล์
  if (!validateVideoUpload(file)) {
    return
  }

  // สร้างชื่อไฟล์ใหม่พร้อม timestamp
  const newFileName = generateVideoName(file.name)
  console.log('Video filename:', newFileName)
  // ตัวอย่าง: video_demo_1699999999999.mp4

  // สร้าง File object ใหม่
  const renamedFile = new File([file], newFileName, { type: file.type })

  // อัพโหลดไฟล์
  uploadVideo(renamedFile)
}
const { mutate: uploadVideo, isPending: isUploadingVideo } = useMutation({
  mutationFn: (file: File) => productStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    const filename = data.filename

    emit('update-video-file', filename)
    toast.success('อัปโหลดวิดีโอสำเร็จ')
  },
  onError: (error: any) => {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'อัปโหลดวิดีโอไม่สำเร็จ')
  },
})

const getVideoPreview = (filename: string) => {
  return getProductImageUrl(filename)
}

const getImagePreview = (filename: string) => {
  return getProductImageUrl(filename)
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <!-- Product Images -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <i class="pi pi-image text-blue-600"></i>
        <h4 class="text-lg font-medium text-gray-800">รูปภาพสินค้า</h4>
      </div>

      <div v-if="productImages && productImages.length > 0" class="mb-4">
        <div class="grid grid-cols-2 gap-2">
          <div v-for="(image, index) in productImages" :key="index" class="relative">
            <img
              :src="getImagePreview(image.filename)"
              :alt="`Product image ${index + 1}`"
              class="w-full h-40 object-contain rounded-lg border border-gray-200"
              loading="lazy"
              fetchpriority="low"
              crossorigin="anonymous"
            />
            <Button
              icon="pi pi-times"
              severity="danger"
              size="small"
              text
              rounded
              class="absolute top-1 right-1"
              @click="removeProductImage(index)"
            />
          </div>
        </div>
      </div>

      <FileUpload
        mode="basic"
        name="productImage"
        accept="image/*"
        :maxFileSize="2000000"
        @select="onProductImageSelect"
        :chooseLabel="isUploadingImage ? 'กำลังอัปโหลด...' : 'เพิ่มรูปภาพ'"
        :disabled="isUploadingImage"
        size="small"
      />
    </div>

     <!-- Video Upload Section -->
    <div v-if="showVideo" class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <i class="pi pi-video text-green-600"></i>
        <h4 class="text-lg font-medium text-gray-800">วิดีโอสินค้า</h4>
        <span class="text-xs text-gray-500">(อัปโหลดได้ 1 คลิป สูงสุด 980MB)</span>
      </div>

      <div v-if="videoFile" class="mb-4">
        <div class="relative">
          <video
            :src="getVideoPreview(videoFile)"
            class="w-full h-60 rounded-lg border border-gray-200"
            controls
          />
          <Button
            v-if="!isEdit"
            icon="pi pi-times"
            severity="danger"
            size="small"
            text
            rounded
            class="absolute top-1 right-1"
            @click="removeVideo"
          />
        </div>
      </div>

      <FileUpload
        v-if="isEdit || !videoFile"
        mode="basic"
        name="videoFile"
        accept="video/*"
        :maxFileSize="980000000"
        @select="onVideoSelect"
        :chooseLabel="isUploadingVideo ? 'กำลังอัปโหลด...' : (isEdit && videoFile) ? 'เปลี่ยนวิดีโอ' : 'เลือกวิดีโอ'"
        :disabled="isUploadingVideo"
        size="small"
      />
    </div>

    <!-- Certificate (for fish only) -->
    <div v-if="showCertificate" class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-center gap-2 mb-3">
        <i class="pi pi-file text-purple-600"></i>
        <h4 class="text-lg font-medium text-gray-800">ใบรับรอง</h4>
      </div>

      <div v-if="certificateFile" class="mb-4">
        <div class="relative">
          <img
            :src="getImagePreview(certificateFile)"
            alt="Certificate"
            class="w-full h-60 object-contain rounded-lg border border-gray-200"
            loading="lazy"
            fetchpriority="low"
            crossorigin="anonymous"
          />
          <Button
            icon="pi pi-times"
            severity="danger"
            size="small"
            text
            rounded
            class="absolute top-1 right-1"
            @click="removeCertificate"
          />
        </div>
      </div>

      <FileUpload
        v-else
        mode="basic"
        name="certificate"
        accept="image/*"
        :maxFileSize="2000000"
        @select="onCertificateSelect"
        :chooseLabel="isUploadingCertificate ? 'กำลังอัปโหลด...' : 'เลือกใบรับรอง'"
        :disabled="isUploadingCertificate"
        size="small"
      />
    </div>
  </div>
</template>


