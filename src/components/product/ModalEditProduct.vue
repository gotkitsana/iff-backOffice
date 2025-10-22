<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, InputText, Textarea, Select, InputNumber, Button, RadioButton } from 'primevue'
import {
  useProductStore,
  type IUpdateProductPayload,
  type IProduct,
} from '@/stores/product/product'
import { toast } from 'vue3-toastify'

// Props
const props = defineProps<{
  visible: boolean
  productData: IProduct | null
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'product-updated': []
}>()

// Stores
const productStore = useProductStore()

// Form data
const productForm = ref<IUpdateProductPayload>({
  _id: '',
  category: null,
  type: 1,
  name: '',
  price: 0,
  detail: '',
  sku: '',
  farm: '',
  size: 0,
  gender: 1,
  age: '',
  sold: false,
  rate: 0,
  youtube: '',
  certificate: '',
  auctionOnly: 0,
})

// Options
const productTypes = [
  { label: 'ปลาคาร์ฟ', value: 1 },
  { label: 'ปลาทอง', value: 2 },
  { label: 'ปลาอื่นๆ', value: 3 },
]

const genderOptions = [
  { label: 'ตัวผู้', value: 1 },
  { label: 'ตัวเมีย', value: 2 },
]

const auctionOptions = [
  { label: 'สินค้าสำหรับขาย', value: 0 },
  { label: 'สินค้าสำหรับประมูล', value: 1 },
]

// Computed
const isAuctionProduct = computed(() => productForm.value.auctionOnly === 1)
const isKoiFish = computed(() => productForm.value.type === 1)

// Watch for props changes to populate form
watch(
  () => props.productData,
  (newProductData) => {
    if (newProductData) {
      populateForm(newProductData)
    }
  },
  { immediate: true }
)

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
  if (!productForm.value.farm.trim()) {
    toast.error('กรุณากรอกชื่อฟาร์ม')
    return false
  }
  if (productForm.value.size && productForm.value.size <= 0) {
    toast.error('กรุณากรอกขนาดที่ถูกต้อง')
    return false
  }
  if (!isAuctionProduct.value && productForm.value.price && productForm.value.price <= 0) {
    toast.error('กรุณากรอกราคาที่ถูกต้อง')
    return false
  }
  if (isAuctionProduct.value && !isKoiFish.value) {
    toast.error('สินค้าสำหรับประมูลต้องเป็นปลาคาร์ฟเท่านั้น')
    return false
  }
  return true
}

// Handlers
const populateForm = (productData: IProduct) => {
  if (!productData) return

  productForm.value = {
    _id: productData._id,
    category: productData.category || null,
    type: productData.type,
    name: productData.name,
    price: productData.price || 0,
    detail: productData.detail,
    sku: productData.sku,
    farm: productData.farm,
    size: productData.size || 0,
    gender: productData.gender || 1,
    age: productData.age,
    sold: productData.sold,
    rate: productData.rate,
    youtube: productData.youtube,
    certificate: productData.certificate || '',
    auctionOnly: productData.auctionOnly,
  }
}

const handleSubmit = async () => {
  if (!props.productData || !validateForm()) return

  isSubmitting.value = true

  try {
    const payload: IUpdateProductPayload = {
      _id: props.productData._id,
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
      certificate: productForm.value.certificate || null,
      auctionOnly: productForm.value.auctionOnly,
    }

    await productStore.onUpdateProduct(payload)
    emit('product-updated')
    handleClose()
  } catch (error) {
    toast.error('เกิดข้อผิดพลาดในการอัปเดตสินค้า')
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

const isSubmitting = ref(false)

const handleClose = () => {
  isSubmitting.value = false
  emit('update:visible', false)
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
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-pencil text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">แก้ไขข้อมูลสินค้า</h3>
          <p class="text-sm text-gray-600">แก้ไขข้อมูลสินค้า</p>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Product Type Selection -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-tags text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ประเภทสินค้า</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-2 block">ประเภทการขาย</label>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <RadioButton v-model="productForm.auctionOnly" :value="0" inputId="sale" />
                <label for="sale" class="text-sm text-gray-700">สินค้าสำหรับขาย</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton v-model="productForm.auctionOnly" :value="1" inputId="auction" />
                <label for="auction" class="text-sm text-gray-700"
                  >สินค้าสำหรับประมูล (ปลาคาร์ฟเท่านั้น)</label
                >
              </div>
            </div>
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-fish mr-1.5 !text-sm"></i>
              ประเภทปลา
            </label>
            <Select
              v-model="productForm.type"
              :options="productTypes"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              :disabled="isAuctionProduct"
            />
            <small v-if="isAuctionProduct" class="text-orange-600 text-xs">
              สินค้าสำหรับประมูลจะถูกตั้งเป็นปลาคาร์ฟอัตโนมัติ
            </small>
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
            <InputText v-model="productForm.name" placeholder="กรอกชื่อสินค้า" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-barcode mr-1.5 !text-sm"></i>
              SKU *
            </label>
            <InputText v-model="productForm.sku" placeholder="กรอก SKU" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-building mr-1.5 !text-sm"></i>
              ฟาร์ม *
            </label>
            <InputText v-model="productForm.farm" placeholder="กรอกชื่อฟาร์ม" fluid size="small" />
          </div>

          <div>
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
            />
          </div>

          <div>
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

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-calendar mr-1.5 !text-sm"></i>
              อายุ
            </label>
            <InputText v-model="productForm.age" placeholder="เช่น 2 ปี" fluid size="small" />
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

      <!-- Pricing Information -->
      <div
        v-if="!isAuctionProduct"
        class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      >
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-dollar text-yellow-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลราคา</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            />
          </div>

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

      <!-- Auction Information -->
      <div v-if="isAuctionProduct" class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-gavel text-purple-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลประมูล</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-star mr-1.5 !text-sm"></i>
              คะแนนคุณภาพ *
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

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-certificate mr-1.5 !text-sm"></i>
              ใบรับรอง
            </label>
            <InputText
              v-model="productForm.certificate"
              placeholder="กรอกข้อมูลใบรับรอง"
              fluid
              size="small"
            />
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

      <!-- Status Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-cog text-gray-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">สถานะสินค้า</h4>
        </div>

        <div class="flex items-center gap-2">
          <input
            v-model="productForm.sold"
            type="checkbox"
            id="sold"
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label for="sold" class="text-sm text-gray-700">ขายแล้ว</label>
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
          label="อัปเดตข้อมูล"
          icon="pi pi-check"
          @click="handleSubmit"
          severity="success"
          size="small"
          :loading="isSubmitting"
        />
      </div>
    </template>
  </Dialog>
</template>
