<script setup lang="ts">
import { useCustomerStore, type Customer } from '@/stores/customer/customer'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import dayjs from 'dayjs'
import { Dialog, Button, Skeleton, Tag } from 'primevue'

const props = defineProps<{
  showDetailModal: boolean
  id: string
}>()

const emit = defineEmits<{
  (e: 'onCloseDetailModal'): void
}>()

const showDetailModal = computed({
  get: () => props.showDetailModal,
  set: (value: boolean) => {
    if (!value) {
      closeDetailModal()
    }
  },
})

const closeDetailModal = () => {
  emit('onCloseDetailModal')
}

const customerStore = useCustomerStore()
const { data, isLoading } = useQuery<Customer>({
  queryKey: ['get_customer_id', props.id],
  queryFn: () => customerStore.onGetCustomerID(props.id),
  enabled: computed(() => !!props.id),
})
</script>

<template>
  <Dialog
    v-model:visible="showDetailModal"
    @update:visible="closeDetailModal"
    modal
    header="รายละเอียดลูกค้า"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '80vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      title: 'text-lg font-semibold!',
    }"
  >
    <div v-if="isLoading">
      <Skeleton height="100px" width="100%" class="mb-4" />

      <Skeleton height="140px" width="100%" class="mb-4" />

      <Skeleton height="140px" width="100%" class="mb-4" />

      <Skeleton height="140px" width="100%" class="mb-4" />
    </div>

    <div v-if="data" class="space-y-4">
      <!-- Header Section with Avatar -->
      <div
        class="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50/75 to-indigo-50/75 rounded-xl border border-blue-100/50"
      >
        <div
          class="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"
        >
          <i class="pi pi-user text-white text-2xl"></i>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-[500]! text-gray-800">{{ data.displayName || data.username }}</h3>
          <div class="flex items-center gap-x-2">
            <Tag
              class="text-xs"
              :value="data.bidder ? 'ลูกค้าประมูล' : 'ลูกค้าทั่วไป'"
              :severity="data.bidder ? 'success' : 'info'"
            />

            <Tag
              class="text-xs"
              :value="data.isVerify ? 'ยืนยันตัวตน' : 'ยังไม่ยืนยันตัวตน'"
              :severity="data.isVerify ? 'info' : 'danger'"
            />
          </div>
        </div>
      </div>

      <!-- Personal Information Section -->
      <div class="bg-white border border-gray-200 rounded-xl p-4">
        <h4 class="text-lg font-semibold! text-gray-800 mb-4 flex items-center">
          <i class="pi pi-id-card text-blue-600 mr-2"></i>
          ข้อมูลส่วนตัว
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-medium! text-gray-600">ชื่อ-นามสกุล</label>
            <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900 font-medium!">{{ data.name }}</p>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-medium! text-gray-600">อีเมล</label>
            <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900 font-medium!">
                {{ data.email || 'ไม่ระบุ' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Information Section -->
      <div class="bg-white border border-gray-200 rounded-xl p-4">
        <h4 class="text-lg font-semibold! text-gray-800 mb-4 flex items-center">
          <i class="pi pi-cog text-green-600 mr-2"></i>
          ข้อมูลบัญชี
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-medium! text-gray-600">ชื่อผู้ใช้</label>
            <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900 font-medium!">{{ data.username }}</p>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-medium! text-gray-600">ชื่อแสดง</label>
            <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900 font-medium!">{{ data.displayName }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Timestamps Section -->
      <div class="bg-white border border-gray-200 rounded-xl p-4">
        <h4 class="text-lg font-semibold! text-gray-800 mb-4 flex items-center">
          <i class="pi pi-clock text-orange-600 mr-2"></i>
          ข้อมูลเวลา
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-medium! text-gray-600">วันที่สร้างบัญชี</label>
            <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900 font-medium!">
                {{ dayjs(data.cat).format('DD/MM/YYYY HH:mm') }}
              </p>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-medium! text-gray-600">แก้ไขล่าสุด</label>
            <div class="p-2 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900 font-medium!">
                {{ dayjs(data.uat).format('DD/MM/YYYY HH:mm') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="ปิด"
        icon="pi pi-times"
        @click="closeDetailModal"
        severity="secondary"
        size="small"
        class="px-6"
      />
    </template>
  </Dialog>
</template>
