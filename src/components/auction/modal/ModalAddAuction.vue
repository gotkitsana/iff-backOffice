<script setup lang="ts">
import { useAuctionStore, type IAuctionPayload } from '@/stores/auction/auction'
import { useMutation } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue3-toastify'
import { Dialog, Button, InputNumber, Select, DatePicker } from 'primevue'
import type { IProduct } from '@/stores/auction/product'

const props = defineProps<{
  showAddAuctionModal: boolean
  availableProducts?: IProduct[]
}>()

const emit = defineEmits<{
  (e: 'onCloseAddAuctionModal'): void
}>()

const showAddAuctionModal = computed({
  get: () => props.showAddAuctionModal,
  set: (value: boolean) => {
    if (!value) {
      closeAddAuctionModal()
    }
  },
})

const closeAddAuctionModal = () => {
  emit('onCloseAddAuctionModal')
  resetForm()
}

const form = ref<IAuctionPayload>({
  productId: '',
  biddingTime: 0,
  startDate: 0,
  endDate: 0,
  minBid: 0,
})

const startDateValue = ref<Date | null>(null)
const endDateValue = ref<Date | null>(null)

const resetForm = () => {
  form.value = {
    productId: '',
    biddingTime: 0,
    startDate: 0,
    endDate: 0,
    minBid: 0,
  }
  startDateValue.value = null
  endDateValue.value = null
}

const isSubmitting = ref(false)

// Product options from available products
const productOptions = computed(() => {
  if (!props.availableProducts) return []
  return props.availableProducts.map((product) => ({
    label: `${product.name} (${product.size} ซม.) - ${product.category || 'ไม่ระบุหมวดหมู่'}`,
    value: product._id,
    product: product,
  }))
})

// Selected product details
const selectedProduct = computed(() => {
  if (!form.value.productId || !props.availableProducts) return null
  return props.availableProducts.find((p) => p._id === form.value.productId)
})

// Watch for product selection to auto-fill price
watch(
  () => form.value.productId,
  (newProductId) => {
    if (newProductId && selectedProduct.value) {
      form.value.minBid = selectedProduct.value.price || 0
    }
  }
)

const validateForm = () => {
  const errors = []

  if (!form.value.productId) errors.push('กรุณาเลือกปลาคาร์ฟ')
  if (!form.value.biddingTime) errors.push('กรุณาระบุเวลาในการประมูล (นาที)')
  if (!startDateValue.value) errors.push('กรุณาเลือกวันที่เริ่มประมูล')
  if (!endDateValue.value) errors.push('กรุณาเลือกวันที่สิ้นสุดประมูล')
  if (!form.value.minBid || form.value.minBid < 0) errors.push('กรุณากรอกราคาเริ่มต้น (บาท)')

  if (startDateValue.value && endDateValue.value && startDateValue.value >= endDateValue.value) {
    errors.push('วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น')
  }

  return errors
}

const auctionStore = useAuctionStore()
const { mutate, isPending } = useMutation({
  mutationFn: (payload: IAuctionPayload) => auctionStore.onCreateAuction(payload),
  onSuccess: (data: unknown) => {
    isSubmitting.value = false
    const response = data as { message?: string }
    toast.success(response.message || 'เพิ่มประมูลสำเร็จ')
    closeAddAuctionModal()
  },
  onError: (error: unknown) => {
    isSubmitting.value = false
    const errorResponse = error as { message?: string }
    toast.error(errorResponse.message || 'เพิ่มประมูลไม่สำเร็จ')
  },
})

// Use the mutate function
const handleAddAuction = () => {
  isSubmitting.value = true
  const errors = validateForm()

  if (errors.length > 0) {
    toast.error(errors[0])
    isSubmitting.value = false
    return
  }

  mutate({
    productId: form.value.productId,
    biddingTime: form.value.biddingTime,
    startDate: startDateValue.value ? startDateValue.value.getTime() : 0,
    endDate: endDateValue.value ? endDateValue.value.getTime() : 0,
    minBid: form.value.minBid,
  })
}
</script>
<template>
  <Dialog
    v-model:visible="showAddAuctionModal"
    @update:visible="closeAddAuctionModal"
    modal
    :style="{ width: '45rem' }"
    :breakpoints="{ '1199px': '85vw', '575px': '95vw' }"
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
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มประมูลใหม่</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลสำหรับประมูลให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Product Selection -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-fish text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">เลือกปลาคาร์ฟ</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tag mr-1.5 !text-sm"></i>
              เลือกปลาคาร์ฟ *
            </label>
            <Select
              v-model="form.productId"
              :options="productOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกปลาคาร์ฟที่ต้องการประมูล"
              :invalid="!form.productId && isSubmitting"
              fluid
              size="small"
            />
            <small
              v-if="!form.productId && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              <i class="pi pi-exclamation-triangle text-xs"></i>
              กรุณาเลือกปลาคาร์ฟ
            </small>
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-clock mr-1.5 !text-sm"></i>
              เวลาประมูล (นาที) *
            </label>
            <InputNumber
              v-model="form.biddingTime"
              :min="0"
              :max="999999999"
              :invalid="!form.biddingTime && isSubmitting"
              placeholder="ระบุเวลาในการประมูล (นาที)"
              suffix=" นาที"
              fluid
              size="small"
            />
            <small
              v-if="!form.biddingTime && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              <i class="pi pi-exclamation-triangle text-xs"></i>
              กรุณาระบุเวลาในการประมูล (นาที)
            </small>
          </div>
        </div>

        <!-- Selected Product Details -->
        <div v-if="selectedProduct" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-fish text-blue-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <h5 class="font-semibold text-gray-900">{{ selectedProduct.name }}</h5>
              <p class="text-sm text-gray-600">
                {{ selectedProduct.category || 'ไม่ระบุหมวดหมู่' }} - {{ selectedProduct.size }} ซม.
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ selectedProduct.detail }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-green-600">
                {{
                  selectedProduct.price
                    ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
                        selectedProduct.price
                      )
                    : 'ไม่ระบุราคา'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Auction Schedule -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-calendar text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">กำหนดการประมูล</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-play mr-1.5 !text-sm"></i>
              วันที่เริ่มประมูล
            </label>
            <DatePicker
              v-model="startDateValue"
              showIcon
              fluid
              iconDisplay="input"
              :invalid="!startDateValue && isSubmitting"
              placeholder="เลือกวันที่เริ่มประมูล"
              size="small"
              showTime
              hourFormat="24"
            />
            <small
              v-if="!startDateValue && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              <i class="pi pi-exclamation-triangle text-xs"></i>
              กรุณาเลือกวันที่เริ่มประมูล
            </small>
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-stop mr-1.5 !text-sm"></i>
              วันที่สิ้นสุดประมูล
            </label>
            <DatePicker
              v-model="endDateValue"
              showIcon
              fluid
              iconDisplay="input"
              :invalid="!endDateValue && isSubmitting"
              placeholder="เลือกวันที่สิ้นสุดประมูล"
              size="small"
              showTime
              hourFormat="24"
            />
            <small
              v-if="!endDateValue && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              <i class="pi pi-exclamation-triangle text-xs"></i>
              กรุณาเลือกวันที่สิ้นสุดประมูล
            </small>
          </div>
        </div>
      </div>

      <!-- Price Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-dollar text-yellow-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลราคา</h4>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-money-bill mr-1.5 !text-sm"></i>
              ราคาเริ่มต้น (บาท) *
            </label>
            <InputNumber
              v-model="form.minBid"
              :invalid="(!form.minBid || form.minBid < 0) && isSubmitting"
              placeholder="กรอกราคาเริ่มต้น (บาท)"
              :min="0"
              :max="999999999"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
            <small
              v-if="(!form.minBid || form.minBid < 0) && isSubmitting"
              class="text-red-500 flex items-center gap-1"
            >
              <i class="pi pi-exclamation-triangle text-xs"></i>
              กรุณากรอกราคาเริ่มต้น (บาท)
            </small>
          </div>

          <!-- Price Suggestion -->
          <div
            v-if="selectedProduct && selectedProduct.price"
            class="p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-lightbulb text-green-600"></i>
              <span class="text-sm font-medium text-green-800">คำแนะนำ</span>
            </div>
            <p class="text-sm text-green-700">
              ราคาขายปลาคาร์ฟ:
              <span class="font-semibold">{{
                new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
                  selectedProduct.price
                )
              }}</span>
            </p>
            <p class="text-xs text-green-600 mt-1">
              ราคาเริ่มต้นประมูลควรต่ำกว่าราคาขายเพื่อดึงดูดผู้ประมูล
            </p>
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
          @click="closeAddAuctionModal"
          :disabled="isPending"
          size="small"
        />

        <Button
          label="เพิ่มประมูล"
          icon="pi pi-plus"
          @click="handleAddAuction"
          :loading="isPending"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
