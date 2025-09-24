<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button, Menu, Avatar } from 'primevue'
import { useAuthStore } from '@/stores/auth'

interface Props {
  isSidebarOpen: boolean
  isMobile: boolean
}

defineProps<Props>()

defineEmits<{
  'toggle-sidebar': []
}>()

const authStore = useAuthStore()
const menu = ref()
const items = ref([
  {
    label: 'ข้อมูลผู้ใช้งาน',
    items: [
      {
        label: 'Profile',
        icon: 'pi pi-user',
        route: '/profile',
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        onClick: () => {
          authStore.logout()
        },
      },
    ],
  },
])

const toggle = (event: any) => {
  menu.value.toggle(event)
}

const route = useRoute()
</script>


<template>
  <header
    class="border-b border-b-gray-200 lg:border-b-0 bg-white lg:bg-transparent sticky top-0 z-30 lg:relative"
  >
    <div class="flex items-center justify-between px-4 py-3 lg:px-6 w-full">
      <!-- Left side - Toggle button, Logo and Navigation -->
      <div
        class="flex items-center space-x-2 transition-all duration-300 ease-in-out header-slide"
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
        <p class="font-semibold!">{{ route.meta.title }}</p>
      </div>

      <!-- Right side - Settings, Notifications, Profile, Mobile menu -->
      <div class="flex items-center space-x-2">
        <!-- Settings -->
        <!-- <Button
          icon="pi pi-cog"
          text
          rounded
          class="hover:bg-gray-100"
          :class="{ 'bg-blue-50 text-blue-600': isSettingsActive }"
        /> -->

        <!-- Notifications -->
        <div class="relative">
          <Button icon="pi pi-bell" text rounded class="hover:bg-gray-100 relative" />
          <span v-if="false" class="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>

        <!-- Profile -->
        <div>
          <Avatar
            icon="pi pi-user"
            shape="circle"
            size="normal"
            class="cursor-pointer"
            @click="toggle"
          />
          <Menu ref="menu" :model="items" :popup="true">
            <template #item="{ item, props }">
              <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
                <div v-ripple v-bind="props.action" @click="navigate">
                  <span :class="item.icon" />
                  <span class="ml-2 text-sm">{{ item.label }}</span>
                </div>
              </router-link>
              <div v-else v-ripple v-bind="props.action" @click="item.onClick">
                <span :class="item.icon" />
                <span class="ml-2 text-sm">{{ item.label }}</span>
              </div>
            </template>
          </Menu>
        </div>
      </div>
    </div>
  </header>
</template>

