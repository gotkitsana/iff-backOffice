<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MenuItem from './MenuItem.vue'

defineOptions({
  name: 'AppSidebar',
})

interface Props {
  isOpen: boolean
}

defineProps<Props>()

defineEmits<{
  close: []
}>()

const route = useRoute()
const router = useRouter()

const isMobile = ref(false)
const currentRoute = computed(() => {
  return route.name as string
})

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

// Menu data structure
const menuSections = [
  {
    title: 'ระบบหลัก',
    items: [
      {
        icon: 'pi pi-home',
        label: 'ภาพรวม',
        route: 'dashboard',
      },
      {
        icon: 'pi pi-users',
        label: 'ข้อมูลลูกค้า',
        route: 'members',
      },
      {
        icon: 'pi pi-cart-plus',
        label: 'ขาย',
        route: 'sales',
      },
      {
        icon: 'pi pi-truck',
        label: 'จัดส่ง',
        route: 'shipping',
      },
      {
        icon: 'pi pi-cart-plus',
        label: 'คลังสินค้า',
        route: 'store',
      },
      {
        icon: 'pi pi-calculator',
        label: 'บัญชี',
        route: 'accounting',
      },
    ],
  },
  // {
  //   title: 'ระบบการผลิต',
  //   items: [
  //     {
  //       icon: 'pi pi-warehouse',
  //       label: 'ผลิต',
  //       route: 'production',
  //     },
  //     {
  //       icon: 'pi pi-shop',
  //       label: 'คลัง',
  //       route: 'koi-store',
  //     },

  //   ],
  // },
  {
    title: 'ระบบการตลาด',
    items: [
      {
        icon: 'pi pi-trophy',
        label: 'Auction',
        route: 'auction',
      },
      {
        icon: 'pi pi-trophy',
        label: 'โปรโมชั่น',
        route: 'promotion',
      },
    ],
  },
  {
    title: 'ระบบบุคลากร',
    items: [
      {
        icon: 'pi pi-cog',
        label: 'บุคลากร',
        route: 'employee',
      },
      {
        icon: 'pi pi-cog',
        label: 'จัดการ Admin',
        route: 'admin-settings',
      },
    ],
  },
  // {
  //   title: 'ระบบ POS',
  //   items: [
  //     {
  //       icon: 'pi pi-box',
  //       label: 'จัดการสินค้า',
  //       route: 'product',
  //     },
  //   ],
  // },
  // {
  //   title: 'ระบบแจ้งเตือน',
  //   items: [
  //     {
  //       icon: 'pi pi-bell',
  //       label: 'ตั้งค่าการแจ้งเตือน',
  //       route: 'notification',
  //     },
  //   ],
  // }

]

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <!-- Mobile Overlay -->
  <div
    v-if="isMobile && isOpen"
    class="fixed inset-0 bg-black/30 z-40 lg:hidden"
    @click="$emit('close')"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 w-64 bg-white  lg:bg-transparent transform transition-transform duration-300 ease-in-out sidebar-slide',
      isOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <div class="flex flex-col h-full">
      <!-- Logo Section -->
      <div class="flex items-center space-x-3 p-4">
        <div class="w-8 h-8 p-1 bg-blue-400 rounded-lg flex items-center justify-center">
          <img src="@/assets/images/icon/icon.png" alt="logo" class="w-full h-full object-cover" />
        </div>
        <span class="font-semibold! text-lg text-gray-800">IFF Back Office</span>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 p-2 overflow-y-auto sidebar-scroll">
        <div
          v-for="(section, sectionIndex) in menuSections"
          :key="section.title"
          :class="sectionIndex > 0 ? 'mt-5' : ''"
        >
          <h3 class="text-sm text-gray-500 uppercase tracking-wider mb-1.5 px-3">
            {{ section.title }}
          </h3>
          <div :class="sectionIndex === 0 ? 'lg:px-2 space-y-1' : 'lg:px-3 space-y-1'">
            <MenuItem
              v-for="item in section.items"
              :route="item.route"
              :key="item.route"
              :icon="item.icon"
              :label="item.label"
              :active="currentRoute === item.route"
              @click="navigateTo(item.route)"
            />
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>


