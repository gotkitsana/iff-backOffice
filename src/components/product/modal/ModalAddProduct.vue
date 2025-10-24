<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button } from 'primevue'
import {
  useProductStore,
  type ICategoryOption,
  type ICertificateFile,
  type ICreateProductPayload,
  type IFieldsKey,
  type IProductImage,
  type IUploadImageResponse,
} from '@/stores/product/product'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { useSalesStore } from '@/stores/sales/sales'

// Import components
import CategorySelectionStep from '@/components/product/add_product/CategorySelectionStep.vue'
import DynamicFormField from '@/components/product/add_product/DynamicFormField.vue'
import FileUploadSection from '@/components/product/add_product/FileUploadSection.vue'
import ModalHeader from '@/components/product/add_product/ModalHeader.vue'
import ModalFooter from '@/components/product/add_product/ModalFooter.vue'

// Props
defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// Stores
const productStore = useProductStore()
const categoryStore = useCategoryStore()
const salesStore = useSalesStore()

// State
const currentStep = ref(1) // 1 = เลือกหมวดหมู่, 2 = กรอกข้อมูล
const selectedCategory = ref<ICategory | null>(null)
const isSubmitting = ref(false)

// Form data
const productForm = ref<ICreateProductPayload>({
  type: 1, // เริ่มต้นเป็นสินค้าอื่นๆ
  name: '',
  lotNumber: '',
  price: null,
  detail: '',
  category: '',
  sold: false,
  youtube: '',
  images: [],
  certificate: '',
  auctionOnly: 0,

  // ปลา fields
  sku: '',
  size: 0,
  farm: '',
  birth: '',
  age: '',
  gender: '',
  weight: 0,
  breeders: '',
  quality: '',
  pond: '',
  rate: 0,

  // สินค้าอื่น fields
  seedType: '',
  seedSize: '',
  balance: 0,
})

const dynamicFormData = ref<Record<IFieldsKey, string | number | Date | null> | null>(null)
const productImages = ref<IProductImage[]>([])
const certificateFile = ref<ICertificateFile | null>(null)

// Queries
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

const isFishCategory = computed(() => selectedCategory.value?.value === 'fish')

// เพิ่ม computed สำหรับ type
const productType = computed(() => {
  if (selectedCategory.value?.value === 'fish') {
    return 0 // ปลา (species)
  }
  return 1 // สินค้าอื่นๆ (product)
})

// อัปเดต productForm เมื่อเปลี่ยน category
watch(selectedCategory, (newCategory) => {
  if (newCategory) {
    productForm.value.type = productType.value
    productForm.value.category = newCategory._id
  }
})

// Computed
const selectedCategoryInfo = computed(() => {
  return categoryOptionsUI.value.find((cat) => cat._id === selectedCategory.value?._id)
})

const categoryOptionsUI = computed(() => {
  if (!categories.value) return []
  const fieldsData = [
    {
      value: 'fish',
      fields: [
        { key: 'lotNumber', label: 'เลขล็อต', type: 'text', required: true },
        { key: 'pond', label: 'บ่อ', type: 'text', required: true },
        { key: 'sku', label: 'รหัสปลา', type: 'text', required: true },
        { key: 'name', label: 'สายพันธุ์', type: 'select', required: true },
        { key: 'breeders', label: 'แม่พันธุ์', type: 'text', required: true },
        { key: 'birth', label: 'วันเกิด', type: 'date', required: true },
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
      fields: [
        { key: 'lotNumber', label: 'เลขล็อต', type: 'text', required: true },
        { key: 'name', label: 'ชื่อผลิตภัณฑ์', type: 'text', required: true },
        { key: 'seedType', label: 'ชนิดเม็ด', type: 'select', required: true },
        { key: 'weight', label: 'น้ำหนัก ต่อกระสอบ (กก.)', type: 'number', required: true },
        { key: 'seedSize', label: 'ขนาดเม็ด', type: 'select', required: true },
        { key: 'balance', label: 'คงเหลือ', type: 'number', required: true },
        { key: 'price', label: 'ราคา', type: 'number', required: true },
      ],
    },
  ]

  const categoryFields = categories.value?.map((category) => ({
    ...category,
    fields: fieldsData.find((field) => field.value === category.value)?.fields || [],
  }))

  return categoryFields as ICategoryOption[]
})

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
const selectCategory = (category: ICategory) => {
  selectedCategory.value = category
  productForm.value.category = category._id
  currentStep.value = 2
  initializeDynamicForm()
}

const initializeDynamicForm = () => {
  if (!selectedCategoryInfo.value) return
  const formData: Record<string, any> = {}
  selectedCategoryInfo.value.fields.forEach((field) => {
    formData[field.key] = field.type === 'number' ? 0 : ''
  })
  dynamicFormData.value = formData
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
      case 'name':
        productForm.value.name = value as string
        break
      case 'lotNumber':
        productForm.value.lotNumber = value as string
        break
      case 'price':
        productForm.value.price = value as number
        break
      case 'weight':
        productForm.value.weight = value as number
        break
      case 'sku':
        productForm.value.sku = value as string
        break
      case 'size':
        productForm.value.size = value as number
        break
      case 'farm':
        productForm.value.farm = value as string
        break
      case 'birth':
        productForm.value.birth = value as string
        break
      case 'age':
        productForm.value.age = value as string
        break
      case 'gender':
        productForm.value.gender = value as string
        break
      case 'breeders':
        productForm.value.breeders = value as string
        break
      case 'quality':
        productForm.value.quality = value as string
        break
      case 'pond':
        productForm.value.pond = value as string
        break
      case 'rate':
        productForm.value.rate = value as number
        break
      case 'seedType':
        productForm.value.seedType = value as string
        break
      case 'seedSize':
        productForm.value.seedSize = value as string
        break
      case 'balance':
        productForm.value.balance = value as number
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
    ...productForm.value,
    type: productType.value,
    category: selectedCategory.value?._id || '',
  }

  console.log(payload)
  toast.success('เพิ่มสินค้าสำเร็จ')
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
    type: 1, // เริ่มต้นเป็นสินค้าอื่นๆ
    name: '',
    lotNumber: '',
    price: null,
    detail: '',
    category: '',
    sold: false,
    youtube: '',
    images: [],
    certificate: '',
    auctionOnly: 0,

    // ปลา fields
    sku: '',
    size: 0,
    farm: '',
    birth: '',
    age: '',
    gender: '',
    weight: 0,
    breeders: '',
    quality: '',
    pond: '',
    rate: 0,

    // สินค้าอื่น fields
    seedType: '',
    seedSize: '',
    balance: 0,
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
  productForm.value.certificate = ''
}

// const { data: species } = useQuery<ISpecies[]>({
//   queryKey: ['get_species'],
//   queryFn: () => productStore.onGetSpecies(),
// })
const speciesOptions = computed(() => {
  return []
})
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
          :species-options="speciesOptions"
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
