<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, InputText, Textarea, Select, InputNumber, Button } from 'primevue'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useMemberStore, type IMember } from '@/stores/member/member'
import { useQuery } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import formatCurrency from '@/utils/formatCurrency'
import { useSalesStore, type ICreateSalesPayload } from '@/stores/sales/sales'
import type { filter } from 'lodash-es'

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
const memberStore = useMemberStore()
const salesStore = useSalesStore()

// Form data
const saleForm = ref<ICreateSalesPayload>({
  item: '',
  status: '',
  user: '',
  products: [{ id: '', quantity: 0 }],
  deposit: 0,
  discount: 0,
  seller: '',
  note: '',
})

// Queries
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: members, isLoading: membersLoading } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})

// Computed
const availableProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter((p) => !p.sold && p.auctionOnly === 0)
})

const productOptions = computed(() => {
  return availableProducts.value.map((product) => ({
    label: `${product.name} (รหัส: ${product.sku})`,
    value: product._id,
  }))
})

const selectedProductDetails = computed(() => {
  if (!saleForm.value.products[0].id || !availableProducts.value) return null
  return availableProducts.value.find((p) => p._id === saleForm.value.products[0].id)
})

const memberOptions = computed(() => {
  if (!members.value) return []
  return members.value.map((member) => {
    const code = member.code.charAt(0).toUpperCase() + member.code.slice(1)
    return {
      label: `${code} - ${member.name || member.displayName}`,
      value: member._id,
    }
  })
})

const selectedMemberDetails = computed(() => {
  if (!saleForm.value.user || !members.value) return null
  return members.value.find((m) => m._id === saleForm.value.user)
})

// Handlers
const handleSubmit = () => {
  isSubmitting.value = true
  if (
    !saleForm.value.user ||
    !saleForm.value.products[0].id ||
    !saleForm.value.products[0].quantity ||
    !saleForm.value.seller ||
    !saleForm.value.status
  ) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  toast.success('เพิ่มข้อมูลการขายสำเร็จ')
}

const isSubmitting = ref(false)
const handleClose = () => {
  resetForm()
  isSubmitting.value = false
  emit('update:visible', false)
}

const resetForm = () => {
  saleForm.value = {
    item: '',
    status: '',
    user: '',
    products: [{ id: '', quantity: 0 }],
    deposit: 0,
    discount: 0,
    seller: '',
    note: '',
  }
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
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มข้อมูลการขาย</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลการขายให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Customer Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              v-model="saleForm.user"
              :options="memberOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกลูกค้า"
              fluid
              size="small"
              :loading="membersLoading"
              :invalid="!saleForm.user && isSubmitting"
              filter
            />
            <small v-if="!saleForm.user && isSubmitting" class="text-red-500"
              >กรุณาเลือกลูกค้า</small
            >
          </div>

          <div>
            <Select
              v-model="saleForm.status"
              :options="salesStore.sellingStatusOptions"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              placeholder="เลือกสถานะรายการขาย"
              :invalid="!saleForm.status && isSubmitting"
            />
            <small v-if="!saleForm.status && isSubmitting" class="text-red-500"
              >กรุณาเลือกสถานะรายการขาย</small
            >
          </div>

          <div>
            <Select
              v-model="saleForm.seller"
              :options="salesStore.sellers"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              placeholder="เลือกผู้ขาย"
              :invalid="!saleForm.seller && isSubmitting"
            />
            <small v-if="!saleForm.seller && isSubmitting" class="text-red-500"
              >กรุณาเลือกผู้ขาย</small
            >
          </div>
        </div>

        <!-- Selected Member Details -->
        <div
          v-if="selectedMemberDetails"
          class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div
              class="md:flex hidden w-14 h-14 bg-green-100 rounded-lg items-center justify-center"
            >
              <i class="pi pi-user text-green-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <h5 class="font-semibold text-gray-900">
                {{ selectedMemberDetails.name || selectedMemberDetails.displayName }}
              </h5>
              <p class="text-sm text-gray-600">
                รหัส: <span class="capitalize">{{ selectedMemberDetails.code }}</span> | ชื่อเล่น:
                {{ selectedMemberDetails.displayName || '-' }} | เบอร์:
                {{ selectedMemberDetails.phone || '-' }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                ที่อยู่: {{ selectedMemberDetails.address || '-' }},
                {{
                  selectedMemberDetails.province
                    ? memberStore.provinceOptions.find(
                        (option) => option.value === selectedMemberDetails?.province
                      )?.label
                    : '-'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              v-model="saleForm.products[0].id"
              :options="productOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกสินค้าที่ต้องการขาย"
              fluid
              size="small"
              :invalid="!saleForm.products[0].id && isSubmitting"
            />
            <small v-if="!saleForm.products[0].id && isSubmitting" class="text-red-500"
              >กรุณาเลือกสินค้า</small
            >
          </div>

          <div>
            <InputNumber
              v-model="saleForm.products[0].quantity"
              :min="1"
              :max="10"
              fluid
              size="small"
              placeholder="ระบุจำนวนสินค้า"
              :invalid="!saleForm.products[0].quantity && isSubmitting"
            />
            <small v-if="!saleForm.products[0].quantity && isSubmitting" class="text-red-500"
              >กรุณากรอกจำนวนสินค้า</small
            >
          </div>

          <div
            v-if="selectedProductDetails"
            class="p-4 bg-blue-50 border border-blue-200 rounded-lg md:col-span-2 flex justify-between gap-x-4"
          >
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-box text-blue-600 text-xl"></i>
              </div>
              <div class="flex-1">
                <h5 class="font-semibold text-gray-900">ชื่อสินค้า: {{ selectedProductDetails.name }}</h5>
                <p class="text-xs text-gray-500 mt-1">รายละเอียด: {{ selectedProductDetails.detail }}</p>
              </div>
            </div>
            <div>
              <div class="text-right">
                <p class="text-gray-500 text-sm">
                  ราคาต่อหน่วย:
                  {{
                    selectedProductDetails.price
                      ? formatCurrency(selectedProductDetails.price)
                      : 'ไม่ระบุราคา'
                  }}
                </p>
                <p class="mt-1 font-[500]! text-green-600">
                  ราคารวม:
                  {{
                    selectedProductDetails.price
                      ? formatCurrency(selectedProductDetails.price * saleForm.products[0].quantity)
                      : 'ไม่ระบุราคา'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-wallet mr-1.5 !text-sm"></i>
              มัดจำ (บาท)
            </label>
            <InputNumber
              v-model="saleForm.deposit"
              :min="0"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
              placeholder="ระบุยอดมัดจำ"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-percentage mr-1.5 !text-sm"></i>
              ส่วนลด (บาท)
            </label>
            <InputNumber
              v-model="saleForm.discount"
              :min="0"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
              placeholder="ระบุส่วนลด"
            />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-file-edit text-purple-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">หมายเหตุ</h4>
        </div>

        <Textarea
          v-model="saleForm.note"
          placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
          rows="3"
          fluid
          size="small"
        />
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
          label="บันทึกข้อมูล"
          icon="pi pi-check"
          @click="handleSubmit"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
