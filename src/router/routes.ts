import Dashboard from '@/views/DashboardView.vue'
import Members from '@/views/Member/MembersView.vue'
import Accounting from '@/views/Accounting/AccountingView.vue'
import Auction from '@/views/Auction/AuctionView.vue'
import AuctionDetail from '@/views/Auction/AuctionDetailView.vue'
import AuctionSettings from '@/views/Auction/AuctionSettingsView.vue'
import Login from '@/views/auth/LoginView.vue'
import Unauthorized from '@/views/UnauthorizedView.vue'
import NotFound from '@/views/NotFoundView.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import Employee from '@/views/Employee/EmployeeView.vue'
import Production from '@/views/Production/ProductionView.vue'
import Product from '@/views/Product/ProductView.vue'
import PondSettings from '@/views/Product/PondSettingsView.vue'
import Marketing from '@/views/Marketing/MarketingView.vue'
import AdminSettings from '@/views/Admin/AdminSettingView.vue'
import Sales from '@/views/Sales/SalesView.vue'

export default [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      title: 'เข้าสู่ระบบ',
    },
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: Unauthorized,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: Dashboard,
        meta: {
          title: 'ภาพรวม',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'ภาพรวม' }],
        },
      },
      {
        path: '/members',
        name: 'members',
        component: Members,
        meta: {
          title: 'ข้อมูลลูกค้า',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'ข้อมูลลูกค้า' }],
        },
      },
      {
        path: '/sales',
        name: 'sales',
        component: Sales,
        meta: {
          title: 'ขาย',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'ขาย' }],
        },
      },
      {
        path: '/shipping',
        name: 'shipping',
        component: Dashboard,
        meta: {
          title: 'จัดส่ง',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'จัดส่ง' }],
        },
      },
      {
        path: '/storage',
        name: 'storage',
        component: Product,
        meta: {
          title: 'คลังสินค้า',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'คลังสินค้า' }],
        },
      },
      {
        path: '/accounting',
        name: 'accounting',
        component: Accounting,
        meta: {
          title: 'บัญชี',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บัญชี' }],
        },
      },
      {
        path: '/employee',
        name: 'employee',
        component: Employee,
        meta: {
          title: 'บุคลากร',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บุคลากร' }],
        },
      },

      {
        path: '/production',
        name: 'production',
        component: Production,
        meta: {
          title: 'ผลิต',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการผลิต' }, { label: 'ผลิต' }],
        },
      },

      {
        path: '/promotion',
        name: 'promotion',
        component: Dashboard,
        meta: {
          title: 'โปรโมชั่น',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการตลาด' }, { label: 'โปรโมชั่น' }],
        },
      },
      {
        path: '/auction',
        name: 'auction',
        component: Auction,
        meta: {
          title: 'Auction',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการตลาด' }, { label: 'Auction' }],
        },
      },
      {
        path: '/auction/:id',
        name: 'auction-detail',
        component: AuctionDetail,
        meta: {
          title: 'รายละเอียดการประมูล',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบการตลาด' },
            { label: 'Auction' },
            { label: 'รายละเอียดการประมูล' },
          ],
        },
      },
      {
        path: '/auction/:id/settings',
        name: 'auction-settings',
        component: AuctionSettings,
        meta: {
          title: 'ตั้งค่าระบบประมูล',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบการตลาด' },
            { label: 'Auction' },
            { label: 'ตั้งค่าระบบประมูล' },
          ],
        },
      },

      // {
      //   path: '/koi-store',
      //   name: 'koi-store',
      //   component: KoiStore,
      //   meta: {
      //     title: 'คลังปลาคราฟ',
      //     roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
      //     breadcrumb: [{ label: 'ระบบการตลาด' }, { label: 'คลังปลาคราฟ' }],
      //   },
      // },

      {
        path: '/product',
        name: 'product',
        component: Product,
        meta: {
          title: 'จัดการสินค้า',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบ POS' }, { label: 'จัดการสินค้า' }],
        },
      },
      {
        path: '/product/pond-settings',
        name: 'pond-settings',
        component: PondSettings,
        meta: {
          title: 'ตั้งค่าบ่อปลาคาร์ฟ',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบ POS' },
            { label: 'จัดการสินค้า' },
            { label: 'ตั้งค่าบ่อปลาคาร์ฟ' },
          ],
        },
      },

      {
        path: '/admin-settings',
        name: 'admin-settings',
        component: AdminSettings,
        meta: {
          title: 'จัดการ Admin',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบ Admin' }, { label: 'จัดการ Admin' }],
        },
      },
    ],
  },
]
