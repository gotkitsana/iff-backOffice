<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { toast } from 'vue3-toastify';

// Components
import { Card, Select } from 'primevue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import FileUpload from 'primevue/fileupload';
import Tag from 'primevue/tag';
import Chart from 'primevue/chart';

// Interfaces
interface Meter {
  id: number;
  name: string;
  location: string;
  limit: number;
  costPerUnit: number;
}

interface Record {
  id: number;
  date: string;
  meterId: number;
  previous: number;
  current: number;
  units: number;
  cost: number;
  status: string;
  recorder: string;
}

// Mock Data & State
const meters = ref<Meter[]>([
  { id: 1, name: 'หน้าฟาร์ม', location: 'หน้าฟาร์ม', limit: 1000, costPerUnit: 5 }
]);

const records = ref<Record[]>([
  { id: 1, date: '2023-10-01', meterId: 1, previous: 0, current: 500, units: 500, cost: 2500, status: 'normal', recorder: 'Admin' }
]);

const showRecordDialog = ref(false);
const showSettingsDialog = ref(false);

// Forms
const recordForm = reactive<{
  meterId: number | null;
  currentReading: number | null;
  units: number | null;
  image: unknown;
}>({
  meterId: null,
  currentReading: null,
  units: null,
  image: null
});

const settingsForm = reactive<{
  id: number | null;
  name: string;
  location: string;
  limit: number | null;
  costPerUnit: number | null;
}>({
  id: null,
  name: '',
  location: '',
  limit: null,
  costPerUnit: null
});

// Computed
const chartData = computed(() => {
  return {
    labels: records.value.map(r => r.date),
    datasets: [
      {
        label: 'หน่วยไฟฟ้าที่ใช้',
        data: records.value.map(r => r.units),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        tension: 0.4
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#495057'
      }
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#495057'
      },
      grid: {
        color: '#ebedef'
      }
    },
    y: {
      ticks: {
        color: '#495057'
      },
      grid: {
        color: '#ebedef'
      }
    }
  }
};

// Methods
const openRecordDialog = () => {
  if (meters.value.length > 0) {
    recordForm.meterId = meters.value[0].id;
  }
  recordForm.currentReading = null;
  recordForm.image = null;
  showRecordDialog.value = true;
};

const saveRecord = () => {
  if (!recordForm.meterId || recordForm.currentReading === null) {
    toast.error('Please fill in all required fields');
    return;
  }

  const meter = meters.value.find(m => m.id === recordForm.meterId);
  if (!meter) return;

  // Find previous reading for this meter
  const meterRecords = records.value.filter(r => r.meterId === recordForm.meterId);
  const lastRecord = meterRecords.length > 0 ? meterRecords[meterRecords.length - 1] : null;
  const previousReading = lastRecord ? lastRecord.current : 0;

  if (recordForm.currentReading < previousReading) {
    toast.error('Current reading cannot be less than previous reading');
    return;
  }

  const units = recordForm.currentReading - previousReading;
  const cost = units * meter.costPerUnit;

  // Calculate status
  let status = 'normal';
  const usagePercent = (units / meter.limit) * 100;
  if (usagePercent > 100) status = 'critical';
  else if (usagePercent >= 50) status = 'warning';

  const newRecord: Record = {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    meterId: recordForm.meterId,
    previous: previousReading,
    current: recordForm.currentReading,
    units: units,
    cost: cost,
    status: status,
    recorder: 'Admin' // Mock user
  };

  records.value.push(newRecord);
  showRecordDialog.value = false;
  toast.success('Record saved successfully');
};

const openSettingsDialog = () => {
  if (meters.value.length > 0) {
    const m = meters.value[0];
    settingsForm.id = m.id;
    settingsForm.name = m.name;
    settingsForm.location = m.location;
    settingsForm.limit = m.limit;
    settingsForm.costPerUnit = m.costPerUnit;
  }
  showSettingsDialog.value = true;
};

const saveSettings = () => {
  const index = meters.value.findIndex(m => m.id === settingsForm.id);
  if (index !== -1 && settingsForm.limit !== null && settingsForm.costPerUnit !== null && settingsForm.id !== null) {
    meters.value[index] = {
      id: settingsForm.id,
      name: settingsForm.name,
      location: settingsForm.location,
      limit: settingsForm.limit,
      costPerUnit: settingsForm.costPerUnit
    };
    toast.success('Settings updated successfully');
  }
  showSettingsDialog.value = false;
};

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'normal': return 'success';
    case 'warning': return 'warning';
    case 'critical': return 'danger';
    default: return 'info';
  }
};

</script>

<template>
  <div>
    <div class="flex justify-between flex-wrap items-center gap-3 mb-4">
      <div>
        <h1 class="text-lg lg:text-xl font-bold text-slate-800">ระบบวิเคราะห์ควบคุมการใช้ไฟฟ้า</h1>
        <p class="text-slate-500 text-sm">Electricity Usage Control Analysis System</p>
      </div>
      <div class="flex gap-2">
        <Button label="ตั้งค่า (Settings)" icon="pi pi-cog" size="small" severity="contrast"
          @click="openSettingsDialog" />
        <Button label="จดมิเตอร์ (Record)" icon="pi pi-plus" size="small" @click="openRecordDialog" />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <Card class="shadow-sm hover:shadow-md transition-shadow">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <p class="text-slate-500 text-sm">ค่าไฟเดือนนี้ (บาท)</p>
              <h2 class="text-xl font-bold text-slate-800">2,500</h2>
            </div>
            <div class="p-2 bg-blue-100 rounded-lg">
              <i class="pi pi-dollar text-blue-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
      <Card class="shadow-sm hover:shadow-md transition-shadow">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <p class="text-slate-500 text-sm">หน่วยที่ใช้ (Units)</p>
              <h2 class="text-xl font-bold text-slate-800">500</h2>
            </div>
            <div class="p-2 bg-green-100 rounded-lg">
              <i class="pi pi-bolt text-green-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
      <Card class="shadow-sm hover:shadow-md transition-shadow">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <p class="text-slate-500 text-sm">หน่วยคงเหลือ</p>
              <h2 class="text-xl font-bold text-slate-800">500</h2>
            </div>
            <div class="p-2 bg-orange-100 rounded-lg">
              <i class="pi pi-chart-pie text-orange-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
      <Card class="shadow-sm hover:shadow-md transition-shadow">
        <template #content>
          <div class="flex justify-between items-start">
            <div>
              <p class="text-slate-500 text-sm">สถานะปัจจุบัน</p>
              <Tag value="อยู่ในเกณฑ์ (Normal)" severity="success" class="px-3 py-1" size="small" />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Left: Chart & Reports -->
      <div class="lg:col-span-2 space-y-4">
        <Card class="shadow-sm">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-line text-slate-400"></i>
              <span class="text-lg font-semibold text-slate-700">กราฟการใช้ไฟฟ้า (Usage Trend)</span>
            </div>
          </template>
          <template #content>
            <div class="h-[300px]">
              <Chart type="line" :data="chartData" :options="chartOptions" class="h-full" />
            </div>
          </template>
        </Card>

        <Card class="shadow-sm">
          <template #title>
            <div class="flex flex-wrap gap-2 items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-list text-slate-400"></i>
                <span class="text-lg font-semibold text-slate-700">ประวัติการบันทึก (History)</span>
              </div>
              <Select :options="meters" optionLabel="name" placeholder="เลือกมิเตอร์" size="small" />
            </div>
          </template>
          <template #content>
            <DataTable :value="records" stripedRows paginator :rows="5" tableStyle="min-width: 50rem">
              <Column field="date" header="วันที่"></Column>
              <Column field="previous" header="อ่านครั้งก่อน"></Column>
              <Column field="current" header="อ่านครั้งหลัง"></Column>
              <Column field="units" header="หน่วยที่ใช้"></Column>
              <Column field="cost" header="ค่าไฟ (บาท)"></Column>
              <Column header="สถานะ">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                </template>
              </Column>
              <Column field="recorder" header="ผู้บันทึก"></Column>
            </DataTable>
          </template>
        </Card>
      </div>

      <!-- Right: Quick Actions / Info -->
      <div class="space-y-4">
        <Card class="shadow-sm">
          <template #title>
            <span class="text-blue-800 font-semibold">ข้อมูลมิเตอร์ (Meter Info)</span>
          </template>
          <template #content>
            <div class="space-y-2">
              <div class="flex justify-between border-b border-blue-200 pb-2">
                <span class="text-slate-600">ชื่อมิเตอร์</span>
                <span class="font-semibold text-slate-800">{{ meters[0].name }}</span>
              </div>
              <div class="flex justify-between border-b border-blue-200 pb-2">
                <span class="text-slate-600">สถานที่</span>
                <span class="font-semibold text-slate-800">{{ meters[0].location }}</span>
              </div>
              <div class="flex justify-between border-b border-blue-200 pb-2">
                <span class="text-slate-600">โควต้า (หน่วย/เดือน)</span>
                <span class="font-semibold text-slate-800">{{ meters[0].limit }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">ค่าไฟ (บาท/หน่วย)</span>
                <span class="font-semibold text-slate-800">{{ meters[0].costPerUnit }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Dialogs -->
    <Dialog v-model:visible="showRecordDialog" modal header="บันทึกค่าไฟฟ้า (Record Reading)"
      :style="{ width: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">เลือกมิเตอร์</label>
          <Select v-model="recordForm.meterId" :options="meters" optionLabel="name" optionValue="id"
            placeholder="Select a Meter" size="small" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold">เลขที่จดได้</label>
          <InputNumber v-model="recordForm.currentReading" inputId="current-reading" :min="0" size="small" placeholder="เลขที่จดได้" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold">จำนวนหน่วยที่ใช้</label>
          <InputNumber v-model="recordForm.units" inputId="current-reading" :min="0" size="small" placeholder="จำนวนหน่วยที่ใช้" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold">รูปภาพหลักฐาน</label>
          <FileUpload mode="basic" name="demo[]" url="/api/upload" accept="image/*" :maxFileSize="1000000"
            size="small"  />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" text @click="showRecordDialog = false" size="small" />
        <Button label="บันทึก" icon="pi pi-check" @click="saveRecord" autofocus size="small" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showSettingsDialog" modal header="ตั้งค่ามิเตอร์ (Meter Settings)"
      :style="{ width: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="font-semibold">ชื่อมิเตอร์</label>
          <InputText v-model="settingsForm.name" size="small" placeholder="ชื่อมิเตอร์"/>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold">สถานที่ติดตั้ง</label>
          <InputText v-model="settingsForm.location" size="small" placeholder="สถานที่ติดตั้ง"/>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold">กำหนดหน่วยไฟ/เดือน (Limit)</label>
          <InputNumber v-model="settingsForm.limit" size="small" placeholder="กำหนดหน่วยไฟ/เดือน (Limit)" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold">ค่าไฟฟ้าต่อหน่วย (Cost/Unit)</label>
          <InputNumber v-model="settingsForm.costPerUnit" mode="currency" currency="THB" locale="th-TH" size="small" placeholder="ค่าไฟฟ้าต่อหน่วย (Cost/Unit)" />
        </div>
      </div>
      <template #footer>
        <Button label="ยกเลิก" icon="pi pi-times" text @click="showSettingsDialog = false" size="small" />
        <Button label="บันทึก" icon="pi pi-check" @click="saveSettings" autofocus size="small" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Add any custom styles here if Tailwind is not enough */
</style>
