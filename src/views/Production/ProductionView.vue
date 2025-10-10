<script setup lang="ts">
import { ref } from 'vue'
import {
  Card,
  Button,
  ProgressBar,
  Tag,
  DataTable,
  Column,
  Tabs,
  TabPanels,
  Tab,
  TabList,
  TabPanel,
} from 'primevue'
import ModalAddProduction from '@/components/production/ModalAddProduction.vue'
import ModalProductionSettings from '@/components/production/ModalProductionSettings.vue'

// Sample data for production dashboard
const productionStats = ref({
  totalFish: 1250,
  activeProduction: 45,
  completedToday: 12,
  qualityPassRate: 98.5,
  averageGrowthTime: 8.5,
  totalRevenue: 2850000,
})

// Sample data for production tracking
const productionTracking = ref([
  {
    id: 1,
    batchNumber: 'BATCH-2024-001',
    fishType: 'โคฮากุ',
    quantity: 50,
    startDate: '2024-01-15',
    expectedHarvest: '2024-03-15',
    currentStage: 'การเจริญเติบโต',
    progress: 65,
    status: 'active',
    waterTemp: 24.5,
    phLevel: 7.2,
    healthScore: 95,
  },
  {
    id: 2,
    batchNumber: 'BATCH-2024-002',
    fishType: 'ไทชู',
    quantity: 30,
    startDate: '2024-01-20',
    expectedHarvest: '2024-03-20',
    currentStage: 'การเจริญเติบโต',
    progress: 45,
    status: 'active',
    waterTemp: 25.1,
    phLevel: 7.0,
    healthScore: 92,
  },
  {
    id: 3,
    batchNumber: 'BATCH-2024-003',
    fishType: 'ชิโรอุตสึริ',
    quantity: 25,
    startDate: '2024-01-25',
    expectedHarvest: '2024-03-25',
    currentStage: 'การเตรียมพร้อม',
    progress: 20,
    status: 'preparation',
    waterTemp: 23.8,
    phLevel: 7.3,
    healthScore: 88,
  },
])

// Sample data for production schedule
const productionSchedule = ref([
  {
    id: 1,
    task: 'การให้อาหารเช้า',
    time: '08:00',
    batch: 'BATCH-2024-001',
    status: 'completed',
    assignedTo: 'คุณสมชาย',
  },
  {
    id: 2,
    task: 'ตรวจสอบคุณภาพน้ำ',
    time: '09:00',
    batch: 'BATCH-2024-002',
    status: 'in-progress',
    assignedTo: 'คุณนิดา',
  },
  {
    id: 3,
    task: 'การให้อาหารเย็น',
    time: '17:00',
    batch: 'BATCH-2024-001',
    status: 'pending',
    assignedTo: 'คุณปิยะ',
  },
])

// Sample data for quality control
const qualityControl = ref([
  {
    id: 1,
    batchNumber: 'BATCH-2024-001',
    testDate: '2024-01-15',
    waterQuality: 'ดีเยี่ยม',
    fishHealth: 'ดีเยี่ยม',
    growthRate: 'ปกติ',
    overallScore: 95,
    status: 'ผ่าน',
  },
  {
    id: 2,
    batchNumber: 'BATCH-2024-002',
    testDate: '2024-01-14',
    waterQuality: 'ดี',
    fishHealth: 'ดี',
    growthRate: 'ช้า',
    overallScore: 85,
    status: 'ผ่าน',
  },
])

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'preparation':
      return 'warning'
    case 'completed':
      return 'info'
    case 'pending':
      return 'secondary'
    case 'in-progress':
      return 'warning'
    case 'ผ่าน':
      return 'success'
    default:
      return 'secondary'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'กำลังผลิต'
    case 'preparation':
      return 'เตรียมพร้อม'
    case 'completed':
      return 'เสร็จสิ้น'
    case 'pending':
      return 'รอดำเนินการ'
    case 'in-progress':
      return 'กำลังดำเนินการ'
    case 'ผ่าน':
      return 'ผ่าน'
    default:
      return status
  }
}

// Modal states
const showAddModal = ref(false)
const showSettingsModal = ref(false)

const openAddModal = () => {
  showAddModal.value = true
  // TODO: Implement modal functionality
  console.log('เปิด Modal เพิ่มการผลิตใหม่')
}

const openSettingsModal = () => {
  showSettingsModal.value = true
  // TODO: Implement modal functionality
  console.log('เปิด Modal ตั้งค่าการผลิต')
}

const closeAddModal = () => {
  showAddModal.value = false
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

const activeTab = ref('tracking')
const handleTabChange = (value: string) => {
  activeTab.value = value
}
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ระบบการผลิตปลาคาร์ฟ</h1>
        <p class="text-gray-600">จัดการและติดตามการผลิตปลาคาร์ฟอย่างมีประสิทธิภาพ</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          label="เพิ่มการผลิตใหม่"
          icon="pi pi-plus"
          severity="success"
          size="small"
          class="btn-hover"
          @click="openAddModal"
        />
        <!-- <Button
          label="รายงานการผลิต"
          icon="pi pi-chart-line"
          severity="info"
          size="small"
          class="btn-hover"
        /> -->
        <Button
          label="ตั้งค่าการผลิต"
          icon="pi pi-cog"
          severity="secondary"
          size="small"
          class="btn-hover"
          @click="openSettingsModal"
        />
      </div>
    </div>

    <!-- Production Stats Dashboard -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">ปลาทั้งหมด</p>
              <p class="text-xl md:text-2xl font-bold text-blue-600">
                {{ productionStats.totalFish.toLocaleString() }}
              </p>
              <p class="text-xs text-gray-500">ตัว</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-fish text-blue-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">กำลังผลิต</p>
              <p class="text-xl md:text-2xl font-bold text-green-600">
                {{ productionStats.activeProduction }}
              </p>
              <p class="text-xs text-gray-500">แบทช์</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-play text-green-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">เสร็จสิ้นวันนี้</p>
              <p class="text-xl md:text-2xl font-bold text-orange-600">
                {{ productionStats.completedToday }}
              </p>
              <p class="text-xs text-gray-500">แบทช์</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-check text-orange-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">อัตราคุณภาพ</p>
              <p class="text-xl md:text-2xl font-bold text-purple-600">
                {{ productionStats.qualityPassRate }}%
              </p>
              <p class="text-xs text-gray-500">ผ่านมาตรฐาน</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-star text-purple-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">เวลาผลิตเฉลี่ย</p>
              <p class="text-xl md:text-2xl font-bold text-indigo-600">
                {{ productionStats.averageGrowthTime }}
              </p>
              <p class="text-xs text-gray-500">เดือน</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-clock text-indigo-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">รายได้รวม</p>
              <p class="text-xl md:text-2xl font-bold text-emerald-600">
                {{ formatCurrency(productionStats.totalRevenue) }}
              </p>
              <p class="text-xs text-gray-500">บาท</p>
            </div>
            <div
              class="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-money-bill text-emerald-600 text-lg md:text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Content Tabs -->
    <Card class="rounded-2xl bg-white/80">
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="tracking">ติดตามการผลิต</Tab>
            <Tab value="schedule">ตารางการผลิต</Tab>
            <Tab value="quality">ควบคุมคุณภาพ</Tab>
            <Tab value="reports">รายงานการผลิต</Tab>
          </TabList>

          <TabPanels>
            <!-- Production Tracking Tab -->
            <TabPanel value="tracking">
              <h3 class="text-lg font-semibold! text-gray-900 mb-1">
                การติดตามการผลิตแบบเรียลไทม์
              </h3>
              <p class="text-sm text-gray-600 mb-4">ติดตามสถานะการผลิตปลาคาร์ฟในแต่ละแบทช์</p>

              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div
                  v-for="batch in productionTracking"
                  :key="batch.id"
                  class="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                >
                  <!-- Batch Header -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div>
                      <h4 class="font-semibold text-gray-900 text-base md:text-lg">
                        {{ batch.batchNumber }}
                      </h4>
                      <p class="text-sm text-gray-600">
                        {{ batch.fishType }} - {{ batch.quantity }} ตัว
                      </p>
                    </div>
                    <Tag
                      :value="getStatusLabel(batch.status)"
                      :severity="getStatusSeverity(batch.status)"
                      size="small"
                    />
                  </div>

                  <!-- Progress Section -->
                  <div class="mb-4">
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{{ batch.currentStage }}</span>
                      <span>{{ batch.progress }}%</span>
                    </div>
                    <ProgressBar :value="batch.progress" class="h-2" />
                  </div>

                  <!-- Timeline -->
                  <div class="mb-4 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">เริ่มผลิต:</span>
                      <span class="font-medium">{{ formatDate(batch.startDate) }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">คาดการณ์เก็บเกี่ยว:</span>
                      <span class="font-medium">{{ formatDate(batch.expectedHarvest) }}</span>
                    </div>
                  </div>

                  <!-- Environment Data -->
                  <div class="grid grid-cols-3 gap-2 md:gap-3 mb-4">
                    <div class="text-center p-2 bg-blue-50 rounded-lg">
                      <p class="text-xs text-blue-600 font-medium">อุณหภูมิ</p>
                      <p class="text-sm font-bold text-blue-800">{{ batch.waterTemp }}°C</p>
                    </div>
                    <div class="text-center p-2 bg-green-50 rounded-lg">
                      <p class="text-xs text-green-600 font-medium">pH</p>
                      <p class="text-sm font-bold text-green-800">{{ batch.phLevel }}</p>
                    </div>
                    <div class="text-center p-2 bg-purple-50 rounded-lg">
                      <p class="text-xs text-purple-600 font-medium">สุขภาพ</p>
                      <p class="text-sm font-bold text-purple-800">{{ batch.healthScore }}%</p>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex flex-col sm:flex-row gap-2">
                    <Button
                      label="ดูรายละเอียด"
                      icon="pi pi-eye"
                      size="small"
                      severity="secondary"
                      class="flex-1"
                    />
                    <Button
                      icon="pi pi-pencil"
                      size="small"
                      severity="info"
                      outlined
                      class="sm:w-auto w-full"
                    />
                  </div>
                </div>
              </div>
            </TabPanel>

            <!-- Production Schedule Tab -->
            <TabPanel value="schedule">
              <h3 class="text-lg font-semibold! text-gray-900 mb-1">ตารางการทำงานประจำวัน</h3>
              <p class="text-sm text-gray-600 mb-4">จัดการและติดตามงานประจำวันในการผลิต</p>

              <DataTable
                :value="productionSchedule"
                :paginator="true"
                :rows="10"
                class="p-datatable-sm"
              >
                <Column
                  field="time"
                  header="เวลา"
                  sortable
                  :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[6rem]' }"
                />
                <Column
                  field="task"
                  header="งาน"
                  sortable
                  :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[12rem]' }"
                />
                <Column
                  field="batch"
                  header="แบทช์"
                  sortable
                  :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[10rem]' }"
                />
                <Column
                  field="assignedTo"
                  header="ผู้รับผิดชอบ"
                  sortable
                  :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[8rem]' }"
                />
                <Column
                  field="status"
                  header="สถานะ"
                  :pt="{
                    columnTitle: 'font-semibold',
                    columnHeaderContent: 'justify-center min-w-[8rem]',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <Tag
                      :value="getStatusLabel(slotProps.data.status)"
                      :severity="getStatusSeverity(slotProps.data.status)"
                      size="small"
                    />
                  </template>
                </Column>
                <Column
                  header="จัดการ"
                  :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'justify-end' }"
                >
                  <template #body>
                    <div class="flex space-x-2 justify-end">
                      <Button
                        icon="pi pi-eye"
                        size="small"
                        text
                        rounded
                        severity="info"
                        v-tooltip.top="'ดูรายละเอียด'"
                      />
                      <Button
                        icon="pi pi-pencil"
                        size="small"
                        text
                        rounded
                        severity="warning"
                        v-tooltip.top="'แก้ไข'"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <!-- Quality Control Tab -->
            <TabPanel value="quality">
                <h3 class="text-lg font-semibold! text-gray-900 mb-1">การควบคุมคุณภาพ</h3>
                <p class="text-sm text-gray-600 mb-4">ตรวจสอบและประเมินคุณภาพการผลิต</p>

                <DataTable
                  :value="qualityControl"
                  :paginator="true"
                  :rows="10"
                  class="p-datatable-sm"
                >
                  <Column
                    field="batchNumber"
                    header="หมายเลขแบทช์"
                    sortable
                    :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[10rem]' }"
                  />
                  <Column
                    field="testDate"
                    header="วันที่ตรวจสอบ"
                    sortable
                    :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[8rem]' }"
                  >
                    <template #body="slotProps">
                      <span>{{ formatDate(slotProps.data.testDate) }}</span>
                    </template>
                  </Column>
                  <Column
                    field="waterQuality"
                    header="คุณภาพน้ำ"
                    sortable
                    :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[8rem]' }"
                  />
                  <Column
                    field="fishHealth"
                    header="สุขภาพปลา"
                    sortable
                    :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[8rem]' }"
                  />
                  <Column
                    field="growthRate"
                    header="อัตราการเจริญเติบโต"
                    sortable
                    :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'min-w-[10rem]' }"
                  />
                  <Column
                    field="overallScore"
                    header="คะแนนรวม"
                    sortable
                    :pt="{
                      columnTitle: 'font-semibold',
                      columnHeaderContent: 'min-w-[8rem]',
                      bodyCell: 'text-center',
                    }"
                  >
                    <template #body="slotProps">
                      <div class="text-center">
                        <span
                          class="text-lg font-bold"
                          :class="{
                            'text-green-600': slotProps.data.overallScore >= 90,
                            'text-yellow-600':
                              slotProps.data.overallScore >= 80 && slotProps.data.overallScore < 90,
                            'text-red-600': slotProps.data.overallScore < 80,
                          }"
                        >
                          {{ slotProps.data.overallScore }}
                        </span>
                      </div>
                    </template>
                  </Column>
                  <Column
                    field="status"
                    header="สถานะ"
                    :pt="{
                      columnTitle: 'font-semibold',
                      columnHeaderContent: 'justify-center min-w-[6rem]',
                      bodyCell: 'text-center',
                    }"
                  >
                    <template #body="slotProps">
                      <Tag
                        :value="slotProps.data.status"
                        :severity="getStatusSeverity(slotProps.data.status)"
                        size="small"
                      />
                    </template>
                  </Column>
                  <Column
                    header="จัดการ"
                    :pt="{ columnTitle: 'font-semibold', columnHeaderContent: 'justify-end' }"
                  >
                    <template #body>
                      <div class="flex space-x-2 justify-end">
                        <Button
                          icon="pi pi-eye"
                          size="small"
                          text
                          rounded
                          severity="info"
                          v-tooltip.top="'ดูรายละเอียด'"
                        />
                        <Button
                          icon="pi pi-file-pdf"
                          size="small"
                          text
                          rounded
                          severity="danger"
                          v-tooltip.top="'ส่งออกรายงาน'"
                        />
                      </div>
                    </template>
                  </Column>
                </DataTable>
            </TabPanel>

            <!-- Production Reports Tab -->
            <TabPanel value="reports">
                <h3 class="text-lg font-semibold! text-gray-900 mb-1">รายงานและสถิติการผลิต</h3>
                <p class="text-sm text-gray-600 mb-4">วิเคราะห์และติดตามผลการผลิต</p>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <!-- Production Chart Placeholder -->
                  <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">กราฟการผลิตรายเดือน</h4>
                    <div class="h-64 bg-white rounded-lg flex items-center justify-center">
                      <div class="text-center">
                        <i class="pi pi-chart-line text-4xl text-blue-400 mb-2"></i>
                        <p class="text-gray-600">กราฟการผลิตจะแสดงที่นี่</p>
                      </div>
                    </div>
                  </div>

                  <!-- Quality Trend Chart Placeholder -->
                  <div class="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">แนวโน้มคุณภาพ</h4>
                    <div class="h-64 bg-white rounded-lg flex items-center justify-center">
                      <div class="text-center">
                        <i class="pi pi-chart-bar text-4xl text-green-400 mb-2"></i>
                        <p class="text-gray-600">กราฟคุณภาพจะแสดงที่นี่</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Report Actions -->
                <div class="mt-6 flex flex-wrap gap-3">
                  <Button
                    label="ส่งออกรายงาน PDF"
                    icon="pi pi-file-pdf"
                    severity="danger"
                    size="small"
                  />
                  <Button
                    label="ส่งออกรายงาน Excel"
                    icon="pi pi-file-excel"
                    severity="success"
                    size="small"
                  />

                  <Button
                    label="ส่งออกรายงาน Word"
                    icon="pi pi-file-word"
                    severity="info"
                    size="small"
                  />
                  <Button
                    label="ส่งออกรายงาน PowerPoint"
                    icon="pi pi-file-powerpoint"
                    severity="warning"

                    size="small"
                  />
                </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <!-- Modals -->
    <ModalAddProduction :showAddModal="showAddModal" @onCloseAddModal="closeAddModal" />

    <ModalProductionSettings
      :showSettingsModal="showSettingsModal"
      @onCloseSettingsModal="closeSettingsModal"
    />
  </div>
</template>
