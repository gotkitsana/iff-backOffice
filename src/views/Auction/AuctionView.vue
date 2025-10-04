<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, Tag, Button, ProgressBar } from 'primevue'
import { useAuctionStore } from '@/stores/auction/auction'
import { useProductStore, type IProduct } from '@/stores/auction/product'
import { useQuery } from '@tanstack/vue-query'
import ModalAddContent from '@/components/auction/modal/ModalAddContent.vue'
import ModalAddAuction from '@/components/auction/modal/ModalAddAuction.vue'

// Sample data for active auctions
const activeAuctions = ref([
  {
    id: 1,
    fishName: 'ปลาคราฟโคฮากุ',
    breed: 'โคฮากุ',
    size: 45,
    currentPrice: 125000,
    bidCount: 23,
    timeLeft: '2 ชม. 15 นาที',
    progress: 75,
    image: '/api/placeholder/300/200',
  },
  {
    id: 2,
    fishName: 'ปลาคราฟไทชู',
    breed: 'ไทชู',
    size: 38,
    currentPrice: 98000,
    bidCount: 15,
    timeLeft: '1 ชม. 30 นาที',
    progress: 60,
    image: '/api/placeholder/300/200',
  },
  {
    id: 3,
    fishName: 'ปลาคราฟชิโรอุตสึริ',
    breed: 'ชิโรอุตสึริ',
    size: 42,
    currentPrice: 156000,
    bidCount: 31,
    timeLeft: '45 นาที',
    progress: 90,
    image: '/api/placeholder/300/200',
  },
])

// Sample data for recent auctions
const recentAuctions = ref([
  {
    fishName: 'ปลาคราฟซันเกะ',
    breed: 'ซันเกะ',
    size: 50,
    finalPrice: 189000,
    winner: 'คุณนิดา',
    endTime: new Date('2024-01-15T11:15:00'),
    status: 'Completed',
  },
  {
    fishName: 'ปลาคราฟเบคโกะ',
    breed: 'เบคโกะ',
    size: 35,
    finalPrice: 87000,
    winner: 'คุณปิยะ',
    endTime: new Date('2024-01-15T10:30:00'),
    status: 'Completed',
  },
  {
    fishName: 'ปลาคราฟอูตสึริ',
    breed: 'อูตสึริ',
    size: 40,
    finalPrice: 0,
    winner: '-',
    endTime: new Date('2024-01-15T09:45:00'),
    status: 'No Bid',
  },
])

const formatDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}

const auctionStore = useAuctionStore()
const productStore = useProductStore()

const { data } = useQuery({
  queryKey: ['get_auctions'],
  queryFn: () => auctionStore.onGetAuctions(),
})

// Get products for auction selection
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products_for_auction'],
  queryFn: () => productStore.onGetProducts(),
})

console.log(data)

const auctionSettingModal = ref(false)
const openAuctionSetting = () => {
  auctionSettingModal.value = true
}

const closeAuctionSetting = () => {
  auctionSettingModal.value = false
}

const auctionContentModal = ref(false)
const openAuctionContent = () => {
  auctionContentModal.value = true
}
const closeAuctionContent = () => {
  auctionContentModal.value = false
}

// Computed for available products (not sold and available for auction)
const availableProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter((p) => !p.sold && p.auctionOnly === 0)
})

// Computed stats
const totalRevenue = computed(() =>
  recentAuctions.value.reduce((sum, auction) => sum + auction.finalPrice, 0)
)
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ระบบประมูลปลาคราฟ</h1>
        <p class="text-gray-600">จัดการการประมูลปลาคราฟและติดตามผล</p>
      </div>
      <div class="flex space-x-3">
        <Button
          label="ประมูลใหม่"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openAuctionSetting"
          :disabled="availableProducts.length === 0"
        />

        <Button
          label="ตั้งค่าประกาศ"
          icon="pi pi-megaphone"
          severity="info"
          size="small"
          @click="openAuctionContent"
        />

        <Button
          label="จัดการปลาคาร์ฟ"
          icon="pi pi-fish"
          severity="secondary"
          size="small"
          @click="$router.push('/koi-store')"
        />
      </div>
    </div>

    <!-- Alert for no available products -->
    <div
      v-if="availableProducts.length === 0"
      class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-yellow-600 text-xl"></i>
        <div>
          <h3 class="text-sm font-medium text-yellow-800">ไม่มีปลาคาร์ฟพร้อมประมูล</h3>
          <p class="text-sm text-yellow-700 mt-1">
            กรุณาเพิ่มปลาคาร์ฟในหน้า "จัดการปลาคาร์ฟ" ก่อนสร้างการประมูล
          </p>
        </div>
        <Button
          label="ไปจัดการปลาคาร์ฟ"
          icon="pi pi-arrow-right"
          severity="warning"
          size="small"
          @click="$router.push('/koi-store')"
        />
      </div>
    </div>

    <!-- Auction Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card :pt="{ body: 'p-4 md:p-6' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ประมูลที่กำลังดำเนิน</p>
              <p class="text-2xl md:text-3xl font-bold text-blue-600">
                {{ activeAuctions.length }}
              </p>
              <p class="text-xs text-gray-500 mt-1">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-play text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4 md:p-6' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ประมูลที่เสร็จสิ้น</p>
              <p class="text-2xl md:text-3xl font-bold text-green-600">
                {{ recentAuctions.length }}
              </p>
              <p class="text-xs text-gray-500 mt-1">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-check text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4 md:p-6' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ยอดประมูลรวม</p>
              <p class="text-2xl md:text-3xl font-bold text-orange-600">
                {{ formatCurrency(totalRevenue) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">บาท</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-money-bill text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4 md:p-6' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ปลาคาร์ฟพร้อมประมูล</p>
              <p class="text-2xl md:text-3xl font-bold text-purple-600">
                {{ availableProducts.length }}
              </p>
              <p class="text-xs text-gray-500 mt-1">ตัว</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-fish text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Active Auctions -->
    <Card>
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="text-xl font-semibold text-gray-900">ประมูลที่กำลังดำเนิน</h3>
          <p class="text-sm text-gray-600 mt-1">รายการประมูลปลาคราฟที่กำลังดำเนินอยู่</p>
        </div>
      </template>
      <template #content>
        <div class="p-6 pt-0">
          <div v-if="activeAuctions.length === 0" class="text-center py-12">
            <div
              class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="pi pi-clock text-gray-400 text-3xl"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">ไม่มีประมูลที่กำลังดำเนิน</h3>
            <p class="text-gray-600 mb-4">
              เริ่มสร้างประมูลใหม่เพื่อให้ผู้คนเข้าร่วมประมูลปลาคาร์ฟของคุณ
            </p>
            <Button
              label="สร้างประมูลใหม่"
              icon="pi pi-plus"
              severity="success"
              @click="openAuctionSetting"
              :disabled="availableProducts.length === 0"
            />
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="auction in activeAuctions"
              :key="auction.id"
              class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
            >
              <!-- Fish Image Placeholder -->
              <div
                class="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden"
              >
                <i class="pi pi-fish text-4xl text-blue-400"></i>
                <div
                  class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium"
                >
                  LIVE
                </div>
              </div>

              <!-- Fish Info -->
              <div class="mb-4">
                <h4 class="font-semibold text-gray-900 mb-1 text-lg">{{ auction.fishName }}</h4>
                <p class="text-sm text-gray-600 mb-2">
                  {{ auction.breed }} - {{ auction.size }} ซม.
                </p>

                <!-- Progress Bar -->
                <div class="mb-3">
                  <div class="flex justify-between text-xs text-gray-600 mb-1">
                    <span>ความคืบหน้า</span>
                    <span>{{ auction.progress }}%</span>
                  </div>
                  <ProgressBar :value="auction.progress" class="h-2" />
                </div>
              </div>

              <!-- Price and Time -->
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-2xl font-bold text-green-600">{{
                    formatCurrency(auction.currentPrice)
                  }}</span>
                  <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{{
                    auction.timeLeft
                  }}</span>
                </div>

                <div class="flex justify-between items-center text-sm text-gray-600">
                  <span>{{ auction.bidCount }} ครั้ง</span>
                  <span class="flex items-center gap-1">
                    <i class="pi pi-users text-xs"></i>
                    ผู้เข้าร่วม
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="mt-4 pt-4 border-t border-gray-100">
                <div class="flex gap-2">
                  <Button
                    label="ดูรายละเอียด"
                    icon="pi pi-eye"
                    size="small"
                    severity="secondary"
                    class="flex-1"
                  />
                  <Button icon="pi pi-pencil" size="small" severity="info" outlined />
                  <Button icon="pi pi-trash" size="small" severity="danger" outlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Recent Auctions -->
    <Card>
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="text-xl font-semibold text-gray-900">ประมูลที่เพิ่งเสร็จสิ้น</h3>
          <p class="text-sm text-gray-600 mt-1">รายการประมูลที่เพิ่งเสร็จสิ้น</p>
        </div>
      </template>
      <template #content>
        <div class="p-6 pt-0">
          <div v-if="recentAuctions.length === 0" class="text-center py-12">
            <div
              class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="pi pi-history text-gray-400 text-3xl"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">ยังไม่มีประมูลที่เสร็จสิ้น</h3>
            <p class="text-gray-600">ประมูลที่เสร็จสิ้นจะแสดงที่นี่</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="auction in recentAuctions"
              :key="auction.fishName"
              class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-center gap-4">
                <!-- Fish Icon -->
                <div
                  class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <i class="pi pi-fish text-gray-500 text-2xl"></i>
                </div>

                <!-- Auction Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div>
                      <h4 class="font-semibold text-gray-900 text-lg">{{ auction.fishName }}</h4>
                      <p class="text-sm text-gray-600">
                        {{ auction.breed }} - {{ auction.size }} ซม.
                      </p>
                    </div>
                    <Tag
                      :value="auction.status === 'Completed' ? 'เสร็จสิ้น' : 'ไม่มีผู้ประมูล'"
                      :severity="auction.status === 'Completed' ? 'success' : 'warning'"
                      size="small"
                    />
                  </div>

                  <div class="mt-2 flex items-center justify-between">
                    <div class="flex items-center gap-4 text-sm text-gray-600">
                      <span class="flex items-center gap-1">
                        <i class="pi pi-user text-xs"></i>
                        {{ auction.winner }}
                      </span>
                      <span class="flex items-center gap-1">
                        <i class="pi pi-clock text-xs"></i>
                        {{ formatDate(auction.endTime) }}
                      </span>
                    </div>
                    <div class="text-right">
                      <p class="text-2xl font-bold text-green-600">
                        {{
                          auction.finalPrice > 0
                            ? formatCurrency(auction.finalPrice)
                            : 'ไม่มีผู้ประมูล'
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>

  <ModalAddContent
    v-if="auctionContentModal"
    :showAddContentModal="auctionContentModal"
    @onCloseAddContentModal="closeAuctionContent"
  />

  <ModalAddAuction
    :showAddAuctionModal="auctionSettingModal"
    @onCloseAddAuctionModal="closeAuctionSetting"
    :availableProducts="availableProducts"
  />
</template>
