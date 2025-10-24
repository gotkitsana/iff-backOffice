<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Tag, Card } from 'primevue'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { toast } from 'vue3-toastify'
import formatCurrency from '@/utils/formatCurrency'

// Props
const props = defineProps<{
  visible: boolean
  productData: IProduct | null
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'edit-product': [product: IProduct]
  'product-deleted': []
}>()

// Stores
const productStore = useProductStore()

// Computed
const isAuctionProduct = computed(() => props.productData?.auctionOnly === 1)

const getProductTypeTag = (type: number) => {
  switch (type) {
    case 1:
      return { label: 'ปลาคาร์ฟ', severity: 'info' }
    case 2:
      return { label: 'ปลาทอง', severity: 'warning' }
    case 3:
      return { label: 'ปลาอื่นๆ', severity: 'secondary' }
    default:
      return { label: 'ไม่ระบุ', severity: 'secondary' }
  }
}

const getGenderTag = (gender: number) => {
  switch (gender) {
    case 1:
      return { label: 'ตัวผู้', severity: 'info' }
    case 2:
      return { label: 'ตัวเมีย', severity: 'warning' }
    default:
      return { label: 'ไม่ระบุ', severity: 'secondary' }
  }
}

const getStatusTag = (sold: boolean) => {
  return sold
    ? { label: 'ขายแล้ว', severity: 'danger' }
    : { label: 'พร้อมขาย', severity: 'success' }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Handlers
const handleEdit = () => {
  if (props.productData) {
    emit('edit-product', props.productData)
    emit('update:visible', false)
  }
}

const handleDelete = async () => {
  if (!props.productData) return

  if (confirm(`คุณต้องการลบสินค้า "${props.productData.name}" หรือไม่?`)) {
    try {
      await productStore.onDeleteProduct(props.productData._id)
      emit('product-deleted')
      emit('update:visible', false)
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบสินค้า')
      console.error(error)
    }
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '50rem' }"
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
          <i class="pi pi-eye text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">รายละเอียดสินค้า</h3>
          <p class="text-sm text-gray-600">{{ productData?.name }}</p>
        </div>
      </div>
    </template>

    <div v-if="productData" class="space-y-6">
      <!-- Product Header -->
      <Card :pt="{ body: 'p-4' }" class="bg-gray-50">
        <template #content>
          <div class="flex items-center gap-4">
            <div
              :class="`w-16 h-16 rounded-lg flex items-center justify-center ${
                isAuctionProduct ? 'bg-purple-100' : 'bg-blue-100'
              }`"
            >
              <i
                :class="`${
                  isAuctionProduct ? 'pi pi-gavel text-purple-600' : 'pi pi-fish text-blue-600'
                } text-2xl`"
              ></i>
            </div>
            <div class="flex-1">
              <h4 class="text-xl font-semibold text-gray-900">{{ productData.name }}</h4>
              <p class="text-sm text-gray-600">SKU: {{ productData.sku }}</p>
              <div class="flex items-center gap-2 mt-2">
                <Tag
                  :value="getProductTypeTag(productData.type).label"
                  :severity="getProductTypeTag(productData.type).severity"
                  size="small"
                />
                <Tag
                  :value="getStatusTag(productData.sold).label"
                  :severity="getStatusTag(productData.sold).severity"
                  size="small"
                />
                <Tag v-if="isAuctionProduct" value="สำหรับประมูล" severity="warning" size="small" />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Basic Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card :pt="{ body: 'p-4' }">
          <template #content>
            <h5 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <i class="pi pi-info-circle text-blue-600"></i>
              ข้อมูลพื้นฐาน
            </h5>
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-gray-600">ชื่อสินค้า</label>
                <p class="text-sm text-gray-900">{{ productData.name }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">SKU</label>
                <p class="text-sm text-gray-900">{{ productData.sku }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">ฟาร์ม</label>
                <p class="text-sm text-gray-900">{{ productData.farm }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">ขนาด</label>
                <p class="text-sm text-gray-900">{{ productData.size }} ซม.</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">เพศ</label>
                <Tag
                  :value="getGenderTag(productData.gender ? parseInt(productData.gender) : 1).label"
                  :severity="getGenderTag(productData.gender ? parseInt(productData.gender) : 1).severity"
                  size="small"
                />
              </div>
              <div v-if="productData.age">
                <label class="text-sm font-medium text-gray-600">อายุ</label>
                <p class="text-sm text-gray-900">{{ productData.age }}</p>
              </div>
            </div>
          </template>
        </Card>

        <Card :pt="{ body: 'p-4' }">
          <template #content>
            <h5 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <i class="pi pi-dollar text-yellow-600"></i>
              ข้อมูล{{ isAuctionProduct ? 'ประมูล' : 'ราคา' }}
            </h5>
            <div class="space-y-3">
              <div v-if="!isAuctionProduct && productData.price">
                <label class="text-sm font-medium text-gray-600">ราคา</label>
                <p class="text-lg font-semibold text-green-600">
                  {{ formatCurrency(productData.price) }}
                </p>
              </div>
              <div v-if="isAuctionProduct">
                <label class="text-sm font-medium text-gray-600">คะแนนคุณภาพ</label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-star-fill text-yellow-500"></i>
                  <span class="text-lg font-semibold text-gray-900"
                    >{{ productData.rate || 0 }}/10</span
                  >
                </div>
              </div>
              <div v-if="productData.rate && !isAuctionProduct">
                <label class="text-sm font-medium text-gray-600">คะแนนคุณภาพ</label>
                <div class="flex items-center gap-2">
                  <i class="pi pi-star-fill text-yellow-500"></i>
                  <span class="text-sm text-gray-900">{{ productData.rate }}/10</span>
                </div>
              </div>
              <div v-if="productData.category">
                <label class="text-sm font-medium text-gray-600">หมวดหมู่</label>
                <p class="text-sm text-gray-900">{{ productData.category }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Additional Information -->
      <Card :pt="{ body: 'p-4' }">
        <template #content>
          <h5 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-file-edit text-gray-600"></i>
            รายละเอียดเพิ่มเติม
          </h5>
          <div class="space-y-3">
            <div v-if="productData.detail">
              <label class="text-sm font-medium text-gray-600">รายละเอียด</label>
              <p class="text-sm text-gray-900 whitespace-pre-wrap">{{ productData.detail }}</p>
            </div>
            <div v-if="productData.youtube">
              <label class="text-sm font-medium text-gray-600">YouTube</label>
              <a
                :href="productData.youtube"
                target="_blank"
                class="text-sm text-blue-600 hover:underline"
              >
                {{ productData.youtube }}
              </a>
            </div>
            <div v-if="productData.certificate">
              <label class="text-sm font-medium text-gray-600">ใบรับรอง</label>
              <p class="text-sm text-gray-900">{{ productData.certificate }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- System Information -->
      <Card :pt="{ body: 'p-4' }">
        <template #content>
          <h5 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-cog text-gray-600"></i>
            ข้อมูลระบบ
          </h5>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label class="text-sm font-medium text-gray-600">อัปเดตล่าสุด</label>
              <p class="text-sm text-gray-900">{{ formatDate(productData.uat) }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">สถานะ</label>
              <Tag
                :value="getStatusTag(productData.sold).label"
                :severity="getStatusTag(productData.sold).severity"
                size="small"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">ประเภทการขาย</label>
              <Tag
                :value="isAuctionProduct ? 'สำหรับประมูล' : 'สำหรับขาย'"
                :severity="isAuctionProduct ? 'warning' : 'info'"
                size="small"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <Button
          label="ลบสินค้า"
          icon="pi pi-trash"
          severity="danger"
          @click="handleDelete"
          size="small"
          outlined
        />
        <div class="flex gap-3">
          <Button
            label="ปิด"
            icon="pi pi-times"
            severity="secondary"
            @click="handleClose"
            size="small"
          />
          <Button label="แก้ไข" icon="pi pi-pencil" @click="handleEdit" size="small" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
