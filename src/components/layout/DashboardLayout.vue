<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from './Header.vue'
import AppSidebar from './Sidebar.vue'

defineOptions({
  name: 'DashboardLayout',
})

const isSidebarOpen = ref(false)
const isMobile = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
  if (!isMobile.value) {
    isSidebarOpen.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <div class="flex">
      <!-- Sidebar -->
      <AppSidebar :is-open="isSidebarOpen" @close="closeSidebar" />

      <!-- Main Content -->
      <main class="flex-1 lg:ml-0">
        <div class="p-4 md:p-6">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>



