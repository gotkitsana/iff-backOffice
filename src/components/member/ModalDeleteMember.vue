<script setup lang="ts">
import { computed } from 'vue'
import { useMemberStore} from '@/stores/member/member'
import { Dialog, Button } from 'primevue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'

const props = defineProps<{
  showDeleteModal: boolean
  id: string
  customerName: string
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
const customerStore = useMemberStore()
const { mutate, isPending } = useMutation({
  mutationFn: (payload: string) => customerStore.onDeleteMember(payload),
  onSuccess: (data: any) => {
    if (data.data.deletedCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['get_members'] })
      toast.success('ลบข้อมูลลูกค้าสำเร็จ')
      closeDeleteModal()
    } else {
      toast.error('ลบข้อมูลลูกค้าไม่สำเร็จ')
    }
  },
})
</script>

<template>
  <Dialog
    v-model:visible="showDeleteModal"
    @update:visible="closeDeleteModal"
    modal
    header="ยืนยันการลบข้อมูล"
    :style="{ width: '28rem' }"
    :pt="{
      header: 'p-4',
      title: 'text-lg font-semibold!',
    }"
  >
    <div class="flex items-center space-x-3">
      <i class="pi pi-exclamation-triangle text-red-500 !text-3xl"></i>
      <div>
        <p class="font-[500]! text-gray-700">
          คุณต้องการลบข้อมูลลูกค้า {{ customerName }} หรือไม่?
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
          label="ลบข้อมูล"
          icon="pi pi-trash"
          @click="mutate(props.id)"
          :loading="isPending"
          severity="danger"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
