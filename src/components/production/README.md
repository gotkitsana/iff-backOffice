# Production Modal Components

## ModalAddProduction.vue

Modal สำหรับเพิ่มการผลิตใหม่

### Features

- ฟอร์มกรอกข้อมูลการผลิต
- การสร้างหมายเลขแบทช์อัตโนมัติ
- การเลือกประเภทปลา
- การตั้งค่าวันที่เริ่มผลิตและคาดการณ์เก็บเกี่ยว
- การตั้งค่าสิ่งแวดล้อม (อุณหภูมิ, pH)
- การเพิ่มหมายเหตุ

### Props

- `showAddModal: boolean` - แสดง/ซ่อน modal

### Events

- `onCloseAddModal` - ปิด modal

## ModalProductionSettings.vue

Modal สำหรับตั้งค่าการผลิต

### Features

- ข้อมูลบริษัท
- การตั้งค่าการผลิตเริ่มต้น
- การตั้งค่าการแจ้งเตือน
- การตั้งค่าระบบ
- การรีเซ็ตการตั้งค่า

### Props

- `showSettingsModal: boolean` - แสดง/ซ่อน modal

### Events

- `onCloseSettingsModal` - ปิด modal

## การใช้งาน

```vue
<template>
  <div>
    <!-- ปุ่มเปิด modal -->
    <Button @click="openAddModal" label="เพิ่มการผลิตใหม่" />
    <Button @click="openSettingsModal" label="ตั้งค่าการผลิต" />

    <!-- Modal components -->
    <ModalAddProduction :showAddModal="showAddModal" @onCloseAddModal="closeAddModal" />

    <ModalProductionSettings
      :showSettingsModal="showSettingsModal"
      @onCloseSettingsModal="closeSettingsModal"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ModalAddProduction from '@/components/production/ModalAddProduction.vue'
import ModalProductionSettings from '@/components/production/ModalProductionSettings.vue'

const showAddModal = ref(false)
const showSettingsModal = ref(false)

const openAddModal = () => {
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
}

const openSettingsModal = () => {
  showSettingsModal.value = true
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}
</script>
```

## หมายเหตุ

- Modal components ใช้ PrimeVue Dialog
- มีการ validate ข้อมูลก่อนส่ง
- รองรับ responsive design
- ใช้ toast notification สำหรับแสดงผล
