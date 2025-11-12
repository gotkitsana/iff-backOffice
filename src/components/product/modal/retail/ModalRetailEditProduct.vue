<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button } from 'primevue'
import { toast } from 'vue3-toastify'
import type { ICategory } from '@/stores/product/category'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  useFoodSaleStore,
  type IFieldsKeyRetail,
  type IFieldsRetail,
  type IFieldsRetailUI,
  type IFoodSale,
  type IUpdateFoodSalePayload,
} from '@/stores/product/food_sale'
import DynamicRetailFormField from '@/components/product/category/food-retail/DynamicRetailFormField.vue'

// Props
const props = defineProps<{
  visible: boolean
  productData: IFoodSale | null
  fieldsRetailUI: IFieldsRetailUI
  selectedCategory: ICategory | null
}>()

// Emits
const emit = defineEmits<{
  'close-edit-modal': []
}>()

const selectedCategoryInfo = computed(() => {
  return props.fieldsRetailUI
})

// Form data
const productForm = ref<IUpdateFoodSalePayload>({
  _id: '',
  priceKilo: 0,
  costPriceKilo: 0,
  customerPriceKilo: 0,
  dealerPriceKilo: 0,
  kilo: 0,
})

const dynamicFormData = ref<Record<IFieldsKeyRetail, string | number | Date | null> | null>(null)
const initializeDynamicForm = (newFoodSaleData: IFoodSale) => {
  if (!selectedCategoryInfo.value || !newFoodSaleData) return
  const formData: Record<string, any> = {}
  const fields: IFieldsRetail[] = [
    ...selectedCategoryInfo.value.fields,
    {
      key: 'kilo',
      label: 'คงเหลือ (กก.)',
      type: 'number',
      required: true,
    },
  ]
  fields.forEach((field) => {
    const fieldValue = newFoodSaleData[field.key as keyof IFoodSale]
    if (field.key === 'product') {
      formData[field.key] = newFoodSaleData.product._id
    } else {
      formData[field.key] = fieldValue || (field.type === 'number' ? 0 : '')
    }
  })

  dynamicFormData.value = formData

  productForm.value = {
    ...newFoodSaleData,
    _id: newFoodSaleData._id,
    kilo: newFoodSaleData.kilo,
  }
}
// Watch for props changes to populate form
watch(
  () => props.productData,
  (newFoodSaleData) => {
    if (newFoodSaleData) {
      initializeDynamicForm(newFoodSaleData)
    }
  },
  { immediate: true }
)

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

const editableFields = computed<IFieldsRetail[]>(() => {
  if (!selectedCategoryInfo.value) return []
  return [
    ...selectedCategoryInfo.value.fields.filter((field) => field.key !== 'product'),
    {
      key: 'kilo',
      label: 'คงเหลือ (กก.)',
      type: 'number',
      required: true,
    },
  ]
})
const mapDynamicFormToProductForm = () => {
  if (!editableFields.value) return

  editableFields.value.forEach((field) => {
    const value = dynamicFormData.value![field.key]

    switch (field.key) {
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
      case 'kilo':
        productForm.value.kilo = value as number
        break
    }
  })
}

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

  const payload: IUpdateFoodSalePayload = {
    ...productForm.value,
    _id: props.productData._id,
    priceKilo: productForm.value.priceKilo,
    costPriceKilo: productForm.value.costPriceKilo,
    customerPriceKilo: productForm.value.customerPriceKilo,
    dealerPriceKilo: productForm.value.dealerPriceKilo,
    kilo: productForm.value.kilo,
  }

  updateFoodSale(payload)
}

const queryClient = useQueryClient()
const foodSaleStore = useFoodSaleStore()
const { mutate: updateFoodSale, isPending: isUpdatingFoodSale } = useMutation({
  mutationFn: (payload: IUpdateFoodSalePayload) => foodSaleStore.onUpdateFoodSale(payload),
  onSuccess: (data: any) => {
    if (data.data.modifiedCount > 0) {
      toast.success('อัปเดตสินค้าสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_food_sales'] })
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
  emit('close-edit-modal')
}

const updateDynamicField = (key: IFieldsKeyRetail, value: string | number | Date | null) => {
  dynamicFormData.value![key] = value
}

const filteredFieldsEdit = computed<IFieldsRetail[]>(() => {
  if (!props.fieldsRetailUI) return []
  return [
    ...props.fieldsRetailUI.fields.filter((field) => field.key !== 'product'),
    {
      key: 'kilo',
      label: 'คงเหลือ (กก.)',
      type: 'number',
      required: true,
    },
  ]
})
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

    <DynamicRetailFormField
      v-if="fieldsRetailUI && dynamicFormData"
      :fields="filteredFieldsEdit"
      :form-data="dynamicFormData"
      :is-submitting="isSubmitting"
      @update-field="updateDynamicField"
      :category-id="props.selectedCategory"
    />

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
          :loading="isUpdatingFoodSale"
        />
      </div>
    </template>
  </Dialog>
</template>
