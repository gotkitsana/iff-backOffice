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
      <div class="bg-gradient-to-r from-blue-50/30 to-indigo-50/50 rounded-xl p-4 border border-blue-100">
        <div class="flex items-center gap-3">
          <div
            class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
          >
            {{
              data.displayName?.charAt(0)?.toUpperCase() ||
              data.name?.charAt(0)?.toUpperCase() ||
              'U'
            }}
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <h2 class="text-xl font-[500]! text-gray-900">
                {{ data.displayName || data.name || 'ไม่ระบุชื่อ' }}
              </h2>
              <p class="text-gray-600 text-sm capitalize">รหัสลูกค้า: {{ data.code }}</p>
            </div>
            <div class="flex items-center gap-2">
              <Tag
                :value="
                  memberStore.memberStatusOptions.find((option) => option.value === data?.status)
                    ?.label || ''
                "
                :severity="memberStore.getStatusTag(data?.status)"
                size="small"
                class="font-medium"
              />

            </div>
          </div>
        </div>
      </div>

      <!-- Basic Information Section -->
      <div class="bg-white rounded-xl p-4 border border-blue-100 shadow">
        <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-user text-blue-600 text-sm"></i>
          </div>
          ข้อมูลลูกค้า
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- ช่องทางติดต่อ -->
          <div class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ช่องทางติดต่อ</label>
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div v-if="data.contacts && data.contacts.length > 0" class="space-y-2">
                <div
                  v-for="contact in data.contacts"
                  :key="contact.index"
                  class="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200"
                >
                  <div class="w-8 h-8 flex items-center justify-center">
                    <img
                      v-if="getContactImage(contact.type)"
                      :src="getContactImage(contact.type)"
                      :alt="contact.type"
                      class="w-8 h-8 object-contain rounded"
                    />
                    <div
                      v-else
                      class="w-8 h-8 bg-gray-200 flex items-center rounded justify-center text-gray-600 text-xs"
                    >
                      ?
                    </div>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">
                      {{
                        memberStore.memberContactOptions.find((opt) => opt.value === contact.type)
                          ?.label || contact.type
                      }}
                    </p>
                    <p class="text-sm text-gray-600">{{ contact.value }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-500 text-sm">ไม่ระบุช่องทางติดต่อ</div>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ชื่อเล่น</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ data.displayName || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ชื่อ-นามสกุล</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ data.name || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ที่อยู่</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200 min-h-[80px]">
              <span class="text-gray-900 whitespace-pre-line text-sm">{{
                data.address || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">จังหวัด</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{
                memberStore.provinceOptions.find((option) => option.value === data?.province)
                  ?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ data.phone || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <!-- <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ประเภทลูกค้า</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{
                memberStore.memberTypeOptions.find((option) => option.value === data?.type)
                  ?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">อีเมล</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ data.email || 'ไม่ระบุ' }}</span>
            </div>
          </div> -->
        </div>
      </div>

      <!-- ข้อมูลพฤติกรรม ความสนใจของลูกค้า -->
      <div class="bg-white rounded-xl p-4 border border-purple-100 shadow">
        <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-3">
          <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-heart text-purple-600 text-sm"></i>
          </div>
          ข้อมูลพฤติกรรมความสนใจของลูกค้า
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1"
              >ความชำนาญในการเลี้ยง</label
            >
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{
                memberStore.memberExperienceOptions.find((option) => option.value === getInterestValue('experience'))
                  ?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1"
              >ชอบปลาเล็กหรือปลาใหญ่</label
            >
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{
                memberStore.memberFishPreferenceOptions.find((option) => option.value === getInterestValue('fish_preference'))
                  ?.label || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ขนาดบ่อที่เลี้ยง</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{
                getInterestValue('pond_size') || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ยี่ห้อจุลินทรีย์</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{
                getInterestValue('bacteria_brand') || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ยี่ห้ออาหาร</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{
                getInterestValue('food_brand') || 'ไม่ระบุ'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Information Section -->
      <div class="bg-white rounded-xl p-4 border border-green-100 shadow">
        <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-3">
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-shield text-green-600 text-sm"></i>
          </div>
          ข้อมูลบัญชีประมูล
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ชื่อผู้ใช้</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200">
              <span class="text-gray-900 text-sm">{{ data.username || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">รหัสผ่าน</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3 border border-gray-200 overflow-hidden">
              <span class="text-gray-500 text-sm">{{
                data.password ? '••••••••' : 'ไม่ระบุ'
              }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">สถานะยูสเซอร์</label>
            <div class="flex items-center gap-3">
              <Tag
                :value="data.bidder ? 'เปิดใช้งาน' : 'ล็อค'"
                :severity="data.bidder ? 'success' : 'danger'"
                size="small"
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

          <!-- <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">สถานะการยืนยัน</label>
            <div class="flex items-center gap-3">
              <Tag
                :value="data.isVerify ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'"
                :severity="data.isVerify ? 'success' : 'warning'"
                size="small"
                class="px-4 py-2"
              />
            </div>
          </div> -->

          <div v-if="data.info" class="md:col-span-2 space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ข้อมูลเพิ่มเติม</label>
            <div class="bg-gray-50 rounded-lg p-2 border border-gray-200 min-h-[60px]">
              <span class="text-gray-900 whitespace-pre-line text-sm">{{ data.info }}</span>
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
