<script setup lang="ts">
import { ref, computed } from 'vue'
import { Panel, Tag, Button, Menu, Image, Avatar } from 'primevue'
import type { ISales, PaymentMethod, SellingStatus } from '@/types/sales'
import { convertStatusNumberToString } from '@/types/sales'
import { useSalesStore } from '@/stores/sales/sales'
import { useAdminStore, type IAdmin } from '@/stores/admin/admin'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useQuery } from '@tanstack/vue-query'
import { getProductImageUrl, getShippingSlipUrl } from '@/utils/imageUrl'
import formatCurrency from '@/utils/formatCurrency'
import dayjs from 'dayjs'
import { useMemberStore } from '@/stores/member/member'

const props = defineProps<{
  saleId: string
  sale: ISales | undefined
  isSetting?: boolean // แสดงเมนูสำหรับลบหรือไม่ (สำหรับหน้าแก้ไข)
  isNew?: boolean // เป็นรายการใหม่หรือไม่ (สำหรับหน้าแก้ไข)
}>()

const emit = defineEmits<{
  (e: 'onDelete', saleId: string): void
}>()

const salesStore = useSalesStore()
const adminStore = useAdminStore()
const productStore = useProductStore()

// ดึงข้อมูล admins และ products
const { data: admins } = useQuery<IAdmin[]>({
  queryKey: ['get_admins'],
  queryFn: () => adminStore.onGetAdmins(),
})

const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

// Menu สำหรับลบ (สำหรับรายการเดิม)
const menu = ref()
const toggle = (event: Event) => {
  menu.value.toggle(event)
}

const items = ref([
  {
    label: 'ลบ',
    icon: 'pi pi-trash',
    severity: 'danger',
    command: () => {
      emit('onDelete', props.saleId)
    },
  },
])

// Helper functions
const getStatusLabel = (status: SellingStatus | string): string => {
  const statusString = typeof status === 'number' ? convertStatusNumberToString(status) : status
  const statusInfo =
    salesStore.statusWorkflow[statusString as keyof typeof salesStore.statusWorkflow]
  return statusInfo?.label || statusString
}

const getPaymentLabel = (payment: PaymentMethod | undefined): string => {
  const paymentMap = {
    cash: 'เงินสด',
    transfer: 'โอนเงิน',
    credit: 'เครดิต',
    order: 'ออเดอร์',
    cod: 'COD',
    card: 'บัตร',
  }
  return payment ? paymentMap[payment] : '-'
}

const getSellerName = (sellerId: string): string => {
  if (!admins.value || !sellerId) return '-'
  const seller = admins.value.find((admin) => admin._id === sellerId)
  return seller?.name || '-'
}

const getProductById = (productId: string): IProduct | undefined => {
  if (!products.value) return undefined
  return products.value.find((p) => p._id === productId)
}

const getProductImage = (productId: string): string => {
  const product = getProductById(productId)
  if (!product?.images || product.images.length === 0) return ''
  return getProductImageUrl(product.images[0].filename)
}

const getProductCategory = (productId: string): string => {
  const product = getProductById(productId)
  return product?.category?.name || '-'
}

// คำนวณยอดรวม
const calculateSaleTotal = computed(() => {
  if (!props.sale) return 0
  const productsTotal = props.sale.products
    ? props.sale.products.reduce((total, product) => {
        return total + (product.price || 0) * (product.quantity || 1)
      }, 0)
    : 0
  return productsTotal - props.sale.discount - (props.sale.deliveryNo || 0)
})

const totalAmount = computed(() => {
  if (!props.sale) return 0
  return props.sale.products
    ? props.sale.products.reduce((total, product) => {
        return total + (product.price || 0) * (product.quantity || 1)
      }, 0)
    : 0
})

// URL สำหรับรูปสลิปและใบขนส่ง
const slipUrl = computed(() => {
  if (!props.saleId) return ''
  const apiUrl = import.meta.env.VITE_API_URL as string
  return `${apiUrl}/erp/download/slip?saleId=${props.saleId}`
})

const shippingSlipUrl = computed(() => {
  if (!props.saleId) return ''
  // สำหรับตอนนี้ใช้ jpg เป็น default
  return getShippingSlipUrl(props.saleId, 'jpg')
})

// เช็คว่ามีรูปสลิปหรือไม่
const hasSlip = ref(false)
const hasShippingSlip = ref(false)

// เช็ครูปสลิป
if (props.saleId) {
  const checkSlipImage = new window.Image() as HTMLImageElement
  checkSlipImage.onload = () => {
    hasSlip.value = true
  }
  checkSlipImage.onerror = () => {
    hasSlip.value = false
  }
  checkSlipImage.src = slipUrl.value

  // เช็ครูปใบขนส่ง
  const checkShippingSlipImage = new window.Image() as HTMLImageElement
  checkShippingSlipImage.onload = () => {
    hasShippingSlip.value = true
  }
  checkShippingSlipImage.onerror = () => {
    hasShippingSlip.value = false
  }
  checkShippingSlipImage.src = shippingSlipUrl.value
}

// Status severity
const getStatusSeverity = computed(() => {
  if (!props.sale) return 'secondary'
  const statusString =
    typeof props.sale.sellingStatus === 'number'
      ? convertStatusNumberToString(props.sale.sellingStatus)
      : props.sale.sellingStatus
  const workflow = salesStore.statusWorkflow
  return workflow[statusString]?.color || 'secondary'
})

const memberStore = useMemberStore()
</script>

<template>
  <Panel v-if="sale" toggleable :collapsed="true">
    <!-- Header: แสดงเมื่อปิด Panel -->
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-semibold! text-sm">เลขรายการขาย: {{ sale.item }}</span>
        <Tag
          :value="getStatusLabel(sale.sellingStatus)"
          :severity="getStatusSeverity"
          size="small"
        />
        <Tag :value="getPaymentLabel(sale.paymentMethod)" severity="info" size="small" />
      </div>
    </template>

    <!-- Icons: เมนูสำหรับลบ (สำหรับหน้าแก้ไข) -->
    <template #icons>
      <Button
        v-if="isSetting && isNew"
        icon="pi pi-trash"
        severity="danger"
        rounded
        text
        @click="emit('onDelete', saleId)"
      />
      <template v-else-if="isSetting && !isNew">
        <Button icon="pi pi-cog" severity="secondary" rounded text @click="toggle" />
        <Menu ref="menu" id="config_menu" :model="items" popup size="small" />
      </template>
    </template>

    <!-- Content: รายละเอียดเมื่อเปิด Panel -->
    <div class="space-y-4">
      <!-- รายการสินค้า -->
      <div v-if="sale.products && sale.products.length > 0" class="space-y-3">
        <h5 class="text-sm font-semibold text-gray-700 mb-2">รายการสินค้า:</h5>
        <div class="space-y-3">
          <div
            v-for="(product, productIndex) in sale.products"
            :key="productIndex"
            class="bg-gray-50 rounded-lg p-3 border border-gray-200"
          >
            <div class="flex gap-3">
              <!-- รูปสินค้า -->
              <div class="flex-shrink-0">
                <Image
                  v-if="getProductImage(product.id)"
                  :src="getProductImage(product.id)"
                  :alt="product.name || 'Product'"
                  width="80"
                  preview
                  class="rounded"
                />
                <div
                  v-else
                  class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center"
                >
                  <i class="pi pi-image text-gray-400 text-2xl"></i>
                </div>
              </div>

              <!-- ข้อมูลสินค้า -->
              <div class="flex-1 space-y-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-[600]! text-lg text-gray-900">{{ product.name || '-' }}</h3>
                </div>
                <div class="grid grid-cols-2 gap-1 text-sm">
                  <div>
                    <Tag :value="getProductCategory(product.id)" severity="success" size="small" class="text-xs" />
                  </div>
                  <div class="flex items-center">
                    <span class="text-gray-600 font-medium!">ราคาต่อหน่วย:</span>
                    <span class="font-medium! text-gray-900 ml-1">{{
                      formatCurrency(product.price || 0)
                    }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">จำนวน:</span>
                    <span class="font-medium! text-gray-900 ml-1">{{ product.quantity || 0 }}</span>
                  </div>

                  <div>
                    <span class="text-gray-600">รวม:</span>
                    <span class="font-medium! text-green-600 ml-1">{{
                      formatCurrency((product.price || 0) * (product.quantity || 1))
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- รูปสลิปและใบขนส่ง -->
      <div v-if="hasSlip || hasShippingSlip" class="space-y-3 pt-3 border-t border-gray-200">
        <div class="flex flex-wrap gap-3">
          <div v-if="hasSlip" class="space-y-1">
            <p class="text-sm text-gray-900">รูปสลิปโอนเงิน</p>
            <Image :src="slipUrl" alt="Slip" width="150" preview />
          </div>
          <div v-if="hasShippingSlip" class="space-y-1">
            <p class="text-sm text-gray-900">รูปใบเสร็จการจัดส่ง</p>
            <Image
              :src="shippingSlipUrl"
              alt="Shipping Slip"
              width="150"
              preview
            />
          </div>
        </div>
      </div>

      <!-- ที่อยู่จัดส่ง -->
      <div class="pt-3 border-t border-gray-200">
        <div v-if="sale.shippingAddress" class="mb-3">
          <h5 class="text-sm font-semibold text-gray-700 mb-0.5">ที่อยู่จัดส่ง:</h5>
          <p class="text-sm text-gray-900 bg-gray-50 rounded-lg p-2">
            {{ sale.shippingAddress }}
            <span v-if="sale?.shippingProvince" class="text-gray-600">
              , {{ memberStore.provinceOptions.find((option) => option.value === sale?.shippingProvince)?.label }}
            </span>
          </p>
        </div>
        <h5 class="text-sm font-semibold text-gray-700">
          ผู้ขาย: {{ getSellerName(sale.seller) }}
        </h5>
      </div>

      <!-- สรุปยอดรวม -->
      <div class="pt-3 border-t border-gray-200">
        <h5 class="text-sm font-semibold text-gray-700 mb-2">สรุปยอดรวม:</h5>
        <div class="bg-gray-50 rounded-lg p-3 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">ยอดรวม:</span>
            <span class="font-medium text-gray-900">{{ formatCurrency(totalAmount) }}</span>
          </div>
          <div v-if="sale.discount > 0" class="flex justify-between text-sm">
            <span class="text-gray-600">ส่วนลด:</span>
            <span class="font-medium text-red-600">-{{ formatCurrency(sale.discount) }}</span>
          </div>
          <div v-if="sale.deliveryNo > 0" class="flex justify-between text-sm">
            <span class="text-gray-600">ค่าจัดส่ง:</span>
            <span class="font-medium text-gray-900">{{ formatCurrency(sale.deliveryNo) }}</span>
          </div>
          <div class="flex justify-between text-sm pt-2 border-t border-gray-300">
            <span class="font-semibold text-gray-900">ยอดสุทธิ:</span>
            <span class="font-bold text-green-600 text-base">{{
              formatCurrency(calculateSaleTotal)
            }}</span>
          </div>
        </div>
      </div>

      <!-- วันที่และหมายเหตุ -->
      <div class="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 text-sm">
        <div>
          <span class="text-gray-600">วันที่:</span>
          <span class="font-medium text-gray-900 ml-1">
            {{ dayjs(sale.cat).format('DD/MM/YYYY HH:mm:ss') }}
          </span>
        </div>
        <div>
          <span class="text-gray-600">หมายเหตุ:</span>
          <span class="font-medium text-gray-600 ml-1">{{ sale.note || '-' }}</span>
        </div>
      </div>
    </div>
  </Panel>
  <div v-else class="text-sm text-gray-500 p-4 bg-gray-50 rounded">
    ไม่พบข้อมูลรายการขาย (ID: {{ saleId }})
  </div>
</template>

