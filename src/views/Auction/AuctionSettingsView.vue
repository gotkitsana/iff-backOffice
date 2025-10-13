<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Breadcrumb -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <nav class="flex items-center space-x-2 text-sm text-gray-600">
        <span class="hover:text-blue-600 cursor-pointer" @click="$router.push('/auction')"
          >Auction</span
        >
        <i class="pi pi-chevron-right text-xs"></i>
        <span class="text-gray-900 font-medium">ตั้งค่าระบบประมูล</span>
      </nav>
    </div>

    <div class="max-w-6xl mx-auto p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Panel - Auction Details & Bidders -->
        <div class="space-y-6">
          <!-- Auction Item Info -->
          <Card class="overflow-hidden">
            <template #content>
              <div class="flex items-center gap-4 p-6">
                <div
                  class="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center"
                >
                  <i class="pi pi-fish text-blue-400 text-3xl"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ auction?.fishName || 'Test' }}
                  </h3>
                  <p class="text-sm text-gray-600">{{ auction?.breed || 'Kohaku' }}</p>
                  <p class="text-sm text-gray-500">{{ auction?.id || '015' }}</p>
                </div>
              </div>
            </template>
          </Card>

          <!-- Bidders Section -->
          <Card>
            <template #content>
              <div class="p-4">
                <h4 class="text-lg font-semibold text-gray-900 mb-4">จำนวนผู้ประมูล (1) คน</h4>

                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"
                      >
                        <i class="pi pi-user text-gray-600"></i>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900">inter fishfarm</p>
                        <p class="text-sm text-green-600">สถานะ : ประมูลได้</p>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <Button
                        icon="pi pi-ban"
                        size="small"
                        severity="secondary"
                        outlined
                        label="บล็อค"
                      />
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        severity="danger"
                        outlined
                        label="ลบ"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Auction History -->
          <Card>
            <template #content>
              <div class="p-4">
                <h4 class="text-lg font-semibold text-gray-900 mb-4">ประวัติการประมูล</h4>

                <div class="space-y-3">
                  <div
                    class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <i class="pi pi-arrow-right text-gray-400"></i>
                      <div
                        class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"
                      >
                        <i class="pi pi-user text-gray-600 text-xs"></i>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900">inter fishfarm</p>
                        <p class="text-sm text-gray-500">11 ต.ค. 2025 เวลา 16:58:39</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-600">ราคาประมูล</span>
                      <i class="pi pi-arrow-up text-green-600"></i>
                      <span class="font-bold text-green-600">฿3</span>
                    </div>
                  </div>

                  <div
                    class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <i class="pi pi-arrow-right text-gray-400"></i>
                      <div
                        class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"
                      >
                        <i class="pi pi-user text-gray-600 text-xs"></i>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900">inter fishfarm</p>
                        <p class="text-sm text-gray-500">11 ต.ค. 2025 เวลา 16:57:39</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-600">ราคาประมูล</span>
                      <i class="pi pi-arrow-up text-green-600"></i>
                      <span class="font-bold text-green-600">฿2</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Right Panel - Auction Settings -->
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-6">ตั้งค่าระบบประมูล</h4>

          <!-- Toggle Switch -->
          <div class="flex items-center justify-between mb-6">
            <span class="text-sm font-medium text-gray-700">สถานะระบบประมูล</span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">ปิด</span>
              <div class="relative">
                <input
                  type="checkbox"
                  id="auctionToggle"
                  class="sr-only"
                  v-model="auctionSettings.enabled"
                />
                <label
                  for="auctionToggle"
                  class="block w-12 h-6 bg-gray-300 rounded-full cursor-pointer transition-colors duration-200"
                  :class="{ 'bg-green-500': auctionSettings.enabled }"
                >
                  <div
                    class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200"
                    :class="{ 'transform translate-x-6': auctionSettings.enabled }"
                  ></div>
                </label>
              </div>
              <span class="text-sm text-gray-500">เปิด</span>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Starting Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">ราคาเริ่มต้น</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >฿</span
                >
                <InputText
                  v-model="auctionSettings.startingPrice"
                  class="w-full pl-8 pr-16"
                  placeholder="1"
                />
                <span
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
                  >บาท</span
                >
              </div>
            </div>

            <!-- Auction Start Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">วันที่เปิดประมูล</label>
              <InputText
                v-model="auctionSettings.startDate"
                class="w-full"
                placeholder="26/09/2025, 09:15:11"
              />
            </div>

            <!-- Auction End Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >วันที่สิ้นสุดประมูล</label
              >
              <InputText
                v-model="auctionSettings.endDate"
                class="w-full"
                placeholder="26/09/2568, 09:16:00"
              />
            </div>

            <!-- Time After Bidding -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >เวลาหลังจาก BIDDING</label
              >
              <div class="relative">
                <InputText
                  v-model="auctionSettings.timeAfterBidding"
                  class="w-full pr-16"
                  placeholder="180"
                />
                <span
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
                  >วินาที</span
                >
              </div>
            </div>

            <!-- Information Box -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
                <p class="text-sm text-blue-800">
                  เงื่อนไขนี้จะทำงานเมื่อเวลาประมูลเหลือน้อยกว่าหรือเท่ากับ 5 วินาที
                </p>
              </div>
            </div>

            <!-- Minimum Bid -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">ประมูลขั้นต่ำ</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >฿</span
                >
                <InputText
                  v-model="auctionSettings.minimumBid"
                  class="w-full pl-8 pr-16"
                  placeholder="1"
                />
                <span
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
                  >บาท</span
                >
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="mt-8">
            <Button
              label="บันทึก"
              icon="pi pi-check"
              severity="success"
              class="w-full"
              @click="saveAuctionSettings"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Card, Button, InputText } from 'primevue'
import { useRoute } from 'vue-router'

interface Auction {
  id: number
  fishName: string
  breed: string
  size: number
  currentPrice: number
  bidCount: number
  timeLeft: string
  status: string
  image?: string
}

const route = useRoute()
const auction = ref<Auction | null>(null)

const auctionSettings = reactive({
  enabled: true,
  startingPrice: '1',
  startDate: '26/09/2025, 09:15:11',
  endDate: '26/09/2568, 09:16:00',
  timeAfterBidding: '180',
  minimumBid: '1',
})

const saveAuctionSettings = () => {
  console.log('Saving auction settings:', auctionSettings)
  // Implement save logic here
  // Show success message
  alert('บันทึกการตั้งค่าเรียบร้อยแล้ว')
}

// Load auction data based on route params
onMounted(() => {
  const auctionId = route.params.id
  // In a real app, you would fetch auction data based on ID
  // For now, we'll use sample data
  auction.value = {
    id: Number(auctionId) || 1,
    fishName: 'Test',
    breed: 'Kohaku',
    size: 45,
    currentPrice: 125000,
    bidCount: 23,
    timeLeft: '2 ชม. 15 นาที',
    status: 'กำลังประมูล',
    image: '/api/placeholder/300/200',
  }
})
</script>

<style scoped>
/* Custom styles for better appearance */
.p-card {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.p-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
