<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Tag, Button } from 'primevue'
import { useSalesStore } from '../../../stores/sales/sales'
import type { ISales } from '../../../types/sales'
import dayjs from 'dayjs'
import { useMemberStore, type IMember } from '../../../stores/member/member'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/auction/category'

// Props
const props = defineProps<{
  visible: boolean
  saleData: ISales
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const salesStore = useSalesStore()
const memberStore = useMemberStore()

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

const formatDateForInvoice = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// Computed properties
const currentStatusInfo = computed(() => {
  return salesStore.statusWorkflow[props.saleData.status]
})

const totalAmount = computed(() => {
  return props.saleData.products.reduce((total, product) => {
    return total + (product.price || 0) * product.quantity
  }, 0)
})

const finalAmount = computed(() => {
  return totalAmount.value - props.saleData.discount
})

const paymentMethodLabel = computed(() => {
  const methods = {
    cash: 'เงินสด',
    transfer: 'โอนเงิน',
    credit: 'เครดิต',
    promptpay: 'พร้อมเพย์',
    other: 'อื่นๆ',
  }
  return methods[props.saleData.payment] || 'ไม่ระบุ'
})

// Handlers
const handleClose = () => {
  emit('update:visible', false)
}

const handlePrintInvoice = () => {
  // สร้างหน้าต่างใหม่สำหรับพิมพ์
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const invoiceContent = generateInvoiceHTML()
  printWindow.document.write(invoiceContent)
  printWindow.document.close()
  printWindow.print()
}

const { data: members } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})
const findMemberData = (id: string) => {
  if (!members.value) return null
  return members.value.find((member) => member._id === id)
}

const generateInvoiceHTML = () => {
  const currentDate = formatDateForInvoice(new Date())

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ใบแจ้งหนี้ - ${props.saleData.item}</title>
      <style>
        body {
          font-family: 'Sarabun', sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .logo-section {
          text-align: left;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 5px;
        }
        .company-name {
          font-size: 14px;
          color: #666;
        }
        .invoice-title {
          background: #e3f2fd;
          padding: 10px 20px;
          border-radius: 5px;
          text-align: center;
          font-weight: bold;
          color: #1976d2;
        }
        .invoice-info {
          text-align: right;
        }
        .customer-section {
          margin-bottom: 30px;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
        }
        .customer-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        .customer-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          font-size: 14px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
          font-size: 14px;
        }
        .items-table th {
          background: #f8f9fa;
          font-weight: bold;
        }
        .items-table .text-center {
          text-align: center;
        }
        .items-table .text-right {
          text-align: right;
        }
        .summary-section {
          margin-top: 20px;
          text-align: right;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .summary-total {
          font-weight: bold;
          font-size: 18px;
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
        }
        .signature-section {
          display: flex;
          justify-content: space-around;
          margin-top: 30px;
          align-items: flex-end;
        }
        .signature-box {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .signature-dots {
          border-bottom: 1px dotted #333;
          width: 150px;
          height: 15px;
          margin-bottom: 8px;
        }
        .signature-parentheses {
          font-size: 16px;
          color: #333;
          margin-bottom: 8px;
          font-weight: normal;
          min-width: 150px;
          text-align: center;
        }
        .signature-label {
          font-weight: bold;
          color: #333;
          font-size: 14px;
        }
        @media print {
          body { margin: 0; }
          .invoice-container { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="logo">iff</div>
            <div class="company-name">INTER FISH FARM</div>
            <div class="company-name">อินเตอร์ พิชฟาร์ม</div>
          </div>
          <div class="invoice-title">INVOICE/ใบแจ้งหนี้</div>
          <div class="invoice-info">
            <div><strong>ห้างหุ้นส่วนจำกัด อินเตอร์ ฟิช ฟาร์ม</strong></div>
            <div>Inter Fish Farm Part., Ltd (HEAD OFFICE)</div>
            <div style="margin-top: 15px;">
              <div>รหัสใบแจ้งหนี้: <strong>${props.saleData.item}</strong></div>
              <div>วันที่ออกใบแจ้งหนี้: <strong>${currentDate}</strong></div>
            </div>
          </div>
        </div>

        <!-- Customer Information -->
        <div class="customer-section">
            <div class="customer-title">ข้อมูลลูกค้า</div>
            <div class="customer-details">
              <div>ชื่อลูกค้า: ${
                props.saleData.user.name || props.saleData.user.displayName
              }</div>
              <div>รหัสลูกค้า: ${
                props.saleData.user.code.charAt(0).toUpperCase() + props.saleData.user.code.slice(1)
              }</div>
              <div>ที่อยู่: ${findMemberData(props.saleData.user._id)?.address}, ${memberStore.provinceOptions.find((option) => option.value === findMemberData(props.saleData.user._id)?.province)?.label || '-'}</div>
              <div>เบอร์โทร: ${findMemberData(props.saleData.user._id)?.phone}</div>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>ลำดับที่</th>
              <th>รายการ</th>
              <th class="text-center">จำนวน</th>
              <th class="text-right">ราคา/หน่วย</th>
              <th class="text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${props.saleData.products
              .map(
                (product, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${product.name}</td>
                <td class="text-center">${product.quantity}</td>
                <td class="text-right">${formatCurrency(product.price || 0)}</td>
                <td class="text-right">${formatCurrency(
                  (product.price || 0) * product.quantity
                )}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <!-- Summary -->
        <div class="summary-section">
          <div class="summary-row">
            <span>ยอดรวม:</span>
            <span>${formatCurrency(totalAmount.value)}</span>
          </div>
          <div class="summary-row">
            <span>มัดจำ:</span>
            <span>${formatCurrency(props.saleData.deposit)}</span>
          </div>
          <div class="summary-row">
            <span>ส่วนลด:</span>
            <span>${formatCurrency(props.saleData.discount)}</span>
          </div>
          <div class="summary-row summary-total">
            <span>จำนวนเงินรวมทั้งสิ้น:</span>
            <span>${formatCurrency(finalAmount.value)}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div style="margin-bottom: 20px;">
            <strong>หมายเหตุ: เงื่อนไขการสั่งซื้อและชำระเงิน</strong>
          </div>
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-dots"></div>
              <div class="signature-parentheses">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
              <div class="signature-label">ผู้รับสินค้า</div>
            </div>
            <div class="signature-box">
              <div class="signature-dots"></div>
              <div class="signature-parentheses">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
              <div class="signature-label">ผู้ชำระเงิน</div>
            </div>
            <div class="signature-box">
              <div class="signature-dots"></div>
              <div class="signature-parentheses">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
              <div class="signature-label">ผู้รับเงิน</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

const findMemberStatusTag = (status: string) => {
  return memberStore.memberStatusOptions.find((option) => option.value === status)
}
const findMemberStatusSeverity = (status: string) => {
  return memberStore.getStatusTag(status)
}
const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(),
})
const handleFindCategory = (id: string | null | undefined) => {
  if (!id) return ''
  return categories.value?.find((category) => category._id === id)?.name
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '70rem' }"
    :breakpoints="{ '1199px': '95vw', '575px': '95vw' }"
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
          <p class="text-sm text-gray-600">เลขที่: {{ saleData?.item }}</p>
        </div>
      </div>
    </template>

    <div v-if="saleData" class="space-y-6">
      <!-- Sale Header -->
      <div class="text-center border-b border-gray-200 pb-4">
        <h2 class="text-2xl font-bold text-gray-900">รายละเอียดการขาย</h2>
        <p class="text-gray-600">เลขที่: {{ saleData.item }}</p>
        <p class="text-gray-600">วันที่: {{ formatDate(dayjs(saleData.cat).toDate()) }}</p>
      </div>

      <!-- Customer and Order Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-50/95 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-user text-green-600"></i>
            ข้อมูลลูกค้า
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">รหัสลูกค้า:</span>
              <span class="font-medium capitalize">{{ saleData.user.code }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ชื่อ-สกุล:</span>
              <span class="font-medium">{{ saleData.user.name || saleData.user.displayName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ชื่อเล่น:</span>
              <span class="font-medium">{{ saleData.user.displayName || '-' }}</span>
            </div>
            <!-- <div class="flex justify-between">
              <span class="text-gray-600">ประเภทลูกค้า:</span>
              <Tag :value="saleData.user.type" severity="info" size="small" />
            </div> -->
            <div class="flex justify-between">
              <span class="text-gray-600">สถานะ:</span>
              <Tag
                :value="findMemberStatusTag(saleData.user.status)?.label"
                :severity="findMemberStatusSeverity(saleData.user.status)"
                size="small"
              />
            </div>
          </div>
        </div>

        <div class="bg-gray-50/95 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-shopping-cart text-blue-600"></i>
            ข้อมูลการสั่งซื้อ
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">ผู้ขาย:</span>
              <span class="font-medium">{{ saleData.seller }}</span>
            </div>
            <!-- <div class="flex justify-between">
              <span class="text-gray-600">วิธีการชำระเงิน:</span>
              <Tag :value="paymentMethodLabel" severity="success" size="small" />
            </div> -->
            <div class="flex justify-between">
              <span class="text-gray-600">สถานะการขาย:</span>
              <Tag
                :value="currentStatusInfo?.label"
                :severity="currentStatusInfo?.color"
                size="small"
              />
            </div>
            <!-- <div class="flex justify-between">
              <span class="text-gray-600">สถานะการจัดส่ง:</span>
              <Tag :value="saleData.deliveryStatus" severity="warning" size="small" />
            </div> -->
          </div>
        </div>
      </div>

      <!-- Products Details -->
      <div class="bg-gray-50/95 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-box text-purple-600"></i>
          รายการสินค้า
        </h4>
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900">ลำดับ</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900">รายการ</th>
                <th class="px-4 py-2 text-center text-sm font-medium text-gray-900">จำนวน</th>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-900">ราคา/หน่วย</th>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-900">รวม</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(product, index) in saleData.products"
                :key="product.id"
                class="border-t border-gray-200"
              >
                <td class="px-4 py-2 text-sm text-gray-900">{{ index + 1 }}</td>
                <td class="px-4 py-2 text-sm text-gray-900">
                  <div>
                    <div class="font-medium!">{{ product.name }}</div>
                    <div class="text-xs text-gray-600">หมวดหมู่: {{ salesStore.categoryTypes.find((t) => t.value === handleFindCategory(product.category))?.label || '-' }}</div>
                  </div>
                </td>
                <td class="px-4 py-2 text-center text-sm text-gray-900">
                  {{ product.quantity }}
                </td>
                <td class="px-4 py-2 text-right text-sm text-gray-900">
                  {{ formatCurrency(product.price || 0) }}
                </td>
                <td class="px-4 py-2 text-right text-sm text-gray-900">
                  {{ formatCurrency((product.price || 0) * product.quantity) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pricing Summary -->
      <div class="bg-gray-50/95 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-calculator text-yellow-600"></i>
          สรุปราคา
        </h4>
        <div class="grid grid-cols-1 gap-4">
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">ยอดรวมสินค้า:</span>
              <span class="font-medium text-lg">{{ formatCurrency(totalAmount) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">มัดจำ:</span>
              <span class="font-medium text-blue-600">{{ formatCurrency(saleData.deposit) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">ส่วนลด:</span>
              <span class="font-medium text-red-600">{{ formatCurrency(saleData.discount) }}</span>
            </div>
            <div class="border-t border-gray-300 pt-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-900 font-semibold text-lg">ยอดสุทธิ:</span>
                <span class="font-bold text-green-600 text-xl">{{
                  formatCurrency(finalAmount)
                }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <span class="text-gray-500">วันที่สร้าง:</span>
              <span class="font-medium! text-gray-500">{{
                formatDate(dayjs(saleData.cat).toDate())
              }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500">วันที่อัปเดต:</span>
              <span class="font-medium! text-gray-500">{{
                formatDate(dayjs(saleData.uat).toDate())
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Information -->
      <div v-if="saleData.payment === 'transfer'" class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-credit-card text-indigo-600"></i>
          ข้อมูลการโอนเงิน
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex justify-between">
            <span class="text-gray-600">รหัสธนาคาร:</span>
            <span class="font-medium">{{ saleData.bankCode || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">บัญชีธนาคาร:</span>
            <span class="font-medium">{{ saleData.bankAccount || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="saleData.note" class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <i class="pi pi-file-edit text-purple-600"></i>
          หมายเหตุ
        </h4>
        <p class="text-sm text-gray-700 bg-white p-3 rounded">{{ saleData.note }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center gap-3">
        <Button
          label="พิมพ์ใบแจ้งหนี้"
          icon="pi pi-print"
          @click="handlePrintInvoice"
          severity="success"
          size="small"
        />

        <div class="flex gap-3">
          <Button
            label="ปิด"
            icon="pi pi-times"
            severity="secondary"
            @click="handleClose"
            size="small"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>
