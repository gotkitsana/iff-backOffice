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
const isMarketingOpen = ref(false)

const currentRoute = computed(() => {
  return route.name as string
})

const toggleMarketing = () => {
  isMarketingOpen.value = !isMarketingOpen.value
}

const navigateTo = (routeName: string) => {
  router.push({ name: routeName })
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
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
      'fixed inset-y-0 left-0 z-50 w-64 bg-white lg:bg-transparent transform transition-transform duration-300 ease-in-out sidebar-slide',
      isOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:z-40',
    ]"
  >
    <div class="flex flex-col h-full">
      <!-- Logo Section -->
      <div class="flex items-center space-x-3 p-4">
        <div class="w-8 h-8 p-1 bg-blue-400 rounded-lg flex items-center justify-center">
          <img src="@/assets/images/icon/icon.png" alt="logo" class="w-full h-full object-cover" />
        </div>
        <span class="font-bold text-gray-800">KoiFish ERP</span>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 p-2 space-y-1.5 overflow-y-auto sidebar-scroll">
        <!-- ระบบหลัก -->
        <div>
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            ระบบหลัก
          </h3>

          <!-- ลูกค้า -->
          <MenuItem
            icon="pi pi-users"
            label="ลูกค้า"
            :active="currentRoute === 'customers'"
            @click="navigateTo('customers')"
          />

          <!-- บัญชี -->
          <MenuItem
            icon="pi pi-calculator"
            label="บัญชี"
            :active="currentRoute === 'accounting'"
            @click="navigateTo('accounting')"
          />

          <!-- บุคลากร -->
          <MenuItem
            icon="pi pi-id-card"
            label="บุคลากร"
            :active="currentRoute === 'personnel'"
            @click="navigateTo('personnel')"
          />

          <!-- ผลิต -->
          <MenuItem
            icon="pi pi-cog"
            label="ผลิต"
            :active="currentRoute === 'production'"
            @click="navigateTo('production')"
          />
        </div>

        <!-- การตลาด -->
        <div class="space-y-1 mt-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            การตลาด
          </h3>

          <!-- การตลาด (Parent) -->
          <div class="space-y-1">
            <button
              @click="toggleMarketing"
              class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <i class="pi pi-chart-line text-gray-500"></i>
                <span>การตลาด</span>
              </div>
              <i
                :class="[
                  'pi text-xs transition-transform',
                  isMarketingOpen ? 'pi-chevron-down' : 'pi-chevron-right',
                ]"
              ></i>
            </button>

            <!-- Auction Submenu -->
            <div v-show="isMarketingOpen" class="ml-6 space-y-1">
              <MenuItem
                icon="pi pi-gavel"
                label="Auction"
                :active="currentRoute === 'auction'"
                @click="navigateTo('auction')"
                submenu
              />
            </div>
          </div>
        </div>

        <!-- ระบบจัดการ -->
        <div class="space-y-1 mt-6">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            ระบบจัดการ
          </h3>

          <MenuItem
            icon="pi pi-file"
            label="รายงาน"
            :active="currentRoute === 'reports'"
            @click="navigateTo('reports')"
          />

          <MenuItem
            icon="pi pi-cog"
            label="ตั้งค่า"
            :active="currentRoute === 'settings'"
            @click="navigateTo('settings')"
          />
        </div>
      </nav>
    </div>
  </aside>
</template>


