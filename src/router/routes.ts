import Dashboard from '@/views/DashboardView.vue'
import Members from '@/views/Member/MembersView.vue'
import Accounting from '@/views/Accounting/AccountingView.vue'
import Auction from '@/views/Auction/AuctionView.vue'
import KoiStore from '@/views/Auction/KoiStoreView.vue'
import Login from '@/views/auth/LoginView.vue'
import Unauthorized from '@/views/UnauthorizedView.vue'
import NotFound from '@/views/NotFoundView.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import Employee from '@/views/Employee/EmployeeView.vue'
import Production from '@/views/Production/ProductionView.vue'
import Product from '@/views/Product/ProductView.vue'
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
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'ผลิต' }],
        },
      },

      {
        path: '/marketing',
        name: 'marketing',
        component: Marketing,
        meta: {
          title: 'การตลาด',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการตลาด' }, { label: 'การตลาด' }],
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
        path: '/koi-store',
        name: 'koi-store',
        component: KoiStore,
        meta: {
          title: 'คลังปลาคราฟ',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการตลาด' }, { label: 'คลังปลาคราฟ' }],
        },
      },

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
        path: '/admin-settings',
        name: 'admin-settings',
        component: AdminSettings,
        meta: {
          title: 'จัดการ Admin',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบ Admin' }, { label: 'จัดการ Admin' }],
        },
      },
      {
        path: '/members',
        name: 'members',
        component: Members,
        meta: {
          title: 'จัดการสมาชิก',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบสมาชิก' }, { label: 'จัดการสมาชิก' }],
        },
      },
    ],
  },
]
