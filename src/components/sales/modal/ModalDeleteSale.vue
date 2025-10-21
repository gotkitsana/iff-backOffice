<script setup lang="ts">
import { computed } from 'vue'
import { useSalesStore } from '@/stores/sales/sales'
import { Dialog, Button } from 'primevue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import type { ISales } from '@/types/sales'

const props = defineProps<{
  showDeleteModal: boolean
  saleData: ISales | null
}>()

const emit = defineEmits<{
  (e: 'onCloseDeleteModal'): void
}>()

const showDeleteModal = computed({
  get: () => props.showDeleteModal,
  set: (value: boolean) => {
    if (!value) {
      closeDeleteModal()
    }
  },
})

const closeDeleteModal = () => {
  emit('onCloseDeleteModal')
}

const queryClient = useQueryClient()
const salesStore = useSalesStore()
const { mutate, isPending } = useMutation({
  mutationFn: (payload: string) => salesStore.onDeleteSales(payload),
  onSuccess: (data: any) => {
    console.log(data)
    if (data.data.deletedCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['get_sales'] })
      toast.success('ลบรายการขายสำเร็จ')
      closeDeleteModal()
    } else {
      toast.error('ลบรายการขายไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('เกิดข้อผิดพลาดในการลบรายการขาย')
  },
})
</script>

<template>
  <Dialog
    v-model:visible="showDeleteModal"
    @update:visible="closeDeleteModal"
    modal
    header="ยืนยันการลบรายการขาย"
    :style="{ width: '32rem' }"
    :pt="{
      header: 'p-4',
      title: 'text-lg font-semibold!',
    }"
  >
    <div class="flex items-start space-x-3">
      <i class="pi pi-exclamation-triangle text-red-500 !text-3xl mt-1"></i>
      <div class="flex-1">
        <p class="font-[500]! text-gray-700 mb-2">
          คุณต้องการลบรายการขายนี้หรือไม่?
        </p>
        <div v-if="saleData" class="bg-gray-50 rounded-lg p-3 space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600">เลขรายการ:</span>
            <span class="font-medium text-gray-900">{{ saleData.item }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">ลูกค้า:</span>
            <span class="font-medium text-gray-900">{{ saleData.user.name || saleData.user.displayName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">จำนวนสินค้า:</span>
            <span class="font-medium text-gray-900">{{ saleData.products.length }} รายการ</span>
          </div>
        </div>
        <p class="text-sm text-red-600 mt-2">
          ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="closeDeleteModal"
          severity="secondary"
          size="small"
        />
        <Button
          label="ลบรายการขาย"
          icon="pi pi-trash"
          @click="mutate(saleData?._id || '')"
          :loading="isPending"
          :disabled="!saleData?._id"
          severity="danger"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
