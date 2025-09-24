import Dashboard from '@/views/DashboardView.vue'
import Customers from '@/views/customers/CustomersView.vue'
import Accounting from '@/views/Accounting/AccountingView.vue'
import Auction from '@/views/Auction/AuctionView.vue'
import Login from '@/views/auth/LoginView.vue'
import Unauthorized from '@/views/UnauthorizedView.vue'
import NotFound from '@/views/NotFoundView.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import Employee from '@/views/Employee/EmployeeView.vue'
import Production from '@/views/Production/ProductionView.vue'
import Product from '@/views/Product/ProductView.vue'
import Marketing from '@/views/Marketing/MarketingView.vue'
import AdminSettings from '@/views/Admin/AdminSettingView.vue'

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
          title: 'หน้าหลัก',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'หน้าหลัก' }],
        },
      },
      {
        path: '/customers',
        name: 'customers',
        component: Customers,
        meta: {
          title: 'ลูกค้า',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'ลูกค้า' }],
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
        path: '/product',
        name: 'product',
        component: Product,
        meta: {
          title: 'สินค้า',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการตลาด' }, { label: 'สินค้า' }],
        },
      },

      {
        path: '/admin-settings',
        name: 'admin-settings',
        component: AdminSettings,
        meta: {
          title: 'ตั้งค่า Admin',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบจัดการ Admin' }, { label: 'ตั้งค่า Admin' }],
        },
      },
    ],
  },
]
