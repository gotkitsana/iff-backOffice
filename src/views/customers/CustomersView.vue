<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">จัดการลูกค้า</h1>
        <p class="text-gray-600 mt-1">ระบบจัดการข้อมูลลูกค้าสำหรับประมูลปลาคราฟ</p>
      </div>
      <Button label="เพิ่มลูกค้าใหม่" icon="pi pi-plus" />
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card class="p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">ลูกค้าทั้งหมด</p>
              <p class="text-2xl font-bold text-gray-900">1,247</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-users text-blue-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">ลูกค้าใหม่</p>
              <p class="text-2xl font-bold text-gray-900">23</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-user-plus text-green-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">ลูกค้าประมูล</p>
              <p class="text-2xl font-bold text-gray-900">456</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-gavel text-orange-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="p-6 card-hover">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">ยอดซื้อรวม</p>
              <p class="text-2xl font-bold text-gray-900">฿2.5M</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-money-bill text-purple-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Customer Table -->
    <Card>
      <template #header>
        <div class="p-6 pb-0">
          <h3 class="text-lg font-semibold text-gray-900">รายชื่อลูกค้า</h3>
          <p class="text-sm text-gray-600 mt-1">ข้อมูลลูกค้าทั้งหมดในระบบ</p>
        </div>
      </template>
      <template #content>
        <div class="p-6 pt-0">
          <DataTable :value="customers" :paginator="true" :rows="10" class="p-datatable-sm">
            <Column field="name" header="ชื่อ-นามสกุล" sortable></Column>
            <Column field="email" header="อีเมล" sortable></Column>
            <Column field="phone" header="เบอร์โทร" sortable></Column>
            <Column field="totalAuctions" header="จำนวนประมูล" sortable></Column>
            <Column field="totalSpent" header="ยอดซื้อรวม" sortable>
              <template #body="slotProps">
                <span class="font-semibold text-green-600"
                  >฿{{ slotProps.data.totalSpent.toLocaleString() }}</span
                >
              </template>
            </Column>
            <Column field="status" header="สถานะ" sortable>
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.status"
                  :severity="slotProps.data.status === 'Active' ? 'success' : 'secondary'"
                />
              </template>
            </Column>
            <Column header="จัดการ">
              <template #body="slotProps">
                <div class="flex space-x-2">
                  <Button icon="pi pi-eye" size="small" text rounded />
                  <Button icon="pi pi-pencil" size="small" text rounded />
                  <Button icon="pi pi-trash" size="small" text rounded severity="danger" />
                </div>
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
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

// Sample data for customers
const customers = ref([
  {
    name: 'คุณสมชาย ใจดี',
    email: 'somchai@email.com',
    phone: '081-234-5678',
    totalAuctions: 15,
    totalSpent: 1250000,
    status: 'Active',
  },
  {
    name: 'คุณสมหญิง รักปลา',
    email: 'somying@email.com',
    phone: '082-345-6789',
    totalAuctions: 8,
    totalSpent: 850000,
    status: 'Active',
  },
  {
    name: 'คุณวิชัย ปลาคราฟ',
    email: 'wichai@email.com',
    phone: '083-456-7890',
    totalAuctions: 23,
    totalSpent: 2100000,
    status: 'Active',
  },
  {
    name: 'คุณนิดา สวยงาม',
    email: 'nida@email.com',
    phone: '084-567-8901',
    totalAuctions: 5,
    totalSpent: 450000,
    status: 'Inactive',
  },
  {
    name: 'คุณปิยะ ใจงาม',
    email: 'piya@email.com',
    phone: '085-678-9012',
    totalAuctions: 12,
    totalSpent: 980000,
    status: 'Active',
  },
])
</script>
