<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Tag, Button } from 'primevue'
import { useSalesStore } from '@/stores/sales/sales';

// Props
const props = defineProps<{
  visible: boolean
  saleData: any
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'edit-sale': [sale: any]
}>()

const salesStore = useSalesStore()
// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

// Handlers
const handleClose = () => {
  emit('update:visible', false)
}

const handleEdit = () => {
  emit('edit-sale', props.saleData)
  handleClose()
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
          <i class="pi pi-eye text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">รายละเอียดการขาย</h3>
          <p class="text-sm text-gray-600">{{ saleData?.orderNumber }}</p>
        </div>
      </div>
    </template>

    <div v-if="saleData" class="space-y-6">
      <!-- Sale Header -->
      <div class="text-center border-b border-gray-200 pb-4">
        <h2 class="text-2xl font-bold text-gray-900">รายละเอียดการขาย</h2>
        <p class="text-gray-600">เลขที่: {{ saleData.orderNumber }}</p>
        <p class="text-gray-600">วันที่: {{ formatDate(saleData.saleDate) }}</p>
      </div>

      <!-- Customer and Product Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-user text-green-600"></i>
            ข้อมูลลูกค้า
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">รหัสลูกค้า:</span>
              <span class="font-medium">{{ saleData.customerCode }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ชื่อ-สกุล:</span>
              <span class="font-medium">{{ saleData.customerName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ชื่อเล่น:</span>
              <span class="font-medium">{{ saleData.customerNickname || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">เบอร์โทร:</span>
              <span class="font-medium">{{ saleData.customerPhone || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">อีเมล:</span>
              <span class="font-medium">{{ saleData.customerEmail || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ที่อยู่:</span>
              <span class="font-medium">{{ saleData.customerAddress || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">จังหวัด:</span>
              <span class="font-medium">{{ saleData.customerProvince || '-' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">ประเภทลูกค้า:</span>
              <Tag :value="saleData.customerType" severity="info" size="small" />
            </div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-fish text-blue-600"></i>
            ข้อมูลสินค้า
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">หมวดหมู่:</span>
              <Tag :value="saleData.productCategory" severity="success" size="small" />
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ประเภท:</span>
              <Tag :value="saleData.productType" severity="secondary" size="small" />
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">รายการ:</span>
              <span class="font-medium">{{ saleData.productName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">จำนวน:</span>
              <span class="font-medium">{{ saleData.quantity }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ผู้ขาย:</span>
              <span class="font-medium">{{ saleData.seller }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Details -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-dollar text-yellow-600"></i>
          รายละเอียดราคา
        </h4>
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900">รายการ</th>
                <th class="px-4 py-2 text-center text-sm font-medium text-gray-900">จำนวน</th>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-900">ราคา</th>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-900">รวม</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-gray-200">
                <td class="px-4 py-2 text-sm text-gray-900">{{ saleData.productName }}</td>
                <td class="px-4 py-2 text-center text-sm text-gray-900">
                  {{ saleData.quantity }}
                </td>
                <td class="px-4 py-2 text-right text-sm text-gray-900">
                  {{ formatCurrency(saleData.unitPrice) }}
                </td>
                <td class="px-4 py-2 text-right text-sm text-gray-900">
                  {{ formatCurrency(saleData.unitPrice * saleData.quantity) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td colspan="3" class="px-4 py-2 text-right text-sm font-medium text-gray-900">
                  ยอดรวมก่อนส่วนลด:
                </td>
                <td class="px-4 py-2 text-right text-sm font-medium text-gray-900">
                  {{ formatCurrency(saleData.totalPrice) }}
                </td>
              </tr>
              <tr>
                <td colspan="3" class="px-4 py-2 text-right text-sm font-medium text-gray-900">
                  มัดจำ:
                </td>
                <td class="px-4 py-2 text-right text-sm font-medium text-blue-600">
                  {{ formatCurrency(saleData.deposit) }}
                </td>
              </tr>
              <tr>
                <td colspan="3" class="px-4 py-2 text-right text-sm font-medium text-gray-900">
                  ส่วนลด:
                </td>
                <td class="px-4 py-2 text-right text-sm font-medium text-red-600">
                  -{{ formatCurrency(saleData.discount) }}
                </td>
              </tr>
              <tr class="border-t-2 border-gray-300">
                <td colspan="3" class="px-4 py-2 text-right text-lg font-bold text-gray-900">
                  ยอดสุทธิหลังส่วนลด:
                </td>
                <td class="px-4 py-2 text-right text-lg font-bold text-green-600">
                  {{ formatCurrency(saleData.netAmount) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Status and Payment Info -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 mb-2">วิธีการชำระเงิน</h4>
          <Tag
            :value="salesStore.getPaymentMethodTag(saleData.paymentMethod).label"
            :severity="salesStore.getPaymentMethodTag(saleData.paymentMethod).severity"
            size="small"
          />
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 mb-2">สถานะการขาย</h4>
          <Tag
            :value="salesStore.getStatusTag(saleData.status).label"
            :severity="salesStore.getStatusTag(saleData.status).severity"
            size="small"
          />
        </div>
      </div>

      <!-- Notes -->
      <div v-if="saleData.notes" class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <i class="pi pi-file-edit text-purple-600"></i>
          หมายเหตุ
        </h4>
        <p class="text-sm text-gray-700">{{ saleData.notes }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
        <Button
          label="แก้ไข"
          icon="pi pi-pencil"
          @click="handleEdit"
          severity="info"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
