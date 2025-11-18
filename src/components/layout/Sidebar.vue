<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
const isSalesDropdownOpen = ref(false)
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
        icon: 'pi pi-cart-plus',
        label: 'ขาย',
        isDropdown: true,
        submenu: [
          {
            icon: 'pi pi-users',
            label: 'ข้อมูลลูกค้า',
            route: 'members',
          },
          {
            icon: 'pi pi-cart-plus',
            label: 'บันทึกรายการขาย',
            route: 'sales',
          },
        ],
      },
      {
        icon: 'pi pi-truck',
        label: 'จัดส่ง',
        route: 'shipping',
      },
      {
        icon: 'pi pi-building-columns',
        label: 'คลังสินค้า',
        route: 'storage',
      },
      {
        icon: 'pi pi-calculator',
        label: 'บัญชี',
        route: 'accounting',
      },
      {
        icon: 'pi pi-money-bill',
        label: 'การเงิน',
        route: 'finance',
      },
      {
        icon: 'pi pi-users',
        label: 'บุคลากร',
        route: 'employee',
      },
    ],
  },
  {
    title: 'ระบบการผลิต',
    items: [
      {
        icon: 'pi pi-warehouse',
        label: 'ผลิต',
        route: 'production',
      },
      // {
      //   icon: 'pi pi-shop',
      //   label: 'คลัง',
      //   route: 'koi-store',
      // },
    ],
  },
  {
    title: 'ระบบการตลาด',
    items: [
      {
        icon: 'pi pi-trophy',
        label: 'Auction',
        route: 'auction',
      },
      {
        icon: 'pi pi-megaphone',
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

// Auto-open dropdown if current route matches any submenu item
const salesMenuSection = menuSections[0].items.find((item) => item.isDropdown)
if (salesMenuSection?.submenu) {
  watch(
    currentRoute,
    (routeName) => {
      if (salesMenuSection.submenu?.some((sub) => routeName === sub.route)) {
        isSalesDropdownOpen.value = true
      }
    },
    { immediate: true }
  )
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
        <span class="font-semibold! text-lg text-gray-800">IFF ERP</span>
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
            <template v-for="item in section.items" :key="item.route || item.label">
              <!-- Dropdown Menu Item -->
              <div v-if="item.isDropdown" class="space-y-1">
                <button
                  @click="isSalesDropdownOpen = !isSalesDropdownOpen"
                  :class="[
                    'w-full flex items-center justify-between space-x-3 px-3 py-1.5 text-sm rounded-full transition-all duration-200 group',
                    isSalesDropdownOpen &&
                      'bg-blue-100 lg:drop-shadow-xs',
                  ]"
                >
                  <div class="flex items-center space-x-3 flex-1">
                    <i
                      :class="[
                        item.icon,
                        'text-sm',
                        isSalesDropdownOpen ||
                        item.submenu?.some((sub) => currentRoute === sub.route)
                          ? 'text-blue-500 lg:text-black'
                          : 'text-gray-600 group-hover:text-black',
                      ]"
                    ></i>
                    <span
                      class="flex-1 text-left font-[500]!"
                      :class="
                        isSalesDropdownOpen ||
                        item.submenu?.some((sub) => currentRoute === sub.route)
                          ? 'text-blue-500 lg:text-black'
                          : 'text-gray-600 group-hover:text-black'
                      "
                      >{{ item.label }}</span
                    >
                  </div>
                  <i
                    :class="[
                      'pi text-xs transition-transform duration-200',
                      isSalesDropdownOpen ? 'pi-angle-up' : 'pi-angle-down',
                      isSalesDropdownOpen || item.submenu?.some((sub) => currentRoute === sub.route)
                        ? 'text-blue-500 lg:text-black'
                        : 'text-gray-600',
                    ]"
                  ></i>
                </button>
                <!-- Submenu Items -->
                <Transition name="slide-fade">
                  <div
                    v-if="isSalesDropdownOpen"
                    class="flex flex-col gap-1 overflow-hidden select-none duration-300 ml-2"
                  >
                    <MenuItem
                      v-for="subItem in item.submenu"
                      :key="subItem.route"
                      :icon="subItem.icon"
                      :label="subItem.label"
                      :active="currentRoute === subItem.route"
                      :submenu="true"
                      @click="navigateTo(subItem.route)"
                    />
                  </div>
                </Transition>
              </div>
              <!-- Regular Menu Item -->
              <MenuItem
                v-else-if="item.route"
                :icon="item.icon"
                :label="item.label"
                :active="currentRoute === item.route"
                @click="navigateTo(item.route)"
              />
            </template>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>


