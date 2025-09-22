<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard ระบบประมูลปลาคราฟ</h1>
        <p class="text-gray-600 mt-1">ภาพรวมการดำเนินงานของระบบประมูลปลาคราฟ</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- ยอดขายรายสัปดาห์ -->
      <Card class="p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">ยอดขายรายสัปดาห์</p>
              <p class="text-2xl font-bold text-gray-900">฿2,302</p>
              <div class="flex items-center mt-2">
                <i class="pi pi-arrow-up text-green-500 text-xs mr-1"></i>
                <span class="text-green-500 text-sm font-medium">29%</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-chart-line text-blue-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- ยอดขายรายเดือน -->
      <Card class="p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">ยอดขายรายเดือน</p>
              <p class="text-2xl font-bold text-gray-900">฿72,302</p>
              <div class="flex items-center mt-2">
                <i class="pi pi-arrow-up text-green-500 text-xs mr-1"></i>
                <span class="text-green-500 text-sm font-medium">48%</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-chart-bar text-green-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- ยอดขายรายปี -->
      <Card class="p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">ยอดขายรายปี</p>
              <p class="text-2xl font-bold text-gray-900">฿780,302</p>
              <div class="flex items-center mt-2">
                <i class="pi pi-arrow-up text-green-500 text-xs mr-1"></i>
                <span class="text-green-500 text-sm font-medium">64%</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-chart-pie text-purple-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- จำนวนปลาที่ประมูล -->
      <Card class="p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">ปลาที่ประมูล</p>
              <p class="text-2xl font-bold text-gray-900">1,247</p>
              <div class="flex items-center mt-2">
                <i class="pi pi-arrow-up text-green-500 text-xs mr-1"></i>
                <span class="text-green-500 text-sm font-medium">12%</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-fish text-orange-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Performance Chart -->
      <Card>
        <template #header>
          <div class="p-6 pb-0">
            <h3 class="text-lg font-semibold text-gray-900">ประสิทธิภาพการประมูล</h3>
            <p class="text-sm text-gray-600 mt-1">ข้อมูลการประมูล 14 วันล่าสุด</p>
          </div>
        </template>
        <template #content>
          <div class="p-6 pt-0">
            <!-- Simple Bar Chart Representation -->
            <div class="space-y-4">
              <div class="flex items-end justify-between h-48 space-x-1">
                <div
                  v-for="(value, index) in chartData"
                  :key="index"
                  class="flex flex-col items-center flex-1"
                >
                  <div
                    class="w-full bg-blue-200 rounded-t"
                    :style="{ height: `${(value / Math.max(...chartData)) * 100}%` }"
                  ></div>
                  <div class="text-xs text-gray-500 mt-2">
                    {{ String(index + 1).padStart(2, '0') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Auction Status -->
      <Card>
        <template #header>
          <div class="p-6 pb-0">
            <h3 class="text-lg font-semibold text-gray-900">สถานะการประมูล</h3>
            <p class="text-sm text-gray-600 mt-1">ข้อมูลการประมูลปัจจุบัน</p>
          </div>
        </template>
        <template #content>
          <div class="p-6 pt-0 space-y-4">
            <!-- Stock Status -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-8 bg-blue-500 rounded"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900">สถานะสต็อก</p>
                  <p class="text-2xl font-bold text-gray-900">22,543</p>
                </div>
              </div>
              <div class="flex items-center">
                <i class="pi pi-arrow-up text-green-500 text-xs mr-1"></i>
                <span class="text-green-500 text-sm font-medium">24%</span>
              </div>
            </div>

            <!-- Products Ordered -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-8 bg-orange-500 rounded"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900">ปลาที่สั่งซื้อ</p>
                  <p class="text-2xl font-bold text-gray-900">19,582</p>
                </div>
              </div>
              <div class="flex items-center">
                <i class="pi pi-arrow-up text-green-500 text-xs mr-1"></i>
                <span class="text-green-500 text-sm font-medium">22%</span>
              </div>
            </div>

            <!-- Inventory Turnover -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-8 bg-yellow-500 rounded"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900">การหมุนเวียนสต็อก</p>
                  <p class="text-2xl font-bold text-gray-900">17,472</p>
                </div>
              </div>
              <div class="flex items-center">
                <i class="pi pi-arrow-up text-green-500 text-xs mr-1"></i>
                <span class="text-green-500 text-sm font-medium">28%</span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Recent Auctions Table -->
    <Card>
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="text-lg font-semibold text-gray-900">การประมูลล่าสุด</h3>
          <p class="text-sm text-gray-600 mt-1">รายการประมูลปลาคราฟที่เพิ่งเสร็จสิ้น</p>
        </div>
      </template>
      <template #content>
        <div class="p-6 pt-0">
          <DataTable :value="recentAuctions" :paginator="true" :rows="5" class="p-datatable-sm">
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
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

// Sample data for charts
const chartData = ref([65, 45, 80, 35, 90, 55, 75, 40, 85, 60, 70, 45, 80, 95])

// Sample data for recent auctions
const recentAuctions = ref([
  {
    fishName: 'ปลาคราฟโคฮากุ',
    breed: 'โคฮากุ',
    size: 45,
    finalPrice: 125000,
    winner: 'คุณสมชาย',
    endTime: new Date('2024-01-15T14:30:00'),
  },
  {
    fishName: 'ปลาคราฟไทชู',
    breed: 'ไทชู',
    size: 38,
    finalPrice: 98000,
    winner: 'คุณสมหญิง',
    endTime: new Date('2024-01-15T13:45:00'),
  },
  {
    fishName: 'ปลาคราฟชิโรอุตสึริ',
    breed: 'ชิโรอุตสึริ',
    size: 42,
    finalPrice: 156000,
    winner: 'คุณวิชัย',
    endTime: new Date('2024-01-15T12:20:00'),
  },
  {
    fishName: 'ปลาคราฟซันเกะ',
    breed: 'ซันเกะ',
    size: 50,
    finalPrice: 189000,
    winner: 'คุณนิดา',
    endTime: new Date('2024-01-15T11:15:00'),
  },
  {
    fishName: 'ปลาคราฟเบคโกะ',
    breed: 'เบคโกะ',
    size: 35,
    finalPrice: 87000,
    winner: 'คุณปิยะ',
    endTime: new Date('2024-01-15T10:30:00'),
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
</script>
