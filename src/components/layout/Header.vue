<template>
  <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
    <div class="flex items-center justify-between px-4 py-3 lg:px-6">
      <!-- Left side - Logo and Navigation -->
      <div class="flex items-center space-x-4">
        <!-- Mobile menu button -->
        <Button icon="pi pi-bars" text rounded class="lg:hidden" @click="$emit('toggle-sidebar')" />

        <!-- Logo -->
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i class="pi pi-fish text-white text-sm"></i>
          </div>
          <span class="font-bold text-gray-800 hidden sm:block">KoiFish ERP</span>
        </div>

        <!-- Breadcrumb -->
        <div class="hidden md:flex items-center space-x-2 text-sm text-gray-500">
          <i class="pi pi-chevron-right text-xs"></i>
          <span>{{ currentPageTitle }}</span>
        </div>
      </div>

      <!-- Right side - Search, Settings, Notifications, Profile -->
      <div class="flex items-center space-x-2">
        <!-- Search -->
        <Button icon="pi pi-search" text rounded class="hidden sm:flex" />

        <!-- Settings -->
        <Button
          icon="pi pi-cog"
          text
          rounded
          :class="{ 'bg-blue-50 text-blue-600': isSettingsActive }"
        />

        <!-- Notifications -->
        <div class="relative">
          <Button icon="pi pi-bell" text rounded class="relative" />
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </div>

        <!-- Profile -->
        <div class="flex items-center space-x-2">
          <Avatar
            image="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
            shape="circle"
            size="small"
          />
          <span class="hidden sm:block text-sm font-medium text-gray-700">Admin</span>
        </div>

        <!-- Mobile menu -->
        <Button icon="pi pi-ellipsis-v" text rounded class="lg:hidden" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'

defineOptions({
  name: 'AppHeader',
})

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
