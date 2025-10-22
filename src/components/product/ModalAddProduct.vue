<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  InputText,
  Textarea,
  Select,
  InputNumber,
  Button,
  RadioButton,
  FileUpload,
} from 'primevue'
import {
  useProductStore,
  type ICreateProductPayload,
  type IGender,
  type IUploadImageResponse,
} from '../../stores/product/product'
import { toast } from 'vue3-toastify'
import { useMutation } from '@tanstack/vue-query'

// Props
defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'product-added': []
}>()

// Stores
const productStore = useProductStore()

// Form data
const productForm = ref<ICreateProductPayload>({
  images: [] as { filename: string; type: string }[],
  type: 1, // 1 = ปลา, 0 = อื่นๆ
  name: '',
  price: 0,
  detail: '',
  sku: '',
  farm: '',
  size: 0,
  gender: 1, // 1 = ตัวผู้, 0 = ตัวเมีย
  age: '',
  sold: false,
  rate: 0,
  youtube: '',
  certificate: null,
  auctionOnly: 0, // 0 = สินค้าสำหรับขาย, 1 = สินค้าสำหรับประมูล
  category: null,
})

// File upload states
const productImages = ref<{ filename: string; type: string; preview: string }[]>([])
const certificateFile = ref<{ filename: string; preview: string } | null>(null)
const uploadedProductImage = ref<File | null>(null)
const uploadedCertificateFile = ref<File | null>(null)
const showImageUpload = ref(false)
const showCertificateUpload = ref(false)

const genderOptions: { label: string; value: IGender }[] = [
  { label: 'ตัวผู้', value: 1 },
  { label: 'ตัวเมีย', value: 0 },
]

// Computed
const isAuctionProduct = computed(() => productForm.value.auctionOnly === 1)
const isFish = computed(() => productForm.value.type === 1)

watch(
  isAuctionProduct,
  (newVal) => {
    if (newVal) {
      productForm.value.type = 1
    }
  },
  { immediate: true }
)

watch(() => productForm.value.type, (newVal) => {
  if (newVal === 0) {
    productForm.value.certificate = null
    certificateFile.value = null
  }
}, { immediate: true })
// Validation
const validateForm = () => {
  if (!productForm.value.name.trim()) {
    toast.error('กรุณากรอกชื่อสินค้า')
    return false
  }
  if (!productForm.value.sku.trim()) {
    toast.error('กรุณากรอก SKU')
    return false
  }

  // ตรวจสอบข้อมูลเฉพาะปลา
  if (isFish.value) {
    if (!productForm.value.farm.trim()) {
      toast.error('กรุณากรอกชื่อฟาร์ม')
      return false
    }
    if (productForm.value.size && productForm.value.size <= 0) {
      toast.error('กรุณากรอกขนาดที่ถูกต้อง')
      return false
    }
  }

  // ตรวจสอบราคาสำหรับสินค้าปกติ
  if (!isAuctionProduct.value && productForm.value.price && productForm.value.price <= 0) {
    toast.error('กรุณากรอกราคาที่ถูกต้อง')
    return false
  }

  // ตรวจสอบสินค้าสำหรับประมูลต้องเป็นปลาเท่านั้น
  if (isAuctionProduct.value && !isFish.value) {
    toast.error('สินค้าสำหรับประมูลต้องเป็นปลาเท่านั้น')
    return false
  }

  return true
}

// Handlers
const handleSubmit = async () => {
  isSubmitting.value = true
  if (!validateForm()) return

  const payload: ICreateProductPayload = {
    type: productForm.value.type,
    name: productForm.value.name,
    price: productForm.value.price,
    detail: productForm.value.detail,
    category: productForm.value.category,
    sku: productForm.value.sku,
    farm: productForm.value.farm,
    size: productForm.value.size,
    gender: productForm.value.gender,
    age: productForm.value.age,
    sold: productForm.value.sold,
    rate: productForm.value.rate,
    youtube: productForm.value.youtube,
    certificate: productForm.value.certificate,
    images: productForm.value.images,
    auctionOnly: productForm.value.auctionOnly,
  }

  await productStore.onCreateProduct(payload)
  toast.success('เพิ่มสินค้าสำเร็จ')
  emit('product-added')
  handleClose()
}

const isSubmitting = ref(false)

// File upload mutations
const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
  mutationFn: (file: File) => productStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    console.log(data)
    const filename = data.filename
    const preview = `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${filename}`

    productImages.value.push({
      filename,
      type: 'image',
      preview,
    })

    // Update productForm.images
    productForm.value.images = productImages.value.map((img) => ({
      filename: img.filename,
      type: img.type,
    }))

    uploadedProductImage.value = null
    showImageUpload.value = false
    toast.success('อัปโหลดรูปภาพสำเร็จ')
  },
  onError: (error: { response?: { data?: { message?: string } } }) => {
    toast.error(error.response?.data?.message || 'อัปโหลดรูปภาพไม่สำเร็จ')
    uploadedProductImage.value = null
  },
})

const { mutate: uploadCertificate, isPending: isUploadingCertificate } = useMutation({
  mutationFn: (file: File) => productStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    console.log(data)
    const filename = data.filename
    const preview = `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${filename}`

    certificateFile.value = {
      filename,
      preview,
    }

    productForm.value.certificate = filename
    uploadedCertificateFile.value = null
    showCertificateUpload.value = false
    toast.success('อัปโหลดใบรับรองสำเร็จ')
  },
  onError: (error: { response?: { data?: { message?: string } } }) => {
    console.log(error)
    toast.error(error.response?.data?.message || 'อัปโหลดใบรับรองไม่สำเร็จ')
    uploadedCertificateFile.value = null
  },
})

// File upload handlers
const onProductImageSelect = (event: { files: File[] }) => {
  const file = event.files[0]
  if (file) {
    uploadedProductImage.value = file
    uploadImage(file)
  }
}

const onCertificateSelect = (event: { files: File[] }) => {
  const file = event.files[0]
  if (file) {
    uploadedCertificateFile.value = file
    uploadCertificate(file)
  }
}

const removeProductImage = (index: number) => {
  productImages.value.splice(index, 1)
  productForm.value.images = productImages.value.map((img) => ({
    filename: img.filename,
    type: img.type,
  }))
}

const removeCertificate = () => {
  certificateFile.value = null
  productForm.value.certificate = null
}

const handleClose = () => {
  resetForm()
  isSubmitting.value = false
  emit('update:visible', false)
}

const resetForm = () => {
  productForm.value = {
    images: [] as { filename: string; type: string }[],
    type: 1, // 1 = ปลา, 0 = อื่นๆ
    name: '',
    price: null,
    detail: '',
    category: null,
    sku: '',
    farm: '',
    size: 0,
    gender: 1, // 1 = ตัวผู้, 0 = ตัวเมีย
    age: '',
    sold: false,
    rate: 0,
    youtube: '',
    certificate: null,
    auctionOnly: 0, // 0 = สินค้าสำหรับขาย, 1 = สินค้าสำหรับประมูล
  }

  // Reset file states
  productImages.value = []
  certificateFile.value = null
  uploadedProductImage.value = null
  uploadedCertificateFile.value = null
  showImageUpload.value = false
  showCertificateUpload.value = false
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มสินค้าใหม่</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลสินค้าให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Product Type Selection -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-tags text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ประเภทสินค้า</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <!-- ประเภทการขาย -->
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-2 block">ประเภทการขาย *</label>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="productForm.auctionOnly"
                  :value="0"
                  inputId="sale"
                  size="small"
                />
                <label for="sale" class="text-sm text-gray-700">สินค้าสำหรับขาย</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="productForm.auctionOnly"
                  :value="1"
                  inputId="auction"
                  size="small"
                />
                <label for="auction" class="text-sm text-gray-700">สินค้าสำหรับประมูล</label>
              </div>
            </div>
          </div>

          <!-- ประเภทสินค้า -->
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-2 block">ประเภทสินค้า *</label>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="productForm.type"
                  :value="1"
                  inputId="fish"
                  size="small"
                  :disabled="isAuctionProduct"
                />
                <label for="fish" class="text-sm text-gray-700">ปลา</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="productForm.type"
                  :value="0"
                  inputId="other"
                  size="small"
                  :disabled="isAuctionProduct"
                />
                <label for="other" class="text-sm text-gray-700">อื่นๆ</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-info-circle text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลพื้นฐาน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tag mr-1.5 !text-sm"></i>
              ชื่อสินค้า *
            </label>
            <InputText
              v-model="productForm.name"
              placeholder="กรอกชื่อสินค้า"
              fluid
              size="small"
              :invalid="!productForm.name && isSubmitting"
            />
            <small
              v-if="!productForm.name && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              กรุณากรอกชื่อสินค้า
            </small>
          </div>

          <!-- หมวดหมู่สินค้า -->
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-users mr-1.5 !text-sm"></i>
              หมวดหมู่สินค้า
            </label>
            <Select
              v-model="productForm.category"
              :options="[]"
              optionLabel="label"
              optionValue="value"
              fluid
              placeholder="เลือกหมวดหมู่สินค้า"
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-barcode mr-1.5 !text-sm"></i>
              SKU *
            </label>
            <InputText
              v-model="productForm.sku"
              placeholder="กรอก SKU"
              fluid
              size="small"
              :invalid="!productForm.sku && isSubmitting"
            />
            <small
              v-if="!productForm.sku && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              กรุณากรอก SKU
            </small>
          </div>

          <!-- ฟาร์ม - แสดงเฉพาะเมื่อเป็นปลา -->
          <div v-if="isFish">
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-building mr-1.5 !text-sm"></i>
              ฟาร์ม *
            </label>
            <InputText
              v-model="productForm.farm"
              placeholder="กรอกชื่อฟาร์ม"
              fluid
              size="small"
              :invalid="!productForm.farm && isSubmitting"
            />
            <small
              v-if="!productForm.farm && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              กรุณากรอกชื่อฟาร์ม
            </small>
          </div>

          <!-- ขนาด - แสดงเฉพาะเมื่อเป็นปลา -->
          <div v-if="isFish">
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-sort-numeric-up mr-1.5 !text-sm"></i>
              ขนาด (ซม.) *
            </label>
            <InputNumber
              v-model="productForm.size"
              :min="0"
              :max="200"
              fluid
              size="small"
              placeholder="กรอกขนาด"
              :invalid="!productForm.size && isSubmitting"
            />
            <small
              v-if="!productForm.size && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              กรุณากรอกขนาด
            </small>
          </div>

          <!-- เพศ - แสดงเฉพาะเมื่อเป็นปลา -->
          <div v-if="isFish">
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-users mr-1.5 !text-sm"></i>
              เพศ
            </label>
            <Select
              v-model="productForm.gender"
              :options="genderOptions"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
            />
          </div>

          <!-- อายุ - แสดงเฉพาะเมื่อเป็นปลา -->
          <div v-if="isFish">
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-calendar mr-1.5 !text-sm"></i>
              อายุ
            </label>
            <InputText
              v-model="productForm.age"
              placeholder="เช่น 2 ปี"
              fluid
              size="small"
              :invalid="!productForm.age && isSubmitting"
            />
            <small
              v-if="!productForm.age && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              กรุณากรอกอายุ
            </small>
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-money-bill mr-1.5 !text-sm"></i>
              ราคา (บาท) *
            </label>
            <InputNumber
              v-model="productForm.price"
              :min="0"
              :max="999999999"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
              placeholder="ราคาสินค้า"
              :invalid="!productForm.price && isSubmitting"
            />
            <small
              v-if="!productForm.price && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              กรุณากรอกราคา
            </small>
          </div>
        </div>

        <div class="mt-4">
          <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
            <i class="pi pi-file-edit mr-1.5 !text-sm"></i>
            รายละเอียด
          </label>
          <Textarea
            v-model="productForm.detail"
            placeholder="กรอกรายละเอียดสินค้า"
            rows="3"
            fluid
            size="small"
          />
        </div>
      </div>

      <!-- Fish-specific Information for Regular Sale -->
      <div
        v-if="isFish"
        class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      >
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-star text-yellow-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลคุณภาพปลา</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-star mr-1.5 !text-sm"></i>
              คะแนนคุณภาพ
            </label>
            <InputNumber
              v-model="productForm.rate"
              :min="0"
              :max="10"
              :step="0.1"
              fluid
              size="small"
              placeholder="0-10"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 items-stretch gap-4">
        <!-- Product Images Upload -->
        <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-image text-blue-600"></i>
            <h4 class="text-lg font-[500]! text-gray-800">รูปภาพสินค้า</h4>
          </div>

          <!-- Display uploaded images -->
          <div v-if="productImages.length > 0" class="mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div v-for="(image, index) in productImages" :key="index" class="relative group">
                <img
                  :src="image.preview"
                  :alt="`Product image ${index + 1}`"
                  class="w-full h-60 object-contain rounded-lg border border-gray-200"
                />
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  size="small"
                  text
                  rounded
                  class="absolute top-2 right-2 transition-opacity"
                  @click="removeProductImage(index)"
                  v-tooltip.top="'ลบรูปภาพ'"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2.5">
            <FileUpload
              mode="basic"
              name="productImage"
              accept="image/*"
              :maxFileSize="2000000"
              @select="onProductImageSelect"
              :chooseLabel="isUploadingImage ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพ'"
              :disabled="isUploadingImage"
              size="small"
            />
            <p class="text-xs text-gray-500">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 2MB</p>
          </div>
        </div>

        <!-- Certificate Upload (for fish only) -->
        <div v-if="isFish" class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-file text-purple-600"></i>
            <h4 class="text-lg font-[500]! text-gray-800">ใบรับรอง</h4>
          </div>

          <!-- Display uploaded certificate -->
          <div v-if="certificateFile" class="mb-4">
            <div class="relative group">
              <img
                :src="certificateFile.preview"
                alt="Certificate"
                class="w-full h-80 object-contain rounded-lg border border-gray-200"
              />
              <Button
                icon="pi pi-times"
                severity="danger"
                size="small"
                text
                rounded
                class="absolute top-2 right-2 opacity-100 transition-opacity"
                @click="removeCertificate"
                v-tooltip.top="'ลบใบรับรอง'"
              />
            </div>
          </div>

          <div v-else class="space-y-2.5">
            <FileUpload
              mode="basic"
              name="certificate"
              accept="image/*"
              :maxFileSize="2000000"
              @select="onCertificateSelect"
              :chooseLabel="isUploadingCertificate ? 'กำลังอัปโหลด...' : 'เลือกใบรับรอง'"
              :disabled="isUploadingCertificate"
              size="small"
            />
            <p class="text-xs text-gray-500">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 2MB</p>
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-link text-gray-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลเพิ่มเติม</h4>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-youtube mr-1.5 !text-sm"></i>
              ลิงก์ YouTube
            </label>
            <InputText
              v-model="productForm.youtube"
              placeholder="https://youtube.com/watch?v=..."
              fluid
              size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
        <Button
          label="เพิ่มสินค้า"
          icon="pi pi-check"
          @click="handleSubmit"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
