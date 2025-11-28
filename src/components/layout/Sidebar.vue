<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { orderBy } from 'lodash-es'
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

// Dropdown state management using dynamic identifiers
const dropdownStates = ref<Record<string, boolean>>({})

// Helper functions for dropdown management
// Use label as identifier directly - simpler approach
const isDropdownOpen = (item: {
  route?: string
  label?: string
  isDropdown?: boolean
  submenu?: Array<{ route?: string }>
}) => {
  if (!item.isDropdown || !item.label) return false
  // Initialize and return state
  if (!(item.label in dropdownStates.value)) {
    dropdownStates.value[item.label] = false
  }
  return dropdownStates.value[item.label] || false
}

const toggleDropdown = (item: {
  route?: string
  label?: string
  isDropdown?: boolean
  submenu?: Array<{ route?: string }>
}) => {
  if (!item.isDropdown || !item.label) return
  // Initialize if needed and toggle
  if (!(item.label in dropdownStates.value)) {
    dropdownStates.value[item.label] = false
  }
  dropdownStates.value[item.label] = !dropdownStates.value[item.label]
}

const isDropdownActive = (item: {
  route?: string
  label?: string
  isDropdown?: boolean
  submenu?: Array<{ route?: string }>
}) => {
  if (!item.isDropdown) return false
  if (!item.label) return false

  // Special case for storage dropdown (uses query parameter)
  if (item.label === 'คลัง' || item.route === 'storage') {
    return currentRoute.value === 'storage' && !!route.query.category
  }

  // For other dropdowns, check if any submenu route matches current route
  return item.submenu?.some((sub) => currentRoute.value === sub.route) || false
}

// Fetch categories for storage dropdown
const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

// Category order: ปลา (fish), อาหาร (food), สารปรับสภาพน้ำ (microorganism)
const categoryOrder: Record<string, number> = {
  fish: 1,
  food: 2,
  microorganism: 3,
}

// Create storage submenu from categories, sorted by predefined order
const storageSubmenu = computed(() => {
  if (!categories.value) return []
  return orderBy(
    categories.value.map((category) => ({
      icon: category.icon,
      label: category.name,
      categoryValue: category.value,
      order: categoryOrder[category.value] || 999, // Put unknown categories at the end
    })),
    'order'
  )
})

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}

const navigateToStorageCategory = (categoryValue: string) => {
  if (categoryValue === 'fish') {
    router.push({ name: 'storage-fish' })
    return
  }
  router.push({ name: 'storage', query: { category: categoryValue } })
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
            label: 'รายการขาย',
            route: 'sales',
          },
          {
            icon: 'pi pi-trophy',
            label: 'Auction',
            route: 'auction',
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
        label: 'คลัง',
        route: 'storage',
        isDropdown: true,
        submenu: [], // Will be populated dynamically from categories
      },
      // {
      //   icon: 'pi pi-calculator',
      //   label: 'บัญชี',
      //   route: 'accounting',
      // },
      {
        icon: 'pi pi-calculator',
        label: 'บัญชี',
        isDropdown: true,
        submenu: [
          {
            icon: 'pi pi-money-bill',
            label: 'รายรับ',
            route: 'income',
          },
          {
            icon: 'pi pi-money-bill',
            label: 'รายจ่าย',
            route: 'expense',
          },
          {
            icon: 'pi pi-credit-card',
            label: 'ลูกหนี้',
            route: 'debt',
          },
          {
            icon: 'pi pi-database',
            label: 'สินทรัพย์',
            route: 'assets',
          },

          {
            icon: 'pi pi-receipt',
            label: 'กู้ยืม/หนี้สิน',
            route: 'loan',
          },
        ],
      },
      {
        icon: 'pi pi-money-bill',
        label: 'การเงิน',
        isDropdown: true,
        submenu: [
          {
            icon: 'pi pi-chart-line',
            label: 'งบกำไรขาดทุน',
            route: 'profit-loss',
          },
          {
            icon: 'pi pi-table',
            label: 'งบดุล',
            route: 'balance-sheet',
          },
          {
            icon: 'pi pi-arrow-right-arrow-left',
            label: 'กระแสเงินสด',
            route: 'cash-flow',
          },
          {
            icon: 'pi pi-calculator',
            label: 'การวิเคราะห์ต้นทุน',
            route: 'cost-analysis',
          },
          {
            icon: 'pi pi-briefcase',
            label: 'การวางแผนลงทุน',
            route: 'investment-planning',
          },
          {
            icon: 'pi pi-shield',
            label: 'การประเมินความเสี่ยง',
            route: 'risk-assessment',
          },
          {
            icon: 'pi pi-shopping-cart',
            label: 'การตัดสินใจซื้อ-กู้-ขยายธุรกิจ',
            route: 'business-decision',
          },
        ],
      },
      {
        icon: 'pi pi-users',
        label: 'บุคลากร',
        isDropdown: true,
        submenu: [
          {
            icon: 'pi pi-building-columns',
            label: 'โครงสร้างองค์กร',
            route: 'organization-structure',
          },
          {
            icon: 'pi pi-users',
            label: 'ข้อมูลพนักงาน',
            route: 'employee',
          },
          {
            icon: 'pi pi-box',
            label: 'ทรัพย์สินบริษัท',
            route: 'company-assets',
          },
          {
            icon: 'pi pi-calendar-times',
            label: 'ขาด-ลา-มาสาย',
            route: 'attendance-leave',
          },
          {
            icon: 'pi pi-money-bill',
            label: 'เงินเดือน Payroll',
            route: 'payroll',
          },
          {
            icon: 'pi pi-check-square',
            label: 'การประเมินพนักงาน',
            route: 'employee-evaluation',
          },
          {
            icon: 'pi pi-gift',
            label: 'สวัสดิการ',
            route: 'welfare',
          },
          {
            icon: 'pi pi-file',
            label: 'เอกสาร HR',
            route: 'hr-documents',
          },
          {
            icon: 'pi pi-book',
            label: 'อบรม-พัฒนาบุคลากร (เสริม)',
            route: 'training-development',
          },
        ],
      },
    ],
  },
  {
    title: 'ระบบการผลิต',
    items: [
      // {
      //   icon: 'pi pi-warehouse',
      //   label: 'ผลิต',
      //   route: 'production',
      // },
      {
        icon: 'pi pi-warehouse',
        label: 'ผลิต',
        isDropdown: true,
        submenu: [
          {
            icon: 'pi pi-book',
            label: 'คู่มือ',
            route: 'production-guide',
          },
          {
            icon: 'pi pi-box',
            label: 'ระบบบริหารการผลิต MES',
            route: 'production-mes',
          },
          {
            icon: 'pi pi-list',
            label: 'วางแผนความต้องการวัตถุดิบ MRP',
            route: 'production-mrp',
          },
          {
            icon: 'pi pi-bolt',
            label: 'ระบบวิเคราะห์ควบคุมการใช้ไฟฟ้า',
            route: 'production-electricity-analysis',
          },
          {
            icon: 'pi pi-calculator',
            label: 'สูตรคำนวณปริมาณอาหาร',
            route: 'production-food-calculation',
          },
        ],
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
watch(
  currentRoute,
  (routeName) => {
    // Check all dropdowns in all menu sections
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        if (!item.isDropdown || !item.label) return

        // Special case for storage dropdown
        if (item.label === 'คลัง' || item.route === 'storage') {
          if (routeName === 'storage' && route.query.category) {
            dropdownStates.value[item.label] = true
          }
          return
        }

        // For other dropdowns, check if any submenu route matches current route
        if (item.submenu?.some((sub) => routeName === sub.route)) {
          dropdownStates.value[item.label] = true
        }
      })
    })
  },
  { immediate: true }
)

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
  <div v-if="isMobile && isOpen" class="fixed inset-0 bg-black/30 z-40 lg:hidden" @click="$emit('close')"></div>

  <!-- Sidebar -->
  <aside :class="[
    'fixed inset-y-0 left-0 z-50 w-64 bg-white  lg:bg-transparent transform transition-transform duration-300 ease-in-out sidebar-slide',
    isOpen ? 'translate-x-0' : '-translate-x-full',
  ]">
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
        <div v-for="(section, sectionIndex) in menuSections" :key="section.title"
          :class="sectionIndex > 0 ? 'mt-5' : ''">
          <h3 class="text-sm text-gray-500 uppercase tracking-wider mb-1.5 px-3">
            {{ section.title }}
          </h3>
          <div :class="sectionIndex === 0 ? 'lg:px-2 space-y-1' : 'lg:px-3 space-y-1'">
            <template v-for="item in section.items" :key="item.route || item.label">
              <!-- Dropdown Menu Item -->
              <div v-if="item.isDropdown" class="space-y-1">
                <button @click="toggleDropdown(item)" :class="[
                  'w-full flex items-center justify-between space-x-3 px-3 py-1.5 text-sm rounded-full transition-all duration-300 group',
                ]">
                  <div class="flex items-center space-x-3 flex-1">
                    <i :class="[item.icon, 'text-sm', 'text-gray-600 group-hover:text-black']"></i>
                    <span class="flex-1 text-left font-[500]!" :class="'text-gray-600 group-hover:text-black'">{{
                      item.label }}</span>
                  </div>
                  <i :class="[
                    'pi text-xs transition-transform duration-300',
                    isDropdownOpen(item) ? 'pi-angle-up' : 'pi-angle-down',
                    'text-gray-600',
                  ]"></i>
                </button>
                <!-- Submenu Items -->
                <Transition name="slide-fade">
                  <div v-if="isDropdownOpen(item)"
                    class="flex flex-col gap-1 overflow-y-auto select-none duration-300 ml-3 dropdown-submenu max-h-[calc(100vh-200px)]"
                    style="scrollbar-width: none; -ms-overflow-style: none">
                    <!-- Storage submenu -->
                    <template v-if="item.label === 'คลัง' || item.route === 'storage'">
                      <MenuItem v-for="subItem in storageSubmenu" :key="subItem.categoryValue" :icon="subItem.icon"
                        :label="subItem.label" :active="currentRoute === 'storage' &&
                          route.query.category === subItem.categoryValue
                          " :submenu="true" @click="navigateToStorageCategory(subItem.categoryValue)" />
                    </template>

                    <!-- Regular submenu -->
                    <template v-else>
                      <MenuItem v-for="subItem in item.submenu" :key="subItem.route" :icon="subItem.icon"
                        :label="subItem.label" :active="currentRoute === subItem.route" :submenu="true"
                        @click="navigateTo(subItem.route)" />
                    </template>
                  </div>
                </Transition>
              </div>
              <!-- Regular Menu Item -->
              <MenuItem v-else-if="item.route" :icon="item.icon" :label="item.label"
                :active="currentRoute === item.route" @click="navigateTo(item.route)" />
            </template>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<style>
/* Hide scrollbar for dropdown submenu to prevent content shift */
.dropdown-submenu {
  overflow-y: auto !important;
  scrollbar-width: none !important;
  /* Firefox */
  -ms-overflow-style: none !important;
  /* IE and Edge */
}

.dropdown-submenu::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
  /* Chrome, Safari, Opera */
}

.dropdown-submenu::-webkit-scrollbar-track {
  display: none !important;
}

.dropdown-submenu::-webkit-scrollbar-thumb {
  display: none !important;
}
</style>
