<script setup lang="ts">
import { useMemberStore, type IMember } from '../../stores/member/member'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { Dialog, Button, Skeleton, Tag } from 'primevue'
import PurchaseHistoryPanel from './PurchaseHistoryPanel.vue'
import { useSalesStore } from '@/stores/sales/sales'
import type { ISales } from '@/types/sales'
import fbIcon from '@/assets/images/icon/fb.png'
import lineOaIcon from '@/assets/images/icon/line-oa.webp'
import lineChatIcon from '@/assets/images/icon/line.png'
import tiktokIcon from '@/assets/images/icon/tiktok.png'
import groupIcon from '@/assets/images/icon/icon-group.png'
import dayjs from 'dayjs'

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
const salesStore = useSalesStore()

const { data, isLoading } = useQuery<IMember>({
  queryKey: ['get_member_id', props.id],
  queryFn: () => memberStore.onGetMemberID(props.id),
  enabled: computed(() => !!props.id),
})

// ดึงข้อมูล sales
const { data: salesData } = useQuery<ISales[]>({
  queryKey: ['get_sales'],
  queryFn: () => salesStore.onGetSales(),
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

// Format วันที่

// Format ตัวเลขเป็นเงิน
const formatCurrency = (amount?: number) => {
  if (!amount && amount !== 0) return 'ไม่ระบุ'
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ตรวจสอบว่ามี CRM data หรือไม่
const hasCRMData = computed(() => {
  return !!(
    data.value?.totalPurchaseAmount &&
    data.value?.purchaseCount &&
    data.value?.lastPurchaseDate
  )
})

// Helper function หา sale จาก _id
const getSaleById = (saleId: string): ISales | undefined => {
  if (!salesData.value) return undefined
  return salesData.value.find((sale) => sale._id === saleId)
}
</script>

<template>
  <Dialog v-model:visible="showDetailModal" @update:visible="closeDetailModal" modal :style="{ width: '56rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }" :pt="{
      header: 'py-3',
      content: 'p-0',
      footer: 'p-4',
    }">
    <template #header>
      <div v-if="isLoading">
        <Skeleton height="20px" width="80px" />
        <Skeleton height="15px" width="120px" class="mt-2" />
      </div>
      <div v-if="!isLoading && data" class="text-white">
        <h2 class="text-xl font-semibold! text-gray-900">
          {{ data?.displayName || data?.name || 'ไม่ระบุชื่อ' }}
        </h2>
        <div class="flex items-center gap-2 flex-wrap capitalize">
          <span class="text-sm text-blue-600">รหัส: {{ data?.code }}</span>
          <Tag v-if="data?.status" :value="
              memberStore.memberStatusOptions.find((option) => option.value === data?.status)
                ?.label || ''
            " :severity="memberStore.getStatusTag(data?.status)" size="small" class="text-xs" />
          <Tag v-if="data?.customerLevel" :value="
              memberStore.customerLevelOptions.find(
                (option) => option.value === data?.customerLevel
              )?.label || ''
            " :severity="
              data.customerLevel === 'vvip'
                ? 'danger'
                : data.customerLevel === 'vip'
                ? 'warn'
                : 'secondary'
            " size="small" class="text-xs" />
        </div>
      </div>
    </template>
    <div v-if="isLoading" class="p-6 space-y-4">
      <Skeleton height="200px" width="100%" />
      <Skeleton height="150px" width="100%" />
      <Skeleton height="150px" width="100%" />
    </div>

    <div v-if="data" class="p-4 pt-2 space-y-4">
      <!-- CRM Statistics Section -->
      <div v-if="hasCRMData" class="bg-white rounded-xl p-5 border border-gray-200">
        <h3 class="text-base font-semibold! text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-chart-line text-blue-600 text-xs"></i>
          </div>
          สถิติการซื้อ
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ยอดซื้อรวม</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3">
              <span class="text-gray-900 text-sm font-medium">{{
                formatCurrency(data.totalPurchaseAmount)
                }}</span>
            </div>
          </div>

          <div>
            <label
              class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">จำนวนครั้งที่ซื้อ</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3">
              <span class="text-gray-900 text-sm font-medium">{{ data.purchaseCount || 0 }} ครั้ง</span>
            </div>
          </div>

          <div>
            <label
              class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">วันที่ซื้อล่าสุด</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3">
              <span class="text-gray-900 text-sm font-medium">{{
                dayjs(data.lastPurchaseDate).format('DD/MM/YYYY HH:mm:ss')
                }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Basic Information Section -->
      <div class="bg-white rounded-xl p-5 border border-gray-200">
        <h3 class="text-base font-semibold! text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-user text-blue-600 text-xs"></i>
          </div>
          ข้อมูลติดต่อ
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- ช่องทางติดต่อ -->
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ช่องทางติดต่อ</label>
            <div v-if="data.contacts && data.contacts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div v-for="contact in data.contacts" :key="contact.index"
                class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <img v-if="getContactImage(contact.type)" :src="getContactImage(contact.type)" :alt="contact.type"
                    class="w-8 h-8 object-contain rounded" />
                  <div v-else
                    class="w-8 h-8 bg-gray-300 flex items-center rounded justify-center text-gray-600 text-xs">
                    ?
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-600">
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
            <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ชื่อเล่น</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3">
              <span class="text-gray-900 text-sm font-medium">{{
                data.displayName || 'ไม่ระบุ'
                }}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ชื่อ-นามสกุล</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3">
              <span class="text-gray-900 text-sm font-medium">{{ data.name || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ที่อยู่</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3 min-h-[60px]">
              <span class="text-gray-900 whitespace-pre-line text-sm leading-relaxed">{{
                data.address || 'ไม่ระบุ'
                }}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">จังหวัด</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3">
              <span class="text-gray-900 text-sm font-medium">{{
                memberStore.provinceOptions.find((option) => option.value === data?.province)
                ?.label || 'ไม่ระบุ'
                }}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">เบอร์โทรศัพท์</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3">
              <span class="text-gray-900 text-sm font-medium">{{ data.phone || 'ไม่ระบุ' }}</span>
            </div>
          </div>

          <div v-if="data.requirements" class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ความต้องการ</label>
            <div class="bg-gray-50 rounded-lg py-2 px-3">
              <span class="text-gray-900 text-sm font-medium">{{ data.requirements }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-semibold text-gray-700 mb-1">ประเภทลูกค้า</label>
            <div class="bg-gray-50 rounded-lg py-1.5 px-3">
              <span class="text-gray-900 text-sm">{{
                memberStore.customerTypeOptions.find((option) => option.value === data?.type)
                ?.label || 'ไม่ระบุ'
                }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ข้อมูลพฤติกรรม ความสนใจของลูกค้า -->
      <div class="bg-white rounded-xl p-5 border border-gray-200 space-y-6">
        <h3 class="text-base font-semibold! text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-heart text-purple-600 text-xs"></i>
          </div>
          ความสนใจ
        </h3>

        <!-- พฤติกรรมการเลี้ยง -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">พฤติกรรมการเลี้ยง</label>
          <div class="bg-gray-50 rounded-lg py-2 px-3">
            <span class="text-gray-900 text-sm font-medium">{{
              memberStore.breedingBehaviorOptions.find(
              (option) => option.value === getInterestValue('breeding_behavior')
              )?.label || 'ไม่ระบุ'
              }}</span>
          </div>
        </div>

        <!-- สายพันธุ์ที่ชอบ -->
        <div>
          <h4 class="font-semibold! text-gray-800 mb-1.5 text-sm">สายพันธุ์ที่ชอบ</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Gosanke
                ลูกค้าชอบปลาสายพันธุ์อะไรมากที่สุด</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.gosankeOptions.find(
                  (option) => option.value === getInterestValue('gosanke')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Non-Gosanke
                ลูกค้าชอบสายพันธุ์อะไร</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.nonGosankeOptions.find(
                  (option) => option.value === getInterestValue('non_gosanke')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Variety สีล้วน
                ลูกค้าชอบสายพันธุ์อะไรมากที่สุด</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.varietyOptions.find(
                  (option) => option.value === getInterestValue('variety')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ชอบเลี้ยงปลาอายุเท่าไร</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.fishAgeOptions.find(
                  (option) => option.value === getInterestValue('fish_age')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ข้อมูลการเลี้ยง -->
        <div>
          <h4 class="font-semibold! text-sm text-gray-800 mb-1.5">ข้อมูลการเลี้ยง</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ระดับงบประมาณ
                ร้านคาเฟ่</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.budgetLevelOptions.find(
                  (option) => option.value === getInterestValue('budget_level')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ใช้จุลินทรีย์</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.bacteriaUsageOptions.find(
                  (option) => option.value === getInterestValue('bacteria_usage')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div v-if="getInterestValue('bacteria_usage') === 'yes'">
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ยี่ห้อจุลินทรีย์</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('bacteria_brand') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ยี่ห้ออาหาร</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('food_brand') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ล้างกรอง</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.filterCleaningOptions.find(
                  (option) => option.value === getInterestValue('filter_cleaning')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div v-if="getInterestValue('filter_cleaning') === 'company'">
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">บริษัทรับล้าง</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('filter_cleaning_company') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ขนาดบ่อเลี้ยง</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('pond_size') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">วิธีการให้อาหาร</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.feedingMethodOptions.find(
                  (option) => option.value === getInterestValue('feeding_method')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- กิจกรรมและประสบการณ์ -->
        <div>
          <h4 class="text-sm font-semibold! text-gray-800 mb-1.5">กิจกรรมและประสบการณ์</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <!-- ชอบส่งปลางานประกวดหรือไม่ -->
            <div>
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ชอบส่งปลางานประกวดหรือไม่</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.contestParticipationOptions.find(
                  (option) => option.value === getInterestValue('contest_participation')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div v-if="getInterestValue('contest_participation') === 'no'">
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">เหตุผล</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('contest_participation_reason') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <!-- เคยร่วมกิจกรรมแข่งเลี้ยง รับเงินรางวัล หรือไม่ -->
            <div>
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">เคยร่วมกิจกรรมแข่งเลี้ยง
                รับเงินรางวัล หรือไม่</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.competitionParticipationOptions.find(
                  (option) => option.value === getInterestValue('competition_participation')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div v-if="getInterestValue('competition_participation') === 'yes'">
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ฟาร์มไหน</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('competition_farm') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div v-if="getInterestValue('competition_participation') === 'no'">
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">เหตุผล</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('competition_reason') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <!-- เคยประมูลปลาออนไลน์หรือไม่ -->
            <div>
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">เคยประมูลปลาออนไลน์หรือไม่
                เช่น Sakai Auction Online , Dainishi Auction Online
                เป็นต้นฯ</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.onlineAuctionOptions.find(
                  (option) => option.value === getInterestValue('online_auction')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div v-if="getInterestValue('online_auction') === 'yes'">
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ประมูลกับฟาร์มไหน</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('auction_farm') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div v-if="getInterestValue('online_auction') === 'no'">
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">เหตุผล</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('auction_reason') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <!-- เคยไปซื้อปลาคาร์ฟที่ญี่ปุ่นหรือไม่ -->
            <div>
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">เคยไปซื้อปลาคาร์ฟที่ญี่ปุ่นหรือไม่</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  memberStore.japanPurchaseOptions.find(
                  (option) => option.value === getInterestValue('japan_purchase')
                  )?.label || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div v-if="getInterestValue('japan_purchase') === 'yes'">
              <label
                class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">ไปกับฟาร์มไหน</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('japan_farm') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>

            <div v-if="getInterestValue('japan_purchase') === 'no'">
              <label class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">เหตุผล</label>
              <div class="bg-gray-50 rounded-lg py-2 px-3">
                <span class="text-gray-900 text-sm font-medium">{{
                  getInterestValue('japan_reason') || 'ไม่ระบุ'
                  }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- โน้ตพฤติกรรมลูกค้า -->
        <div v-if="data.behaviorNotes" class="md:col-span-2">
          <label
            class="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">โน้ตพฤติกรรมลูกค้า</label>
          <div class="bg-gray-50 rounded-lg py-2 px-3 min-h-[60px]">
            <span class="text-gray-900 whitespace-pre-line text-sm leading-relaxed">{{
              data.behaviorNotes
              }}</span>
          </div>
        </div>
      </div>

      <div v-if="data.purchaseHistory && data.purchaseHistory.length > 0"
        class="bg-white rounded-xl p-5 border border-gray-200">
        <h3 class="text-base font-semibold! text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-shopping-bag text-blue-600 text-xs"></i>
          </div>
          ประวัติซื้อสินค้า
        </h3>

        <div class="space-y-3">
          <PurchaseHistoryPanel v-for="saleId in data.purchaseHistory" :key="saleId" :sale-id="saleId"
            :sale="getSaleById(saleId)" :is-setting="false" />
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
        <Button label="ปิด" icon="pi pi-times" @click="closeDetailModal" severity="secondary" size="small" outlined />
      </div>
    </template>
  </Dialog>
</template>
