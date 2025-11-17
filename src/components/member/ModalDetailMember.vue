<script setup lang="ts">
import { useMemberStore, type IMember } from '../../stores/member/member'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { Dialog, Button, Skeleton, Tag } from 'primevue'
import fbIcon from '@/assets/images/icon/fb.png'
import lineOaIcon from '@/assets/images/icon/line-oa.webp'
import lineChatIcon from '@/assets/images/icon/line.png'
import lineGroupIcon from '@/assets/images/icon/line.png'
import tiktokIcon from '@/assets/images/icon/tiktok.png'
import groupIcon from '@/assets/images/icon/icon-group.png'

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

// ฟังก์ชันสำหรับแสดงรูป logo ของช่องทางติดต่อ
const getContactImage = (contactType: string): string | undefined => {
  switch (contactType) {
    case 'facebook':
      return fbIcon
    case 'line_oa':
      return lineOaIcon
    case 'line_chat':
      return lineChatIcon
    case 'line_group':
      return groupIcon
    case 'tiktok':
      return tiktokIcon
    default:
      return undefined
  }
}

// ฟังก์ชันสำหรับดึงค่าจาก interests array
const getInterestValue = (type: string): string | undefined => {
  if (!data.value?.interests) return undefined
  return data.value.interests.find((i) => i.type === type)?.value
}
</script>

<template>
  <Dialog
    v-model:visible="showDetailModal"
    @update:visible="closeDetailModal"
    modal
    :style="{ width: '56rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'py-3',
      content: 'p-0',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class=" text-white">
        <h2 class="text-xl font-semibold! text-gray-900">
          {{ data?.displayName || data?.name || 'ไม่ระบุชื่อ' }}
        </h2>
        <div class="flex items-center gap-2 flex-wrap  capitalize" >
          <span class="text-sm text-blue-600">รหัส: {{ data?.code }}</span>
          <Tag
            v-if="data?.status"
            :value="
              memberStore.memberStatusOptions.find((option) => option.value === data?.status)
                ?.label || ''
            "
            :severity="memberStore.getStatusTag(data?.status)"
            size="small"
            class="text-xs"
          />
        </div>
      </div>
    </template>
    <div v-if="isLoading" class="p-6 space-y-4">
      <Skeleton height="200px" width="100%" />
      <Skeleton height="150px" width="100%" />
      <Skeleton height="150px" width="100%" />
    </div>

    <div v-if="data" class="p-4 pt-2 space-y-4 ">
      <!-- Basic Information Section -->
      <div class="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <h3 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-user text-blue-600 text-xs"></i>
          </div>
          <span>ข้อมูลติดต่อ</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- ช่องทางติดต่อ -->
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ช่องทางติดต่อ</label
            >
            <div
              v-if="data.contacts && data.contacts.length > 0"
              class="grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              <div
                v-for="contact in data.contacts"
                :key="contact.index"
                class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg  hover:bg-gray-100 transition-colors"
              >
                <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <img
                    v-if="getContactImage(contact.type)"
                    :src="getContactImage(contact.type)"
                    :alt="contact.type"
                    class="w-8 h-8 object-contain rounded"
                  />
                  <div
                    v-else
                    class="w-8 h-8 bg-gray-300 flex items-center rounded justify-center text-gray-600 text-xs"
                  >
                    ?
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-gray-600">
                    {{
                      memberStore.memberContactOptions.find((opt) => opt.value === contact.type)
                        ?.label || contact.type
                    }}
                  </p>
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ contact.value }}</p>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-400 text-sm py-2">ไม่ระบุช่องทางติดต่อ</div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ชื่อเล่น</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3">
              <span class="text-gray-900 text-sm font-medium">{{
                data.displayName || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ชื่อ-นามสกุล</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 ">
              <span class="text-gray-900 text-sm font-medium">{{ data.name || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ที่อยู่</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3  min-h-[60px]">
              <span class="text-gray-900 whitespace-pre-line text-sm leading-relaxed">{{
                data.address || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >จังหวัด</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 ">
              <span class="text-gray-900 text-sm font-medium">{{
                memberStore.provinceOptions.find((option) => option.value === data?.province)
                  ?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >เบอร์โทรศัพท์</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 ">
              <span class="text-gray-900 text-sm font-medium">{{ data.phone || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <!-- <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ประเภทลูกค้า</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 ">
              <span class="text-gray-900 text-sm">{{
                memberStore.memberTypeOptions.find((option) => option.value === data?.type)
                  ?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">อีเมล</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 ">
              <span class="text-gray-900 text-sm">{{ data.email || 'ไม่ระบุ' }}</span>
            </div>
          </div> -->
        </div>
      </div>

      <!-- ข้อมูลพฤติกรรม ความสนใจของลูกค้า -->
      <div class="bg-white rounded-xl p-5  shadow-sm">
        <h3 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-heart text-purple-600 text-xs"></i>
          </div>
          <span>ความสนใจ</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ความชำนาญในการเลี้ยง</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 ">
              <span class="text-gray-900 text-sm font-medium">{{
                memberStore.memberExperienceOptions.find(
                  (option) => option.value === getInterestValue('experience')
                )?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ชอบปลาเล็กหรือปลาใหญ่</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 ">
              <span class="text-gray-900 text-sm font-medium">{{
                memberStore.memberFishPreferenceOptions.find(
                  (option) => option.value === getInterestValue('fish_preference')
                )?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ขนาดบ่อที่เลี้ยง</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 ">
              <span class="text-gray-900 text-sm font-medium">{{
                getInterestValue('pond_size') || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ยี่ห้อจุลินทรีย์</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 ">
              <span class="text-gray-900 text-sm font-medium">{{
                getInterestValue('bacteria_brand') || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ยี่ห้ออาหาร</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 ">
              <span class="text-gray-900 text-sm font-medium">{{
                getInterestValue('food_brand') || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Information Section -->
      <!-- <div class="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <h3 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-shield text-green-600 text-xs"></i>
          </div>
          <span>ข้อมูลบัญชี</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ชื่อผู้ใช้</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm font-medium">{{
                data.username || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >รหัสผ่าน</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 border border-gray-200">
              <span class="text-gray-500 text-sm font-medium">{{
                data.password ? '••••••••' : 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >สถานะประมูล</label
            >
            <div class="flex items-center gap-2">
              <Tag
                :value="data.bidder ? 'เปิดใช้งาน' : 'ล็อค'"
                :severity="data.bidder ? 'success' : 'danger'"
                size="small"
              />
              <span class="text-sm text-gray-600">{{
                data.bidder ? 'สามารถเข้าร่วมประมูลได้' : 'ไม่สามารถเข้าร่วมประมูลได้'
              }}</span>
            </div>
          </div>

          <div v-if="data.info" class="md:col-span-2">
            <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide"
              >ข้อมูลเพิ่มเติม</label
            >
            <div class="bg-gray-50 rounded-lg py-2 px-3 border border-gray-200 min-h-[50px]">
              <span class="text-gray-900 whitespace-pre-line text-sm leading-relaxed">{{
                data.info
              }}</span>
            </div>
          </div>
        </div>
      </div> -->
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button
          label="ปิด"
          icon="pi pi-times"
          @click="closeDetailModal"
          severity="secondary"
          size="small"
          outlined
        />
      </div>
    </template>
  </Dialog>
</template>
