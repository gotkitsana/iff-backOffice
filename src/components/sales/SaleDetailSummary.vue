<script setup lang="ts">
import { computed } from 'vue'
import { Tag } from 'primevue'
import { useMemberStore } from '@/stores/member/member'
import { useSalesStore } from '@/stores/sales/sales'
import type { ISales } from '@/types/sales'
import type { IMember } from '@/stores/member/member'
import formatCurrency from '@/utils/formatCurrency'
import BankData from '@/config/BankData'
import { useAdminStore, type IAdmin } from '@/stores/admin/admin'
import { useQuery } from '@tanstack/vue-query'

const props = defineProps<{
  saleData: ISales
  member?: IMember | null
}>()

const memberStore = useMemberStore()
const salesStore = useSalesStore()
const adminStore = useAdminStore()
const { data: admins } = useQuery<IAdmin[]>({
  queryKey: ['get_admins'],
  queryFn: () => adminStore.onGetAdmins(),
})
const handleFindAdmin = (id: string | null | undefined): IAdmin | undefined => {
  if (!id) return undefined
  return admins.value?.find((admin) => admin._id === id)
}
const currentStatusInfo = computed(() => {
  return salesStore.statusWorkflow[props.saleData.status as keyof typeof salesStore.statusWorkflow]
})

const totalAmount = computed(() => {
  return props.saleData.products
    ? props.saleData.products.reduce((total, product) => {
        return total + (product.price || 0) * (product.quantity || 1)
      }, 0)
    : 0
})

const finalAmount = computed(() => {
  return totalAmount.value - props.saleData.discount - (props.saleData.deliveryNo || 0)
})

const memberName = computed(() => {
  return props.member?.name || props.saleData.user.name || props.saleData.user.displayName || '-'
})

const memberCode = computed(() => {
  return props.member?.code || props.saleData.user.code || '-'
})

const memberPhone = computed(() => {
  return props.member?.phone || '-'
})

const memberAddress = computed(() => {
  const address = props.member?.address || '-'
  const province = props.member?.province
    ? memberStore.provinceOptions.find((opt) => opt.value === props.member?.province)?.label
    : '-'
  return `${address}, ${province}`
})

const bankName = computed(() => {
  if (!props.saleData.bankCode) return '-'
  return BankData[props.saleData.bankCode]?.fullname || props.saleData.bankCode
})


</script>

<template>
  <div class="space-y-4">
    <!-- Customer Information -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <i class="pi pi-user text-blue-600"></i>
        ข้อมูลลูกค้า
      </h4>
      <div
        v-if="member || saleData.user"
        class="p-4 bg-green-50 border border-green-200 rounded-lg"
      >
        <div class="flex items-center gap-3">
          <div class="md:flex hidden w-14 h-14 bg-green-100 rounded-lg items-center justify-center">
            <i class="pi pi-user text-green-600 text-xl"></i>
          </div>
          <div class="flex-1">
            <h5 class="font-semibold text-gray-900">{{ memberName }}</h5>
            <p class="text-sm text-gray-600">
              รหัส: <span class="capitalize">{{ memberCode }}</span> | ชื่อเล่น:
              {{ saleData.user.displayName || '-' }} | เบอร์: {{ memberPhone }}
            </p>
            <p class="text-xs text-gray-500 mt-0.5">ที่อยู่: {{ memberAddress }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Information -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <i class="pi pi-shopping-cart text-indigo-600"></i>
        ข้อมูลการสั่งซื้อ
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-gray-600 mb-1">รหัสรายการ</div>
          <div class="font-semibold text-gray-900">{{ saleData.item }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600 mb-1">สถานะปัจจุบัน</div>
          <Tag
            :value="currentStatusInfo?.label"
            :severity="currentStatusInfo?.color"
            size="small"
          />
        </div>
        <div>
          <div class="text-sm text-gray-600 mb-1">ผู้ขาย</div>
          <div class="font-medium text-gray-900">{{ handleFindAdmin(saleData.seller)?.name || '-' }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600 mb-1">วันที่สั่งซื้อ</div>
          <div class="font-medium text-gray-900">
            {{ new Date(saleData.cat).toLocaleDateString('th-TH') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Information -->
    <div
      v-if="saleData.bankCode || saleData.payment"
      class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
    >
      <h4 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <i class="pi pi-credit-card text-green-600"></i>
        ข้อมูลการชำระเงิน
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-gray-600 mb-1">วิธีการชำระเงิน</div>
          <div class="font-medium text-gray-900">
            {{ saleData.payment === 'transfer' ? 'โอนเงิน' : 'อื่นๆ' }}
          </div>
        </div>
        <div v-if="saleData.bankCode">
          <div class="text-sm text-gray-600 mb-1">ธนาคาร</div>
          <div class="font-medium text-gray-900">{{ bankName }}</div>
        </div>
        <div v-if="saleData.bankAccount">
          <div class="text-sm text-gray-600 mb-1">เลขบัญชี</div>
          <div class="font-medium text-gray-900">{{ saleData.bankAccount }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

