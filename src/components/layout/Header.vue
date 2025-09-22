<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Button, Divider, Avatar } from 'primevue'

interface Props {
  isSidebarOpen: boolean
  isMobile: boolean
}

defineProps<Props>()

defineEmits<{
  'toggle-sidebar': []
}>()

const route = useRoute()

const currentPageTitle = computed(() => {
  return route.meta?.title || 'หน้าหลัก'
})

const isSettingsActive = computed(() => {
  return route.name === 'settings'
})
</script>


<template>
  <header
    class="border-b border-b-gray-200 lg:border-b-0 bg-white lg:bg-transparent sticky top-0 z-30 lg:relative"
  >
    <div class="flex items-center justify-between px-4 py-3 lg:px-6 w-full">
      <!-- Left side - Toggle button, Logo and Navigation -->
      <div
        class="flex items-center space-x-4 transition-all duration-300 ease-in-out header-slide"
        :class="[!isMobile && isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0']"
      >
        <!-- Sidebar toggle button -->
        <Button
          :icon="
            isMobile ? 'pi pi-bars' : isSidebarOpen ? 'pi pi-chevron-left' : 'pi pi-chevron-right'
          "
          text
          rounded
          class="hover:bg-gray-100 duration-300"
          @click="$emit('toggle-sidebar')"
        />
        <p class="text-lg font-semibold!">หน้าหลัก</p>
      </div>

      <!-- Right side - Settings, Notifications, Profile, Mobile menu -->
      <div class="flex items-center space-x-2">
        <!-- Settings -->
        <Button
          icon="pi pi-cog"
          text
          rounded
          class="hover:bg-gray-100"
          :class="{ 'bg-blue-50 text-blue-600': isSettingsActive }"
        />

        <!-- Notifications -->
        <div class="relative">
          <Button icon="pi pi-bell" text rounded class="hover:bg-gray-100 relative" />
          <span class="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>

        <!-- Profile -->
        <Avatar
          image="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
          shape="circle"
          size="small"
          class="cursor-pointer"
        />
      </div>
    </div>
  </header>
</template>

