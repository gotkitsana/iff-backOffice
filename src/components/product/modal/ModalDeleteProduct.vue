<script setup lang="ts">
import { Dialog, Button } from 'primevue'
import { useProductStore, type IProduct } from '../../../stores/product/product'
import { toast } from 'vue3-toastify'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue';

// Props
const props = defineProps<{
  visible: boolean
  productData: IProduct | null
}>()

// Emits
const emit = defineEmits<{
  'close-delete-modal': []
}>()

// Stores
const productStore = useProductStore()
const queryClient = useQueryClient()

// Delete mutation
const selectedCategoryId = computed(() => props.productData?.category?._id)
const { mutate: deleteProduct, isPending: isDeletingProduct } = useMutation({
  mutationFn: (productId: string) => productStore.onDeleteProduct(productId),
  onSuccess: (data: any) => {
    if (data.data.deletedCount > 0) {
      toast.success('ลบสินค้าสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_products'] })
      queryClient.invalidateQueries({ queryKey: ['get_products_by_category', selectedCategoryId] })
      handleClose()
    } else {
      toast.error(data.error?.message || 'ลบสินค้าไม่สำเร็จ')
    }
  },
  onError: (error: any) => {
    console.error('Delete error:', error)
    toast.error(error.response?.data?.message || 'ลบสินค้าไม่สำเร็จ')
  },
})

// Handlers
const handleDelete = () => {
  if (!props.productData) {
    toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า')
    return
  }

  deleteProduct(props.productData._id)
}

const handleClose = () => {
  emit('close-delete-modal')
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '35rem' }"
    :breakpoints="{ '1199px': '70vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-trash text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">ลบสินค้า</h3>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
        <p class="text-gray-800 font-medium text-lg">คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?</p>
      </div>
      <div class="space-y-2">
          <div v-if="productData" class="bg-gray-50 rounded-lg p-3 space-y-1">
            <p class="text-sm text-gray-600">
              <span class="font-medium">ชื่อสินค้า:</span> {{ productData?.brand?.name || productData?.species?.name || productData?.name || '-' }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-medium">รหัส:</span> {{ productData.sku }}
            </p>
            <p v-if="productData.category" class="text-sm text-gray-600">
              <span class="font-medium">หมวดหมู่:</span> {{ productData.category.name }}
            </p>
            <p v-if="productData.price" class="text-sm text-gray-600">
              <span class="font-medium">ราคา:</span> {{ productData.price.toLocaleString() }} บาท
            </p>
          </div>
          <p class="text-sm text-red-600 flex items-center gap-1">
            <i class="pi pi-info-circle mr-1"></i>
            การดำเนินการนี้ไม่สามารถยกเลิกได้
          </p>
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
          :disabled="isDeletingProduct"
        />
        <Button
          label="ลบสินค้า"
          icon="pi pi-trash"
          severity="danger"
          @click="handleDelete"
          size="small"
          :loading="isDeletingProduct"
        />
      </div>
    </template>
  </Dialog>
</template>
