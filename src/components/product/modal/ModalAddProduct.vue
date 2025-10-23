<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, Button } from 'primevue'
import {
  useProductStore,
  type ICategoryOption,
  type ICertificateFile,
  type ICreateProductPayload,
  type IFieldsKey,
  type IProductImage,
  type IUploadImageResponse,
} from '../../../stores/product/product'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '../../../stores/auction/category'
import { useSalesStore } from '../../../stores/sales/sales'

// Import components
import CategorySelectionStep from '../add_product/CategorySelectionStep.vue'
import DynamicFormField from '../add_product/DynamicFormField.vue'
import FileUploadSection from '../add_product/FileUploadSection.vue'
import ModalHeader from '../add_product/ModalHeader.vue'
import ModalFooter from '../add_product/ModalFooter.vue'

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
const categoryStore = useCategoryStore()
const salesStore = useSalesStore()

// State
const currentStep = ref(1) // 1 = เลือกหมวดหมู่, 2 = กรอกข้อมูล
const selectedCategory = ref<string | null>(null)
const isSubmitting = ref(false)

// Form data
const productForm = ref<
  ICreateProductPayload & {
    lotNumber: string
    pond: string
    fishId: string
    species: string
    breed: string
    birthDate: Date
    age: string
    quality: number
    farm: string
    size: number
    weight: number
    gender: number
    price: number
  }
>({
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
  lotNumber: '',
  pond: '',
  fishId: '',
  species: '',
  breed: '',
  birthDate: new Date(),
  quality: 0,
  weight: 0,
})

const dynamicFormData = ref<Record<IFieldsKey, string | number | Date | null> | null>(null)
const productImages = ref<IProductImage[]>([])
const certificateFile = ref<ICertificateFile | null>(null)

// Queries
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(),
})

// Computed
const selectedCategoryInfo = computed(() => {
  return categoryOptionsUI.value.find((cat) => cat.value === selectedCategory.value)
})

const isFishCategory = computed(() => selectedCategory.value === 'fish')

const categoryOptionsUI = computed<ICategoryOption[]>(() => [
  {
    value: 'fish',
    label: 'ปลา',
    icon: 'pi pi-star',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    fields: [
      { key: 'lotNumber', label: 'เลขล็อต', type: 'text', required: true },
      { key: 'pond', label: 'บ่อ', type: 'text', required: true },
      { key: 'fishId', label: 'รหัสปลา', type: 'text', required: true },
      { key: 'species', label: 'สายพันธุ์', type: 'text', required: true },
      { key: 'breed', label: 'แม่พันธุ์', type: 'text', required: true },
      { key: 'birthDate', label: 'วันเกิด', type: 'date', required: true },
      { key: 'age', label: 'อายุ (6 เดือนขึ้นไป)', type: 'text', required: true },
      { key: 'quality', label: 'คุณภาพปลา', type: 'number', required: true },
      { key: 'farm', label: 'ฟาร์ม', type: 'text', required: true },
      { key: 'size', label: 'ไซต์', type: 'number', required: true },
      { key: 'weight', label: 'น้ำหนัก', type: 'number', required: true },
      { key: 'gender', label: 'เพศ', type: 'select', required: true },
      { key: 'price', label: 'ราคา', type: 'number', required: true },
    ],
  },
  {
    value: 'food',
    label: 'อาหาร',
    icon: 'pi pi-heart',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    fields: [
      { key: 'lotNumber', label: 'เลขล็อต', type: 'text', required: true },
      { key: 'productName', label: 'ชื่อผลิตภัณฑ์', type: 'text', required: true },
      { key: 'pelletType', label: 'ชนิดเม็ด', type: 'text', required: true },
      { key: 'weightPerBag', label: 'น้ำหนัก ต่อกระสอบ', type: 'number', required: true },
      { key: 'pelletSize', label: 'ขนาดเม็ด', type: 'text', required: true },
      { key: 'remainingQuantity', label: 'คงเหลือ', type: 'number', required: true },
      { key: 'price', label: 'ราคา', type: 'number', required: true },
    ],
  },
  // {
  //   value: 'microorganism',
  //   label: 'สารปรับสภาพน้ำ',
  //   icon: 'pi pi-sparkles',
  //   color: 'text-purple-600',
  //   bgColor: 'bg-purple-100',
  //   iconColor: 'text-purple-600',
  //   fields: [
  //     { key: 'productName', label: 'ชื่อผลิตภัณฑ์', type: 'text', required: true },
  //     { key: 'volume', label: 'ปริมาณ', type: 'text', required: true },
  //     { key: 'price', label: 'ราคา', type: 'number', required: true },
  //   ],
  // },
  // {
  //   value: 'equipment',
  //   label: 'อุปกรณ์',
  //   icon: 'pi pi-wrench',
  //   color: 'text-orange-600',
  //   bgColor: 'bg-orange-100',
  //   iconColor: 'text-orange-600',
  //   fields: [
  //     { key: 'productName', label: 'ชื่ออุปกรณ์', type: 'text', required: true },
  //     { key: 'model', label: 'รุ่น', type: 'text', required: false },
  //     { key: 'specification', label: 'รายละเอียด', type: 'textarea', required: false },
  //     { key: 'price', label: 'ราคา', type: 'number', required: true },
  //   ],
  // },
  // {
  //   value: 'medicine',
  //   label: 'เวชภัณฑ์',
  //   icon: 'pi pi-plus-circle',
  //   color: 'text-green-600',
  //   bgColor: 'bg-green-100',
  //   iconColor: 'text-green-600',
  //   fields: [
  //     { key: 'productName', label: 'ชื่อยา', type: 'text', required: true },
  //     { key: 'dosage', label: 'ขนาด', type: 'text', required: true },
  //     { key: 'expiryDate', label: 'วันหมดอายุ', type: 'date', required: true },
  //     { key: 'price', label: 'ราคา', type: 'number', required: true },
  //   ],
  // },
])

// File upload mutations
const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
  mutationFn: (file: File) => productStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
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

    toast.success('อัปโหลดรูปภาพสำเร็จ')
  },
  onError: (error: any) => {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'อัปโหลดรูปภาพไม่สำเร็จ')
  },
})

const { mutate: uploadCertificate, isPending: isUploadingCertificate } = useMutation({
  mutationFn: (file: File) => productStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    const filename = data.filename
    const preview = `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${filename}`

    certificateFile.value = {
      filename,
      preview,
    }

    productForm.value.certificate = filename
    toast.success('อัปโหลดใบรับรองสำเร็จ')
  },
  onError: (error: any) => {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'อัปโหลดใบรับรองไม่สำเร็จ')
  },
})

// Methods
const selectCategory = (categoryValue: string) => {
  selectedCategory.value = categoryValue

  // หา _id ของ category ที่เลือกจาก categories API
  const selectedCategoryData = categories.value?.find((cat) => {
    const categoryType = salesStore.categoryTypes.find((c) => c.value === cat.name)
    const uiCategory = categoryOptionsUI.value.find((ui) => ui.value === categoryValue)
    return categoryType?.label === uiCategory?.label
  })

  productForm.value.category = selectedCategoryData?._id || null
  currentStep.value = 2
  initializeDynamicForm()
}

const initializeDynamicForm = () => {
  if (selectedCategoryInfo.value) {
    const formData: Record<string, any> = {}
    selectedCategoryInfo.value.fields.forEach((field) => {
      formData[field.key] = field.type === 'number' ? 0 : ''
    })
    dynamicFormData.value = formData
  }
}

const goBackToCategorySelection = () => {
  currentStep.value = 1
  selectedCategory.value = null
  dynamicFormData.value = {} as Record<IFieldsKey, string | number | Date | null>
}

const updateDynamicField = (key: IFieldsKey, value: string | number | Date | null) => {
  dynamicFormData.value![key] = value
}

const mapDynamicFormToProductForm = () => {
  if (!selectedCategoryInfo.value) return

  selectedCategoryInfo.value.fields.forEach((field) => {
    const value = dynamicFormData.value![field.key]

    switch (field.key) {
      case 'lotNumber':
        productForm.value.lotNumber = value as string
        break
      case 'pond':
        productForm.value.pond = value as string
        break
      case 'fishId':
        productForm.value.fishId = value as string
        break
      case 'species':
        productForm.value.species = value as string
        break
      case 'breed':
        productForm.value.breed = value as string
        break
      case 'birthDate':
        productForm.value.birthDate = value as Date
        break
      case 'age':
        productForm.value.age = value as string
        break
      case 'quality':
        productForm.value.quality = value as number
        break
      case 'weight':
        productForm.value.weight = value as number
        break
      default:
        break
    }
  })
}

const validateForm = () => {
  if (!selectedCategoryInfo.value) {
    toast.error('กรุณาเลือกหมวดหมู่สินค้า')
    return false
  }

  // Validate required fields
  for (const field of selectedCategoryInfo.value.fields) {
    if (field.required && !dynamicFormData.value![field.key]) {
      toast.error(`กรุณากรอก${field.label}`)
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  isSubmitting.value = true
  if (!validateForm()) {
    return
  }

  mapDynamicFormToProductForm()

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

  console.log(payload)
  // try {
  //   await productStore.onCreateProduct(payload)
  //   emit('product-added')
  //   toast.success('เพิ่มสินค้าสำเร็จ')
  //   handleClose()
  // } catch (error) {
  //   toast.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า')
  //   console.error(error)
  // } finally {
  //   isSubmitting.value = false
  // }
}

const handleClose = () => {
  if (isSubmitting.value) return // ป้องกันการปิดขณะกำลัง submit

  resetForm()
  isSubmitting.value = false
  currentStep.value = 1
  selectedCategory.value = null
  emit('update:visible', false)
}

const resetForm = () => {
  productForm.value = {
    images: [] as { filename: string; type: string }[],
    type: 1, // 1 = ปลา, 0 = อื่นๆ
    name: '',
    price: 0,
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
    lotNumber: '',
    pond: '',
    fishId: '',
    species: '',
    breed: '',
    birthDate: new Date(),
    quality: 0,
    weight: 0,
  }

  dynamicFormData.value = null
  productImages.value = []
  certificateFile.value = null
}

const validateFileUpload = (file: File, maxSize: number = 2000000) => {
  if (file.size > maxSize) {
    toast.error('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 2MB)')
    return false
  }

  if (!file.type.startsWith('image/')) {
    toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
    return false
  }

  return true
}

// File upload handlers
const onProductImageSelect = (event: { files: File[] }) => {
  const file = event.files[0]
  if (file && validateFileUpload(file)) {
    uploadImage(file)
  }
}

const onCertificateSelect = (event: { files: File[] }) => {
  const file = event.files[0]
  if (file && validateFileUpload(file)) {
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
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '70rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <ModalHeader :current-step="currentStep" />
    </template>

    <div class="space-y-4">
      <!-- Step 1: Category Selection -->
      <CategorySelectionStep
        :category-options="categoryOptionsUI"
        :selected-category="selectedCategory"
        @select-category="selectCategory"
      />

      <!-- Step 2: Dynamic Form -->
      <div v-if="currentStep === 2 && selectedCategoryInfo" class="space-y-4">
        <!-- Dynamic Form Fields -->
        <DynamicFormField
          v-if="dynamicFormData"
          :fields="selectedCategoryInfo.fields"
          :form-data="dynamicFormData"
          :is-submitting="isSubmitting"
          @update-field="updateDynamicField"
        />

        <!-- File Upload Section -->
        <FileUploadSection
          :product-images="productImages"
          :certificate-file="certificateFile"
          :show-certificate="isFishCategory"
          :is-uploading-image="isUploadingImage"
          :is-uploading-certificate="isUploadingCertificate"
          @product-image-select="onProductImageSelect"
          @certificate-select="onCertificateSelect"
          @remove-product-image="removeProductImage"
          @remove-certificate="removeCertificate"
        />
      </div>
    </div>

    <template #footer>
      <ModalFooter
        :current-step="currentStep"
        :is-submitting="false"
        @go-back="goBackToCategorySelection"
        @close="handleClose"
        @submit="handleSubmit"
      />
    </template>
  </Dialog>
</template>
