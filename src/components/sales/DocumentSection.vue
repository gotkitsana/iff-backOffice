<script setup lang="ts">
import { Image as PrimeImage } from 'primevue'
import SlipUploadSection from './SlipUploadSection.vue'
import ShippingSlipUploadSection from './ShippingSlipUploadSection.vue'

// Props
const props = defineProps<{
  hasSlip: boolean
  hasShippingSlip: boolean
  slipUrl: string
  shippingSlipUrl: string
  showSummary: boolean
  showDetailed: boolean
  showSlipUpload: boolean
  showShippingSlipUpload: boolean
  saleId: string
  currentStatusString: string
  isSubmitting: boolean
  skipShippingSlipUpload: boolean
  requireShippingSlipUpload: boolean
  delivery?: string
  isReadOnly: boolean
  currentStatus?: string
}>()

// Emits
const emit = defineEmits<{
  'slip-status-changed': [status: boolean]
  'slip-pending-upload': [isPending: boolean]
  'slip-uploaded': [saleId: string]
  'shipping-slip-status-changed': [status: boolean]
  'shipping-slip-pending-upload': [isPending: boolean]
  'shipping-slip-uploaded': [saleId: string]
  'skip-upload-changed': [skip: boolean]
  'require-upload-changed': [require: boolean]
  'delivery-changed': [delivery: string]
}>()
</script>

<template>
  <div v-if="showSlipUpload || showShippingSlipUpload" class="space-y-4">
    <!-- Summary View -->
    <div v-if="showSummary" class="space-y-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h4 class="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
          <i class="pi pi-file text-blue-600 text-xs"></i>
          เอกสารการชำระเงินและการจัดส่ง
        </h4>
        <div class="flex flex-wrap gap-4">
          <!-- Slip Summary -->
          <div v-if="hasSlip" class="space-y-2">
            <div class="text-xs font-medium text-gray-700">สลิปการโอนเงิน</div>
            <div class="relative">
              <PrimeImage
                :src="slipUrl"
                :alt="'สลิปการโอนเงิน'"
                :preview="true"
                class="max-w-[120px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
              />
            </div>
          </div>
          <div v-else class="space-y-2">
            <div class="text-xs font-medium text-gray-700">สลิปการโอนเงิน</div>
            <div class="text-xs text-gray-500 italic">ไม่มีสลิป</div>
          </div>

          <!-- Shipping Slip Summary -->
          <div v-if="hasShippingSlip" class="space-y-2">
            <div class="text-xs font-medium text-gray-700">ใบเสร็จการขนส่ง</div>
            <div class="relative">
              <PrimeImage
                :src="shippingSlipUrl"
                :alt="'ใบเสร็จการขนส่ง'"
                :preview="true"
                class="max-w-[120px] object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
              />
            </div>
          </div>
          <div v-else class="space-y-2">
            <div class="text-xs font-medium text-gray-700">ใบเสร็จการขนส่ง</div>
            <div class="text-xs text-gray-500 italic">ไม่มีใบเสร็จ</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed View -->
    <div v-if="showDetailed">
      <div v-if="currentStatus === 'preparing' || currentStatusString === 'preparing'" class="mb-4">
        <div
          class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <i class="pi pi-check-circle text-white text-lg"></i>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-green-900 mb-1">สลิปการโอนเงินยืนยันแล้ว</h4>
              <p class="text-sm text-green-700">
                กรุณาอัปโหลดใบเสร็จการขนส่งเพื่อดำเนินการจัดส่งสินค้า
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <SlipUploadSection
          v-if="showSlipUpload"
          :sale-id="saleId"
          :selected-status="currentStatusString"
          :is-current-status="currentStatusString"
          :is-submitting="isSubmitting"
          @slip-status-changed="emit('slip-status-changed', $event)"
          @slip-pending-upload="emit('slip-pending-upload', $event)"
          @slip-uploaded="emit('slip-uploaded', $event)"
        />

        <ShippingSlipUploadSection
          v-if="showShippingSlipUpload"
          :sale-id="saleId"
          :selected-status="currentStatusString"
          :is-current-status="currentStatusString"
          :is-submitting="isSubmitting"
          :skip-upload="skipShippingSlipUpload"
          :require-upload="requireShippingSlipUpload"
          :delivery="delivery"
          :is-read-only="isReadOnly"
          @shipping-slip-status-changed="emit('shipping-slip-status-changed', $event)"
          @shipping-slip-pending-upload="emit('shipping-slip-pending-upload', $event)"
          @shipping-slip-uploaded="emit('shipping-slip-uploaded', $event)"
          @skip-upload-changed="emit('skip-upload-changed', $event)"
          @require-upload-changed="emit('require-upload-changed', $event)"
          @delivery-changed="emit('delivery-changed', $event)"
        />
      </div>
    </div>
  </div>
</template>

