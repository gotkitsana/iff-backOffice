<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Breadcrumb -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <nav class="flex items-center space-x-2 text-sm text-gray-600">
        <span class="hover:text-blue-600 cursor-pointer" @click="$router.push('/auction')"
          >Auction</span
        >
        <i class="pi pi-chevron-right text-xs"></i>
        <span class="text-gray-900 font-medium">รายละเอียดการประมูล</span>
      </nav>
    </div>

    <div class="max-w-6xl mx-auto p-6 space-y-6">
      <!-- Auction Item Information -->
      <Card class="overflow-hidden">
        <template #content>
          <div class="flex items-start gap-6 p-6">
            <!-- Fish Image -->
            <div
              class="w-48 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            >
              <img
                v-if="auction?.image"
                :src="auction.image"
                :alt="auction.fishName"
                class="w-full h-full object-cover rounded-xl"
              />
              <div v-else class="text-center">
                <i class="pi pi-fish text-6xl text-blue-400 mb-2"></i>
                <p class="text-blue-600 font-medium">รูปภาพปลา</p>
              </div>
            </div>

            <!-- Item Details -->
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {{ auction?.fishName || 'Test' }}
              </h1>
              <div class="flex items-center gap-2 text-lg text-gray-600 mb-4">
                <span class="font-medium">{{ auction?.breed || 'Kohaku' }}</span>
                <span class="text-gray-400">•</span>
                <span>{{ auction?.id || '015' }}</span>
              </div>

              <!-- Status and Price -->
              <div class="flex items-center gap-4 mb-4">
                <Tag
                  :value="auction?.status || 'กำลังประมูล'"
                  :severity="getStatusSeverity(auction?.status || 'กำลังประมูล')"
                  size="large"
                />
                <div class="text-right">
                  <p class="text-sm text-gray-500">ราคาปัจจุบัน</p>
                  <p class="text-2xl font-bold text-green-600">
                    {{ formatCurrency(auction?.currentPrice ?? 0) }}
                  </p>
                </div>
              </div>

              <!-- Time and Bids Info -->
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-2">
                  <i class="pi pi-clock text-gray-400"></i>
                  <span class="text-gray-600">เวลาที่เหลือ:</span>
                  <span class="font-medium">{{ auction?.timeLeft || '2 ชม. 15 นาที' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="pi pi-users text-gray-400"></i>
                  <span class="text-gray-600">จำนวนครั้งประมูล:</span>
                  <span class="font-medium">{{ auction?.bidCount || 0 }} ครั้ง</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Action Buttons -->
      <Card>
        <template #content>
          <div class="p-6 space-y-4">
            <div class="flex gap-4">
              <Button
                label="กลับไปยังรายการประมูล"
                icon="pi pi-arrow-left"
                severity="secondary"
                @click="$router.push('/auction')"
              />
              <Button
                label="ตั้งค่าการประมูล"
                icon="pi pi-cog"
                severity="info"
                @click="goToSettings"
              />
              <Button label="แก้ไขข้อมูลประมูล" icon="pi pi-pencil" severity="warning" outlined />
              <Button label="ลบการประมูล" icon="pi pi-trash" severity="danger" outlined />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Card, Tag, Button } from 'primevue'
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

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'กำลังประมูล':
      return 'success'
    case 'รอประมูล':
      return 'warning'
    case 'ปิดประมูล':
      return 'info'
    default:
      return 'success'
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}

const goToSettings = () => {
  if (auction.value?.id) {
    window.location.href = `/auction/${auction.value.id}/settings`
  }
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
