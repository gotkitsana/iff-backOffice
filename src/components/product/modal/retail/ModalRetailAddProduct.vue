<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog } from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { type ICategory } from '@/stores/product/category'
import dayjs from 'dayjs'

// Import components
import DynamicRetailFormField from '@/components/product/category/food-retail/DynamicRetailFormField.vue'
import ModalFooter from '@/components/product/add_product/ModalFooter.vue'
import { useSalePercentStore, type ISalePercent } from '@/stores/product/sale_percent'
import {
  useFoodSaleStore,
  type ICreateFoodSalePayload,
  type IFieldsKeyRetail,
  type IFieldsRetailUI,
} from '@/stores/product/food_sale'
import { useProductStore, type IProduct, type IUpdateProductPayload } from '@/stores/product/product'

// Props
const props = defineProps<{
  visible: boolean
  fieldsRetailUI: IFieldsRetailUI
  selectedCategory: ICategory | null
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// Stores
const selectedCategory = computed<ICategory | null>(() => props.selectedCategory)

const isSubmitting = ref(false)
const productForm = ref<ICreateFoodSalePayload>({
  product: '',
  priceKilo: 0,
  costPriceKilo: 0,
  customerPriceKilo: 0,
  dealerPriceKilo: 0,
  kilo: 0,
  name: '',
})

const dynamicFormData = ref<Record<IFieldsKeyRetail, string | number | Date | null> | null>(null)

const initializeDynamicForm = (newFieldsRetailUI: IFieldsRetailUI) => {
  if (!newFieldsRetailUI) return
  dynamicFormData.value = newFieldsRetailUI.fields.reduce((acc, field) => {
    acc[field.key as IFieldsKeyRetail] = field.type === 'number' ? 0 : ''
    return acc
  }, {} as Record<IFieldsKeyRetail, string | number | Date | null>)
}

watch(
  () => props.fieldsRetailUI,
  (newFieldsRetailUI) => {
    if (newFieldsRetailUI) {
      initializeDynamicForm(newFieldsRetailUI)
    }
  },
  { immediate: true }
)

const updateDynamicField = (key: IFieldsKeyRetail, value: string | number | Date | null) => {
  dynamicFormData.value![key] = value
}

const mapDynamicFormToProductForm = () => {
  if (!props.fieldsRetailUI) return

  props.fieldsRetailUI.fields.forEach((field: { key: IFieldsKeyRetail; type: string }) => {
    const value = dynamicFormData.value![field.key]

    switch (field.key) {
      case 'product':
        productForm.value.product = value as string
        break
      case 'priceKilo':
        productForm.value.priceKilo = value as number
        break
      case 'costPriceKilo':
        productForm.value.costPriceKilo = value as number
        break
      case 'customerPriceKilo':
        productForm.value.customerPriceKilo = value as number
        break
      case 'dealerPriceKilo':
        productForm.value.dealerPriceKilo = value as number
        break
    }
  })
}

const productStore = useProductStore()
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const validateForm = () => {
  // Validate required fields
  for (const field of props.fieldsRetailUI.fields) {
    if (field.required && !dynamicFormData.value![field.key as IFieldsKeyRetail]) {
      toast.error(`กรุณากรอก${field.label}`)
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  isSubmitting.value = true

  if (!validatePricePercent()) {
    isSubmitting.value = false
    return
  }

  if (!validateForm()) {
    return
  }

  if (!selectedCategory.value) {
    toast.error('กรุณาเลือกหมวดหมู่สินค้า')
    return
  }

  mapDynamicFormToProductForm()

  const product = products?.value?.find((p) => p._id === productForm.value.product)
  if (!product) {
    toast.error('กรุณาเลือกสินค้า')
    return
  }

  if (!product.balance || product.balance <= 0) {
    toast.error('สินค้านี้มีคงเหลือไม่เพียงพอ')
    return
  }

  if (!product.weight) {
    toast.error('กรุณาตั้งค่าน้ำหนักสินค้า')
    return
  }

  const payload: ICreateFoodSalePayload = {
    ...productForm.value,
    product: productForm.value.product,
    priceKilo: productForm.value.priceKilo,
    costPriceKilo: productForm.value.costPriceKilo,
    customerPriceKilo: productForm.value.customerPriceKilo,
    dealerPriceKilo: productForm.value.dealerPriceKilo,
    kilo: product.weight,
    name: `${product.name}-${dayjs().unix()}`,
  }

  createFoodSale(payload)
}

const queryClient = useQueryClient()
const foodSaleStore = useFoodSaleStore()
const { mutate: createFoodSale, isPending: isCreatingFoodSale } = useMutation({
  mutationFn: (payload: ICreateFoodSalePayload) => foodSaleStore.onCreateFoodSale(payload),
  onSuccess: (data: any, variables: ICreateFoodSalePayload) => {
    console.log(data, variables)
    if (data.data) {
      toast.success('เพิ่มอาหารแบ่งขายเรียบร้อย')
      queryClient.invalidateQueries({ queryKey: ['get_food_sales'] })
      if(variables.product) {
        const findProduct = products?.value?.find((p) => p._id === variables.product)
        if(findProduct && findProduct.balance && findProduct.balance > 0) {
          updateProduct({
            ...findProduct,
            _id: findProduct._id,
            fishpond: findProduct.fishpond?._id,
            species: findProduct.species?._id,
            farm: findProduct.farm?._id,
            quality: findProduct.quality?._id,
            lotNumber: findProduct.lotNumber?._id,
            seedSize: findProduct.seedSize?._id,
            foodtype: findProduct.foodtype?._id,
            brand: findProduct.brand?._id,
            fishStatus: findProduct.fishStatus?._id,
            balance: findProduct.balance - 1,
          })
        }
      }
    } else {
      toast.error(data.error.message || 'เพิ่มอาหารแบ่งขายไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
  onError: (error: any) => {
    console.log(error)
    toast.error(error.response?.data?.message || 'เพิ่มอาหารแบ่งขายไม่สำเร็จ')
    isSubmitting.value = false
  },
})

const selectedCategoryById = computed(() => props.selectedCategory?._id)
const { mutate: updateProduct, isPending: isUpdatingProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
  onSuccess: (data: any) => {
    if (data.data.modifiedCount > 0) {
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
  resetForm()
  isSubmitting.value = false
  emit('update:visible', false)
}

const resetForm = () => {
  productForm.value = {
    product: '',
    priceKilo: 0,
    costPriceKilo: 0,
    customerPriceKilo: 0,
    dealerPriceKilo: 0,
    kilo: 0,
    name: '',
  }

  dynamicFormData.value = null
}

const salePercentStore = useSalePercentStore()
const { data: salePercents } = useQuery<ISalePercent[]>({
  queryKey: ['get_sale_percents'],
  queryFn: () => salePercentStore.onGetSalePercents(),
})

const validatePricePercent = (): boolean => {
  const hasCustomerKiloPercent = salePercents.value?.some(
    (sp) =>
      sp.name === 'customerPriceKilo' &&
      sp.category._id === selectedCategory.value?._id &&
      sp.active
  )

  const hasDealerKiloPercent = salePercents.value?.some(
    (sp) =>
      sp.name === 'dealerPriceKilo' && sp.category._id === selectedCategory.value?._id && sp.active
  )

  if (!hasCustomerKiloPercent || !hasDealerKiloPercent) {
    toast.error('กรุณาตั้งค่าเปอร์เซ็นต์กำไรก่อนเพิ่มสินค้า')
    return false
  }

  return true
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
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มสินค้าอาหารแบ่งขาย</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลอาหารแบ่งขาย</p>
        </div>
      </div>
    </template>

    <DynamicRetailFormField
      v-if="fieldsRetailUI && dynamicFormData"
      :fields="fieldsRetailUI.fields"
      :form-data="dynamicFormData"
      :is-submitting="isSubmitting"
      @update-field="updateDynamicField"
      :category-id="props.selectedCategory"
    />

    <template #footer>
      <ModalFooter
        :is-submitting="isCreatingFoodSale || isUpdatingProduct"
        @close="handleClose"
        @submit="handleSubmit"
      />
    </template>
  </Dialog>
</template>
