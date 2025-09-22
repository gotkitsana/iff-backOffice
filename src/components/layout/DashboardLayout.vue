<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AppHeader from './Header.vue'
import AppSidebar from './Sidebar.vue'

defineOptions({
  name: 'DashboardLayout',
})

const isSidebarOpen = ref(true) // เริ่มต้นด้วย sidebar เปิด
const isMobile = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
  if (isMobile.value) {
    isSidebarOpen.value = false
  }
}

// คำนวณ margin สำหรับ content เมื่อ sidebar ปิด
const contentMargin = computed(() => {
  if (isMobile.value) {
    return 'ml-0'
  }
  return isSidebarOpen.value ? 'ml-0' : 'ml-0'
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div class="relative">
    <AppHeader
      @toggle-sidebar="toggleSidebar"
      :is-sidebar-open="isSidebarOpen"
      :is-mobile="isMobile"
    />
    <AppSidebar :is-open="isSidebarOpen" @close="closeSidebar" />
    <main
      :class="[
        'transition-all duration-300 ease-in-out min-h-screen content-slide',
        !isMobile && isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0',
      ]"
    >
      <div class="px-4 md:px-6 py-2">
        <router-view />
      </div>
    </main>
  </div>
</template>



