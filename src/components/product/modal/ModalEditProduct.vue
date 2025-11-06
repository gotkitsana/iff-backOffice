<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button } from 'primevue'
import {
  useProductStore,
  type IUpdateProductPayload,
  type IProduct,
  type ICategoryOption,
  type IFieldsKey,
  type IProductImage,
} from '@/stores/product/product'
import { toast } from 'vue3-toastify'
import type { ICategory } from '@/stores/product/category'
import DynamicFormField from '@/components/product/add_product/DynamicFormField.vue'
import FileUploadSection from '@/components/product/add_product/FileUploadSection.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import dayjs from 'dayjs'
import { useSpeciesStore, type ISpecies } from '@/stores/product/species'
import { usePondStore } from '@/stores/product/pond'
import { useFoodBrandStore, type IFoodBrand } from '@/stores/product/food_brand'

// Props
const props = defineProps<{
  visible: boolean
  productData: IProduct | null
  categoryOptionsUI: ICategoryOption[]
  selectedCategory: ICategory | null
}>()

// Emits
const emit = defineEmits<{
  'close-edit-modal': []
}>()

const selectedCategoryId = computed(() => props.selectedCategory)
const selectedCategoryInfo = computed(() => {
  return props.categoryOptionsUI.find((cat) => cat._id === selectedCategoryId.value?._id)
})

// Form data
const productForm = ref<IUpdateProductPayload>({
  _id: '',
  type: 1, // เริ่มต้นเป็นสินค้าอื่นๆ
  name: '',
  lotNumber: '',
  code: '',
  price: 0,
  species: undefined,
  detail: '',
  category: {
    _id: '',
    name: '',
  },
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
    type: '',
    produceDate: 0,
    expireDate: 0,
    marketPrice: 0,
    costPrice: 0,
    customerPrice: 0,
    dealerPrice: 0,
  },
  cat: 0,
  uat: 0,

  brand: undefined,
  foodtype: undefined,
  seedSize: undefined,
  fishStatus: undefined,
})

const dynamicFormData = ref<Record<IFieldsKey, string | number | Date | null> | null>(null)

// Watch for props changes to populate form
watch(
  () => props.productData,
  (newProductData) => {
    if (newProductData) {
      initializeDynamicForm(newProductData)
    }
  },
  { immediate: true }
)

watch(
  () => selectedCategoryId.value?.value,
  (val) => {
    if (val !== 'fish') {
      productForm.value.certificate = ''
    }
  }
)

const pondStore = usePondStore()
const { data: pondsData } = useQuery<any[]>({
  queryKey: ['get_ponds'],
  queryFn: () => pondStore.onGetPonds(),
})
const initializeDynamicForm = (newProductData: IProduct) => {
  if (!selectedCategoryInfo.value || !newProductData) return

  productForm.value.images = []
  productForm.value.certificate = ''

  const formData: Record<string, any> = {}
  selectedCategoryInfo.value.fields.forEach((field) => {
    const fieldValue = newProductData[field.key as keyof IProduct]
    if (field.key === 'produceDate' && newProductData.food) {
      formData[field.key] = dayjs(newProductData.food.produceDate).toDate() || ''
    } else if (field.key === 'expireDate' && newProductData.food) {
      formData[field.key] = dayjs(newProductData.food.expireDate).toDate() || ''
    } else if (field.key === 'marketPrice' && newProductData.food) {
      formData[field.key] = newProductData.food.marketPrice || 0
    } else if (field.key === 'costPrice' && newProductData.food) {
      formData[field.key] = newProductData.food.costPrice || 0
    } else if (field.key === 'customerPrice' && newProductData.food) {
      formData[field.key] = newProductData.food.customerPrice || 0
    } else if (field.key === 'dealerPrice' && newProductData.food) {
      formData[field.key] = newProductData.food.dealerPrice || 0
    } else if (field.key === 'species' && newProductData.species) {
      formData[field.key] = newProductData.species._id || undefined
    } else if (field.key === 'fishpond' && newProductData.fishpond) {
      formData[field.key] = newProductData.fishpond._id || undefined
    } else if (field.key === 'birth' && newProductData.birth) {
      formData[field.key] = dayjs(newProductData.birth).toDate() || ''
    } else if (field.key === 'farm' && newProductData.farm) {
      formData[field.key] = newProductData.farm._id || undefined
    } else if (field.key === 'quality' && newProductData.quality) {
      formData[field.key] = newProductData.quality._id || undefined
    } else if (field.key === 'lotNumber' && newProductData.lotNumber) {
      formData[field.key] = newProductData.lotNumber._id || undefined
    } else if (field.key === 'foodtype' && newProductData.food) {
      formData[field.key] = newProductData.foodtype?._id || ''
    } else if (field.key === 'seedSize' && newProductData.seedSize) {
      formData[field.key] = newProductData.seedSize?._id || ''
    } else if (field.key === 'brand' && newProductData.brand) {
      formData[field.key] = newProductData.brand?._id || ''
    } else if (field.key === 'fishStatus' && newProductData.fishStatus) {
      formData[field.key] = newProductData.fishStatus?._id || ''
    } else {
      formData[field.key] = fieldValue || (field.type === 'number' ? 0 : '')
    }
  })

  const currentPondId = newProductData.fishpond?._id
  if (currentPondId && pondsData.value) {
    const pond = pondsData.value.find((pond) => pond._id === currentPondId)
    if (pond?.greenhouse?._id && 'greenhouse' in formData) {
      formData['greenhouse'] = pond.greenhouse?._id
    }
  }

  dynamicFormData.value = formData

  productForm.value = {
    ...newProductData,
    _id: newProductData._id,
    category: newProductData.category,
    food: newProductData.food || null,
    fishpond: newProductData.fishpond?._id,
    species: newProductData.species?._id,
    farm: newProductData.farm?._id,
    quality: newProductData.quality?._id,
    lotNumber: newProductData.lotNumber?._id,
    foodtype: newProductData.foodtype?._id,
    seedSize: newProductData.seedSize?._id,
    brand: newProductData.brand?._id,
    fishStatus: newProductData.fishStatus?._id,
  }

  productForm.value.images = newProductData.images
  productForm.value.certificate = newProductData.certificate || undefined
  productForm.value.youtube = newProductData.youtube || ''
}

// Validation
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

const editableFields = computed(() => {
  if (!selectedCategoryInfo.value) return []
  return selectedCategoryInfo.value.fields.filter((field) => field.key !== 'category')
})
const mapDynamicFormToProductForm = () => {
  if (!editableFields.value) return

  editableFields.value.forEach((field) => {
    const value = dynamicFormData.value![field.key]

    switch (field.key) {
      case 'sold':
        productForm.value.sold = !!value as boolean
        break
      case 'name':
        productForm.value.name = value as string
        break
      case 'brand':
        productForm.value.brand = value as string
        break
      case 'lotNumber':
        productForm.value.lotNumber = value as string
        break
      case 'code':
        productForm.value.code = value as string
        break
      case 'price':
        productForm.value.price = value as number
        break
      case 'detail':
        productForm.value.detail = value as string
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
        productForm.value.food!.produceDate = dayjs(value as Date).valueOf()
        break
      case 'expireDate':
        productForm.value.food!.expireDate = dayjs(value as Date).valueOf()
        break
      case 'marketPrice':
        productForm.value.food!.marketPrice = value as number
        break
      case 'costPrice':
        productForm.value.food!.costPrice = value as number
        break
      case 'customerPrice':
        productForm.value.food!.customerPrice = value as number
        break
      case 'dealerPrice':
        productForm.value.food!.dealerPrice = value as number
        break
      case 'foodtype':
        productForm.value.foodtype = value as string
        break
      case 'species':
        productForm.value.species = value as string
        break
      case 'fishStatus':
        productForm.value.fishStatus = value as string || undefined
        break
    }
  })
}

const speciesStore = useSpeciesStore()
const { data: speciesData } = useQuery<ISpecies[]>({
  queryKey: ['get_species'],
  queryFn: () => speciesStore.onGetSpecies(),
})
const foodBrandStore = useFoodBrandStore()
const { data: brandData } = useQuery<IFoodBrand[]>({
  queryKey: ['get_food_brands'],
  queryFn: () => foodBrandStore.onGetFoodBrands(),
})
const isSubmitting = ref(false)
const handleSubmit = async () => {
  isSubmitting.value = true
  if (!props.productData) {
    toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า')
    return
  }

  if (!validateForm()) {
    isSubmitting.value = false
    return
  }

  mapDynamicFormToProductForm()

  const payload: IUpdateProductPayload = {
    ...productForm.value,
    _id: props.productData._id,
    type: props.productData.type,
    category: props.productData.category,
    images: productForm.value.images.map((img) => ({
      filename: img.filename,
      type: img.type,
    })),
    certificate: isFishCategory.value ? productForm.value.certificate : '',
    youtube: productForm.value.youtube,
    price:
      selectedCategoryId.value?.value == 'fish'
        ? productForm.value.price
        : selectedCategoryId.value?.value === 'food'
        ? productForm.value.food?.customerPrice || 0
        : selectedCategoryId.value?.value === 'microorganism'
        ? productForm.value.food?.customerPrice || 0
        : 0,
    name:
      selectedCategoryId.value?.value !== 'fish'
        ? brandData.value?.find((brand) => brand._id === productForm.value.brand)?.name || ''
        : speciesData.value?.find((specie) => specie._id === productForm.value.species)?.name || ''

  }

  updateProduct(payload)
}

const queryClient = useQueryClient()
const productStore = useProductStore()
const selectedCategoryById = computed(() => props.productData?.category?._id)
const { mutate: updateProduct, isPending: isUpdatingProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
  onSuccess: (data: any) => {
    if (data.data.modifiedCount > 0) {
      toast.success('อัปเดตสินค้าสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_products'] })
      queryClient.invalidateQueries({
        queryKey: ['get_products_by_category', selectedCategoryById],
      })
      handleClose()
      isSubmitting.value = false
    } else {
      toast.error(data.error?.message || 'อัปเดตสินค้าไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
  onError: (error: any) => {
    console.error('Update error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตสินค้าไม่สำเร็จ')
    isSubmitting.value = false
  },
})

const handleClose = () => {
  isSubmitting.value = false
  productForm.value.images = []
  productForm.value.certificate = ''
  emit('close-edit-modal')
}

const updateDynamicField = (key: IFieldsKey, value: string | number | Date | null) => {
  dynamicFormData.value![key] = value
}

const isFishCategory = computed(() => selectedCategoryId.value?.value === 'fish')

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

const updateCertificateFile = (file: string | undefined) => {
  productForm.value.certificate = file
}

const handleUpdateVideoFile = (filename: string | undefined) => {
  productForm.value.youtube = filename || ''
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '65rem' }"
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
          <i class="pi pi-pencil text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">แก้ไขข้อมูลสินค้า</h3>
        </div>
      </div>
    </template>

    <div v-if="selectedCategoryInfo" class="space-y-4">
      <!-- Dynamic Form Fields -->
      <DynamicFormField
        v-if="dynamicFormData"
        :category-id="selectedCategory"
        :fields="editableFields"
        :form-data="dynamicFormData"
        :is-submitting="isSubmitting"
        :pond-options="filteredPondOptions"
        @update-field="updateDynamicField"
      />

      <!-- File Upload Section -->
      <FileUploadSection
        :show-video="isFishCategory"
        :show-certificate="isFishCategory"
        :product-images="productForm.images"
        :certificate-file="productForm.certificate"
        :video-file="productForm.youtube"
        @update-product-images="updateProductImages"
        @update-certificate-file="updateCertificateFile"
        @update-video-file="handleUpdateVideoFile"
        :is-edit="true"
      />
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
          label="ยืนยัน"
          icon="pi pi-check"
          @click="handleSubmit"
          severity="success"
          size="small"
          :loading="isUpdatingProduct"
        />
      </div>
    </template>
  </Dialog>
</template>
