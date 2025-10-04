<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Dialog, Textarea, Button } from 'primevue'
import { useAuctionStore, type IContentPayload } from '@/stores/auction/auction'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'

const props = defineProps<{
  showAddContentModal: boolean
}>()

const emit = defineEmits<{
  (e: 'onCloseAddContentModal'): void
}>()

const showAddContentModal = computed({
  get: () => props.showAddContentModal,
  set: (value: boolean) => {
    if (!value) {
      closeAddContentModal()
    }
  },
})

const closeAddContentModal = () => {
  emit('onCloseAddContentModal')
}

const auctionStore = useAuctionStore()
const { data, isLoading, refetch } = useQuery<IContentPayload>({
  queryKey: ['get_auction_content'],
  queryFn: () => auctionStore.onGetAuctionContent(),
})

console.log(data)
const form = ref({
  content: '',
})

watch(data, (newVal) => {
  if (newVal) {
      form.value.content = newVal.content
    }
  },
  { immediate: true }
)

const isSubmitting = ref(false)
const handleAddContent = () => {
  isSubmitting.value = true
  if (!form.value.content) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }
  mutate(form.value)
}

const { mutate, isPending } = useMutation({
  mutationFn: (payload: IContentPayload) => auctionStore.onCreateAuctionContent(payload),
  onSuccess: (data: any) => {
    isSubmitting.value = false
    form.value.content = ''
    toast.success(data.message || 'เพิ่มประกาศสำเร็จ')
    closeAddContentModal()
    refetch()
  },
  onError: (error: any) => {
    isSubmitting.value = false
    toast.error(error.message || 'เพิ่มประกาศไม่สำเร็จ')
  },
})
</script>

<template>
  <Dialog
    v-model:visible="showAddContentModal"
    @update:visible="closeAddContentModal"
    modal
    header="เพิ่มประกาศ"
    :style="{ width: '40rem' }"
    :breakpoints="{ '1199px': '80vw', '575px': '95vw' }"
    :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
  >
    <div>
      <label class="block text-sm font-[500]! text-gray-700 mb-1">ข้อความประกาศ *</label>
      <Textarea
        v-model="form.content"
        placeholder="กรุณาใส่ข้อความประกาศ"
        rows="5" cols="50"
        :invalid="!form.content && isSubmitting"
        fluid
        size="small"
      />
      <small v-if="!form.content && isSubmitting" class="text-red-500"
        >กรุณาใส่ข้อความประกาศ</small
      >
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="danger"
          @click="closeAddContentModal"
          size="small"
        />

        <Button
          label="เพิ่มประกาศ"
          icon="pi pi-check"
          @click="handleAddContent"
          :loading="isPending"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
