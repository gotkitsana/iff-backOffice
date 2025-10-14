<script setup lang="ts">
import { useMemberStore, type IMember } from '../../stores/member/member'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
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

const memberStore = useMemberStore()
const { data, isLoading } = useQuery<IMember>({
  queryKey: ['get_member_id', props.id],
  queryFn: () => memberStore.onGetMemberID(props.id),
  enabled: computed(() => !!props.id),
})
</script>

<template>
  <Dialog
    v-model:visible="showDetailModal"
    @update:visible="closeDetailModal"
    modal
    header="รายละเอียดลูกค้า"
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '85vw', '575px': '95vw' }"
  >
    <div v-if="isLoading" class="space-y-4">
      <div class="flex items-center gap-4 mb-6">
        <Skeleton height="60px" width="60px" shape="circle" />
        <div class="flex-1">
          <Skeleton height="24px" width="200px" class="mb-2" />
          <Skeleton height="16px" width="150px" />
        </div>
      </div>

      <Skeleton height="120px" width="100%" class="mb-4" />
      <Skeleton height="120px" width="100%" class="mb-4" />
      <Skeleton height="120px" width="100%" class="mb-4" />
    </div>

    <div v-if="data" class="space-y-4">
      <!-- Header Profile Section -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div class="flex items-center gap-3">
          <div
            class="w-18 h-18 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
          >
            {{ data.name?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-semibold! text-gray-900">{{ data.name || 'ไม่ระบุชื่อ' }}</h2>
            <p class="text-gray-600 mb-1">{{ data.displayName ? `(${data.displayName})` : '' }}</p>
            <div class="flex items-center gap-2">
              <Tag
                :value="
                  memberStore.memberStatusOptions.find((option) => option.value === data?.status)
                    ?.label || ''
                "
                :severity="memberStore.getStatusLabel(data.status)"
                size="small"
                class="font-medium"
              />
              <Tag
                :value="
                  memberStore.memberContactOptions.find((option) => option.value === data?.contact)
                    ?.label || ''
                "
                severity="info"
                size="small"
                class="font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Basic Information Section -->
      <div class="bg-white rounded-xl p-4 border border-blue-100 shadow">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-user text-blue-600 text-sm"></i>
          </div>
          ข้อมูลลูกค้า
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ชื่อช่องทางติดต่อ</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <span class="text-gray-900">{{ data.contactName || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ชื่อเล่น</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <span class="text-gray-900">{{ data.displayName || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ชื่อ-นามสกุล</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <span class="text-gray-900">{{ data.name || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ที่อยู่</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200 min-h-[80px]">
              <span class="text-gray-900 whitespace-pre-line">{{ data.address || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">จังหวัด</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <span class="text-gray-900">{{
                memberStore.provinceOptions.find((option) => option.value === data?.province)
                  ?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <span class="text-gray-900">{{ data.phone || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ประเภทลูกค้า</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <span class="text-gray-900">{{
                memberStore.memberTypeOptions.find((option) => option.value === data?.type)
                  ?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ความสนใจ</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <span class="text-gray-900">{{
                memberStore.memberInterestOptions.find((option) => option.value === data?.interest)
                  ?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Information Section -->
      <div class="bg-white rounded-xl p-4 border border-green-100 shadow">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-shield text-green-600 text-sm"></i>
          </div>
          ข้อมูลบัญชีประมูล
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ชื่อผู้ใช้</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <span class="text-gray-900">{{ data.username || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">รหัสผ่าน</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200 overflow-hidden">
              <span class="text-gray-500">{{ data.password || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">สถานะยูสเซอร์</label>
            <div class="flex items-center gap-3">
              <Tag
                :value="data.bidder ? 'เปิดใช้งาน' : 'ล็อค'"
                :severity="data.bidder ? 'success' : 'danger'"
                size="small"
                class="px-4 py-2"
              />
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <i
                  :class="
                    data.bidder
                      ? 'pi pi-check-circle text-green-500'
                      : 'pi pi-times-circle text-red-500'
                  "
                ></i>
                <span>{{
                  data.bidder ? 'สามารถเข้าร่วมประมูลได้' : 'ไม่สามารถเข้าร่วมประมูลได้'
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button
          label="ปิด"
          icon="pi pi-times"
          @click="closeDetailModal"
          severity="secondary"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
