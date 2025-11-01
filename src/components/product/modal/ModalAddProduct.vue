<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog } from 'primevue'
import {
  useProductStore,
  type ICategoryOption,
  type ICreateProductPayload,
  type IFieldsKey,
  type IProductImage,
} from '@/stores/product/product'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { type ICategory } from '@/stores/product/category'

// Import components
import DynamicFormField from '@/components/product/add_product/DynamicFormField.vue'
import FileUploadSection from '@/components/product/add_product/FileUploadSection.vue'
import ModalHeader from '@/components/product/add_product/ModalHeader.vue'
import ModalFooter from '@/components/product/add_product/ModalFooter.vue'
import dayjs from 'dayjs'
import { useSpeciesStore, type ISpecies } from '@/stores/product/species'
import { usePondStore } from '@/stores/product/pond'
import { useFoodBrandStore, type IFoodBrand } from '@/stores/product/food_brand'

// Props
const props = defineProps<{
  visible: boolean
  categoryOptionsUI: ICategoryOption[]
  selectedCategory: ICategory | null
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// Stores
const productStore = useProductStore()
const speciesStore = useSpeciesStore()
const pondStore = usePondStore()

const selectedCategory = computed<ICategory | null>(() => props.selectedCategory)

// State
const isSubmitting = ref(false)

// Form data
const productForm = ref<ICreateProductPayload>({
  type: 1, // เริ่มต้นเป็นสินค้าอื่นๆ
  name: '',
  code: '',
  lotNumber: '',
  price: 0,
  detail: '',
  category: '',
  sold: false,
  youtube: '',
  images: [],
  certificate: '',
  auctionOnly: 0,

  // ปลา fields
  sku: '',
  size: undefined,
  farm: undefined,
  birth: '',
  age: '',
  gender: '',
  weight: 0,
  breeders: '',
  quality: undefined,
  fishpond: undefined,
  rate: 0,
  species: undefined,

  // สินค้าอื่น fields
  seedType: '',
  balance: 0,

  food: {
    produceDate: 0,
    expireDate: 0,
    marketPrice: 0,
    costPrice: 0,
    customerPrice: 0,
    dealerPrice: 0,
  },

  brand: undefined,
  foodtype: undefined,
  seedSize: undefined,
})

const dynamicFormData = ref<Record<IFieldsKey, string | number | Date | null> | null>(null)

// Queries
const isFishCategory = computed(() => selectedCategory.value?.value === 'fish')

// เพิ่ม computed สำหรับ type
const productType = computed(() => {
  if (selectedCategory.value?.value === 'fish') {
    return 0 // ปลา (species)
  }
  return 1 // สินค้าอื่นๆ (product)
})

watch(selectedCategory, (newCategory) => {
  if (newCategory) {
    // รีเซ็ตทุกอย่างทุกครั้งที่เปลี่ยนหมวดหมู่
    productForm.value.images = []
    productForm.value.certificate = ''

    // อัปเดตข้อมูลหมวดหมู่
    productForm.value.type = productType.value
    productForm.value.category = newCategory._id
  }
})

// Computed
const selectedCategoryInfo = computed(() => {
  return props.categoryOptionsUI.find((cat) => cat._id === props.selectedCategory?._id)
})

// Methods
watch(
  () => [props.selectedCategory, props.visible],
  (category) => {
    if (category && props.visible) {
      initializeDynamicForm()
    }
  },
  { immediate: true }
)

const initializeDynamicForm = () => {
  if (!selectedCategoryInfo.value) return
  const formData: Record<string, any> = {}
  selectedCategoryInfo.value.fields.forEach((field) => {
    formData[field.key] = field.type === 'number' ? 0 : ''
  })
  dynamicFormData.value = formData
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
      case 'fishpond':
        productForm.value.fishpond = value as string
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
      case 'produceDate':
        productForm.value.food.produceDate = dayjs(value as Date).valueOf() || 0
        break
      case 'expireDate':
        productForm.value.food.expireDate = dayjs(value as Date).valueOf() || 0
        break
      case 'marketPrice':
        productForm.value.food.marketPrice = value as number
        break
      case 'costPrice':
        productForm.value.food.costPrice = value as number
        break
      case 'customerPrice':
        productForm.value.food.customerPrice = value as number
        break
      case 'dealerPrice':
        productForm.value.food.dealerPrice = value as number
        break
      case 'foodtype':
        productForm.value.foodtype = value as string
        break
      case 'brand':
        productForm.value.brand = value as string
        break
      case 'species':
        productForm.value.species = value as string
        break
      case 'price':
        productForm.value.price = value as number
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

const { data: speciesData } = useQuery<ISpecies[]>({
  queryKey: ['get_species'],
  queryFn: () => speciesStore.onGetSpecies(),
})

const foodBrandStore = useFoodBrandStore()
const { data: brandData } = useQuery<IFoodBrand[]>({
  queryKey: ['get_food_brands'],
  queryFn: () => foodBrandStore.onGetFoodBrands(),
})
const handleSubmit = async () => {
  isSubmitting.value = true
  if (!validateForm()) {
    return
  }

  if (!selectedCategory.value) {
    toast.error('กรุณาเลือกหมวดหมู่สินค้า')
    return
  }

  mapDynamicFormToProductForm()

  const payload: ICreateProductPayload = {
    ...productForm.value,
    type: productType.value,
    category: selectedCategory.value._id,
    name:
      selectedCategory.value.value !== 'fish'
        ? `${brandData.value?.find((brand) => brand._id === productForm.value.brand)?.name} รหัส ${
            productForm.value.sku
          }`
        : `${
            speciesData.value?.find((specie) => specie._id === productForm.value.species)?.name
          } รหัส ${productForm.value.sku}`,
    price:
      selectedCategory.value.value == 'fish'
        ? productForm.value.price
        : selectedCategory.value.value === 'food'
        ? productForm.value.food.customerPrice
        : 0,
  }

  createProduct(payload)
}

const selectedCategoryId = computed(() => selectedCategory.value?._id)
const queryClient = useQueryClient()
const { mutate: createProduct, isPending: isCreatingProduct } = useMutation({
  mutationFn: (payload: ICreateProductPayload) => productStore.onCreateProduct(payload),
  onSuccess: (data: any) => {
    if (data.data) {
      toast.success('เพิ่มสินค้าสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_products'] })
      queryClient.invalidateQueries({ queryKey: ['get_products_by_category', selectedCategoryId] })
      handleClose()
    } else {
      toast.error(data.error.message || 'เพิ่มสินค้าไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
  onError: (error: any) => {
    console.log(error)
    toast.error(error.response?.data?.message || 'เพิ่มสินค้าไม่สำเร็จ')
    isSubmitting.value = false
  },
})

const handleClose = () => {
  resetForm()
  isSubmitting.value = false
  emit('update:visible', false)
}

const resetForm = () => {
  productForm.value = {
    type: 1, // เริ่มต้นเป็นสินค้าอื่นๆ
    name: '',
    code: '',
    lotNumber: '',
    price: 0,
    detail: '',
    category: '',
    sold: false,
    youtube: '',
    images: [],
    certificate: '',
    auctionOnly: 0,

    // ปลา fields
    sku: '',
    size: undefined,
    farm: undefined,
    birth: '',
    age: '',
    gender: '',
    weight: 0,
    breeders: '',
    quality: undefined,
    fishpond: undefined,
    rate: 0,

    // สินค้าอื่น fields
    seedType: '',

    balance: 0,
    food: {
      produceDate: 0,
      expireDate: 0,
      marketPrice: 0,
      costPrice: 0,
      customerPrice: 0,
      dealerPrice: 0,
    },
    species: undefined,
    brand: undefined,
    foodtype: undefined,
    seedSize: undefined,
  }

  dynamicFormData.value = null
}

watch(
  () => dynamicFormData.value?.greenhouse,
  () => {
    if (dynamicFormData.value) {
      dynamicFormData.value.fishpond = ''
    }
  }
)

const { data: pondsData } = useQuery<any[]>({
  queryKey: ['get_ponds'],
  queryFn: () => pondStore.onGetPonds(),
})
const filteredPondOptions = computed(() => {
  const ghId = dynamicFormData.value?.greenhouse || ''
  if (!pondsData.value) return []
  if (!ghId) return []

  return pondsData.value
    .filter((pond) => pond.greenhouse?._id === ghId)
    .map((pond) => ({
      label: pond.code,
      value: pond._id,
    }))
})

const updateProductImages = (images: IProductImage[]) => {
  productForm.value.images = images
}

const updateCertificateFile = (filename: string | undefined) => {
  productForm.value.certificate = filename
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '70rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <ModalHeader :selected-category="selectedCategory" />
    </template>

    <div class="space-y-4">
      <!-- Step 2: Dynamic Form -->
      <div v-if="selectedCategoryInfo" class="space-y-4">
        <!-- Dynamic Form Fields -->
        <DynamicFormField
          v-if="dynamicFormData"
          :fields="selectedCategoryInfo.fields"
          :form-data="dynamicFormData"
          :is-submitting="isSubmitting"
          :pond-options="filteredPondOptions"
          @update-field="updateDynamicField"
        />

        <!-- File Upload Section -->
        <FileUploadSection
          :show-certificate="isFishCategory"
          :product-images="productForm.images || []"
          :certificate-file="productForm.certificate"
          @update-product-images="updateProductImages"
          @update-certificate-file="updateCertificateFile"
        />
      </div>
    </div>

    <template #footer>
      <ModalFooter :is-submitting="isCreatingProduct" @close="handleClose" @submit="handleSubmit" />
    </template>
  </Dialog>
</template>
