<script setup lang="ts">
import { ref } from 'vue'
import { Card, Tabs, TabList, TabPanel, TabPanels, Tab, Avatar, Badge } from 'primevue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useAuctionStore } from '@/stores/auction/auction'
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
  },
  {
    id: 2,
    fishName: 'ปลาคราฟไทชู',
    breed: 'ไทชู',
    size: 38,
    currentPrice: 98000,
    bidCount: 15,
    timeLeft: '1 ชม. 30 นาที',
  },
  {
    id: 3,
    fishName: 'ปลาคราฟชิโรอุตสึริ',
    breed: 'ชิโรอุตสึริ',
    size: 42,
    currentPrice: 156000,
    bidCount: 31,
    timeLeft: '45 นาที',
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

const auctionStore = useAuctionStore()
const { data, isLoading } = useQuery<any[]>({
  queryKey: ['get_auctions'],
  queryFn: () => auctionStore.onGetAuctions(),
})
const activeTab = ref('all')

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
        />

        <Button
          label="ตั้งค่าประกาศ"
          icon="pi pi-megaphone"
          severity="info"
          size="small"
          @click="openAuctionContent"
        />
        <!-- <Button label="ประมูลที่กำลังดำเนิน" icon="pi pi-play" size="small" /> -->
      </div>
    </div>

    <!-- Auction Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card :pt="{ body: 'p-3 md:p-5' }">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium! text-gray-600">ประมูลที่กำลังดำเนิน</p>
              <p class="text-lg md:text-xl font-[600]! text-gray-900">12</p>
            </div>
            <div class="md:w-12 md:h-12 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-play text-blue-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-3 md:p-5' }">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium! text-gray-600">ประมูลที่เสร็จสิ้น</p>
              <p class="text-lg md:text-xl font-[600]! text-gray-900">156</p>
            </div>
            <div class="md:w-12 md:h-12 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-check text-green-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-3 md:p-5' }">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium! text-gray-600">ยอดประมูลวันนี้</p>
              <p class="text-lg md:text-xl font-[600]! text-gray-900">฿2.3M</p>
            </div>
            <div class="md:w-12 md:h-12 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-money-bill text-orange-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-3 md:p-5' }">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium! text-gray-600">ผู้เข้าร่วมประมูล</p>
              <p class="text-lg md:text-xl font-[600]! text-gray-900">89</p>
            </div>
            <div class="md:w-12 md:h-12 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-users text-purple-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Active Auctions -->
    <!-- <Card>
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="text-lg font-semibold text-gray-900">ประมูลที่กำลังดำเนิน</h3>
          <p class="text-sm text-gray-600 mt-1">รายการประมูลปลาคราฟที่กำลังดำเนินอยู่</p>
        </div>
      </template>
      <template #content>
        <div class="p-6 pt-0">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="auction in activeAuctions"
              :key="auction.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div
                class="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center"
              >
                <i class="pi pi-fish text-4xl text-gray-400"></i>
              </div>
              <h4 class="font-semibold text-gray-900 mb-2">{{ auction.fishName }}</h4>
              <p class="text-sm text-gray-600 mb-2">{{ auction.breed }} - {{ auction.size }} ซม.</p>
              <div class="flex justify-between items-center mb-3">
                <span class="text-lg font-bold text-green-600"
                  >฿{{ auction.currentPrice.toLocaleString() }}</span
                >
                <span class="text-sm text-gray-500">{{ auction.timeLeft }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">{{ auction.bidCount }} ครั้ง</span>
                <Button label="ดูรายละเอียด" size="small" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card> -->

    <Card :pt="{ body: 'p-3' }">
      <template #content>
        <Tabs :value="activeTab" :pt="{ tablist: 'p-3' }">
          <TabList size="small">
            <Tab value="all" as="div" class="flex items-center gap-2">
              <i class="pi pi-hashtag" />
              <span class="font-bold whitespace-nowrap">ทั้งหมด</span>
            </Tab>

            <Tab value="pending" as="div" class="flex items-center gap-2">
              <i class="pi pi-clock" />
              <span class="font-bold whitespace-nowrap">กำลังประมูล</span>
              <Badge value="2" severity="danger" size="small" v-if="false" />
            </Tab>

            <Tab value="success" class="flex items-center gap-2">
              <i class="pi pi-check-circle" />
              <span class="font-bold whitespace-nowrap">ประมูลเสร็จสิ้น</span>
            </Tab>

            <Tab value="cancel" class="flex items-center gap-2">
              <i class="pi pi-times-circle" />
              <span class="font-bold whitespace-nowrap">ยกเลิกประมูล</span>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="all" as="div" class="m-0"> ทั้งหมด </TabPanel>
            <TabPanel value="pending" as="div" class="m-0"> กำลังประมูล </TabPanel>
            <TabPanel value="success" as="div" class="m-0">
              <p class="m-0">ประมูลเสร็จสิ้น</p>
            </TabPanel>
            <TabPanel value="cancel" as="div" class="m-0"> ยกเลิกประมูล </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <!-- Recent Auctions -->
    <Card >
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="text-lg font-semibold text-gray-900">ประมูลที่เพิ่งเสร็จสิ้น</h3>
          <p class="text-sm text-gray-600 mt-1">รายการประมูลที่เพิ่งเสร็จสิ้น</p>
        </div>
      </template>
      <template #content>
        <div class="p-6 pt-0">
          <DataTable :value="recentAuctions" :paginator="true" :rows="10" class="p-datatable-sm">
            <Column field="fishName" header="ชื่อปลา" sortable></Column>
            <Column field="breed" header="สายพันธุ์" sortable></Column>
            <Column field="size" header="ขนาด (ซม.)" sortable></Column>
            <Column field="finalPrice" header="ราคาสุดท้าย" sortable>
              <template #body="slotProps">
                <span class="font-semibold text-green-600"
                  >฿{{ slotProps.data.finalPrice.toLocaleString() }}</span
                >
              </template>
            </Column>
            <Column field="winner" header="ผู้ชนะ" sortable></Column>
            <Column field="endTime" header="เวลาสิ้นสุด" sortable>
              <template #body="slotProps">
                <span class="text-sm text-gray-600">{{ formatDate(slotProps.data.endTime) }}</span>
              </template>
            </Column>
            <Column field="status" header="สถานะ" sortable>
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.status"
                  :severity="slotProps.data.status === 'Completed' ? 'success' : 'warning'"
                />
              </template>
            </Column>
          </DataTable>
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
  />
</template>


